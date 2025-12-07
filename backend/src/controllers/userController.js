const { User } = require('../models');
const { formatResponse } = require('../utils/helpers');

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
      attributes: { exclude: ['password'] },
      order: [['created_at', 'DESC']]
    });

    res.json(formatResponse(true, 'Users retrieved successfully', { users }));
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
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json(formatResponse(false, 'User not found'));
    }

    res.json(formatResponse(true, 'User retrieved successfully', { user }));
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
      return res.status(404).json(formatResponse(false, 'User not found'));
    }

    // Users can only update their own profile unless they're admin
    if (user.id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json(formatResponse(false, 'You can only update your own profile'));
    }

    const { full_name, avatar_url } = req.body;
    await user.update({ full_name, avatar_url });
    
    res.json(formatResponse(true, 'User updated successfully', { user }));
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
      return res.status(404).json(formatResponse(false, 'User not found'));
    }

    await user.destroy();
    
    res.json(formatResponse(true, 'User deleted successfully'));
  } catch (error) {
    next(error);
  }
};
