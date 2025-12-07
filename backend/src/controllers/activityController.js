const { ActivityLog, User, Project, Task } = require('../models');
const { formatResponse, getPagination, formatPaginatedResponse } = require('../utils/helpers');

/**
 * Get project activity feed
 * GET /api/projects/:projectId/activities
 */
exports.listByProject = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const { offset, limit: queryLimit } = getPagination(page, limit);

    const activities = await ActivityLog.findAndCountAll({
      where: { project_id: req.params.projectId },
      limit: queryLimit,
      offset,
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'full_name', 'avatar_url'] },
        { model: Task, as: 'task', attributes: ['id', 'task_key', 'title'] }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json(formatResponse(
      true,
      'Activities retrieved successfully',
      formatPaginatedResponse(activities, page, queryLimit)
    ));
  } catch (error) {
    next(error);
  }
};

/**
 * Get user activity feed
 * GET /api/users/:userId/activities
 */
exports.listByUser = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const { offset, limit: queryLimit } = getPagination(page, limit);

    const activities = await ActivityLog.findAndCountAll({
      where: { user_id: req.params.userId },
      limit: queryLimit,
      offset,
      include: [
        { model: Project, as: 'project', attributes: ['id', 'name'] },
        { model: Task, as: 'task', attributes: ['id', 'task_key', 'title'] }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json(formatResponse(
      true,
      'Activities retrieved successfully',
      formatPaginatedResponse(activities, page, queryLimit)
    ));
  } catch (error) {
    next(error);
  }
};
