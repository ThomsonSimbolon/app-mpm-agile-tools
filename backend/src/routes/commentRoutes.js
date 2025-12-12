const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const commentController = require("../controllers/commentController");
const auth = require("../middleware/auth");
const validate = require("../middleware/validation");
const { roleCheckAdvanced } = require("../middleware/roleCheckAdvanced");

router.use(auth);

/**
 * @route   POST /api/tasks/:taskId/comments
 * @desc    Add comment to task
 * @access  Private (requires add_comment permission)
 */
router.post(
  "/tasks/:taskId/comments",
  roleCheckAdvanced({ permissions: ["add_comment"], allowProjectMember: true }),
  [
    body("content")
      .trim()
      .notEmpty()
      .withMessage("Comment content is required"),
  ],
  validate,
  commentController.create
);

/**
 * @route   GET /api/tasks/:taskId/comments
 * @desc    Get comments for task
 * @access  Private (requires view_task permission)
 */
router.get(
  "/tasks/:taskId/comments",
  roleCheckAdvanced({ permissions: ["view_task"], allowProjectMember: true }),
  commentController.listByTask
);

/**
 * @route   PUT /api/comments/:id
 * @desc    Update comment
 * @access  Private
 */
router.put(
  "/:id",
  [
    body("content")
      .trim()
      .notEmpty()
      .withMessage("Comment content is required"),
  ],
  validate,
  commentController.update
);

/**
 * @route   DELETE /api/comments/:id
 * @desc    Delete comment
 * @access  Private
 */
router.delete("/:id", commentController.delete);

module.exports = router;
