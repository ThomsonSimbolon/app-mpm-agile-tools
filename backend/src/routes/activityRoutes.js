const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const auth = require('../middleware/auth');

router.use(auth);

/**
 * @route   GET /api/projects/:projectId/activities
 * @desc    Get project activity feed
 * @access  Private
 */
router.get('/projects/:projectId/activities', activityController.listByProject);

/**
 * @route   GET /api/users/:userId/activities
 * @desc    Get user activity feed
 * @access  Private
 */
router.get('/users/:userId/activities', activityController.listByUser);

module.exports = router;
