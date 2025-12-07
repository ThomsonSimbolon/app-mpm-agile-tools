const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const sprintController = require('../controllers/sprintController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validation');
const activityLogger = require('../middleware/activityLogger');

router.use(auth);

/**
 * @route   POST /api/projects/:projectId/sprints
 * @desc    Create new sprint
 * @access  Private
 */
router.post(
  '/projects/:projectId/sprints',
  [
    body('name').trim().notEmpty().withMessage('Sprint name is required'),
    body('start_date').isISO8601().withMessage('Valid start date is required'),
    body('end_date').isISO8601().withMessage('Valid end date is required'),
    body('goal').optional().trim()
  ],
  validate,
  activityLogger('created', 'sprint'),
  sprintController.create
);

/**
 * @route   GET /api/projects/:projectId/sprints
 * @desc    Get sprints by project
 * @access  Private
 */
router.get('/projects/:projectId/sprints', sprintController.listByProject);

/**
 * @route   GET /api/sprints/:id
 * @desc    Get sprint by ID
 * @access  Private
 */
router.get('/:id', sprintController.getById);

/**
 * @route   PUT /api/sprints/:id
 * @desc    Update sprint
 * @access  Private
 */
router.put('/:id', activityLogger('updated', 'sprint'), sprintController.update);

/**
 * @route   DELETE /api/sprints/:id
 * @desc    Delete sprint
 * @access  Private
 */
router.delete('/:id', activityLogger('deleted', 'sprint'), sprintController.delete);

/**
 * @route   POST /api/sprints/:id/start
 * @desc    Start sprint
 * @access  Private
 */
router.post('/:id/start', sprintController.start);

/**
 * @route   POST /api/sprints/:id/complete
 * @desc    Complete sprint
 * @access  Private
 */
router.post('/:id/complete', sprintController.complete);

/**
 * @route   GET /api/sprints/:id/burndown
 * @desc    Get burndown chart data
 * @access  Private
 */
router.get('/:id/burndown', sprintController.getBurndown);

module.exports = router;
