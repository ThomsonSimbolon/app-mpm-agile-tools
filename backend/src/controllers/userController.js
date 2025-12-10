const { User } = require("../models");
const { formatResponse } = require("../utils/helpers");
const { Op } = require("sequelize");
const fs = require("fs").promises;
const path = require("path");

/**
 * Search users (accessible by all authenticated users)
 * GET /api/users/search?q=keyword
 */
exports.search = async (req, res, next) => {
  try {
    const { q = "", limit = 20 } = req.query;

    const where = {
      status: "active",
    };

    if (q) {
      where[Op.or] = [
        { full_name: { [Op.like]: `%${q}%` } },
        { username: { [Op.like]: `%${q}%` } },
        { email: { [Op.like]: `%${q}%` } },
      ];
    }

    const users = await User.findAll({
      where,
      attributes: [
        "id",
        "username",
        "full_name",
        "email",
        "avatar_url",
        "role",
      ],
      limit: parseInt(limit),
      order: [["full_name", "ASC"]],
    });

    res.json(formatResponse(true, "Users found", { users }));
  } catch (error) {
    next(error);
  }
};

/**
 * Get all users (admin only)
 * GET /api/users
 */
exports.list = async (req, res, next) => {
  try {
    const { role, status } = req.query;

    const where = {};
    if (role) where.role = role;
    if (status) where.status = status;

    const users = await User.findAll({
      where,
      attributes: { exclude: ["password"] },
      order: [["created_at", "DESC"]],
    });

    res.json(formatResponse(true, "Users retrieved successfully", { users }));
  } catch (error) {
    next(error);
  }
};

/**
 * Get user by ID
 * GET /api/users/:id
 */
exports.getById = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(404).json(formatResponse(false, "User not found"));
    }

    res.json(formatResponse(true, "User retrieved successfully", { user }));
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 * PUT /api/users/:id
 */
exports.update = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json(formatResponse(false, "User not found"));
    }

    // Users can only update their own profile unless they're admin
    if (user.id !== req.user.id && req.user.role !== "admin") {
      return res
        .status(403)
        .json(formatResponse(false, "You can only update your own profile"));
    }

    const { full_name } = req.body;
    const updateData = {};

    if (full_name !== undefined) updateData.full_name = full_name;

    await user.update(updateData);

    // Return user without password
    const userResponse = user.toJSON();

    res.json(
      formatResponse(true, "Profile updated successfully", {
        user: userResponse,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Upload user avatar
 * POST /api/users/:id/avatar
 */
exports.uploadAvatar = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json(formatResponse(false, "User not found"));
    }

    // Users can only update their own avatar unless they're admin
    if (user.id !== req.user.id && req.user.role !== "admin") {
      return res
        .status(403)
        .json(formatResponse(false, "You can only update your own avatar"));
    }

    if (!req.file) {
      return res.status(400).json(formatResponse(false, "No file uploaded"));
    }

    // Delete old avatar if exists
    if (user.avatar_url) {
      try {
        const oldAvatarPath = path.join(__dirname, "../../", user.avatar_url);
        await fs.unlink(oldAvatarPath);
      } catch (err) {
        // If file doesn't exist, ignore error
        console.log("Old avatar file not found or already deleted");
      }
    }

    // Update avatar URL (relative path for flexibility)
    const avatarUrl = `uploads/avatars/${req.file.filename}`;
    await user.update({ avatar_url: avatarUrl });

    // Return user without password
    const userResponse = user.toJSON();

    res.json(
      formatResponse(true, "Avatar uploaded successfully", {
        user: userResponse,
        avatar_url: avatarUrl,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user avatar
 * DELETE /api/users/:id/avatar
 */
exports.deleteAvatar = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json(formatResponse(false, "User not found"));
    }

    // Users can only delete their own avatar unless they're admin
    if (user.id !== req.user.id && req.user.role !== "admin") {
      return res
        .status(403)
        .json(formatResponse(false, "You can only delete your own avatar"));
    }

    if (!user.avatar_url) {
      return res.status(400).json(formatResponse(false, "No avatar to delete"));
    }

    // Delete avatar file
    try {
      const avatarPath = path.join(__dirname, "../../", user.avatar_url);
      await fs.unlink(avatarPath);
    } catch (err) {
      console.log("Avatar file not found or already deleted");
    }

    // Update user record
    await user.update({ avatar_url: null });

    const userResponse = user.toJSON();

    res.json(
      formatResponse(true, "Avatar deleted successfully", {
        user: userResponse,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user (admin only)
 * DELETE /api/users/:id
 */
exports.delete = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json(formatResponse(false, "User not found"));
    }

    await user.destroy();

    res.json(formatResponse(true, "User deleted successfully"));
  } catch (error) {
    next(error);
  }
};
