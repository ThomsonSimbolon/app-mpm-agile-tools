const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const taskController = require('../controllers/taskController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validation');
const activityLogger = require('../middleware/activityLogger');

// All routes require authentication
router.use(auth);

/**
 * @route   POST /api/projects/:projectId/tasks
 * @desc    Create new task
 * @access  Private
 */
router.post(
  '/projects/:projectId/tasks',
  [
    body('title').trim().notEmpty().withMessage('Task title is required'),
    body('description').optional().trim(),
    body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
    body('story_points').optional().isInt({ min: 0, max: 100 }),
    body('assigned_to').optional().isInt(),
    body('sprint_id').optional().isInt(),
    body('due_date').optional().isISO8601()
  ],
  validate,
  activityLogger('created', 'task'),
  taskController.create
);

/**
 * @route   GET /api/projects/:projectId/tasks
 * @desc    Get tasks by project
 * @access  Private
 */
router.get('/projects/:projectId/tasks', taskController.listByProject);

/**
 * @route   GET /api/tasks/:id
 * @desc    Get task by ID
 * @access  Private
 */
router.get('/:id', taskController.getById);

/**
 * @route   PUT /api/tasks/:id
 * @desc    Update task
 * @access  Private
 */
router.put('/:id', activityLogger('updated', 'task'), taskController.update);

/**
 * @route   PUT /api/tasks/:id/status
 * @desc    Update task status (FOR KANBAN DRAG & DROP)
 * @access  Private
 */
router.put(
  '/:id/status',
  [
    body('status').isIn(['backlog', 'todo', 'in_progress', 'in_review', 'done'])
      .withMessage('Invalid status')
  ],
  validate,
  activityLogger('status_changed', 'task'),
  taskController.updateStatus
);

/**
 * @route   PUT /api/tasks/:id/assign
 * @desc    Assign task to user
 * @access  Private
 */
router.put(
  '/:id/assign',
  [
    body('assigned_to').isInt().withMessage('Valid user ID is required')
  ],
  validate,
  activityLogger('assigned', 'task'),
  taskController.assign
);

/**
 * @route   DELETE /api/tasks/:id
 * @desc    Delete task
 * @access  Private
 */
router.delete('/:id', activityLogger('deleted', 'task'), taskController.delete);

/**
 * @route   GET /api/users/:userId/tasks
 * @desc    Get user's assigned tasks
 * @access  Private
 */
router.get('/users/:userId/tasks', taskController.getUserTasks);

/**
 * @route   POST /api/tasks/:id/subtasks
 * @desc    Create subtask
 * @access  Private
 */
router.post(
  '/:id/subtasks',
  [
    body('title').trim().notEmpty().withMessage('Subtask title is required')
  ],
  validate,
  taskController.createSubtask
);

module.exports = router;
