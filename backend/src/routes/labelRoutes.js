const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const labelController = require("../controllers/labelController");
const auth = require("../middleware/auth");
const validate = require("../middleware/validation");
const { roleCheckAdvanced } = require("../middleware/roleCheckAdvanced");

router.use(auth);

/**
 * @route   POST /api/projects/:projectId/labels
 * @desc    Create label for project
 * @access  Private (requires edit_project permission)
 */
router.post(
  "/projects/:projectId/labels",
  roleCheckAdvanced({
    permissions: ["edit_project", "edit_project_details"],
    allowProjectMember: true,
  }),
  [
    body("name").trim().notEmpty().withMessage("Label name is required"),
    body("color")
      .optional()
      .matches(/^#[0-9A-F]{6}$/i)
      .withMessage("Invalid color format"),
  ],
  validate,
  labelController.create
);

/**
 * @route   GET /api/projects/:projectId/labels
 * @desc    Get labels for project
 * @access  Private (requires view_project permission)
 */
router.get(
  "/projects/:projectId/labels",
  roleCheckAdvanced({
    permissions: ["view_project"],
    allowProjectMember: true,
  }),
  labelController.listByProject
);

/**
 * @route   PUT /api/labels/:id
 * @desc    Update label
 * @access  Private
 */
router.put("/:id", labelController.update);

/**
 * @route   DELETE /api/labels/:id
 * @desc    Delete label
 * @access  Private
 */
router.delete("/:id", labelController.delete);

/**
 * @route   POST /api/tasks/:taskId/labels/:labelId
 * @desc    Add label to task
 * @access  Private
 */
router.post("/tasks/:taskId/labels/:labelId", labelController.addToTask);

/**
 * @route   DELETE /api/tasks/:taskId/labels/:labelId
 * @desc    Remove label from task
 * @access  Private
 */
router.delete("/tasks/:taskId/labels/:labelId", labelController.removeFromTask);

module.exports = router;
