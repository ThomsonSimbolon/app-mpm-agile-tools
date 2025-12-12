/**
 * =============================================================================
 * APPROVAL CONTROLLER
 * =============================================================================
 * Controller untuk mengelola approval workflow pada task
 * =============================================================================
 */

const {
  TaskApproval,
  Task,
  User,
  Project,
  ProjectMember,
  Notification,
} = require("../models");
const { formatResponse } = require("../utils/helpers");
const { Op } = require("sequelize");
const notificationService = require("../services/notificationService");

/**
 * Get pending approvals for current user (as approver)
 * GET /api/approvals/pending
 * Alias: GET /api/approvals/my-pending
 */
exports.getPendingApprovals = async (req, res, next) => {
  try {
    const approvals = await TaskApproval.findAll({
      where: {
        approver_id: req.user.id,
        status: "pending",
      },
      include: [
        {
          model: Task,
          as: "task",
          include: [
            {
              model: Project,
              as: "project",
              attributes: ["id", "name", "key"],
            },
          ],
        },
        {
          model: User,
          as: "requester",
          attributes: ["id", "username", "full_name", "avatar_url"],
        },
      ],
      order: [
        ["priority", "DESC"],
        ["requested_at", "ASC"],
      ],
    });

    res.json(
      formatResponse(true, "Pending approvals retrieved", { approvals })
    );
  } catch (error) {
    next(error);
  }
};

// Alias for getPendingApprovals
exports.getMyPendingApprovals = exports.getPendingApprovals;

/**
 * Get approval history for current user
 * GET /api/approvals/history
 */
exports.getApprovalHistory = async (req, res, next) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const where = {
      [Op.or]: [{ approver_id: req.user.id }, { requested_by: req.user.id }],
    };

    if (status) where.status = status;
    if (type) where.approval_type = type;

    const { count, rows: approvals } = await TaskApproval.findAndCountAll({
      where,
      include: [
        {
          model: Task,
          as: "task",
          include: [
            {
              model: Project,
              as: "project",
              attributes: ["id", "name", "key"],
            },
          ],
        },
        {
          model: User,
          as: "requester",
          attributes: ["id", "username", "full_name", "avatar_url"],
        },
        {
          model: User,
          as: "approver",
          attributes: ["id", "username", "full_name", "avatar_url"],
        },
      ],
      order: [["updated_at", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json(
      formatResponse(true, "Approval history retrieved", {
        approvals,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit),
        },
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get approvals for a specific task
 * GET /api/tasks/:taskId/approvals
 */
exports.getTaskApprovals = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    const approvals = await TaskApproval.findAll({
      where: { task_id: taskId },
      include: [
        {
          model: User,
          as: "requester",
          attributes: ["id", "username", "full_name", "avatar_url"],
        },
        {
          model: User,
          as: "approver",
          attributes: ["id", "username", "full_name", "avatar_url"],
        },
      ],
      order: [["requested_at", "DESC"]],
    });

    res.json(formatResponse(true, "Task approvals retrieved", { approvals }));
  } catch (error) {
    next(error);
  }
};

/**
 * Request approval for a task
 * POST /api/approvals/request
 * POST /api/tasks/:taskId/approvals (legacy)
 */
exports.requestApproval = async (req, res, next) => {
  try {
    // Support both params and body for taskId
    const taskId = req.params.taskId || req.body.task_id;
    const { approval_type, approver_id, message, priority, due_date } =
      req.body;

    if (!taskId) {
      return res.status(400).json(formatResponse(false, "Task ID is required"));
    }

    // Get task
    const task = await Task.findByPk(taskId, {
      include: [{ model: Project, as: "project" }],
    });

    if (!task) {
      return res.status(404).json(formatResponse(false, "Task not found"));
    }

    // Determine approver if not specified
    let finalApproverId = approver_id;
    if (!finalApproverId) {
      // Find approver based on project hierarchy
      const projectManager = await ProjectMember.findOne({
        where: {
          project_id: task.project_id,
          role: { [Op.in]: ["project_manager", "project_owner"] },
        },
      });

      if (projectManager) {
        finalApproverId = projectManager.user_id;
      } else {
        // Fallback to project owner
        finalApproverId = task.project.owner_id;
      }
    }

    // Check if there's already a pending approval of the same type
    const existingApproval = await TaskApproval.findOne({
      where: {
        task_id: taskId,
        approval_type: approval_type || "task_creation",
        status: "pending",
      },
    });

    if (existingApproval) {
      return res
        .status(400)
        .json(
          formatResponse(
            false,
            "There is already a pending approval for this task"
          )
        );
    }

    // Create approval request
    const approval = await TaskApproval.create({
      task_id: taskId,
      requested_by: req.user.id,
      approver_id: finalApproverId,
      approval_type: approval_type || "task_creation",
      priority: priority || "normal",
      request_message: message,
      due_date: due_date,
      requested_at: new Date(),
    });

    // Send notification to approver
    try {
      await notificationService.createNotification(
        finalApproverId,
        "approval_request",
        `New approval request for task: ${task.title}`,
        { task_id: taskId, approval_id: approval.id }
      );
    } catch (e) {
      console.log("Notification failed:", e.message);
    }

    // Reload with associations
    await approval.reload({
      include: [
        { model: Task, as: "task" },
        {
          model: User,
          as: "requester",
          attributes: ["id", "username", "full_name"],
        },
        {
          model: User,
          as: "approver",
          attributes: ["id", "username", "full_name"],
        },
      ],
    });

    res
      .status(201)
      .json(formatResponse(true, "Approval request created", { approval }));
  } catch (error) {
    next(error);
  }
};

/**
 * Approve a request
 * POST /api/approvals/:id/approve
 */
exports.approve = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    const approval = await TaskApproval.findByPk(id, {
      include: [
        { model: Task, as: "task" },
        {
          model: User,
          as: "requester",
          attributes: ["id", "username", "full_name"],
        },
      ],
    });

    if (!approval) {
      return res.status(404).json(formatResponse(false, "Approval not found"));
    }

    // Check if current user is the approver
    if (approval.approver_id !== req.user.id) {
      return res
        .status(403)
        .json(
          formatResponse(
            false,
            "You are not authorized to approve this request"
          )
        );
    }

    if (approval.status !== "pending") {
      return res
        .status(400)
        .json(
          formatResponse(false, `This approval is already ${approval.status}`)
        );
    }

    // Update approval
    await approval.update({
      status: "approved",
      response_message: message,
      responded_at: new Date(),
    });

    // Update task if needed based on approval type
    if (
      approval.approval_type === "status_change" &&
      approval.metadata?.new_status
    ) {
      await approval.task.update({ status: approval.metadata.new_status });
    }

    // Notify requester
    try {
      await notificationService.createNotification(
        approval.requested_by,
        "approval_approved",
        `Your approval request for "${approval.task.title}" has been approved`,
        { task_id: approval.task_id, approval_id: approval.id }
      );
    } catch (e) {
      console.log("Notification failed:", e.message);
    }

    res.json(
      formatResponse(true, "Request approved successfully", { approval })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Reject a request
 * POST /api/approvals/:id/reject
 */
exports.reject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message) {
      return res
        .status(400)
        .json(formatResponse(false, "Rejection reason is required"));
    }

    const approval = await TaskApproval.findByPk(id, {
      include: [
        { model: Task, as: "task" },
        {
          model: User,
          as: "requester",
          attributes: ["id", "username", "full_name"],
        },
      ],
    });

    if (!approval) {
      return res.status(404).json(formatResponse(false, "Approval not found"));
    }

    // Check if current user is the approver
    if (approval.approver_id !== req.user.id) {
      return res
        .status(403)
        .json(
          formatResponse(false, "You are not authorized to reject this request")
        );
    }

    if (approval.status !== "pending") {
      return res
        .status(400)
        .json(
          formatResponse(false, `This approval is already ${approval.status}`)
        );
    }

    // Update approval
    await approval.update({
      status: "rejected",
      response_message: message,
      responded_at: new Date(),
    });

    // Notify requester
    try {
      await notificationService.createNotification(
        approval.requested_by,
        "approval_rejected",
        `Your approval request for "${approval.task.title}" has been rejected`,
        { task_id: approval.task_id, approval_id: approval.id, reason: message }
      );
    } catch (e) {
      console.log("Notification failed:", e.message);
    }

    res.json(formatResponse(true, "Request rejected", { approval }));
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel an approval request
 * DELETE /api/approvals/:id
 */
exports.cancel = async (req, res, next) => {
  try {
    const { id } = req.params;

    const approval = await TaskApproval.findByPk(id);

    if (!approval) {
      return res.status(404).json(formatResponse(false, "Approval not found"));
    }

    // Only requester can cancel
    if (approval.requested_by !== req.user.id) {
      return res
        .status(403)
        .json(
          formatResponse(false, "Only the requester can cancel this approval")
        );
    }

    if (approval.status !== "pending") {
      return res
        .status(400)
        .json(formatResponse(false, "Only pending approvals can be cancelled"));
    }

    await approval.update({ status: "cancelled" });

    res.json(formatResponse(true, "Approval request cancelled"));
  } catch (error) {
    next(error);
  }
};

/**
 * Get approval statistics
 * GET /api/approvals/stats
 */
exports.getStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [
      pendingAsApprover,
      pendingAsRequester,
      approvedCount,
      rejectedCount,
    ] = await Promise.all([
      TaskApproval.count({
        where: { approver_id: userId, status: "pending" },
      }),
      TaskApproval.count({
        where: { requested_by: userId, status: "pending" },
      }),
      TaskApproval.count({
        where: { approver_id: userId, status: "approved" },
      }),
      TaskApproval.count({
        where: { approver_id: userId, status: "rejected" },
      }),
    ]);

    res.json(
      formatResponse(true, "Approval stats retrieved", {
        stats: {
          pendingAsApprover,
          pendingAsRequester,
          approvedCount,
          rejectedCount,
          totalProcessed: approvedCount + rejectedCount,
        },
      })
    );
  } catch (error) {
    next(error);
  }
};
