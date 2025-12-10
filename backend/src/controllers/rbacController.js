/**
 * =============================================================================
 * RBAC CONTROLLER - Enterprise Role-Based Access Control
 * =============================================================================
 * Controller untuk mengelola RBAC: roles, permissions, assignments
 * =============================================================================
 */

const { Op } = require("sequelize");
const {
  User,
  Department,
  DepartmentMember,
  Team,
  TeamMember,
  Project,
  ProjectMember,
  RbacPermission,
  RolePermission,
  UserRoleAssignment,
  PermissionAuditLog,
  sequelize,
} = require("../models");

const {
  resolveEffectivePermissions,
  hasPermission,
  getAllUserRoles,
  isSuperAdmin,
  SYSTEM_ROLES,
  DIVISION_ROLES,
  TEAM_ROLES,
  PROJECT_ROLES,
  PERMISSIONS,
} = require("../middleware/roleCheckAdvanced");

// =============================================================================
// PERMISSION MANAGEMENT
// =============================================================================

/**
 * Get all permissions
 */
exports.getAllPermissions = async (req, res) => {
  try {
    const permissions = await RbacPermission.findAll({
      where: { is_active: true },
      order: [
        ["category", "ASC"],
        ["name", "ASC"],
      ],
    });

    // Group by category
    const grouped = permissions.reduce((acc, perm) => {
      if (!acc[perm.category]) {
        acc[perm.category] = [];
      }
      acc[perm.category].push(perm);
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        permissions,
        grouped,
        total: permissions.length,
      },
    });
  } catch (error) {
    console.error("Error getting permissions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get permissions",
      error: error.message,
    });
  }
};

/**
 * Get permission by code
 */
exports.getPermissionByCode = async (req, res) => {
  try {
    const permission = await RbacPermission.findOne({
      where: { code: req.params.code },
      include: [
        {
          model: RolePermission,
          as: "rolePermissions",
        },
      ],
    });

    if (!permission) {
      return res.status(404).json({
        success: false,
        message: "Permission not found",
      });
    }

    res.json({
      success: true,
      data: permission,
    });
  } catch (error) {
    console.error("Error getting permission:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get permission",
      error: error.message,
    });
  }
};

/**
 * Create new permission
 */
exports.createPermission = async (req, res) => {
  try {
    const { code, name, description, category } = req.body;

    // Check if permission exists
    const existing = await RbacPermission.findOne({
      where: { code },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Permission code already exists",
      });
    }

    const permission = await RbacPermission.create({
      code,
      name,
      description,
      category,
    });

    // Log audit
    await PermissionAuditLog.create({
      user_id: req.user.id,
      target_user_id: req.user.id,
      action: "grant",
      role_type: "system",
      role_name: "permission_created",
      reason: `Created new permission: ${code}`,
      ip_address: req.ip,
      user_agent: req.get("user-agent"),
    });

    res.status(201).json({
      success: true,
      message: "Permission created successfully",
      data: permission,
    });
  } catch (error) {
    console.error("Error creating permission:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create permission",
      error: error.message,
    });
  }
};

// =============================================================================
// ROLE-PERMISSION MAPPING
// =============================================================================

/**
 * Get role-permission mappings
 */
exports.getRolePermissionMappings = async (req, res) => {
  try {
    const { role_type, role_name } = req.query;
    const where = {};

    if (role_type) where.role_type = role_type;
    if (role_name) where.role_name = role_name;

    const mappings = await RolePermission.findAll({
      where,
      include: [
        {
          model: RbacPermission,
          as: "permission",
        },
      ],
      order: [
        ["role_type", "ASC"],
        ["role_name", "ASC"],
      ],
    });

    // Group by role
    const groupedByRole = mappings.reduce((acc, mapping) => {
      const key = `${mapping.role_type}.${mapping.role_name}`;
      if (!acc[key]) {
        acc[key] = {
          role_type: mapping.role_type,
          role_name: mapping.role_name,
          permissions: [],
        };
      }
      acc[key].permissions.push({
        id: mapping.permission_id,
        code: mapping.permission?.code,
        name: mapping.permission?.name,
        is_conditional: mapping.is_conditional,
        condition_type: mapping.condition_type,
      });
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        mappings,
        groupedByRole: Object.values(groupedByRole),
      },
    });
  } catch (error) {
    console.error("Error getting role-permission mappings:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get role-permission mappings",
      error: error.message,
    });
  }
};

/**
 * Add permission to role
 */
exports.addPermissionToRole = async (req, res) => {
  try {
    const {
      role_type,
      role_name,
      permission_code,
      is_conditional,
      condition_type,
      condition_config,
    } = req.body;

    // Validate role type
    if (!["system", "division", "team", "project"].includes(role_type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role type",
      });
    }

    // Get permission
    const permission = await RbacPermission.findOne({
      where: { code: permission_code },
    });

    if (!permission) {
      return res.status(404).json({
        success: false,
        message: "Permission not found",
      });
    }

    // Check if mapping exists
    const existing = await RolePermission.findOne({
      where: {
        role_type,
        role_name,
        permission_id: permission.id,
      },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Permission already assigned to this role",
      });
    }

    // Create mapping
    const mapping = await RolePermission.create({
      role_type,
      role_name,
      permission_id: permission.id,
      is_conditional: is_conditional || false,
      condition_type,
      condition_config,
    });

    res.status(201).json({
      success: true,
      message: "Permission added to role successfully",
      data: mapping,
    });
  } catch (error) {
    console.error("Error adding permission to role:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add permission to role",
      error: error.message,
    });
  }
};

/**
 * Remove permission from role
 */
exports.removePermissionFromRole = async (req, res) => {
  try {
    const { role_type, role_name, permission_code } = req.body;

    // Get permission
    const permission = await RbacPermission.findOne({
      where: { code: permission_code },
    });

    if (!permission) {
      return res.status(404).json({
        success: false,
        message: "Permission not found",
      });
    }

    const deleted = await RolePermission.destroy({
      where: {
        role_type,
        role_name,
        permission_id: permission.id,
      },
    });

    if (deleted === 0) {
      return res.status(404).json({
        success: false,
        message: "Role-permission mapping not found",
      });
    }

    res.json({
      success: true,
      message: "Permission removed from role successfully",
    });
  } catch (error) {
    console.error("Error removing permission from role:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove permission from role",
      error: error.message,
    });
  }
};

// =============================================================================
// USER ROLE MANAGEMENT
// =============================================================================

/**
 * Get all roles for a user
 */
exports.getUserRoles = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId, {
      attributes: [
        "id",
        "username",
        "full_name",
        "email",
        "role",
        "system_role",
        "institution_role",
      ],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const roles = await getAllUserRoles(userId);

    res.json({
      success: true,
      data: {
        user,
        roles,
      },
    });
  } catch (error) {
    console.error("Error getting user roles:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user roles",
      error: error.message,
    });
  }
};

/**
 * Update user's system role
 */
exports.updateUserSystemRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { system_role, institution_role, reason } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Validate system_role
    if (
      system_role &&
      !["super_admin", "admin", "security_officer", "ai_admin", null].includes(
        system_role
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid system role",
      });
    }

    // Only super_admin can assign super_admin role
    const isCurrUserSuperAdmin = await isSuperAdmin(req.user.id);
    if (system_role === "super_admin" && !isCurrUserSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: "Only super_admin can assign super_admin role",
      });
    }

    const oldSystemRole = user.system_role;
    const oldInstitutionRole = user.institution_role;

    // Update user
    await user.update({
      system_role: system_role !== undefined ? system_role : user.system_role,
      institution_role:
        institution_role !== undefined
          ? institution_role
          : user.institution_role,
    });

    // Log audit
    await PermissionAuditLog.create({
      user_id: req.user.id,
      target_user_id: userId,
      action: "modify",
      role_type: "system",
      role_name: system_role || institution_role || "updated",
      old_role: oldSystemRole || oldInstitutionRole,
      new_role: system_role || institution_role,
      reason: reason || "System role updated via API",
      ip_address: req.ip,
      user_agent: req.get("user-agent"),
    });

    res.json({
      success: true,
      message: "User system role updated successfully",
      data: {
        userId,
        system_role: user.system_role,
        institution_role: user.institution_role,
      },
    });
  } catch (error) {
    console.error("Error updating user system role:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user system role",
      error: error.message,
    });
  }
};

/**
 * Assign user to division with role
 */
exports.assignDivisionRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { department_id, role, position, is_head, reason } = req.body;

    // Validate
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const department = await Department.findByPk(department_id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    // Check if already member
    let membership = await DepartmentMember.findOne({
      where: { department_id, user_id: userId },
    });

    if (membership) {
      const oldRole = membership.role;

      await membership.update({
        role,
        position,
        is_head: is_head || false,
        is_active: true,
      });

      // Log audit
      await PermissionAuditLog.create({
        user_id: req.user.id,
        target_user_id: userId,
        action: "modify",
        role_type: "division",
        role_name: role,
        resource_type: "department",
        resource_id: department_id,
        old_role: oldRole,
        new_role: role,
        reason: reason || "Division role updated",
        ip_address: req.ip,
        user_agent: req.get("user-agent"),
      });

      res.json({
        success: true,
        message: "Division role updated successfully",
        data: membership,
      });
    } else {
      membership = await DepartmentMember.create({
        department_id,
        user_id: userId,
        role,
        position,
        is_head: is_head || false,
        is_active: true,
      });

      // Log audit
      await PermissionAuditLog.create({
        user_id: req.user.id,
        target_user_id: userId,
        action: "grant",
        role_type: "division",
        role_name: role,
        resource_type: "department",
        resource_id: department_id,
        new_role: role,
        reason: reason || "Division role assigned",
        ip_address: req.ip,
        user_agent: req.get("user-agent"),
      });

      res.status(201).json({
        success: true,
        message: "User assigned to division successfully",
        data: membership,
      });
    }
  } catch (error) {
    console.error("Error assigning division role:", error);
    res.status(500).json({
      success: false,
      message: "Failed to assign division role",
      error: error.message,
    });
  }
};

/**
 * Assign user to team with role
 */
exports.assignTeamRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      team_id,
      role,
      position,
      specialization,
      capacity_percentage,
      reason,
    } = req.body;

    // Validate
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const team = await Team.findByPk(team_id);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    // Check if already member
    let membership = await TeamMember.findOne({
      where: { team_id, user_id: userId },
    });

    if (membership) {
      const oldRole = membership.role;

      await membership.update({
        role,
        position,
        specialization,
        capacity_percentage: capacity_percentage || 100,
        is_active: true,
      });

      // Log audit
      await PermissionAuditLog.create({
        user_id: req.user.id,
        target_user_id: userId,
        action: "modify",
        role_type: "team",
        role_name: role,
        resource_type: "team",
        resource_id: team_id,
        old_role: oldRole,
        new_role: role,
        reason: reason || "Team role updated",
        ip_address: req.ip,
        user_agent: req.get("user-agent"),
      });

      res.json({
        success: true,
        message: "Team role updated successfully",
        data: membership,
      });
    } else {
      membership = await TeamMember.create({
        team_id,
        user_id: userId,
        role,
        position,
        specialization,
        capacity_percentage: capacity_percentage || 100,
        is_active: true,
      });

      // Log audit
      await PermissionAuditLog.create({
        user_id: req.user.id,
        target_user_id: userId,
        action: "grant",
        role_type: "team",
        role_name: role,
        resource_type: "team",
        resource_id: team_id,
        new_role: role,
        reason: reason || "Team role assigned",
        ip_address: req.ip,
        user_agent: req.get("user-agent"),
      });

      res.status(201).json({
        success: true,
        message: "User assigned to team successfully",
        data: membership,
      });
    }
  } catch (error) {
    console.error("Error assigning team role:", error);
    res.status(500).json({
      success: false,
      message: "Failed to assign team role",
      error: error.message,
    });
  }
};

/**
 * Assign user to project with role
 */
exports.assignProjectRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      project_id,
      role,
      is_primary,
      allocation_percentage,
      can_approve,
      reason,
    } = req.body;

    // Validate
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const project = await Project.findByPk(project_id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check if already member
    let membership = await ProjectMember.findOne({
      where: { project_id, user_id: userId },
    });

    if (membership) {
      const oldRole = membership.role;

      await membership.update({
        role,
        is_primary: is_primary || false,
        allocation_percentage: allocation_percentage || 100,
        can_approve: can_approve || false,
      });

      // Log audit
      await PermissionAuditLog.create({
        user_id: req.user.id,
        target_user_id: userId,
        action: "modify",
        role_type: "project",
        role_name: role,
        resource_type: "project",
        resource_id: project_id,
        old_role: oldRole,
        new_role: role,
        reason: reason || "Project role updated",
        ip_address: req.ip,
        user_agent: req.get("user-agent"),
      });

      res.json({
        success: true,
        message: "Project role updated successfully",
        data: membership,
      });
    } else {
      membership = await ProjectMember.create({
        project_id,
        user_id: userId,
        role,
        is_primary: is_primary || false,
        allocation_percentage: allocation_percentage || 100,
        can_approve: can_approve || false,
      });

      // Log audit
      await PermissionAuditLog.create({
        user_id: req.user.id,
        target_user_id: userId,
        action: "grant",
        role_type: "project",
        role_name: role,
        resource_type: "project",
        resource_id: project_id,
        new_role: role,
        reason: reason || "Project role assigned",
        ip_address: req.ip,
        user_agent: req.get("user-agent"),
      });

      res.status(201).json({
        success: true,
        message: "User assigned to project successfully",
        data: membership,
      });
    }
  } catch (error) {
    console.error("Error assigning project role:", error);
    res.status(500).json({
      success: false,
      message: "Failed to assign project role",
      error: error.message,
    });
  }
};

/**
 * Remove user from division
 */
exports.removeDivisionRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { department_id, reason } = req.body;

    const membership = await DepartmentMember.findOne({
      where: { department_id, user_id: userId },
    });

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: "User is not a member of this department",
      });
    }

    const oldRole = membership.role;

    await membership.destroy();

    // Log audit
    await PermissionAuditLog.create({
      user_id: req.user.id,
      target_user_id: userId,
      action: "revoke",
      role_type: "division",
      role_name: oldRole,
      resource_type: "department",
      resource_id: department_id,
      old_role: oldRole,
      reason: reason || "Division role revoked",
      ip_address: req.ip,
      user_agent: req.get("user-agent"),
    });

    res.json({
      success: true,
      message: "User removed from division successfully",
    });
  } catch (error) {
    console.error("Error removing division role:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove division role",
      error: error.message,
    });
  }
};

// =============================================================================
// EFFECTIVE PERMISSIONS
// =============================================================================

/**
 * Get current user's effective permissions
 */
exports.getMyPermissions = async (req, res) => {
  try {
    const context = {
      departmentId: req.query.department_id,
      teamId: req.query.team_id,
      projectId: req.query.project_id,
    };

    const { roles, permissions } = await resolveEffectivePermissions(
      req.user.id,
      context
    );

    res.json({
      success: true,
      data: {
        userId: req.user.id,
        context,
        roles,
        permissions,
        permissionCount: permissions.length,
      },
    });
  } catch (error) {
    console.error("Error getting permissions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get permissions",
      error: error.message,
    });
  }
};

/**
 * Check if user has specific permission
 */
exports.checkPermission = async (req, res) => {
  try {
    const { permission, department_id, team_id, project_id, task_id } =
      req.body;

    const context = {
      departmentId: department_id,
      teamId: team_id,
      projectId: project_id,
      taskId: task_id,
    };

    const allowed = await hasPermission(req.user.id, permission, context);

    res.json({
      success: true,
      data: {
        permission,
        allowed,
        context,
      },
    });
  } catch (error) {
    console.error("Error checking permission:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check permission",
      error: error.message,
    });
  }
};

/**
 * Bulk check multiple permissions
 */
exports.bulkCheckPermissions = async (req, res) => {
  try {
    const { permissions, department_id, team_id, project_id } = req.body;

    if (!Array.isArray(permissions)) {
      return res.status(400).json({
        success: false,
        message: "permissions must be an array",
      });
    }

    const context = {
      departmentId: department_id,
      teamId: team_id,
      projectId: project_id,
    };

    const results = {};
    for (const permission of permissions) {
      results[permission] = await hasPermission(
        req.user.id,
        permission,
        context
      );
    }

    res.json({
      success: true,
      data: {
        permissions: results,
        context,
      },
    });
  } catch (error) {
    console.error("Error bulk checking permissions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to bulk check permissions",
      error: error.message,
    });
  }
};

// =============================================================================
// AUDIT LOGS
// =============================================================================

/**
 * Get audit logs
 */
exports.getAuditLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      user_id,
      target_user_id,
      action,
      role_type,
      start_date,
      end_date,
    } = req.query;

    const where = {};

    if (user_id) where.user_id = user_id;
    if (target_user_id) where.target_user_id = target_user_id;
    if (action) where.action = action;
    if (role_type) where.role_type = role_type;

    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) where.created_at[Op.gte] = new Date(start_date);
      if (end_date) where.created_at[Op.lte] = new Date(end_date);
    }

    const { count, rows: logs } = await PermissionAuditLog.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: "actor",
          attributes: ["id", "username", "full_name"],
        },
        {
          model: User,
          as: "targetUser",
          attributes: ["id", "username", "full_name"],
        },
      ],
      order: [["created_at", "DESC"]],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error("Error getting audit logs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get audit logs",
      error: error.message,
    });
  }
};

// =============================================================================
// ROLE DEFINITIONS (for frontend dropdown)
// =============================================================================

/**
 * Get available role definitions
 */
exports.getRoleDefinitions = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        system_roles: SYSTEM_ROLES,
        division_roles: DIVISION_ROLES,
        team_roles: TEAM_ROLES,
        project_roles: PROJECT_ROLES,
        all_permissions: PERMISSIONS,
      },
    });
  } catch (error) {
    console.error("Error getting role definitions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get role definitions",
      error: error.message,
    });
  }
};

// =============================================================================
// DASHBOARD STATS
// =============================================================================

/**
 * Get RBAC dashboard statistics
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      usersWithSystemRole,
      totalDepartments,
      totalTeams,
      totalProjects,
      totalPermissions,
      recentAuditLogs,
    ] = await Promise.all([
      User.count({ where: { status: "active" } }),
      User.count({ where: { system_role: { [Op.ne]: null } } }),
      Department.count({ where: { is_active: true } }),
      Team.count({ where: { status: "active" } }),
      Project.count({ where: { status: { [Op.ne]: "deleted" } } }),
      RbacPermission.count({ where: { is_active: true } }),
      PermissionAuditLog.count({
        where: {
          created_at: {
            [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      }),
    ]);

    // Role distribution
    const systemRoleDistribution = await User.findAll({
      attributes: [
        "system_role",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      where: { system_role: { [Op.ne]: null } },
      group: ["system_role"],
      raw: true,
    });

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          usersWithSystemRole,
          totalDepartments,
          totalTeams,
          totalProjects,
          totalPermissions,
          recentAuditLogs,
        },
        systemRoleDistribution,
      },
    });
  } catch (error) {
    console.error("Error getting dashboard stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get dashboard stats",
      error: error.message,
    });
  }
};

module.exports = exports;
