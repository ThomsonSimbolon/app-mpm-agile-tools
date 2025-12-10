/**
 * =============================================================================
 * RBAC ROUTES - Enterprise Role-Based Access Control API
 * =============================================================================
 * Routes untuk manajemen RBAC: roles, permissions, assignments
 * =============================================================================
 */

const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  roleCheckAdvanced,
  requireSystemAdmin,
  requireSuperAdmin,
  SYSTEM_ROLES,
  PERMISSIONS,
} = require("../middleware/roleCheckAdvanced");

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
} = require("../models");

const { Op } = require("sequelize");

// =============================================================================
// PERMISSION ROUTES
// =============================================================================

/**
 * GET /api/rbac/permissions
 * Get all permissions
 */
router.get("/permissions", auth, requireSystemAdmin(), async (req, res) => {
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
});

/**
 * GET /api/rbac/role-definitions
 * Get all role definitions for dropdowns/UI
 */
router.get("/role-definitions", auth, async (req, res) => {
  try {
    // Define role definitions from middleware constants
    const roleDefinitions = {
      system: [
        {
          value: "super_admin",
          label: "Super Admin",
          description: "Full system access",
        },
        {
          value: "admin",
          label: "Admin",
          description: "System administration",
        },
        {
          value: "manager",
          label: "Manager",
          description: "Management access",
        },
        { value: "user", label: "User", description: "Standard user access" },
      ],
      division: [
        {
          value: "kepala_divisi",
          label: "Kepala Divisi",
          description: "Division head",
        },
        {
          value: "wakil_divisi",
          label: "Wakil Divisi",
          description: "Deputy division head",
        },
        { value: "staff", label: "Staff", description: "Division staff" },
        { value: "member", label: "Member", description: "Division member" },
      ],
      team: [
        { value: "team_lead", label: "Team Lead", description: "Team leader" },
        { value: "senior", label: "Senior", description: "Senior team member" },
        { value: "member", label: "Member", description: "Team member" },
        { value: "junior", label: "Junior", description: "Junior team member" },
      ],
      project: [
        {
          value: "project_manager",
          label: "Project Manager",
          description: "Project management",
        },
        { value: "lead", label: "Lead", description: "Project lead" },
        {
          value: "developer",
          label: "Developer",
          description: "Project developer",
        },
        { value: "viewer", label: "Viewer", description: "Read-only access" },
      ],
      institution: [
        {
          value: "superadmin",
          label: "Superadmin",
          description: "Institution superadmin",
        },
        {
          value: "admin_sistem",
          label: "Admin Sistem",
          description: "System administrator",
        },
        {
          value: "manager",
          label: "Manager",
          description: "Institution manager",
        },
        { value: "hrd", label: "HRD", description: "Human resources" },
        {
          value: "kepala_divisi",
          label: "Kepala Divisi",
          description: "Division head",
        },
        {
          value: "project_manager",
          label: "Project Manager",
          description: "Project manager",
        },
        { value: "staff", label: "Staff", description: "General staff" },
        { value: "instruktur", label: "Instruktur", description: "Instructor" },
      ],
    };

    res.json({
      success: true,
      data: roleDefinitions,
    });
  } catch (error) {
    console.error("Error getting role definitions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get role definitions",
      error: error.message,
    });
  }
});

/**
 * GET /api/rbac/dashboard
 * Get RBAC dashboard statistics
 */
router.get("/dashboard", auth, requireSystemAdmin(), async (req, res) => {
  try {
    // Get counts
    const totalUsers = await User.count();
    const usersWithSystemRole = await User.count({
      where: {
        system_role: {
          [Op.not]: null,
        },
      },
    });
    const totalDepartments = await Department.count();
    const totalTeams = await Team.count();
    const totalProjects = await Project.count();
    const totalPermissions = await RbacPermission.count({
      where: { is_active: true },
    });

    // Get system role distribution
    const systemRoleDistribution = await User.findAll({
      attributes: [
        "system_role",
        [
          require("sequelize").fn("COUNT", require("sequelize").col("id")),
          "count",
        ],
      ],
      where: {
        system_role: {
          [Op.not]: null,
        },
      },
      group: ["system_role"],
      raw: true,
    });

    // Get recent audit logs count (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    let recentAuditLogs = 0;
    try {
      recentAuditLogs = await PermissionAuditLog.count({
        where: {
          created_at: {
            [Op.gte]: sevenDaysAgo,
          },
        },
      });
    } catch (e) {
      // Table might not exist yet
      recentAuditLogs = 0;
    }

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
        systemRoleDistribution: systemRoleDistribution.map((item) => ({
          role: item.system_role,
          count: parseInt(item.count),
        })),
      },
    });
  } catch (error) {
    console.error("Error getting dashboard stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get dashboard statistics",
      error: error.message,
    });
  }
});

/**
 * GET /api/rbac/permissions/:code
 * Get permission by code
 */
router.get(
  "/permissions/:code",
  auth,
  requireSystemAdmin(),
  async (req, res) => {
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
  }
);

// =============================================================================
// ROLE PERMISSION MAPPING ROUTES
// =============================================================================

/**
 * GET /api/rbac/role-permissions
 * Get role-permission mappings
 */
router.get(
  "/role-permissions",
  auth,
  requireSystemAdmin(),
  async (req, res) => {
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

      res.json({
        success: true,
        data: mappings,
      });
    } catch (error) {
      console.error("Error getting role permissions:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get role permissions",
        error: error.message,
      });
    }
  }
);

/**
 * POST /api/rbac/role-permissions
 * Add permission to role
 */
router.post(
  "/role-permissions",
  auth,
  requireSuperAdmin(),
  async (req, res) => {
    try {
      const {
        role_type,
        role_name,
        permission_code,
        is_conditional,
        condition_type,
        condition_config,
      } = req.body;

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
        message: "Permission added to role",
        data: mapping,
      });
    } catch (error) {
      console.error("Error adding role permission:", error);
      res.status(500).json({
        success: false,
        message: "Failed to add role permission",
        error: error.message,
      });
    }
  }
);

/**
 * DELETE /api/rbac/role-permissions/:id
 * Remove permission from role
 */
router.delete(
  "/role-permissions/:id",
  auth,
  requireSuperAdmin(),
  async (req, res) => {
    try {
      const mapping = await RolePermission.findByPk(req.params.id);

      if (!mapping) {
        return res.status(404).json({
          success: false,
          message: "Role permission mapping not found",
        });
      }

      await mapping.destroy();

      res.json({
        success: true,
        message: "Permission removed from role",
      });
    } catch (error) {
      console.error("Error removing role permission:", error);
      res.status(500).json({
        success: false,
        message: "Failed to remove role permission",
        error: error.message,
      });
    }
  }
);

// =============================================================================
// USER ROLE ASSIGNMENT ROUTES
// =============================================================================

/**
 * GET /api/rbac/users/:userId/roles
 * Get all roles for a user
 */
router.get(
  "/users/:userId/roles",
  auth,
  requireSystemAdmin(),
  async (req, res) => {
    try {
      const { userId } = req.params;

      const user = await User.findByPk(userId, {
        attributes: [
          "id",
          "username",
          "email",
          "full_name",
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

      // Get division memberships
      const divisionMemberships = await DepartmentMember.findAll({
        where: { user_id: userId, is_active: true },
        include: [{ model: require("../models").Department, as: "department" }],
      });

      // Get team memberships
      const teamMemberships = await TeamMember.findAll({
        where: { user_id: userId, is_active: true },
        include: [{ model: Team, as: "team" }],
      });

      // Get project memberships
      const projectMemberships = await ProjectMember.findAll({
        where: { user_id: userId },
        include: [{ model: Project, as: "project" }],
      });

      // Get dynamic role assignments
      const dynamicAssignments = await UserRoleAssignment.findAll({
        where: {
          user_id: userId,
          is_active: true,
          [Op.or]: [
            { valid_until: null },
            { valid_until: { [Op.gt]: new Date() } },
          ],
        },
      });

      res.json({
        success: true,
        data: {
          user,
          systemRole: user.system_role,
          institutionRole: user.institution_role,
          divisionRoles: divisionMemberships.map((m) => ({
            departmentId: m.department_id,
            departmentName: m.department?.name,
            role: m.role,
            isHead: m.is_head,
          })),
          teamRoles: teamMemberships.map((m) => ({
            teamId: m.team_id,
            teamName: m.team?.name,
            role: m.role,
            position: m.position,
          })),
          projectRoles: projectMemberships.map((m) => ({
            projectId: m.project_id,
            projectName: m.project?.name,
            role: m.role,
            isPrimary: m.is_primary,
          })),
          dynamicAssignments,
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
  }
);

/**
 * PUT /api/rbac/users/:userId/system-role
 * Update user's system role
 */
router.put(
  "/users/:userId/system-role",
  auth,
  requireSuperAdmin(),
  async (req, res) => {
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

      const oldSystemRole = user.system_role;
      const oldInstitutionRole = user.institution_role;

      // Update user
      await user.update({
        system_role,
        institution_role,
      });

      // Log the change
      await PermissionAuditLog.create({
        user_id: req.user.id,
        target_user_id: userId,
        action: oldSystemRole ? "modify" : "grant",
        role_type: "system",
        role_name: system_role || "none",
        old_role: oldSystemRole,
        new_role: system_role,
        reason,
        ip_address: req.ip,
        user_agent: req.headers["user-agent"],
      });

      res.json({
        success: true,
        message: "User system role updated",
        data: {
          userId,
          oldSystemRole,
          newSystemRole: system_role,
          oldInstitutionRole,
          newInstitutionRole: institution_role,
        },
      });
    } catch (error) {
      console.error("Error updating system role:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update system role",
        error: error.message,
      });
    }
  }
);

/**
 * POST /api/rbac/users/:userId/assignments
 * Create dynamic role assignment
 */
router.post(
  "/users/:userId/assignments",
  auth,
  requireSystemAdmin(),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const {
        role_type,
        role_name,
        resource_type,
        resource_id,
        valid_from,
        valid_until,
        notes,
      } = req.body;

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const assignment = await UserRoleAssignment.create({
        user_id: userId,
        role_type,
        role_name,
        resource_type,
        resource_id,
        assigned_by: req.user.id,
        valid_from: valid_from || new Date(),
        valid_until,
        notes,
      });

      // Log the assignment
      await PermissionAuditLog.create({
        user_id: req.user.id,
        target_user_id: userId,
        action: "grant",
        role_type,
        role_name,
        resource_type,
        resource_id,
        reason: notes,
        ip_address: req.ip,
        user_agent: req.headers["user-agent"],
      });

      res.status(201).json({
        success: true,
        message: "Role assignment created",
        data: assignment,
      });
    } catch (error) {
      console.error("Error creating role assignment:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create role assignment",
        error: error.message,
      });
    }
  }
);

/**
 * DELETE /api/rbac/assignments/:id
 * Revoke role assignment
 */
router.delete(
  "/assignments/:id",
  auth,
  requireSystemAdmin(),
  async (req, res) => {
    try {
      const assignment = await UserRoleAssignment.findByPk(req.params.id);

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: "Assignment not found",
        });
      }

      // Soft delete - set is_active to false
      await assignment.update({ is_active: false });

      // Log the revocation
      await PermissionAuditLog.create({
        user_id: req.user.id,
        target_user_id: assignment.user_id,
        action: "revoke",
        role_type: assignment.role_type,
        role_name: assignment.role_name,
        resource_type: assignment.resource_type,
        resource_id: assignment.resource_id,
        ip_address: req.ip,
        user_agent: req.headers["user-agent"],
      });

      res.json({
        success: true,
        message: "Role assignment revoked",
      });
    } catch (error) {
      console.error("Error revoking assignment:", error);
      res.status(500).json({
        success: false,
        message: "Failed to revoke assignment",
        error: error.message,
      });
    }
  }
);

// =============================================================================
// DEPARTMENT MEMBER ROUTES
// =============================================================================

/**
 * GET /api/rbac/departments/:departmentId/members
 * Get department members with roles
 */
router.get("/departments/:departmentId/members", auth, async (req, res) => {
  try {
    const members = await DepartmentMember.findAll({
      where: { department_id: req.params.departmentId, is_active: true },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "email", "full_name", "avatar_url"],
        },
      ],
      order: [["role", "ASC"]],
    });

    res.json({
      success: true,
      data: members,
    });
  } catch (error) {
    console.error("Error getting department members:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get department members",
      error: error.message,
    });
  }
});

/**
 * POST /api/rbac/departments/:departmentId/members
 * Add member to department
 */
router.post(
  "/departments/:departmentId/members",
  auth,
  roleCheckAdvanced({
    permissions: [PERMISSIONS.MANAGE_DIVISION_MEMBERS],
  }),
  async (req, res) => {
    try {
      const { departmentId } = req.params;
      const { user_id, role, position, is_head } = req.body;

      // Check if department exists
      const department = await Department.findByPk(departmentId);
      if (!department) {
        return res.status(404).json({
          success: false,
          message: "Department not found",
        });
      }

      // Check if user exists
      const user = await User.findByPk(user_id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Create membership
      const membership = await DepartmentMember.create({
        department_id: departmentId,
        user_id,
        role: role || "division_viewer",
        position,
        is_head: is_head || false,
      });

      // Update department head if is_head is true
      if (is_head) {
        await department.update({ head_user_id: user_id });
      }

      res.status(201).json({
        success: true,
        message: "Member added to department",
        data: membership,
      });
    } catch (error) {
      console.error("Error adding department member:", error);
      res.status(500).json({
        success: false,
        message: "Failed to add department member",
        error: error.message,
      });
    }
  }
);

/**
 * PUT /api/rbac/departments/:departmentId/members/:userId
 * Update member role in department
 */
router.put(
  "/departments/:departmentId/members/:userId",
  auth,
  roleCheckAdvanced({
    permissions: [PERMISSIONS.MANAGE_DIVISION_MEMBERS],
  }),
  async (req, res) => {
    try {
      const { departmentId, userId } = req.params;
      const { role, position, is_head } = req.body;

      const membership = await DepartmentMember.findOne({
        where: { department_id: departmentId, user_id: userId },
      });

      if (!membership) {
        return res.status(404).json({
          success: false,
          message: "Membership not found",
        });
      }

      const oldRole = membership.role;

      await membership.update({ role, position, is_head });

      // Log the change
      await PermissionAuditLog.create({
        user_id: req.user.id,
        target_user_id: userId,
        action: "modify",
        role_type: "division",
        role_name: role,
        resource_type: "department",
        resource_id: departmentId,
        old_role: oldRole,
        new_role: role,
        ip_address: req.ip,
        user_agent: req.headers["user-agent"],
      });

      res.json({
        success: true,
        message: "Member role updated",
        data: membership,
      });
    } catch (error) {
      console.error("Error updating department member:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update department member",
        error: error.message,
      });
    }
  }
);

// =============================================================================
// AUDIT ROUTES
// =============================================================================

/**
 * GET /api/rbac/audit-logs
 * Get permission audit logs
 */
router.get(
  "/audit-logs",
  auth,
  roleCheckAdvanced({
    permissions: [PERMISSIONS.VIEW_AUDIT_LOGS],
  }),
  async (req, res) => {
    try {
      const {
        page = 1,
        limit = 20,
        user_id,
        target_user_id,
        action,
        role_type,
      } = req.query;
      const where = {};

      if (user_id) where.user_id = user_id;
      if (target_user_id) where.target_user_id = target_user_id;
      if (action) where.action = action;
      if (role_type) where.role_type = role_type;

      const { rows: logs, count } = await PermissionAuditLog.findAndCountAll({
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
  }
);

// =============================================================================
// EFFECTIVE PERMISSIONS
// =============================================================================

/**
 * GET /api/rbac/my-permissions
 * Get current user's effective permissions
 */
router.get("/my-permissions", auth, async (req, res) => {
  try {
    const {
      resolveEffectivePermissions,
    } = require("../middleware/roleCheckAdvanced");

    // Get context from query params
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
});

/**
 * POST /api/rbac/check-permission
 * Check if user has specific permission
 */
router.post("/check-permission", auth, async (req, res) => {
  try {
    const { hasPermission } = require("../middleware/roleCheckAdvanced");
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
});

module.exports = router;
