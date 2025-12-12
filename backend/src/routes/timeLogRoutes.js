const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const timeLogController = require("../controllers/timeLogController");
const auth = require("../middleware/auth");
const validate = require("../middleware/validation");
const { roleCheckAdvanced } = require("../middleware/roleCheckAdvanced");

router.use(auth);

/**
 * @route   POST /api/tasks/:taskId/time-logs
 * @desc    Log time for task
 * @access  Private (requires log_time permission)
 */
router.post(
  "/tasks/:taskId/time-logs",
  roleCheckAdvanced({ permissions: ["log_time"], allowProjectMember: true }),
  [
    body("hours_spent")
      .isFloat({ min: 0.01, max: 999.99 })
      .withMessage("Valid hours spent is required"),
    body("description").optional().trim(),
    body("logged_date").optional().isISO8601(),
  ],
  validate,
  timeLogController.create
);

/**
 * @route   GET /api/tasks/:taskId/time-logs
 * @desc    Get time logs for task
 * @access  Private (requires view_task permission)
 */
router.get(
  "/tasks/:taskId/time-logs",
  roleCheckAdvanced({ permissions: ["view_task"], allowProjectMember: true }),
  timeLogController.listByTask
);

/**
 * @route   GET /api/users/:userId/time-logs
 * @desc    Get user's time logs
 * @access  Private
 */
router.get("/users/:userId/time-logs", timeLogController.listByUser);

/**
 * @route   PUT /api/time-logs/:id
 * @desc    Update time log
 * @access  Private
 */
router.put("/:id", timeLogController.update);

/**
 * @route   DELETE /api/time-logs/:id
 * @desc    Delete time log
 * @access  Private
 */
router.delete("/:id", timeLogController.delete);

module.exports = router;
