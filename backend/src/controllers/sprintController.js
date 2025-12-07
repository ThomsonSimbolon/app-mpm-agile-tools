const { Sprint, Project, Task } = require('../models');
const { formatResponse, getPagination, formatPaginatedResponse } = require('../utils/helpers');

/**
 * Create new sprint
 * POST /api/projects/:projectId/sprints
 */
exports.create = async (req, res, next) => {
  try {
    const { name, goal, start_date, end_date } = req.body;

    const sprint = await Sprint.create({
      project_id: req.params.projectId,
      name,
      goal,
      start_date,
      end_date,
      status: 'planning'
    });

    res.status(201).json(formatResponse(true, 'Sprint created successfully', { sprint }));
  } catch (error) {
    next(error);
  }
};

/**
 * Get sprints by project
 * GET /api/projects/:projectId/sprints
 */
exports.listByProject = async (req, res, next) => {
  try {
    const { status } = req.query;

    const where = { project_id: req.params.projectId };
    if (status) where.status = status;

    const sprints = await Sprint.findAll({
      where,
      include: [
        { model: Project, as: 'project', attributes: ['id', 'name'] }
      ],
      order: [['start_date', 'DESC']]
    });

    res.json(formatResponse(true, 'Sprints retrieved successfully', { sprints }));
  } catch (error) {
    next(error);
  }
};

/**
 * Get sprint by ID
 * GET /api/sprints/:id
 */
exports.getById = async (req, res, next) => {
  try {
    const sprint = await Sprint.findByPk(req.params.id, {
      include: [
        { model: Project, as: 'project', attributes: ['id', 'name', 'key'] },
        { 
          model: Task, 
          as: 'tasks',
          include: [
            { model: require('../models').User, as: 'assignee', attributes: ['id', 'username', 'full_name', 'avatar_url'] }
          ]
        }
      ]
    });

    if (!sprint) {
      return res.status(404).json(formatResponse(false, 'Sprint not found'));
    }

    // Calculate sprint statistics
    const totalTasks = sprint.tasks.length;
    const completedTasks = sprint.tasks.filter(t => t.status === 'done').length;
    const totalPoints = sprint.tasks.reduce((sum, t) => sum + (t.story_points || 0), 0);
    const completedPoints = sprint.tasks
      .filter(t => t.status === 'done')
      .reduce((sum, t) => sum + (t.story_points || 0), 0);

    const sprintData = {
      ...sprint.toJSON(),
      statistics: {
        total_tasks: totalTasks,
        completed_tasks: completedTasks,
        total_points: totalPoints,
        completed_points: completedPoints,
        completion_rate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      }
    };

    res.json(formatResponse(true, 'Sprint retrieved successfully', { sprint: sprintData }));
  } catch (error) {
    next(error);
  }
};

/**
 * Update sprint
 * PUT /api/sprints/:id
 */
exports.update = async (req, res, next) => {
  try {
    const sprint = await Sprint.findByPk(req.params.id);
    
    if (!sprint) {
      return res.status(404).json(formatResponse(false, 'Sprint not found'));
    }

    const { name, goal, start_date, end_date, status } = req.body;
    await sprint.update({ name, goal, start_date, end_date, status });
    
    res.json(formatResponse(true, 'Sprint updated successfully', { sprint }));
  } catch (error) {
    next(error);
  }
};

/**
 * Delete sprint
 * DELETE /api/sprints/:id
 */
exports.delete = async (req, res, next) => {
  try {
    const sprint = await Sprint.findByPk(req.params.id);
    
    if (!sprint) {
      return res.status(404).json(formatResponse(false, 'Sprint not found'));
    }

    await sprint.destroy();
    
    res.json(formatResponse(true, 'Sprint deleted successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * Start sprint
 * POST /api/sprints/:id/start
 */
exports.start = async (req, res, next) => {
  try {
    const sprint = await Sprint.findByPk(req.params.id);
    
    if (!sprint) {
      return res.status(404).json(formatResponse(false, 'Sprint not found'));
    }

    if (sprint.status !== 'planning') {
      return res.status(400).json(formatResponse(false, 'Sprint can only be started from planning status'));
    }

    await sprint.update({ status: 'active' });
    
    res.json(formatResponse(true, 'Sprint started successfully', { sprint }));
  } catch (error) {
    next(error);
  }
};

/**
 * Complete sprint
 * POST /api/sprints/:id/complete
 */
exports.complete = async (req, res, next) => {
  try {
    const sprint = await Sprint.findByPk(req.params.id);
    
    if (!sprint) {
      return res.status(404).json(formatResponse(false, 'Sprint not found'));
    }

    if (sprint.status !== 'active') {
      return res.status(400).json(formatResponse(false, 'Only active sprints can be completed'));
    }

    await sprint.update({ status: 'completed' });
    
    res.json(formatResponse(true, 'Sprint completed successfully', { sprint }));
  } catch (error) {
    next(error);
  }
};

/**
 * Get burndown chart data
 * GET /api/sprints/:id/burndown
 */
exports.getBurndown = async (req, res, next) => {
  try {
    const sprint = await Sprint.findByPk(req.params.id, {
      include: [{ model: Task, as: 'tasks' }]
    });

    if (!sprint) {
      return res.status(404).json(formatResponse(false, 'Sprint not found'));
    }

    const totalPoints = sprint.tasks.reduce((sum, t) => sum + (t.story_points || 0), 0);
    const completedPoints = sprint.tasks
      .filter(t => t.status === 'done')
      .reduce((sum, t) => sum + (t.story_points || 0), 0);

    const burndownData = {
      total_points: totalPoints,
      completed_points: completedPoints,
      remaining_points: totalPoints - completedPoints,
      start_date: sprint.start_date,
      end_date: sprint.end_date
    };

    res.json(formatResponse(true, 'Burndown data retrieved successfully', { burndown: burndownData }));
  } catch (error) {
    next(error);
  }
};
