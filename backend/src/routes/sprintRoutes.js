const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const sprintController = require("../controllers/sprintController");
const auth = require("../middleware/auth");
const validate = require("../middleware/validation");
const activityLogger = require("../middleware/activityLogger");

// RBAC Middleware
const {
  roleCheckAdvanced,
  requireSprintManager,
} = require("../middleware/roleCheckAdvanced");

router.use(auth);

/**
 * @route   POST /api/projects/:projectId/sprints
 * @desc    Create new sprint
 * @access  Private - Requires manage_sprints permission
 */
router.post(
  "/projects/:projectId/sprints",
  roleCheckAdvanced({
    permissions: ["manage_sprints"],
    checkOwnership: {
      resourceType: "project",
      resourceIdParam: "projectId",
    },
  }),
  [
    body("name").trim().notEmpty().withMessage("Sprint name is required"),
    body("start_date").isISO8601().withMessage("Valid start date is required"),
    body("end_date").isISO8601().withMessage("Valid end date is required"),
    body("goal").optional().trim(),
  ],
  validate,
  activityLogger("created", "sprint"),
  sprintController.create
);

/**
 * @route   GET /api/projects/:projectId/sprints
 * @desc    Get sprints by project
 * @access  Private - Project members can view
 */
router.get("/projects/:projectId/sprints", sprintController.listByProject);

/**
 * @route   GET /api/sprints/:id
 * @desc    Get sprint by ID
 * @access  Private - Project members can view
 */
router.get("/:id", sprintController.getById);

/**
 * @route   PUT /api/sprints/:id
 * @desc    Update sprint
 * @access  Private - Requires manage_sprints permission
 */
router.put(
  "/:id",
  roleCheckAdvanced({
    permissions: ["manage_sprints"],
    checkOwnership: {
      resourceType: "sprint",
      resourceIdParam: "id",
    },
  }),
  activityLogger("updated", "sprint"),
  sprintController.update
);

/**
 * @route   DELETE /api/sprints/:id
 * @desc    Delete sprint
 * @access  Private - Requires manage_sprints permission
 */
router.delete(
  "/:id",
  roleCheckAdvanced({
    permissions: ["manage_sprints"],
    checkOwnership: {
      resourceType: "sprint",
      resourceIdParam: "id",
    },
  }),
  activityLogger("deleted", "sprint"),
  sprintController.delete
);

/**
 * @route   POST /api/sprints/:id/start
 * @desc    Start sprint
 * @access  Private - Requires manage_sprints permission
 */
router.post(
  "/:id/start",
  roleCheckAdvanced({
    permissions: ["manage_sprints"],
    checkOwnership: {
      resourceType: "sprint",
      resourceIdParam: "id",
    },
  }),
  sprintController.start
);

/**
 * @route   POST /api/sprints/:id/complete
 * @desc    Complete sprint
 * @access  Private - Requires manage_sprints permission
 */
router.post(
  "/:id/complete",
  roleCheckAdvanced({
    permissions: ["manage_sprints"],
    checkOwnership: {
      resourceType: "sprint",
      resourceIdParam: "id",
    },
  }),
  sprintController.complete
);

/**
 * @route   GET /api/sprints/:id/burndown
 * @desc    Get burndown chart data
 * @access  Private - Requires view_reports permission
 */
router.get(
  "/:id/burndown",
  roleCheckAdvanced({
    permissions: ["view_reports", "view_team_reports"],
    requireAll: false,
    checkOwnership: {
      resourceType: "sprint",
      resourceIdParam: "id",
    },
  }),
  sprintController.getBurndown
);

module.exports = router;
