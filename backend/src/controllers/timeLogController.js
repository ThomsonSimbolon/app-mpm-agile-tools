const { TimeLog, Task, User } = require('../models');
const { formatResponse, getPagination, formatPaginatedResponse } = require('../utils/helpers');

/**
 * Log time for task
 * POST /api/tasks/:taskId/time-logs
 */
exports.create = async (req, res, next) => {
  try {
    const { hours_spent, description, logged_date } = req.body;

    const timeLog = await TimeLog.create({
      task_id: req.params.taskId,
      user_id: req.user.id,
      hours_spent,
      description,
      logged_date: logged_date || new Date()
    });

    res.status(201).json(formatResponse(true, 'Time logged successfully', { timeLog }));
  } catch (error) {
    next(error);
  }
};

/**
 * Get time logs for task
 * GET /api/tasks/:taskId/time-logs
 */
exports.listByTask = async (req, res, next) => {
  try {
    const timeLogs = await TimeLog.findAll({
      where: { task_id: req.params.taskId },
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'full_name'] }
      ],
      order: [['logged_date', 'DESC']]
    });

    const totalHours = timeLogs.reduce((sum, log) => sum + parseFloat(log.hours_spent), 0);

    res.json(formatResponse(true, 'Time logs retrieved successfully', { 
      timeLogs,
      total_hours: totalHours.toFixed(2)
    }));
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's time logs
 * GET /api/users/:userId/time-logs
 */
exports.listByUser = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, start_date, end_date } = req.query;
    const { offset, limit: queryLimit } = getPagination(page, limit);

    const where = { user_id: req.params.userId };
    if (start_date && end_date) {
      where.logged_date = {
        [require('sequelize').Op.between]: [start_date, end_date]
      };
    }

    const timeLogs = await TimeLog.findAndCountAll({
      where,
      limit: queryLimit,
      offset,
      include: [
        { model: Task, as: 'task', attributes: ['id', 'task_key', 'title'] }
      ],
      order: [['logged_date', 'DESC']]
    });

    res.json(formatResponse(
      true,
      'Time logs retrieved successfully',
      formatPaginatedResponse(timeLogs, page, queryLimit)
    ));
  } catch (error) {
    next(error);
  }
};

/**
 * Update time log
 * PUT /api/time-logs/:id
 */
exports.update = async (req, res, next) => {
  try {
    const timeLog = await TimeLog.findByPk(req.params.id);
    
    if (!timeLog) {
      return res.status(404).json(formatResponse(false, 'Time log not found'));
    }

    if (timeLog.user_id !== req.user.id) {
      return res.status(403).json(formatResponse(false, 'You can only edit your own time logs'));
    }

    const { hours_spent, description, logged_date } = req.body;
    await timeLog.update({ hours_spent, description, logged_date });
    
    res.json(formatResponse(true, 'Time log updated successfully', { timeLog }));
  } catch (error) {
    next(error);
  }
};

/**
 * Delete time log
 * DELETE /api/time-logs/:id
 */
exports.delete = async (req, res, next) => {
  try {
    const timeLog = await TimeLog.findByPk(req.params.id);
    
    if (!timeLog) {
      return res.status(404).json(formatResponse(false, 'Time log not found'));
    }

    if (timeLog.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json(formatResponse(false, 'You can only delete your own time logs'));
    }

    await timeLog.destroy();
    
    res.json(formatResponse(true, 'Time log deleted successfully'));
  } catch (error) {
    next(error);
  }
};
