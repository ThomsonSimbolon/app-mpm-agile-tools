const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const userController = require("../controllers/userController");
const auth = require("../middleware/auth");
const validate = require("../middleware/validation");
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
 * @route   POST /api/users
 * @desc    Create new user (requires manage_all_users permission)
 * @access  Private (System Admin)
 */
router.post(
  "/",
  roleCheckAdvanced({
    permissions: ["manage_all_users"],
  }),
  [
    body("username")
      .trim()
      .isLength({ min: 3, max: 50 })
      .withMessage("Username must be between 3 and 50 characters"),
    body("email").trim().isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("full_name").trim().notEmpty().withMessage("Full name is required"),
  ],
  validate,
  userController.create
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
 * @route   PUT /api/users/:id/admin
 * @desc    Admin update user (full update including roles)
 * @access  Private (System Admin)
 */
router.put(
  "/:id/admin",
  roleCheckAdvanced({
    permissions: ["manage_all_users"],
  }),
  userController.adminUpdate
);

/**
 * @route   PUT /api/users/:id/status
 * @desc    Update user status (activate/suspend)
 * @access  Private (System Admin)
 */
router.put(
  "/:id/status",
  roleCheckAdvanced({
    permissions: ["manage_all_users"],
  }),
  [
    body("status")
      .isIn(["active", "inactive", "suspended"])
      .withMessage("Invalid status"),
  ],
  validate,
  userController.updateStatus
);

/**
 * @route   POST /api/users/:id/reset-password
 * @desc    Reset user password (admin only)
 * @access  Private (System Admin)
 */
router.post(
  "/:id/reset-password",
  roleCheckAdvanced({
    permissions: ["manage_all_users"],
  }),
  [
    body("new_password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  validate,
  userController.resetPassword
);

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
