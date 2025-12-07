const { Label, Project, Task, TaskLabel } = require('../models');
const { formatResponse } = require('../utils/helpers');

/**
 * Create label for project
 * POST /api/projects/:projectId/labels
 */
exports.create = async (req, res, next) => {
  try {
    const { name, color } = req.body;

    const label = await Label.create({
      project_id: req.params.projectId,
      name,
      color: color || '#3B82F6'
    });

    res.status(201).json(formatResponse(true, 'Label created successfully', { label }));
  } catch (error) {
    next(error);
  }
};

/**
 * Get labels for project
 * GET /api/projects/:projectId/labels
 */
exports.listByProject = async (req, res, next) => {
  try {
    const labels = await Label.findAll({
      where: { project_id: req.params.projectId },
      order: [['name', 'ASC']]
    });

    res.json(formatResponse(true, 'Labels retrieved successfully', { labels }));
  } catch (error) {
    next(error);
  }
};

/**
 * Update label
 * PUT /api/labels/:id
 */
exports.update = async (req, res, next) => {
  try {
    const label = await Label.findByPk(req.params.id);
    
    if (!label) {
      return res.status(404).json(formatResponse(false, 'Label not found'));
    }

    const { name, color } = req.body;
    await label.update({ name, color });
    
    res.json(formatResponse(true, 'Label updated successfully', { label }));
  } catch (error) {
    next(error);
  }
};

/**
 * Delete label
 * DELETE /api/labels/:id
 */
exports.delete = async (req, res, next) => {
  try {
    const label = await Label.findByPk(req.params.id);
    
    if (!label) {
      return res.status(404).json(formatResponse(false, 'Label not found'));
    }

    await label.destroy();
    
    res.json(formatResponse(true, 'Label deleted successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * Add label to task
 * POST /api/tasks/:taskId/labels/:labelId
 */
exports.addToTask = async (req, res, next) => {
  try {
    await TaskLabel.create({
      task_id: req.params.taskId,
      label_id: req.params.labelId
    });

    res.status(201).json(formatResponse(true, 'Label added to task successfully'));
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json(formatResponse(false, 'Label already added to this task'));
    }
    next(error);
  }
};

/**
 * Remove label from task
 * DELETE /api/tasks/:taskId/labels/:labelId
 */
exports.removeFromTask = async (req, res, next) => {
  try {
    const taskLabel = await TaskLabel.findOne({
      where: {
        task_id: req.params.taskId,
        label_id: req.params.labelId
      }
    });

    if (!taskLabel) {
      return res.status(404).json(formatResponse(false, 'Label not found on this task'));
    }

    await taskLabel.destroy();
    
    res.json(formatResponse(true, 'Label removed from task successfully'));
  } catch (error) {
    next(error);
  }
};
