const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User } = require('../models');
const authConfig = require('../config/auth');
const { formatResponse } = require('../utils/helpers');

/**
 * Register new user
 * POST /api/auth/register
 */
exports.register = async (req, res, next) => {
  try {
    const { username, email, password, full_name } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [require('sequelize').Op.or]: [{ email }, { username }]
      }
    });

    if (existingUser) {
      return res.status(400).json(formatResponse(
        false,
        existingUser.email === email ? 'Email already registered' : 'Username already taken'
      ));
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password,
      full_name,
      role: 'developer' // Default role
    });

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      authConfig.secret,
      { expiresIn: authConfig.expiresIn, ...authConfig.options }
    );

    res.status(201).json(formatResponse(
      true,
      'User registered successfully',
      { user, token }
    ));
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json(formatResponse(
        false,
        'Invalid email or password'
      ));
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json(formatResponse(
        false,
        'Invalid email or password'
      ));
    }

    // Check if account is active
    if (user.status !== 'active') {
      return res.status(401).json(formatResponse(
        false,
        'Account is not active'
      ));
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      authConfig.secret,
      { expiresIn: authConfig.expiresIn, ...authConfig.options }
    );

    res.json(formatResponse(
      true,
      'Login successful',
      { user, token }
    ));
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user
 * GET /api/auth/me
 */
exports.getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    res.json(formatResponse(
      true,
      'User data retrieved',
      { user }
    ));
  } catch (error) {
    next(error);
  }
};

/**
 * Logout (client-side token removal)
 * POST /api/auth/logout
 */
exports.logout = async (req, res) => {
  res.json(formatResponse(
    true,
    'Logged out successfully'
  ));
};

/**
 * Change password (for logged-in users)
 * PUT /api/auth/change-password
 */
exports.changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;

    // Get user with password
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json(formatResponse(false, 'User not found'));
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(current_password);
    if (!isPasswordValid) {
      return res.status(401).json(formatResponse(false, 'Current password is incorrect'));
    }

    // Update password
    user.password = new_password;
    await user.save();

    res.json(formatResponse(true, 'Password changed successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * Request password reset (forgot password)
 * POST /api/auth/forgot-password
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });

    if (!user) {
      // Don't reveal if email exists for security
      return res.json(formatResponse(
        true,
        'If the email exists, a password reset link has been sent'
      ));
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Set token and expiry (1 hour)
    user.reset_password_token = resetTokenHash;
    user.reset_password_expires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    // In production, send email with reset link
    // For now, return token in response (ONLY FOR DEVELOPMENT)
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    console.log('\n===========================================');
    console.log('PASSWORD RESET TOKEN (Development Only):');
    console.log('Email:', email);
    console.log('Reset URL:', resetUrl);
    console.log('Token:', resetToken);
    console.log('===========================================\n');

    res.json(formatResponse(
      true,
      'If the email exists, a password reset link has been sent',
      { resetToken, resetUrl } // Remove this in production!
    ));
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password with token
 * POST /api/auth/reset-password
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, new_password } = req.body;

    if (!token || !new_password) {
      return res.status(400).json(formatResponse(
        false,
        'Token and new password are required'
      ));
    }

    // Hash the token to compare
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      where: {
        reset_password_token: resetTokenHash,
        reset_password_expires: {
          [require('sequelize').Op.gt]: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json(formatResponse(
        false,
        'Invalid or expired reset token'
      ));
    }

    // Update password
    user.password = new_password;
    user.reset_password_token = null;
    user.reset_password_expires = null;
    await user.save();

    res.json(formatResponse(true, 'Password reset successfully'));
  } catch (error) {
    next(error);
  }
};
