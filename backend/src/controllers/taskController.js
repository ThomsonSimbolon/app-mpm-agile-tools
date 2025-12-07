const { Task, User, Project, Sprint, Label, Comment, Attachment, TimeLog } = require('../models');
const { formatResponse, getPagination, formatPaginatedResponse } = require('../utils/helpers');
const { Op } = require('sequelize');

/**
 * Create new task
 * POST /api/projects/:projectId/tasks
 */
exports.create = async (req, res, next) => {
  try {
    const { title, description, priority, story_points, assigned_to, sprint_id, due_date, parent_task_id } = req.body;

    const task = await Task.create({
      project_id: req.params.projectId,
      title,
      description,
      priority: priority || 'medium',
      story_points,
      assigned_to,
      sprint_id,
      due_date,
      parent_task_id,
      created_by: req.user.id,
      status: 'backlog'
    });

    // Load complete task with associations
    const fullTask = await Task.findByPk(task.id, {
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'username', 'full_name', 'avatar_url'] },
        { model: User, as: 'creator', attributes: ['id', 'username', 'full_name'] }
      ]
    });

    res.status(201).json(formatResponse(true, 'Task created successfully', { task: fullTask }));
  } catch (error) {
    next(error);
  }
};

/**
 * Get tasks by project with filters
 * GET /api/projects/:projectId/tasks
 */
exports.listByProject = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, status, priority, assigned_to, sprint_id, search } = req.query;
    const { offset, limit: queryLimit } = getPagination(page, limit);

    const where = { project_id: req.params.projectId };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assigned_to) where.assigned_to = assigned_to;
    if (sprint_id) where.sprint_id = sprint_id;
    if (search) where.title = { [Op.like]: `%${search}%` };

    const tasks = await Task.findAndCountAll({
      where,
      limit: queryLimit,
      offset,
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'username', 'full_name', 'avatar_url'] },
        { model: User, as: 'creator', attributes: ['id', 'username', 'full_name'] },
        { model: Sprint, as: 'sprint', attributes: ['id', 'name'] },
        { model: Label, as: 'labels' }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json(formatResponse(
      true,
      'Tasks retrieved successfully',
      formatPaginatedResponse(tasks, page, queryLimit)
    ));
  } catch (error) {
    next(error);
  }
};

/**
 * Get task by ID
 * GET /api/tasks/:id
 */
exports.getById = async (req, res, next) => {
  try {
    const task = await Task.findByPk(req.params.id, {
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'username', 'full_name', 'avatar_url'] },
        { model: User, as: 'creator', attributes: ['id', 'username', 'full_name', 'avatar_url'] },
        { model: Project, as: 'project', attributes: ['id', 'name', 'key'] },
        { model: Sprint, as: 'sprint', attributes: ['id', 'name'] },
        { model: Label, as: 'labels' },
        { model: Task, as: 'subtasks' },
        { model: Task, as: 'parentTask', attributes: ['id', 'task_key', 'title'] }
      ]
    });

    if (!task) {
      return res.status(404).json(formatResponse(false, 'Task not found'));
    }

    res.json(formatResponse(true, 'Task retrieved successfully', { task }));
  } catch (error) {
    next(error);
  }
};

/**
 * Update task
 * PUT /api/tasks/:id
 */
exports.update = async (req, res, next) => {
  try {
    const task = await Task.findByPk(req.params.id);
    
    if (!task) {
      return res.status(404).json(formatResponse(false, 'Task not found'));
    }

    const allowedFields = ['title', 'description', 'priority', 'story_points', 'assigned_to', 'sprint_id', 'due_date', 'status'];
    const updateData = {};
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    await task.update(updateData);
    
    const updatedTask = await Task.findByPk(task.id, {
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'username', 'full_name', 'avatar_url'] },
        { model: User, as: 'creator', attributes: ['id', 'username', 'full_name'] }
      ]
    });

    res.json(formatResponse(true, 'Task updated successfully', { task: updatedTask }));
  } catch (error) {
    next(error);
  }
};

/**
 * Update task status (FOR KANBAN DRAG & DROP)
 * PUT /api/tasks/:id/status
 */
exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    
    const task = await Task.findByPk(req.params.id);
    
    if (!task) {
      return res.status(404).json(formatResponse(false, 'Task not found'));
    }

    const oldStatus = task.status;
    await task.update({ status });

    res.json(formatResponse(true, 'Task status updated successfully', { 
      task,
      old_status: oldStatus,
      new_status: status
    }));
  } catch (error) {
    next(error);
  }
};

/**
 * Assign task to user
 * PUT /api/tasks/:id/assign
 */
exports.assign = async (req, res, next) => {
  try {
    const { assigned_to } = req.body;
    
    const task = await Task.findByPk(req.params.id);
    
    if (!task) {
      return res.status(404).json(formatResponse(false, 'Task not found'));
    }

    await task.update({ assigned_to });
    
    const updatedTask = await Task.findByPk(task.id, {
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'username', 'full_name', 'avatar_url'] }
      ]
    });

    res.json(formatResponse(true, 'Task assigned successfully', { task: updatedTask }));
  } catch (error) {
    next(error);
  }
};

/**
 * Delete task
 * DELETE /api/tasks/:id
 */
exports.delete = async (req, res, next) => {
  try {
    const task = await Task.findByPk(req.params.id);
    
    if (!task) {
      return res.status(404).json(formatResponse(false, 'Task not found'));
    }

    await task.destroy();
    
    res.json(formatResponse(true, 'Task deleted successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's assigned tasks
 * GET /api/users/:userId/tasks
 */
exports.getUserTasks = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const { offset, limit: queryLimit } = getPagination(page, limit);

    const where = { assigned_to: req.params.userId };
    if (status) where.status = status;

    const tasks = await Task.findAndCountAll({
      where,
      limit: queryLimit,
      offset,
      include: [
        { model: Project, as: 'project', attributes: ['id', 'name', 'key'] },
        { model: Sprint, as: 'sprint', attributes: ['id', 'name'] }
      ],
      order: [['due_date', 'ASC'], ['priority', 'DESC']]
    });

    res.json(formatResponse(
      true,
      'Tasks retrieved successfully',
      formatPaginatedResponse(tasks, page, queryLimit)
    ));
  } catch (error) {
    next(error);
  }
};

/**
 * Create subtask
 * POST /api/tasks/:id/subtasks
 */
exports.createSubtask = async (req, res, next) => {
  try {
    const parentTask = await Task.findByPk(req.params.id);
    
    if (!parentTask) {
      return res.status(404).json(formatResponse(false, 'Parent task not found'));
    }

    const { title, description, assigned_to } = req.body;

    const subtask = await Task.create({
      project_id: parentTask.project_id,
      parent_task_id: parentTask.id,
      title,
      description,
      assigned_to,
      created_by: req.user.id,
      status: 'todo'
    });

    res.status(201).json(formatResponse(true, 'Subtask created successfully', { subtask }));
  } catch (error) {
    next(error);
  }
};
