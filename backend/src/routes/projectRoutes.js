const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const projectController = require('../controllers/projectController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validation');
const activityLogger = require('../middleware/activityLogger');

// All routes require authentication
router.use(auth);

/**
 * @route   POST /api/projects
 * @desc    Create new project
 * @access  Private
 */
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Project name is required'),
    body('description').optional().trim(),
    body('start_date').optional().isISO8601().withMessage('Invalid start date'),
    body('end_date').optional().isISO8601().withMessage('Invalid end date')
  ],
  validate,
  activityLogger('created', 'project'),
  projectController.create
);

/**
 * @route   GET /api/projects
 * @desc    Get all user's projects
 * @access  Private
 */
router.get('/', projectController.list);

/**
 * @route   GET /api/projects/:id
 * @desc    Get project by ID
 * @access  Private
 */
router.get('/:id', projectController.getById);

/**
 * @route   PUT /api/projects/:id
 * @desc    Update project
 * @access  Private
 */
router.put('/:id', activityLogger('updated', 'project'), projectController.update);

/**
 * @route   DELETE /api/projects/:id
 * @desc    Delete project
 * @access  Private
 */
router.delete('/:id', activityLogger('deleted', 'project'), projectController.delete);

/**
 * @route   GET /api/projects/:id/statistics
 * @desc    Get project statistics
 * @access  Private
 */
router.get('/:id/statistics', projectController.getStatistics);

/**
 * @route   POST /api/projects/:id/members
 * @desc    Add member to project
 * @access  Private
 */
router.post(
  '/:id/members',
  [
    body('user_id').isInt().withMessage('Valid user ID is required'),
    body('role').optional().isIn(['owner', 'manager', 'developer', 'viewer'])
  ],
  validate,
  projectController.addMember
);

/**
 * @route   DELETE /api/projects/:id/members/:userId
 * @desc    Remove member from project
 * @access  Private
 */
router.delete('/:id/members/:userId', projectController.removeMember);

/**
 * @route   PUT /api/projects/:id/members/:userId
 * @desc    Update member role
 * @access  Private
 */
router.put(
  '/:id/members/:userId',
  [
    body('role').isIn(['owner', 'manager', 'developer', 'viewer'])
  ],
  validate,
  projectController.updateMemberRole
);

module.exports = router;
