/**
 * =============================================================================
 * LEAVE CONTROLLER
 * =============================================================================
 * Controller untuk mengelola cuti user dan delegasi tugas otomatis
 * =============================================================================
 */

const {
  UserLeave,
  TaskDelegation,
  Task,
  User,
  Notification,
  sequelize,
} = require("../models");
const { formatResponse } = require("../utils/helpers");
const { Op } = require("sequelize");
const notificationService = require("../services/notificationService");

/**
 * Get current user's leave requests
 * GET /api/leaves/my
 */
exports.getMyLeaves = async (req, res, next) => {
  try {
    const { status, year } = req.query;

    const where = { user_id: req.user.id };
    if (status) where.status = status;
    if (year) {
      where.start_date = {
        [Op.between]: [`${year}-01-01`, `${year}-12-31`],
      };
    }

    const leaves = await UserLeave.findAll({
      where,
      include: [
        {
          model: User,
          as: "delegate",
          attributes: ["id", "username", "full_name", "avatar_url"],
        },
        {
          model: User,
          as: "approvedBy",
          attributes: ["id", "username", "full_name"],
        },
      ],
      order: [["start_date", "DESC"]],
    });

    res.json(formatResponse(true, "Leaves retrieved", { leaves }));
  } catch (error) {
    next(error);
  }
};

/**
 * Get all leave requests (for managers/HR)
 * GET /api/leaves
 */
exports.getAllLeaves = async (req, res, next) => {
  try {
    const { status, user_id, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    if (user_id) where.user_id = user_id;

    const { count, rows: leaves } = await UserLeave.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "full_name", "avatar_url", "email"],
        },
        {
          model: User,
          as: "delegate",
          attributes: ["id", "username", "full_name", "avatar_url"],
        },
        {
          model: User,
          as: "approvedBy",
          attributes: ["id", "username", "full_name"],
        },
      ],
      order: [["created_at", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json(
      formatResponse(true, "Leaves retrieved", {
        leaves,
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
 * Get pending leave requests (for approval)
 * GET /api/leaves/pending
 */
exports.getPendingLeaves = async (req, res, next) => {
  try {
    const leaves = await UserLeave.findAll({
      where: { status: "pending" },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "full_name", "avatar_url", "email"],
        },
        {
          model: User,
          as: "delegate",
          attributes: ["id", "username", "full_name", "avatar_url"],
        },
      ],
      order: [["start_date", "ASC"]],
    });

    res.json(formatResponse(true, "Pending leaves retrieved", { leaves }));
  } catch (error) {
    next(error);
  }
};

/**
 * Create leave request
 * POST /api/leaves
 */
exports.create = async (req, res, next) => {
  try {
    const {
      leave_type,
      start_date,
      end_date,
      delegate_id,
      reason,
      auto_delegate_tasks,
      return_tasks_after,
      contact_info,
      notes,
    } = req.body;

    // Validate dates
    if (new Date(start_date) > new Date(end_date)) {
      return res
        .status(400)
        .json(formatResponse(false, "End date must be after start date"));
    }

    // Check for overlapping leaves
    const overlapping = await UserLeave.findOne({
      where: {
        user_id: req.user.id,
        status: { [Op.notIn]: ["rejected", "cancelled"] },
        [Op.or]: [
          {
            start_date: { [Op.between]: [start_date, end_date] },
          },
          {
            end_date: { [Op.between]: [start_date, end_date] },
          },
          {
            [Op.and]: [
              { start_date: { [Op.lte]: start_date } },
              { end_date: { [Op.gte]: end_date } },
            ],
          },
        ],
      },
    });

    if (overlapping) {
      return res
        .status(400)
        .json(
          formatResponse(
            false,
            "You already have a leave request for this period"
          )
        );
    }

    // Create leave request
    const leave = await UserLeave.create({
      user_id: req.user.id,
      leave_type: leave_type || "annual",
      start_date,
      end_date,
      delegate_id: delegate_id || null,
      reason,
      auto_delegate_tasks: auto_delegate_tasks !== false,
      return_tasks_after: return_tasks_after === true,
      contact_info,
      notes,
      status: "pending",
    });

    // Reload with associations
    await leave.reload({
      include: [
        {
          model: User,
          as: "delegate",
          attributes: ["id", "username", "full_name"],
        },
      ],
    });

    res
      .status(201)
      .json(formatResponse(true, "Leave request created", { leave }));
  } catch (error) {
    next(error);
  }
};

/**
 * Update leave request
 * PUT /api/leaves/:id
 */
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const leave = await UserLeave.findByPk(id);

    if (!leave) {
      return res.status(404).json(formatResponse(false, "Leave not found"));
    }

    // Only owner can update, and only if pending
    if (leave.user_id !== req.user.id) {
      return res
        .status(403)
        .json(
          formatResponse(false, "You can only update your own leave requests")
        );
    }

    if (leave.status !== "pending") {
      return res
        .status(400)
        .json(formatResponse(false, "Only pending leaves can be updated"));
    }

    const updateData = {};
    const allowedFields = [
      "leave_type",
      "start_date",
      "end_date",
      "delegate_id",
      "reason",
      "auto_delegate_tasks",
      "return_tasks_after",
      "contact_info",
      "notes",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    await leave.update(updateData);

    await leave.reload({
      include: [
        {
          model: User,
          as: "delegate",
          attributes: ["id", "username", "full_name"],
        },
      ],
    });

    res.json(formatResponse(true, "Leave updated", { leave }));
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel leave request
 * DELETE /api/leaves/:id
 */
exports.cancel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const leave = await UserLeave.findByPk(id);

    if (!leave) {
      return res.status(404).json(formatResponse(false, "Leave not found"));
    }

    // Only owner can cancel
    if (leave.user_id !== req.user.id) {
      return res
        .status(403)
        .json(
          formatResponse(false, "You can only cancel your own leave requests")
        );
    }

    if (!["pending", "approved"].includes(leave.status)) {
      return res
        .status(400)
        .json(formatResponse(false, "This leave cannot be cancelled"));
    }

    await leave.update({ status: "cancelled" });

    // If was active, return delegated tasks
    if (leave.status === "active") {
      await returnDelegatedTasks(leave.id);
    }

    res.json(formatResponse(true, "Leave cancelled"));
  } catch (error) {
    next(error);
  }
};

/**
 * Approve leave request (manager/HR)
 * POST /api/leaves/:id/approve
 */
exports.approve = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const leave = await UserLeave.findByPk(id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "full_name"],
        },
        {
          model: User,
          as: "delegate",
          attributes: ["id", "username", "full_name"],
        },
      ],
    });

    if (!leave) {
      return res.status(404).json(formatResponse(false, "Leave not found"));
    }

    if (leave.status !== "pending") {
      return res
        .status(400)
        .json(formatResponse(false, "Only pending leaves can be approved"));
    }

    await leave.update({
      status: "approved",
      approved_by: req.user.id,
      approved_at: new Date(),
      notes: notes || leave.notes,
    });

    // Notify user
    try {
      await notificationService.createNotification(
        leave.user_id,
        "leave_approved",
        `Your leave request has been approved`,
        { leave_id: leave.id }
      );
    } catch (e) {
      console.log("Notification failed:", e.message);
    }

    res.json(formatResponse(true, "Leave approved", { leave }));
  } catch (error) {
    next(error);
  }
};

/**
 * Reject leave request (manager/HR)
 * POST /api/leaves/:id/reject
 */
exports.reject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res
        .status(400)
        .json(formatResponse(false, "Rejection reason is required"));
    }

    const leave = await UserLeave.findByPk(id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "full_name"],
        },
      ],
    });

    if (!leave) {
      return res.status(404).json(formatResponse(false, "Leave not found"));
    }

    if (leave.status !== "pending") {
      return res
        .status(400)
        .json(formatResponse(false, "Only pending leaves can be rejected"));
    }

    await leave.update({
      status: "rejected",
      approved_by: req.user.id,
      approved_at: new Date(),
      notes: reason,
    });

    // Notify user
    try {
      await notificationService.createNotification(
        leave.user_id,
        "leave_rejected",
        `Your leave request has been rejected: ${reason}`,
        { leave_id: leave.id }
      );
    } catch (e) {
      console.log("Notification failed:", e.message);
    }

    res.json(formatResponse(true, "Leave rejected", { leave }));
  } catch (error) {
    next(error);
  }
};

/**
 * Activate leave (start delegation)
 * Called by scheduler or manually
 * POST /api/leaves/:id/activate
 */
exports.activate = async (req, res, next) => {
  try {
    const { id } = req.params;

    const leave = await UserLeave.findByPk(id, {
      include: [
        { model: User, as: "user" },
        { model: User, as: "delegate" },
      ],
    });

    if (!leave) {
      return res.status(404).json(formatResponse(false, "Leave not found"));
    }

    if (leave.status !== "approved") {
      return res
        .status(400)
        .json(formatResponse(false, "Only approved leaves can be activated"));
    }

    const t = await sequelize.transaction();

    try {
      // Update leave status
      await leave.update({ status: "active" }, { transaction: t });

      // Delegate tasks if enabled
      if (leave.auto_delegate_tasks && leave.delegate_id) {
        await delegateUserTasks(leave, t);
      }

      await t.commit();

      res.json(
        formatResponse(true, "Leave activated, tasks delegated", { leave })
      );
    } catch (error) {
      await t.rollback();
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Complete leave (end delegation)
 * Called by scheduler or manually
 * POST /api/leaves/:id/complete
 */
exports.complete = async (req, res, next) => {
  try {
    const { id } = req.params;

    const leave = await UserLeave.findByPk(id);

    if (!leave) {
      return res.status(404).json(formatResponse(false, "Leave not found"));
    }

    if (leave.status !== "active") {
      return res
        .status(400)
        .json(formatResponse(false, "Only active leaves can be completed"));
    }

    const t = await sequelize.transaction();

    try {
      // Update leave status
      await leave.update({ status: "completed" }, { transaction: t });

      // Return tasks if enabled
      if (leave.return_tasks_after) {
        await returnDelegatedTasks(leave.id, t);
      } else {
        // Mark delegations as permanent
        await TaskDelegation.update(
          { status: "permanent" },
          {
            where: { user_leave_id: leave.id, status: "active" },
            transaction: t,
          }
        );
      }

      await t.commit();

      res.json(formatResponse(true, "Leave completed", { leave }));
    } catch (error) {
      await t.rollback();
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Get delegated tasks for current user
 * GET /api/delegations/my
 */
exports.getMyDelegations = async (req, res, next) => {
  try {
    const { type } = req.query; // 'received' or 'given'

    const where = { status: "active" };
    if (type === "received") {
      where.delegate_id = req.user.id;
    } else if (type === "given") {
      where.original_assignee_id = req.user.id;
    } else {
      where[Op.or] = [
        { delegate_id: req.user.id },
        { original_assignee_id: req.user.id },
      ];
    }

    const delegations = await TaskDelegation.findAll({
      where,
      include: [
        {
          model: Task,
          as: "task",
          attributes: ["id", "title", "status", "priority"],
        },
        {
          model: User,
          as: "originalAssignee",
          attributes: ["id", "username", "full_name", "avatar_url"],
        },
        {
          model: User,
          as: "delegate",
          attributes: ["id", "username", "full_name", "avatar_url"],
        },
        {
          model: UserLeave,
          as: "leave",
          attributes: ["id", "leave_type", "start_date", "end_date"],
        },
      ],
      order: [["delegated_at", "DESC"]],
    });

    res.json(formatResponse(true, "Delegations retrieved", { delegations }));
  } catch (error) {
    next(error);
  }
};

/**
 * Check if user is on leave
 * GET /api/users/:userId/leave-status
 */
exports.getUserLeaveStatus = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const today = new Date().toISOString().split("T")[0];

    const activeLeave = await UserLeave.findOne({
      where: {
        user_id: userId,
        status: "active",
        start_date: { [Op.lte]: today },
        end_date: { [Op.gte]: today },
      },
      include: [
        {
          model: User,
          as: "delegate",
          attributes: ["id", "username", "full_name", "avatar_url"],
        },
      ],
    });

    res.json(
      formatResponse(true, "Leave status retrieved", {
        isOnLeave: !!activeLeave,
        leave: activeLeave,
      })
    );
  } catch (error) {
    next(error);
  }
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Delegate all active tasks of a user to their delegate
 */
async function delegateUserTasks(leave, transaction) {
  // Find all active tasks assigned to the user
  const tasks = await Task.findAll({
    where: {
      assigned_to: leave.user_id,
      status: { [Op.notIn]: ["done", "cancelled"] },
    },
  });

  for (const task of tasks) {
    // Create delegation record
    await TaskDelegation.create(
      {
        task_id: task.id,
        original_assignee_id: leave.user_id,
        delegate_id: leave.delegate_id,
        delegated_by: leave.user_id, // Self delegation due to leave
        user_leave_id: leave.id,
        delegation_type: "auto_leave",
        status: "active",
        reason: `Auto-delegated due to ${leave.leave_type} leave`,
        expected_return_date: leave.end_date,
      },
      { transaction }
    );

    // Update task assignee
    await task.update({ assigned_to: leave.delegate_id }, { transaction });
  }

  // Notify delegate
  if (tasks.length > 0) {
    try {
      await notificationService.createNotification(
        leave.delegate_id,
        "tasks_delegated",
        `${tasks.length} tasks have been delegated to you`,
        { leave_id: leave.id, task_count: tasks.length }
      );
    } catch (e) {
      console.log("Notification failed:", e.message);
    }
  }

  return tasks.length;
}

/**
 * Return delegated tasks to original assignee
 */
async function returnDelegatedTasks(leaveId, transaction) {
  const delegations = await TaskDelegation.findAll({
    where: {
      user_leave_id: leaveId,
      status: "active",
    },
    include: [{ model: Task, as: "task" }],
  });

  for (const delegation of delegations) {
    // Return task to original assignee
    await delegation.task.update(
      { assigned_to: delegation.original_assignee_id },
      { transaction }
    );

    // Update delegation status
    await delegation.update(
      {
        status: "returned",
        returned_at: new Date(),
      },
      { transaction }
    );
  }

  return delegations.length;
}
