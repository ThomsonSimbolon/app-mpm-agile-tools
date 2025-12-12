/**
 * =============================================================================
 * LEAVE ROUTES
 * =============================================================================
 * Routes untuk Leave Management dan Task Delegation
 * =============================================================================
 */

const express = require("express");
const router = express.Router();
const leaveController = require("../controllers/leaveController");
const auth = require("../middleware/auth");
const { roleCheckAdvanced } = require("../middleware/roleCheckAdvanced");

// All routes require authentication
router.use(auth);

// =============================================================================
// LEAVE ROUTES
// =============================================================================

/**
 * @route   GET /api/leaves/my
 * @desc    Get current user's leave requests
 * @access  Authenticated users
 */
router.get("/my", leaveController.getMyLeaves);

/**
 * @route   GET /api/leaves/pending
 * @desc    Get all pending leave requests (for approval)
 * @access  Users with manage_leave_delegation permission
 */
router.get(
  "/pending",
  roleCheckAdvanced({ requirePermissions: ["manage_leave_delegation"] }),
  leaveController.getPendingLeaves
);

/**
 * @route   GET /api/leaves
 * @desc    Get all leave requests (admin view)
 * @access  Users with manage_leave_delegation permission
 */
router.get(
  "/",
  roleCheckAdvanced({ requirePermissions: ["manage_leave_delegation"] }),
  leaveController.getAllLeaves
);

/**
 * @route   POST /api/leaves
 * @desc    Create a new leave request
 * @access  Authenticated users
 */
router.post("/", leaveController.create);

/**
 * @route   PUT /api/leaves/:id
 * @desc    Update a pending leave request
 * @access  Leave owner only
 */
router.put("/:id", leaveController.update);

/**
 * @route   DELETE /api/leaves/:id
 * @desc    Cancel a leave request
 * @access  Leave owner only
 */
router.delete("/:id", leaveController.cancel);

/**
 * @route   POST /api/leaves/:id/approve
 * @desc    Approve a leave request
 * @access  Users with manage_leave_delegation permission
 */
router.post(
  "/:id/approve",
  roleCheckAdvanced({ requirePermissions: ["manage_leave_delegation"] }),
  leaveController.approve
);

/**
 * @route   POST /api/leaves/:id/reject
 * @desc    Reject a leave request
 * @access  Users with manage_leave_delegation permission
 */
router.post(
  "/:id/reject",
  roleCheckAdvanced({ requirePermissions: ["manage_leave_delegation"] }),
  leaveController.reject
);

/**
 * @route   POST /api/leaves/:id/activate
 * @desc    Activate a leave (start task delegation)
 * @access  System or admin only
 */
router.post(
  "/:id/activate",
  roleCheckAdvanced({ requireSystemRole: ["super_admin", "admin"] }),
  leaveController.activate
);

/**
 * @route   POST /api/leaves/:id/complete
 * @desc    Complete a leave (end task delegation)
 * @access  System or admin only
 */
router.post(
  "/:id/complete",
  roleCheckAdvanced({ requireSystemRole: ["super_admin", "admin"] }),
  leaveController.complete
);

// =============================================================================
// DELEGATION ROUTES
// =============================================================================

/**
 * @route   GET /api/leaves/delegations/my
 * @desc    Get current user's task delegations (given or received)
 * @access  Authenticated users
 */
router.get("/delegations/my", leaveController.getMyDelegations);

/**
 * @route   GET /api/leaves/users/:userId/leave-status
 * @desc    Check if a user is currently on leave
 * @access  Authenticated users
 */
router.get("/users/:userId/leave-status", leaveController.getUserLeaveStatus);

module.exports = router;
