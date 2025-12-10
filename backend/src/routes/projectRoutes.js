const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const projectController = require("../controllers/projectController");
const auth = require("../middleware/auth");
const validate = require("../middleware/validation");
const activityLogger = require("../middleware/activityLogger");

// RBAC Middleware
const {
  roleCheckAdvanced,
  requireSystemAdmin,
} = require("../middleware/roleCheckAdvanced");

// All routes require authentication
router.use(auth);

/**
 * @route   POST /api/projects
 * @desc    Create new project
 * @access  Private - Requires create_project permission
 */
router.post(
  "/",
  roleCheckAdvanced({
    permissions: ["create_project"],
    // Anyone with system admin, division head/manager, or team admin/lead can create projects
  }),
  [
    body("name").trim().notEmpty().withMessage("Project name is required"),
    body("description").optional().trim(),
    body("start_date").optional().isISO8601().withMessage("Invalid start date"),
    body("end_date").optional().isISO8601().withMessage("Invalid end date"),
  ],
  validate,
  activityLogger("created", "project"),
  projectController.create
);

/**
 * @route   GET /api/projects
 * @desc    Get all user's projects
 * @access  Private - All authenticated users (filtered by access)
 */
router.get("/", projectController.list);

/**
 * @route   GET /api/projects/:id
 * @desc    Get project by ID
 * @access  Private - Project members or system admin
 */
router.get("/:id", projectController.getById);

/**
 * @route   PUT /api/projects/:id
 * @desc    Update project
 * @access  Private - Requires edit_project permission
 */
router.put(
  "/:id",
  roleCheckAdvanced({
    permissions: ["edit_project"],
    checkOwnership: {
      resourceType: "project",
      resourceIdParam: "id",
    },
  }),
  activityLogger("updated", "project"),
  projectController.update
);

/**
 * @route   DELETE /api/projects/:id
 * @desc    Delete project
 * @access  Private - Requires delete_project permission
 */
router.delete(
  "/:id",
  roleCheckAdvanced({
    permissions: ["delete_project"],
    checkOwnership: {
      resourceType: "project",
      resourceIdParam: "id",
    },
  }),
  activityLogger("deleted", "project"),
  projectController.delete
);

/**
 * @route   GET /api/projects/:id/statistics
 * @desc    Get project statistics
 * @access  Private - Requires view_project_reports permission
 */
router.get(
  "/:id/statistics",
  roleCheckAdvanced({
    permissions: ["view_project_reports"],
    checkOwnership: {
      resourceType: "project",
      resourceIdParam: "id",
    },
  }),
  projectController.getStatistics
);

/**
 * @route   POST /api/projects/:id/members
 * @desc    Add member to project
 * @access  Private - Requires manage_project_members permission
 */
router.post(
  "/:id/members",
  roleCheckAdvanced({
    permissions: ["manage_project_members"],
    checkOwnership: {
      resourceType: "project",
      resourceIdParam: "id",
    },
  }),
  [
    body("user_id").isInt().withMessage("Valid user ID is required"),
    body("role")
      .optional()
      .isIn([
        "project_owner",
        "project_manager",
        "tech_lead",
        "developer",
        "qa_tester",
        "report_viewer",
        "stakeholder",
        "member",
      ]),
  ],
  validate,
  projectController.addMember
);

/**
 * @route   DELETE /api/projects/:id/members/:userId
 * @desc    Remove member from project
 * @access  Private - Requires manage_project_members permission
 */
router.delete(
  "/:id/members/:userId",
  roleCheckAdvanced({
    permissions: ["manage_project_members"],
    checkOwnership: {
      resourceType: "project",
      resourceIdParam: "id",
    },
  }),
  projectController.removeMember
);

/**
 * @route   PUT /api/projects/:id/members/:userId
 * @desc    Update member role
 * @access  Private - Requires manage_project_members permission
 */
router.put(
  "/:id/members/:userId",
  roleCheckAdvanced({
    permissions: ["manage_project_members"],
    checkOwnership: {
      resourceType: "project",
      resourceIdParam: "id",
    },
  }),
  [
    body("role").isIn([
      "project_owner",
      "project_manager",
      "tech_lead",
      "developer",
      "qa_tester",
      "report_viewer",
      "stakeholder",
      "member",
    ]),
  ],
  validate,
  projectController.updateMemberRole
);

module.exports = router;
