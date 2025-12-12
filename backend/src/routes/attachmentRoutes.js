const express = require("express");
const router = express.Router();
const attachmentController = require("../controllers/attachmentController");
const auth = require("../middleware/auth");
const { attachmentUpload } = require("../config/multer");
const { roleCheckAdvanced } = require("../middleware/roleCheckAdvanced");

router.use(auth);

/**
 * @route   POST /api/tasks/:taskId/attachments
 * @desc    Upload attachment to task
 * @access  Private (requires upload_attachment permission)
 */
router.post(
  "/tasks/:taskId/attachments",
  roleCheckAdvanced({
    permissions: ["upload_attachment"],
    allowProjectMember: true,
  }),
  attachmentUpload.single("file"),
  attachmentController.upload
);

/**
 * @route   GET /api/tasks/:taskId/attachments
 * @desc    Get attachments for task
 * @access  Private (requires view_task permission)
 */
router.get(
  "/tasks/:taskId/attachments",
  roleCheckAdvanced({ permissions: ["view_task"], allowProjectMember: true }),
  attachmentController.listByTask
);

/**
 * @route   GET /api/attachments/:id/download
 * @desc    Download attachment
 * @access  Private
 */
router.get("/:id/download", attachmentController.download);

/**
 * @route   DELETE /api/attachments/:id
 * @desc    Delete attachment
 * @access  Private
 */
router.delete("/:id", attachmentController.delete);

module.exports = router;
