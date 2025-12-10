const { Team, TeamMember, Department, User, Project } = require("../models");
const {
  formatResponse,
  getPagination,
  formatPaginatedResponse,
} = require("../utils/helpers");
const { Op } = require("sequelize");

/**
 * Create new team
 * POST /api/teams
 */
exports.create = async (req, res, next) => {
  try {
    const {
      name,
      description,
      department_id,
      lead_user_id,
      color,
      max_members,
    } = req.body;

    // Validate department exists
    if (department_id) {
      const department = await Department.findByPk(department_id);
      if (!department) {
        return res
          .status(404)
          .json(formatResponse(false, "Department not found"));
      }
    }

    const team = await Team.create({
      name,
      description,
      department_id,
      lead_user_id,
      color: color || "#3B82F6",
      max_members,
    });

    // Auto-add lead as team member
    if (lead_user_id) {
      await TeamMember.create({
        team_id: team.id,
        user_id: lead_user_id,
        role: "lead",
        joined_at: new Date(),
      });
    }

    const fullTeam = await Team.findByPk(team.id, {
      include: [
        {
          model: Department,
          as: "department",
          attributes: ["id", "name", "code"],
        },
        {
          model: User,
          as: "lead",
          attributes: ["id", "username", "full_name", "avatar_url"],
        },
      ],
    });

    res
      .status(201)
      .json(
        formatResponse(true, "Team created successfully", { team: fullTeam })
      );
  } catch (error) {
    next(error);
  }
};

/**
 * Get all teams
 * GET /api/teams
 */
exports.list = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      department_id,
      is_active,
    } = req.query;
    const { offset, limit: queryLimit } = getPagination(page, limit);

    const where = {};

    if (search) {
      where.name = { [Op.like]: `%${search}%` };
    }

    if (department_id) {
      where.department_id = department_id;
    }

    if (is_active !== undefined) {
      where.is_active = is_active === "true";
    } else {
      where.is_active = true;
    }

    const teams = await Team.findAndCountAll({
      where,
      include: [
        {
          model: Department,
          as: "department",
          attributes: ["id", "name", "code"],
        },
        {
          model: User,
          as: "lead",
          attributes: ["id", "username", "full_name", "avatar_url"],
        },
        {
          model: TeamMember,
          as: "teamMembers",
          where: { is_active: true },
          required: false,
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "username", "full_name", "avatar_url"],
            },
          ],
        },
      ],
      order: [["name", "ASC"]],
      limit: queryLimit,
      offset,
      distinct: true,
    });

    // Add member count
    const teamsWithCount = teams.rows.map((team) => ({
      ...team.toJSON(),
      memberCount: team.teamMembers?.length || 0,
    }));

    res.json(
      formatResponse(true, "Teams retrieved successfully", {
        ...formatPaginatedResponse(
          { count: teams.count, rows: teamsWithCount },
          page,
          queryLimit
        ),
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get team by ID
 * GET /api/teams/:id
 */
exports.getById = async (req, res, next) => {
  try {
    const team = await Team.findByPk(req.params.id, {
      include: [
        {
          model: Department,
          as: "department",
          attributes: ["id", "name", "code"],
        },
        {
          model: User,
          as: "lead",
          attributes: ["id", "username", "full_name", "avatar_url", "email"],
        },
        {
          model: TeamMember,
          as: "teamMembers",
          include: [
            {
              model: User,
              as: "user",
              attributes: [
                "id",
                "username",
                "full_name",
                "avatar_url",
                "email",
                "role",
              ],
            },
          ],
          order: [
            ["role", "ASC"],
            ["joined_at", "ASC"],
          ],
        },
      ],
    });

    if (!team) {
      return res.status(404).json(formatResponse(false, "Team not found"));
    }

    res.json(formatResponse(true, "Team retrieved successfully", { team }));
  } catch (error) {
    next(error);
  }
};

/**
 * Update team
 * PUT /api/teams/:id
 */
exports.update = async (req, res, next) => {
  try {
    const team = await Team.findByPk(req.params.id);

    if (!team) {
      return res.status(404).json(formatResponse(false, "Team not found"));
    }

    const {
      name,
      description,
      department_id,
      lead_user_id,
      color,
      max_members,
      is_active,
    } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (department_id !== undefined) updateData.department_id = department_id;
    if (lead_user_id !== undefined) updateData.lead_user_id = lead_user_id;
    if (color !== undefined) updateData.color = color;
    if (max_members !== undefined) updateData.max_members = max_members;
    if (is_active !== undefined) updateData.is_active = is_active;

    // Handle lead change
    if (lead_user_id !== undefined && lead_user_id !== team.lead_user_id) {
      // Demote old lead to member
      if (team.lead_user_id) {
        await TeamMember.update(
          { role: "member" },
          { where: { team_id: team.id, user_id: team.lead_user_id } }
        );
      }

      // Add or promote new lead
      if (lead_user_id) {
        const existingMember = await TeamMember.findOne({
          where: { team_id: team.id, user_id: lead_user_id },
        });

        if (existingMember) {
          await existingMember.update({ role: "lead" });
        } else {
          await TeamMember.create({
            team_id: team.id,
            user_id: lead_user_id,
            role: "lead",
            joined_at: new Date(),
          });
        }
      }
    }

    await team.update(updateData);

    const updatedTeam = await Team.findByPk(team.id, {
      include: [
        {
          model: Department,
          as: "department",
          attributes: ["id", "name", "code"],
        },
        {
          model: User,
          as: "lead",
          attributes: ["id", "username", "full_name", "avatar_url"],
        },
      ],
    });

    res.json(
      formatResponse(true, "Team updated successfully", { team: updatedTeam })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Delete team
 * DELETE /api/teams/:id
 */
exports.delete = async (req, res, next) => {
  try {
    const team = await Team.findByPk(req.params.id);

    if (!team) {
      return res.status(404).json(formatResponse(false, "Team not found"));
    }

    // Soft delete
    await team.update({ is_active: false });

    // Deactivate all team members
    await TeamMember.update(
      { is_active: false },
      { where: { team_id: team.id } }
    );

    res.json(formatResponse(true, "Team deleted successfully"));
  } catch (error) {
    next(error);
  }
};

// ==================== TEAM MEMBER OPERATIONS ====================

/**
 * Add member to team
 * POST /api/teams/:id/members
 */
exports.addMember = async (req, res, next) => {
  try {
    const team = await Team.findByPk(req.params.id);

    if (!team) {
      return res.status(404).json(formatResponse(false, "Team not found"));
    }

    const { user_id, role = "member", position } = req.body;

    // Check if user exists
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json(formatResponse(false, "User not found"));
    }

    // Check if already a member
    const existingMember = await TeamMember.findOne({
      where: { team_id: team.id, user_id },
    });

    if (existingMember) {
      if (existingMember.is_active) {
        return res
          .status(400)
          .json(formatResponse(false, "User is already a member of this team"));
      }
      // Reactivate
      await existingMember.update({
        is_active: true,
        role,
        position,
        joined_at: new Date(),
      });
    } else {
      // Check max members
      if (team.max_members) {
        const currentCount = await TeamMember.count({
          where: { team_id: team.id, is_active: true },
        });
        if (currentCount >= team.max_members) {
          return res
            .status(400)
            .json(
              formatResponse(
                false,
                `Team has reached maximum capacity of ${team.max_members} members`
              )
            );
        }
      }

      await TeamMember.create({
        team_id: team.id,
        user_id,
        role,
        position,
        joined_at: new Date(),
      });
    }

    const member = await TeamMember.findOne({
      where: { team_id: team.id, user_id },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "full_name", "avatar_url", "email"],
        },
      ],
    });

    res
      .status(201)
      .json(formatResponse(true, "Member added successfully", { member }));
  } catch (error) {
    next(error);
  }
};

/**
 * Update team member
 * PUT /api/teams/:id/members/:userId
 */
exports.updateMember = async (req, res, next) => {
  try {
    const { id: teamId, userId } = req.params;
    const { role, position } = req.body;

    const member = await TeamMember.findOne({
      where: { team_id: teamId, user_id: userId },
    });

    if (!member) {
      return res
        .status(404)
        .json(formatResponse(false, "Team member not found"));
    }

    // If promoting to lead, handle old lead
    if (role === "lead") {
      const team = await Team.findByPk(teamId);
      if (team.lead_user_id && team.lead_user_id !== parseInt(userId)) {
        await TeamMember.update(
          { role: "member" },
          { where: { team_id: teamId, user_id: team.lead_user_id } }
        );
      }
      await team.update({ lead_user_id: userId });
    }

    await member.update({ role, position });

    const updatedMember = await TeamMember.findOne({
      where: { team_id: teamId, user_id: userId },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "full_name", "avatar_url", "email"],
        },
      ],
    });

    res.json(
      formatResponse(true, "Member updated successfully", {
        member: updatedMember,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Remove member from team
 * DELETE /api/teams/:id/members/:userId
 */
exports.removeMember = async (req, res, next) => {
  try {
    const { id: teamId, userId } = req.params;

    const member = await TeamMember.findOne({
      where: { team_id: teamId, user_id: userId },
    });

    if (!member) {
      return res
        .status(404)
        .json(formatResponse(false, "Team member not found"));
    }

    // If removing lead, clear team lead
    const team = await Team.findByPk(teamId);
    if (team.lead_user_id === parseInt(userId)) {
      await team.update({ lead_user_id: null });
    }

    // Soft delete member
    await member.update({ is_active: false });

    res.json(formatResponse(true, "Member removed successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * Get team members
 * GET /api/teams/:id/members
 */
exports.getMembers = async (req, res, next) => {
  try {
    const team = await Team.findByPk(req.params.id);

    if (!team) {
      return res.status(404).json(formatResponse(false, "Team not found"));
    }

    const members = await TeamMember.findAll({
      where: { team_id: team.id, is_active: true },
      include: [
        {
          model: User,
          as: "user",
          attributes: [
            "id",
            "username",
            "full_name",
            "avatar_url",
            "email",
            "role",
          ],
        },
      ],
      order: [
        ["role", "ASC"], // lead first
        ["joined_at", "ASC"],
      ],
    });

    res.json(
      formatResponse(true, "Team members retrieved successfully", { members })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get teams for current user
 * GET /api/teams/my-teams
 */
exports.getMyTeams = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const teamMembers = await TeamMember.findAll({
      where: { user_id: userId, is_active: true },
      include: [
        {
          model: Team,
          as: "team",
          where: { is_active: true },
          include: [
            {
              model: Department,
              as: "department",
              attributes: ["id", "name", "code"],
            },
            {
              model: User,
              as: "lead",
              attributes: ["id", "username", "full_name", "avatar_url"],
            },
          ],
        },
      ],
    });

    const teams = teamMembers.map((tm) => ({
      ...tm.team.toJSON(),
      myRole: tm.role,
      myPosition: tm.position,
      joinedAt: tm.joined_at,
    }));

    res.json(
      formatResponse(true, "My teams retrieved successfully", { teams })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get available users to add to team
 * GET /api/teams/:id/available-users
 */
exports.getAvailableUsers = async (req, res, next) => {
  try {
    const { search } = req.query;
    const teamId = req.params.id;

    // Get current team member IDs
    const currentMembers = await TeamMember.findAll({
      where: { team_id: teamId, is_active: true },
      attributes: ["user_id"],
    });
    const memberIds = currentMembers.map((m) => m.user_id);

    const where = {
      id: { [Op.notIn]: memberIds },
      is_active: true,
    };

    if (search) {
      where[Op.or] = [
        { username: { [Op.like]: `%${search}%` } },
        { full_name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    const users = await User.findAll({
      where,
      attributes: [
        "id",
        "username",
        "full_name",
        "avatar_url",
        "email",
        "role",
      ],
      limit: 20,
      order: [["full_name", "ASC"]],
    });

    res.json(
      formatResponse(true, "Available users retrieved successfully", { users })
    );
  } catch (error) {
    next(error);
  }
};
