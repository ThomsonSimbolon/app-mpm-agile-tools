const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const timeLogController = require('../controllers/timeLogController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validation');

router.use(auth);

/**
 * @route   POST /api/tasks/:taskId/time-logs
 * @desc    Log time for task
 * @access  Private
 */
router.post(
  '/tasks/:taskId/time-logs',
  [
    body('hours_spent').isFloat({ min: 0.01, max: 999.99 }).withMessage('Valid hours spent is required'),
    body('description').optional().trim(),
    body('logged_date').optional().isISO8601()
  ],
  validate,
  timeLogController.create
);

/**
 * @route   GET /api/tasks/:taskId/time-logs
 * @desc    Get time logs for task
 * @access  Private
 */
router.get('/tasks/:taskId/time-logs', timeLogController.listByTask);

/**
 * @route   GET /api/users/:userId/time-logs
 * @desc    Get user's time logs
 * @access  Private
 */
router.get('/users/:userId/time-logs', timeLogController.listByUser);

/**
 * @route   PUT /api/time-logs/:id
 * @desc    Update time log
 * @access  Private
 */
router.put('/:id', timeLogController.update);

/**
 * @route   DELETE /api/time-logs/:id
 * @desc    Delete time log
 * @access  Private
 */
router.delete('/:id', timeLogController.delete);

module.exports = router;
