const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { avatarUpload } = require('../config/multer');

router.use(auth);

/**
 * @route   GET /api/users
 * @desc    Get all users (admin only)
 * @access  Private (Admin)
 */
router.get('/', roleCheck(['admin']), userController.list);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private
 */
router.get('/:id', userController.getById);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user profile
 * @access  Private
 */
router.put('/:id', userController.update);

/**
 * @route   POST /api/users/:id/avatar
 * @desc    Upload user avatar
 * @access  Private
 */
router.post('/:id/avatar', avatarUpload.single('avatar'), userController.uploadAvatar);

/**
 * @route   DELETE /api/users/:id/avatar
 * @desc    Delete user avatar
 * @access  Private
 */
router.delete('/:id/avatar', userController.deleteAvatar);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user (admin only)
 * @access  Private (Admin)
 */
router.delete('/:id', roleCheck(['admin']), userController.delete);

module.exports = router;
