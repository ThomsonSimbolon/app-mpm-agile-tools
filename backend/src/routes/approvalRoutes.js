/**
 * =============================================================================
 * APPROVAL ROUTES
 * =============================================================================
 * Routes untuk Task Approval Workflow
 * =============================================================================
 */

const express = require("express");
const router = express.Router();
const approvalController = require("../controllers/approvalController");
const auth = require("../middleware/auth");
const { roleCheckAdvanced } = require("../middleware/roleCheckAdvanced");

// All routes require authentication
router.use(auth);

/**
 * @route   GET /api/approvals/my-pending
 * @desc    Get tasks pending approval that I need to approve
 * @access  Users with approve_workflow permission
 */
router.get(
  "/my-pending",
  roleCheckAdvanced({ requirePermissions: ["approve_workflow"] }),
  approvalController.getMyPendingApprovals
);

/**
 * @route   GET /api/approvals/pending
 * @desc    Get all pending approvals (with filters)
 * @access  Users with approve_workflow permission
 */
router.get(
  "/pending",
  roleCheckAdvanced({ requirePermissions: ["approve_workflow"] }),
  approvalController.getPendingApprovals
);

/**
 * @route   GET /api/approvals/task/:taskId
 * @desc    Get approval status for a task
 * @access  Task members, project members
 */
router.get("/task/:taskId", approvalController.getTaskApprovals);

/**
 * @route   GET /api/approvals/history
 * @desc    Get approval history for current user
 * @access  Authenticated users
 */
router.get("/history", approvalController.getApprovalHistory);

/**
 * @route   GET /api/approvals/stats
 * @desc    Get approval stats for current user
 * @access  Authenticated users
 */
router.get("/stats", approvalController.getStats);

/**
 * @route   POST /api/approvals/request
 * @desc    Request approval for a task
 * @access  Task owner or assigned user
 */
router.post("/request", approvalController.requestApproval);

/**
 * @route   PUT /api/approvals/:id/approve
 * @desc    Approve a task approval request
 * @access  Assigned approver or users with approve_workflow permission
 */
router.put(
  "/:id/approve",
  roleCheckAdvanced({ requirePermissions: ["approve_workflow"] }),
  approvalController.approve
);

/**
 * @route   PUT /api/approvals/:id/reject
 * @desc    Reject a task approval request
 * @access  Assigned approver or users with approve_workflow permission
 */
router.put(
  "/:id/reject",
  roleCheckAdvanced({ requirePermissions: ["approve_workflow"] }),
  approvalController.reject
);

/**
 * @route   PUT /api/approvals/:id/cancel
 * @desc    Cancel a pending approval request
 * @access  Original requester only
 */
router.put("/:id/cancel", approvalController.cancel);

module.exports = router;
