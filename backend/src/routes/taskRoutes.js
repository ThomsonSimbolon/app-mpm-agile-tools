const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const taskController = require("../controllers/taskController");
const auth = require("../middleware/auth");
const validate = require("../middleware/validation");
const activityLogger = require("../middleware/activityLogger");

// RBAC Middleware
const {
  roleCheckAdvanced,
  requireTaskEditor,
} = require("../middleware/roleCheckAdvanced");

// All routes require authentication
router.use(auth);

/**
 * @route   POST /api/projects/:projectId/tasks
 * @desc    Create new task
 * @access  Private - Requires create_task permission
 */
router.post(
  "/projects/:projectId/tasks",
  roleCheckAdvanced({
    permissions: ["create_task"],
    checkOwnership: {
      resourceType: "project",
      resourceIdParam: "projectId",
    },
  }),
  [
    body("title").trim().notEmpty().withMessage("Task title is required"),
    body("description").optional().trim(),
    body("priority").optional().isIn(["low", "medium", "high", "critical"]),
    body("story_points").optional().isInt({ min: 0, max: 100 }),
    body("assigned_to").optional().isInt(),
    body("sprint_id").optional().isInt(),
    body("due_date").optional().isISO8601(),
  ],
  validate,
  activityLogger("created", "task"),
  taskController.create
);

/**
 * @route   GET /api/projects/:projectId/tasks
 * @desc    Get tasks by project
 * @access  Private - Project members can view
 */
router.get("/projects/:projectId/tasks", taskController.listByProject);

/**
 * @route   GET /api/tasks/:id
 * @desc    Get task by ID
 * @access  Private - Project members can view
 */
router.get("/:id", taskController.getById);

/**
 * @route   PUT /api/tasks/:id
 * @desc    Update task
 * @access  Private - Requires edit_task or edit_own_task permission
 */
router.put(
  "/:id",
  roleCheckAdvanced({
    permissions: ["edit_task", "edit_own_task"],
    requireAll: false, // Either permission is enough
    checkOwnership: {
      resourceType: "task",
      resourceIdParam: "id",
    },
  }),
  activityLogger("updated", "task"),
  taskController.update
);

/**
 * @route   PUT /api/tasks/:id/status
 * @desc    Update task status (FOR KANBAN DRAG & DROP)
 * @access  Private - Requires change_task_status permission
 */
router.put(
  "/:id/status",
  roleCheckAdvanced({
    permissions: ["change_task_status"],
    checkOwnership: {
      resourceType: "task",
      resourceIdParam: "id",
    },
  }),
  [
    body("status")
      .isIn(["backlog", "todo", "in_progress", "in_review", "done"])
      .withMessage("Invalid status"),
  ],
  validate,
  activityLogger("status_changed", "task"),
  taskController.updateStatus
);

/**
 * @route   PUT /api/tasks/:id/assign
 * @desc    Assign task to user
 * @access  Private - Requires assign_task permission
 */
router.put(
  "/:id/assign",
  roleCheckAdvanced({
    permissions: ["assign_task"],
    checkOwnership: {
      resourceType: "task",
      resourceIdParam: "id",
    },
  }),
  [body("assigned_to").isInt().withMessage("Valid user ID is required")],
  validate,
  activityLogger("assigned", "task"),
  taskController.assign
);

/**
 * @route   DELETE /api/tasks/:id
 * @desc    Delete task
 * @access  Private - Requires delete_task permission
 */
router.delete(
  "/:id",
  roleCheckAdvanced({
    permissions: ["delete_task"],
    checkOwnership: {
      resourceType: "task",
      resourceIdParam: "id",
    },
  }),
  activityLogger("deleted", "task"),
  taskController.delete
);

/**
 * @route   GET /api/users/:userId/tasks
 * @desc    Get user's assigned tasks
 * @access  Private - Users can view their own tasks
 */
router.get("/users/:userId/tasks", taskController.getUserTasks);

/**
 * @route   POST /api/tasks/:id/subtasks
 * @desc    Create subtask
 * @access  Private - Requires create_task permission
 */
router.post(
  "/:id/subtasks",
  roleCheckAdvanced({
    permissions: ["create_task"],
    checkOwnership: {
      resourceType: "task",
      resourceIdParam: "id",
    },
  }),
  [body("title").trim().notEmpty().withMessage("Subtask title is required")],
  validate,
  taskController.createSubtask
);

module.exports = router;
