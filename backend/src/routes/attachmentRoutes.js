const express = require('express');
const router = express.Router();
const attachmentController = require('../controllers/attachmentController');
const auth = require('../middleware/auth');
const upload = require('../config/multer');

router.use(auth);

/**
 * @route   POST /api/tasks/:taskId/attachments
 * @desc    Upload attachment to task
 * @access  Private
 */
router.post(
  '/tasks/:taskId/attachments',
  upload.single('file'),
  attachmentController.upload
);

/**
 * @route   GET /api/tasks/:taskId/attachments
 * @desc    Get attachments for task
 * @access  Private
 */
router.get('/tasks/:taskId/attachments', attachmentController.listByTask);

/**
 * @route   GET /api/attachments/:id/download
 * @desc    Download attachment
 * @access  Private
 */
router.get('/:id/download', attachmentController.download);

/**
 * @route   DELETE /api/attachments/:id
 * @desc    Delete attachment
 * @access  Private
 */
router.delete('/:id', attachmentController.delete);

module.exports = router;
