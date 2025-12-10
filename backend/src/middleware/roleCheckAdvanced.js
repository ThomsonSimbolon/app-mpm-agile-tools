/**
 * =============================================================================
 * ENTERPRISE RBAC MIDDLEWARE - Advanced Role Check
 * =============================================================================
 * Multi-layer Role-Based Access Control dengan resolusi prioritas:
 * SYSTEM > DIVISION > TEAM > PROJECT
 *
 * Features:
 * - Multi-layer role resolving
 * - Context-aware permission checking
 * - Overridable System roles (super_admin)
 * - Conditional permission evaluation
 * - Resource ownership checking
 * =============================================================================
 */

const {
  SYSTEM_ROLES,
  DIVISION_ROLES,
  TEAM_ROLES,
  PROJECT_ROLES,
  PERMISSIONS,
  SYSTEM_PERMISSION_MATRIX,
  DIVISION_PERMISSION_MATRIX,
  TEAM_PERMISSION_MATRIX,
  PROJECT_PERMISSION_MATRIX,
  CONDITIONAL_RULES,
} = require("../config/rbacConfig");

const {
  User,
  Department,
  Team,
  TeamMember,
  Project,
  ProjectMember,
  Task,
} = require("../models");

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Check if user has system-level role
 */
const hasSystemRole = (user, roles) => {
  if (!user || !user.system_role) return false;
  const rolesArray = Array.isArray(roles) ? roles : [roles];
  return rolesArray.includes(user.system_role);
};

/**
 * Check if user is super admin (has override capability)
 */
const isSuperAdmin = (user) => {
  return hasSystemRole(user, SYSTEM_ROLES.SUPER_ADMIN);
};

/**
 * Check if user is any admin type
 */
const isAdmin = (user) => {
  return hasSystemRole(user, [SYSTEM_ROLES.SUPER_ADMIN, SYSTEM_ROLES.ADMIN]);
};

/**
 * Get user's division role for a specific department
 */
const getDivisionRole = async (userId, departmentId) => {
  try {
    const { DepartmentMember } = require("../models");
    const membership = await DepartmentMember.findOne({
      where: { user_id: userId, department_id: departmentId, is_active: true },
    });
    return membership?.role || null;
  } catch (error) {
    console.error("Error getting division role:", error);
    return null;
  }
};

/**
 * Get user's team role for a specific team
 */
const getTeamRole = async (userId, teamId) => {
  try {
    const membership = await TeamMember.findOne({
      where: { user_id: userId, team_id: teamId, is_active: true },
    });
    return membership?.role || null;
  } catch (error) {
    console.error("Error getting team role:", error);
    return null;
  }
};

/**
 * Get user's project role for a specific project
 */
const getProjectRole = async (userId, projectId) => {
  try {
    const membership = await ProjectMember.findOne({
      where: { user_id: userId, project_id: projectId },
    });
    return membership?.role || null;
  } catch (error) {
    console.error("Error getting project role:", error);
    return null;
  }
};

/**
 * Get all user roles across all layers
 */
const getAllUserRoles = async (userId, context = {}) => {
  const roles = {
    system: null,
    division: null,
    team: null,
    project: null,
  };

  try {
    // Get user with system role
    const user = await User.findByPk(userId);
    if (user) {
      roles.system = user.system_role || user.role;
    }

    // Get division role if department context provided
    if (context.departmentId) {
      roles.division = await getDivisionRole(userId, context.departmentId);
    }

    // Get team role if team context provided
    if (context.teamId) {
      roles.team = await getTeamRole(userId, context.teamId);
    }

    // Get project role if project context provided
    if (context.projectId) {
      roles.project = await getProjectRole(userId, context.projectId);
    }

    return roles;
  } catch (error) {
    console.error("Error getting all user roles:", error);
    return roles;
  }
};

/**
 * Get permissions for a specific role at a specific layer
 */
const getPermissionsForRole = (role, layer) => {
  switch (layer) {
    case "system":
      return SYSTEM_PERMISSION_MATRIX[role] || [];
    case "division":
      return DIVISION_PERMISSION_MATRIX[role] || [];
    case "team":
      return TEAM_PERMISSION_MATRIX[role] || [];
    case "project":
      return PROJECT_PERMISSION_MATRIX[role] || [];
    default:
      return [];
  }
};

/**
 * Resolve effective permissions for a user based on all their roles
 * Formula: FinalAccess = SystemRole ∪ DivisionRole ∪ TeamRole ∪ ProjectRole
 */
const resolveEffectivePermissions = async (userId, context = {}) => {
  const roles = await getAllUserRoles(userId, context);
  const permissions = new Set();

  // System permissions (highest priority)
  if (roles.system) {
    const systemPerms = getPermissionsForRole(roles.system, "system");
    systemPerms.forEach((p) => permissions.add(p));

    // Super admin override - add all permissions
    if (roles.system === SYSTEM_ROLES.SUPER_ADMIN) {
      Object.values(PERMISSIONS).forEach((p) => permissions.add(p));
    }
  }

  // Division permissions
  if (roles.division) {
    const divisionPerms = getPermissionsForRole(roles.division, "division");
    divisionPerms.forEach((p) => permissions.add(p));
  }

  // Team permissions
  if (roles.team) {
    const teamPerms = getPermissionsForRole(roles.team, "team");
    teamPerms.forEach((p) => permissions.add(p));
  }

  // Project permissions
  if (roles.project) {
    const projectPerms = getPermissionsForRole(roles.project, "project");
    projectPerms.forEach((p) => permissions.add(p));
  }

  return {
    roles,
    permissions: Array.from(permissions),
  };
};

/**
 * Check if user has specific permission
 */
const hasPermission = async (userId, permission, context = {}) => {
  const { permissions } = await resolveEffectivePermissions(userId, context);
  return permissions.includes(permission);
};

/**
 * Check conditional permission rules
 */
const checkConditionalPermission = async (
  roleKey,
  permission,
  context = {}
) => {
  const ruleKey = `${roleKey}:${permission}`;
  const rule = CONDITIONAL_RULES[ruleKey];

  if (!rule) return { allowed: true, filter: null };

  switch (rule.condition) {
    case "own_only":
      // Check if user owns the resource
      if (context.taskId && context.userId) {
        const task = await Task.findByPk(context.taskId);
        if (task && task.assigned_to !== context.userId) {
          return { allowed: false, reason: "Can only modify own resources" };
        }
      }
      return { allowed: true };

    case "partial":
      return { allowed: true, filter: rule.filter };

    case "qa_fields_only":
      return { allowed: true, allowedFields: rule.allowedFields };

    default:
      return { allowed: true };
  }
};

/**
 * Check if user is task owner (assigned to)
 */
const isTaskOwner = async (userId, taskId) => {
  try {
    const task = await Task.findByPk(taskId);
    return task && task.assigned_to === userId;
  } catch (error) {
    return false;
  }
};

/**
 * Check if user is project member
 */
const isProjectMember = async (userId, projectId) => {
  try {
    const membership = await ProjectMember.findOne({
      where: { user_id: userId, project_id: projectId },
    });
    return !!membership;
  } catch (error) {
    return false;
  }
};

/**
 * Check if user is team member
 */
const isTeamMember = async (userId, teamId) => {
  try {
    const membership = await TeamMember.findOne({
      where: { user_id: userId, team_id: teamId, is_active: true },
    });
    return !!membership;
  } catch (error) {
    return false;
  }
};

// =============================================================================
// MIDDLEWARE FACTORY
// =============================================================================

/**
 * Advanced Role Check Middleware
 *
 * @param {Object} options - Configuration options
 * @param {Array} options.roles - Array of allowed roles (can include roles from any layer)
 * @param {Array} options.permissions - Array of required permissions
 * @param {String} options.layer - Specific layer to check: 'system', 'division', 'team', 'project'
 * @param {Boolean} options.requireAll - If true, user must have ALL permissions (default: false - any)
 * @param {Boolean} options.checkOwnership - If true, check resource ownership
 * @param {String} options.resourceType - Type of resource: 'task', 'project', 'team', etc.
 * @param {String} options.resourceIdParam - Request param containing resource ID
 */
const roleCheckAdvanced = (options = {}) => {
  const {
    roles = [],
    permissions = [],
    layer = null,
    requireAll = false,
    checkOwnership = false,
    resourceType = null,
    resourceIdParam = "id",
  } = options;

  return async (req, res, next) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const userId = user.id;

      // Build context from request
      const context = {
        userId,
        departmentId: req.params.departmentId || req.body.department_id,
        teamId: req.params.teamId || req.body.team_id,
        projectId: req.params.projectId || req.body.project_id,
        taskId: req.params.taskId || req.body.task_id,
      };

      // Try to get project ID from task if not provided
      if (!context.projectId && context.taskId) {
        const task = await Task.findByPk(context.taskId);
        if (task) {
          context.projectId = task.project_id;
        }
      }

      // Check for super_admin override (always allowed)
      if (user.system_role === SYSTEM_ROLES.SUPER_ADMIN) {
        req.userRoles = { system: SYSTEM_ROLES.SUPER_ADMIN };
        req.userPermissions = Object.values(PERMISSIONS);
        return next();
      }

      // Get all user roles and permissions
      const { roles: userRoles, permissions: userPermissions } =
        await resolveEffectivePermissions(userId, context);

      // Attach to request for later use
      req.userRoles = userRoles;
      req.userPermissions = userPermissions;
      req.rbacContext = context;

      // Check role-based access
      if (roles.length > 0) {
        const allUserRoles = Object.values(userRoles).filter(Boolean);
        const hasRequiredRole = roles.some((role) =>
          allUserRoles.includes(role)
        );

        if (!hasRequiredRole) {
          return res.status(403).json({
            success: false,
            message: "Insufficient role privileges",
            required: roles,
            current: allUserRoles,
          });
        }
      }

      // Check permission-based access
      if (permissions.length > 0) {
        let hasAccess = false;

        if (requireAll) {
          hasAccess = permissions.every((perm) =>
            userPermissions.includes(perm)
          );
        } else {
          hasAccess = permissions.some((perm) =>
            userPermissions.includes(perm)
          );
        }

        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: "Insufficient permissions",
            required: permissions,
            requireAll,
          });
        }
      }

      // Check ownership if required
      if (checkOwnership && resourceType && req.params[resourceIdParam]) {
        const resourceId = req.params[resourceIdParam];
        let isOwner = false;

        switch (resourceType) {
          case "task":
            isOwner = await isTaskOwner(userId, resourceId);
            break;
          case "project":
            isOwner = await isProjectMember(userId, resourceId);
            break;
          case "team":
            isOwner = await isTeamMember(userId, resourceId);
            break;
        }

        // For conditional edit permissions, check if user owns the resource
        // unless they have full edit permission
        if (
          !isOwner &&
          !userPermissions.includes(PERMISSIONS.EDIT_TASK_DETAILS)
        ) {
          // Check if user has conditional permission
          const roleKey = userRoles.project || userRoles.team || "member";
          const conditionalCheck = await checkConditionalPermission(
            roleKey,
            PERMISSIONS.EDIT_TASK,
            { ...context, taskId: resourceId }
          );

          if (!conditionalCheck.allowed) {
            return res.status(403).json({
              success: false,
              message: conditionalCheck.reason || "Resource ownership required",
            });
          }
        }
      }

      next();
    } catch (error) {
      console.error("Role check error:", error);
      return res.status(500).json({
        success: false,
        message: "Authorization error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };
};

// =============================================================================
// CONVENIENCE MIDDLEWARE HELPERS
// =============================================================================

/**
 * Require system-level admin access
 */
const requireSystemAdmin = () =>
  roleCheckAdvanced({
    roles: [SYSTEM_ROLES.SUPER_ADMIN, SYSTEM_ROLES.ADMIN],
    layer: "system",
  });

/**
 * Require super admin only
 */
const requireSuperAdmin = () =>
  roleCheckAdvanced({
    roles: [SYSTEM_ROLES.SUPER_ADMIN],
    layer: "system",
  });

/**
 * Require division head or manager
 */
const requireDivisionLead = () =>
  roleCheckAdvanced({
    roles: [
      SYSTEM_ROLES.SUPER_ADMIN,
      SYSTEM_ROLES.ADMIN,
      DIVISION_ROLES.DIVISION_HEAD,
      DIVISION_ROLES.DIVISION_MANAGER,
    ],
  });

/**
 * Require project management capabilities
 */
const requireProjectManager = () =>
  roleCheckAdvanced({
    roles: [
      SYSTEM_ROLES.SUPER_ADMIN,
      SYSTEM_ROLES.ADMIN,
      PROJECT_ROLES.PROJECT_OWNER,
      PROJECT_ROLES.PROJECT_MANAGER,
    ],
  });

/**
 * Require sprint management capabilities
 */
const requireSprintManager = () =>
  roleCheckAdvanced({
    roles: [
      SYSTEM_ROLES.SUPER_ADMIN,
      SYSTEM_ROLES.ADMIN,
      PROJECT_ROLES.PROJECT_OWNER,
      PROJECT_ROLES.PROJECT_MANAGER,
      TEAM_ROLES.SCRUM_MASTER,
      TEAM_ROLES.TEAM_LEAD,
    ],
    permissions: [PERMISSIONS.MANAGE_SPRINT, PERMISSIONS.START_END_SPRINT],
  });

/**
 * Require task edit capabilities
 */
const requireTaskEditor = () =>
  roleCheckAdvanced({
    permissions: [
      PERMISSIONS.EDIT_TASK,
      PERMISSIONS.EDIT_TASK_DETAILS,
      PERMISSIONS.CHANGE_TASK_STATUS,
    ],
  });

/**
 * Require task creation capabilities
 */
const requireTaskCreator = () =>
  roleCheckAdvanced({
    permissions: [PERMISSIONS.CREATE_TASK],
  });

/**
 * Require team management capabilities
 */
const requireTeamManager = () =>
  roleCheckAdvanced({
    roles: [
      SYSTEM_ROLES.SUPER_ADMIN,
      SYSTEM_ROLES.ADMIN,
      TEAM_ROLES.TEAM_ADMIN,
      TEAM_ROLES.TEAM_LEAD,
    ],
    permissions: [PERMISSIONS.MANAGE_TEAM_MEMBERS],
  });

/**
 * Require AI management capabilities
 */
const requireAiAdmin = () =>
  roleCheckAdvanced({
    roles: [
      SYSTEM_ROLES.SUPER_ADMIN,
      SYSTEM_ROLES.ADMIN,
      SYSTEM_ROLES.AI_ADMIN,
    ],
    permissions: [PERMISSIONS.MANAGE_AI],
  });

/**
 * Require audit log access
 */
const requireAuditAccess = () =>
  roleCheckAdvanced({
    roles: [
      SYSTEM_ROLES.SUPER_ADMIN,
      SYSTEM_ROLES.ADMIN,
      SYSTEM_ROLES.SECURITY_OFFICER,
    ],
    permissions: [PERMISSIONS.VIEW_AUDIT_LOGS],
  });

/**
 * Check if user can access project resources
 */
const requireProjectAccess = () =>
  roleCheckAdvanced({
    permissions: [PERMISSIONS.VIEW_PROJECT],
    checkOwnership: true,
    resourceType: "project",
    resourceIdParam: "projectId",
  });

/**
 * Check for task ownership or management rights
 */
const requireTaskAccess = () =>
  roleCheckAdvanced({
    permissions: [PERMISSIONS.VIEW_TASK],
    checkOwnership: true,
    resourceType: "task",
    resourceIdParam: "id",
  });

// =============================================================================
// PERMISSION CHECK HELPERS (for use in controllers)
// =============================================================================

/**
 * Check if request user has permission
 * Usage in controller: if (await checkPermission(req, 'create_task')) { ... }
 */
const checkPermission = async (req, permission) => {
  const user = req.user;
  if (!user) return false;

  // Super admin always has permission
  if (user.system_role === SYSTEM_ROLES.SUPER_ADMIN) return true;

  // Check from cached permissions
  if (req.userPermissions) {
    return req.userPermissions.includes(permission);
  }

  // Fallback: calculate permissions
  return await hasPermission(user.id, permission, req.rbacContext || {});
};

/**
 * Check if request user has any of the specified roles
 */
const checkRole = (req, roles) => {
  const user = req.user;
  if (!user) return false;

  const rolesArray = Array.isArray(roles) ? roles : [roles];

  // Check system role
  if (rolesArray.includes(user.system_role)) return true;

  // Check cached roles
  if (req.userRoles) {
    const allUserRoles = Object.values(req.userRoles).filter(Boolean);
    return rolesArray.some((role) => allUserRoles.includes(role));
  }

  return false;
};

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  // Main middleware
  roleCheckAdvanced,

  // Helper functions
  hasSystemRole,
  isSuperAdmin,
  isAdmin,
  getDivisionRole,
  getTeamRole,
  getProjectRole,
  getAllUserRoles,
  resolveEffectivePermissions,
  hasPermission,
  checkConditionalPermission,
  isTaskOwner,
  isProjectMember,
  isTeamMember,

  // Controller helpers
  checkPermission,
  checkRole,

  // Convenience middleware
  requireSystemAdmin,
  requireSuperAdmin,
  requireDivisionLead,
  requireProjectManager,
  requireSprintManager,
  requireTaskEditor,
  requireTaskCreator,
  requireTeamManager,
  requireAiAdmin,
  requireAuditAccess,
  requireProjectAccess,
  requireTaskAccess,

  // Re-export role constants for convenience
  SYSTEM_ROLES,
  DIVISION_ROLES,
  TEAM_ROLES,
  PROJECT_ROLES,
  PERMISSIONS,
};
