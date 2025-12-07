const { Project, ProjectMember, User, Sprint, Task, Label } = require('../models');
const { formatResponse, getPagination, formatPaginatedResponse } = require('../utils/helpers');
const { Op } = require('sequelize');

/**
 * Create new project
 * POST /api/projects
 */
exports.create = async (req, res, next) => {
  try {
    const { name, description, start_date, end_date } = req.body;
    
    const project = await Project.create({
      name,
      description,
      start_date,
      end_date,
      created_by: req.user.id,
      status: 'planning'
    });

    // Add creator as owner
    await ProjectMember.create({
      project_id: project.id,
      user_id: req.user.id,
      role: 'owner'
    });

    res.status(201).json(formatResponse(true, 'Project created successfully', { project }));
  } catch (error) {
    next(error);
  }
};

/**
 * Get all user's projects
 * GET /api/projects
 */
exports.list = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const { offset, limit: queryLimit } = getPagination(page, limit);

    const where = {};
    if (status) where.status = status;
    if (search) where.name = { [Op.like]: `%${search}%` };

    const projects = await Project.findAndCountAll({
      where,
      limit: queryLimit,
      offset,
      include: [
        {
          model: ProjectMember,
          as: 'projectMembers',
          where: { user_id: req.user.id },
          required: true
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'full_name', 'avatar_url']
        }
      ],
      order: [['created_at', 'DESC']],
      distinct: true
    });

    res.json(formatResponse(
      true,
      'Projects retrieved successfully',
      formatPaginatedResponse(projects, page, queryLimit)
    ));
  } catch (error) {
    next(error);
  }
};

/**
 * Get project by ID
 * GET /api/projects/:id
 */
exports.getById = async (req, res, next) => {
  try {
    const project = await Project.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'full_name', 'avatar_url']
        },
        {
          model: ProjectMember,
          as: 'projectMembers',
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'full_name', 'avatar_url', 'role']
          }]
        },
        {
          model: Sprint,
          as: 'sprints',
          limit: 5,
          order: [['created_at', 'DESC']]
        }
      ]
    });

    if (!project) {
      return res.status(404).json(formatResponse(false, 'Project not found'));
    }

    res.json(formatResponse(true, 'Project retrieved successfully', { project }));
  } catch (error) {
    next(error);
  }
};

/**
 * Update project
 * PUT /api/projects/:id
 */
exports.update = async (req, res, next) => {
  try {
    const project = await Project.findByPk(req.params.id);
    
    if (!project) {
      return res.status(404).json(formatResponse(false, 'Project not found'));
    }

    const { name, description, status, start_date, end_date } = req.body;
    await project.update({ name, description, status, start_date, end_date });
    
    res.json(formatResponse(true, 'Project updated successfully', { project }));
  } catch (error) {
    next(error);
  }
};

/**
 * Delete project
 * DELETE /api/projects/:id
 */
exports.delete = async (req, res, next) => {
  try {
    const project = await Project.findByPk(req.params.id);
    
    if (!project) {
      return res.status(404).json(formatResponse(false, 'Project not found'));
    }

    await project.destroy();
    
    res.json(formatResponse(true, 'Project deleted successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * Add member to project
 * POST /api/projects/:id/members
 */
exports.addMember = async (req, res, next) => {
  try {
    const { user_id, role } = req.body;

    // Check if user exists
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json(formatResponse(false, 'User not found'));
    }

    // Check if already member
    const existing = await ProjectMember.findOne({
      where: { project_id: req.params.id, user_id }
    });

    if (existing) {
      return res.status(400).json(formatResponse(false, 'User is already a member'));
    }

    const member = await ProjectMember.create({
      project_id: req.params.id,
      user_id,
      role: role || 'developer'
    });

    res.status(201).json(formatResponse(true, 'Member added successfully', { member }));
  } catch (error) {
    next(error);
  }
};

/**
 * Remove member from project
 * DELETE /api/projects/:id/members/:userId
 */
exports.removeMember = async (req, res, next) => {
  try {
    const member = await ProjectMember.findOne({
      where: {
        project_id: req.params.id,
        user_id: req.params.userId
      }
    });

    if (!member) {
      return res.status(404).json(formatResponse(false, 'Member not found'));
    }

    await member.destroy();
    
    res.json(formatResponse(true, 'Member removed successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * Update member role
 * PUT /api/projects/:id/members/:userId
 */
exports.updateMemberRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    
    const member = await ProjectMember.findOne({
      where: {
        project_id: req.params.id,
        user_id: req.params.userId
      }
    });

    if (!member) {
      return res.status(404).json(formatResponse(false, 'Member not found'));
    }

    await member.update({ role });
    
    res.json(formatResponse(true, 'Member role updated successfully', { member }));
  } catch (error) {
    next(error);
  }
};

/**
 * Get project statistics
 * GET /api/projects/:id/statistics
 */
exports.getStatistics = async (req, res, next) => {
  try {
    const projectId = req.params.id;

    const [
      totalTasks,
      completedTasks,
      inProgressTasks,
      totalSprints,
      activeSprints,
      totalMembers
    ] = await Promise.all([
      Task.count({ where: { project_id: projectId } }),
      Task.count({ where: { project_id: projectId, status: 'done' } }),
      Task.count({ where: { project_id: projectId, status: 'in_progress' } }),
      Sprint.count({ where: { project_id: projectId } }),
      Sprint.count({ where: { project_id: projectId, status: 'active' } }),
      ProjectMember.count({ where: { project_id: projectId } })
    ]);

    const statistics = {
      total_tasks: totalTasks,
      completed_tasks: completedTasks,
      in_progress_tasks: inProgressTasks,
      backlog_tasks: await Task.count({ where: { project_id: projectId, status: 'backlog' } }),
      total_sprints: totalSprints,
      active_sprints: activeSprints,
      total_members: totalMembers,
      completion_rate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    };

    res.json(formatResponse(true, 'Statistics retrieved successfully', { statistics }));
  } catch (error) {
    next(error);
  }
};
