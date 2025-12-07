const { Notification, User } = require('../models');
const { formatResponse, getPagination, formatPaginatedResponse } = require('../utils/helpers');

/**
 * Get user's notifications
 * GET /api/notifications
 */
exports.list = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, is_read } = req.query;
    const { offset, limit: queryLimit } = getPagination(page, limit);

    const where = { user_id: req.user.id };
    if (is_read !== undefined) {
      where.is_read = is_read === 'true';
    }

    const notifications = await Notification.findAndCountAll({
      where,
      limit: queryLimit,
      offset,
      include: [
        { model: User, as: 'trigger', attributes: ['id', 'username', 'full_name', 'avatar_url'] }
      ],
      order: [['created_at', 'DESC']]
    });

    const unreadCount = await Notification.count({
      where: { user_id: req.user.id, is_read: false }
    });

    res.json(formatResponse(
      true,
      'Notifications retrieved successfully',
      {
        ...formatPaginatedResponse(notifications, page, queryLimit),
        unread_count: unreadCount
      }
    ));
  } catch (error) {
    next(error);
  }
};

/**
 * Mark notification as read
 * PUT /api/notifications/:id/read
 */
exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findByPk(req.params.id);
    
    if (!notification) {
      return res.status(404).json(formatResponse(false, 'Notification not found'));
    }

    if (notification.user_id !== req.user.id) {
      return res.status(403).json(formatResponse(false, 'Unauthorized'));
    }

    await notification.update({ is_read: true });
    
    res.json(formatResponse(true, 'Notification marked as read', { notification }));
  } catch (error) {
    next(error);
  }
};

/**
 * Mark all notifications as read
 * PUT /api/notifications/read-all
 */
exports.markAllAsRead = async (req, res, next) => {
  try {
    await Notification.update(
      { is_read: true },
      { where: { user_id: req.user.id, is_read: false } }
    );

    res.json(formatResponse(true, 'All notifications marked as read'));
  } catch (error) {
    next(error);
  }
};

/**
 * Delete notification
 * DELETE /api/notifications/:id
 */
exports.delete = async (req, res, next) => {
  try {
    const notification = await Notification.findByPk(req.params.id);
    
    if (!notification) {
      return res.status(404).json(formatResponse(false, 'Notification not found'));
    }

    if (notification.user_id !== req.user.id) {
      return res.status(403).json(formatResponse(false, 'Unauthorized'));
    }

    await notification.destroy();
    
    res.json(formatResponse(true, 'Notification deleted successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * Create notification (helper function for other controllers)
 */
exports.createNotification = async (userId, type, title, message, triggeredBy, link = null) => {
  try {
    return await Notification.create({
      user_id: userId,
      triggered_by: triggeredBy,
      type,
      title,
      message,
      link
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};
