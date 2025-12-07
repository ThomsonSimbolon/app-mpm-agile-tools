const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const commentController = require('../controllers/commentController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validation');

router.use(auth);

/**
 * @route   POST /api/tasks/:taskId/comments
 * @desc    Add comment to task
 * @access  Private
 */
router.post(
  '/tasks/:taskId/comments',
  [
    body('content').trim().notEmpty().withMessage('Comment content is required')
  ],
  validate,
  commentController.create
);

/**
 * @route   GET /api/tasks/:taskId/comments
 * @desc    Get comments for task
 * @access  Private
 */
router.get('/tasks/:taskId/comments', commentController.listByTask);

/**
 * @route   PUT /api/comments/:id
 * @desc    Update comment
 * @access  Private
 */
router.put(
  '/:id',
  [
    body('content').trim().notEmpty().withMessage('Comment content is required')
  ],
  validate,
  commentController.update
);

/**
 * @route   DELETE /api/comments/:id
 * @desc    Delete comment
 * @access  Private
 */
router.delete('/:id', commentController.delete);

module.exports = router;
