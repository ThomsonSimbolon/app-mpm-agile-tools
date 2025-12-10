const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const auth = require("../middleware/auth");
const { avatarUpload } = require("../config/multer");

// RBAC Middleware (Enterprise RBAC)
const {
  roleCheckAdvanced,
  requireSystemAdmin,
} = require("../middleware/roleCheckAdvanced");

router.use(auth);

/**
 * @route   GET /api/users/search
 * @desc    Search users (accessible by all authenticated users)
 * @access  Private
 */
router.get("/search", userController.search);

/**
 * @route   GET /api/users
 * @desc    Get all users (requires manage_all_users permission)
 * @access  Private (System Admin)
 */
router.get(
  "/",
  roleCheckAdvanced({
    permissions: ["manage_all_users"],
  }),
  userController.list
);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private
 */
router.get("/:id", userController.getById);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user profile (own profile or admin)
 * @access  Private
 */
router.put("/:id", userController.update);

/**
 * @route   POST /api/users/:id/avatar
 * @desc    Upload user avatar
 * @access  Private
 */
router.post(
  "/:id/avatar",
  avatarUpload.single("avatar"),
  userController.uploadAvatar
);

/**
 * @route   DELETE /api/users/:id/avatar
 * @desc    Delete user avatar
 * @access  Private
 */
router.delete("/:id/avatar", userController.deleteAvatar);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user (requires manage_all_users permission)
 * @access  Private (System Admin)
 */
router.delete(
  "/:id",
  roleCheckAdvanced({
    permissions: ["manage_all_users"],
  }),
  userController.delete
);

module.exports = router;
