/**
 * =============================================================================
 * RBAC CONTEXT - Enterprise Role-Based Access Control Context
 * =============================================================================
 * Provides permission checking and role management across the app
 * =============================================================================
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";
import rbacService from "../services/rbacService";

const RbacContext = createContext(null);

export const RbacProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [permissions, setPermissions] = useState([]);
  const [roles, setRoles] = useState({});
  const [loading, setLoading] = useState(false);
  const [roleDefinitions, setRoleDefinitions] = useState(null);
  const [permissionCache, setPermissionCache] = useState({});

  // Load user's effective permissions
  const loadPermissions = useCallback(
    async (context = {}) => {
      if (!isAuthenticated) return;

      setLoading(true);
      try {
        const result = await rbacService.getMyPermissions(context);
        if (result.success) {
          setPermissions(result.data.permissions);
          setRoles(result.data.roles);
        }
      } catch (error) {
        console.error("Failed to load permissions:", error);
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated]
  );

  // Load role definitions (for dropdowns)
  const loadRoleDefinitions = useCallback(async () => {
    try {
      const result = await rbacService.getRoleDefinitions();
      if (result.success) {
        setRoleDefinitions(result.data);
      }
    } catch (error) {
      console.error("Failed to load role definitions:", error);
    }
  }, []);

  // Load on auth change
  useEffect(() => {
    if (isAuthenticated) {
      loadPermissions();
      loadRoleDefinitions();
    } else {
      setPermissions([]);
      setRoles({});
      setPermissionCache({});
    }
  }, [isAuthenticated, loadPermissions, loadRoleDefinitions]);

  // ==========================================================================
  // PERMISSION CHECKING HELPERS
  // ==========================================================================

  /**
   * Check if user has a specific permission
   * Uses cached permissions first, then API if needed
   */
  const hasPermission = useCallback(
    (permission) => {
      // Super admin has all permissions
      if (
        roles.system === "super_admin" ||
        user?.system_role === "super_admin"
      ) {
        return true;
      }

      // Admin has most permissions
      if (roles.system === "admin" || user?.system_role === "admin") {
        // List of permissions admin doesn't have
        const adminExclusions = ["override_permission", "manage_audit_logs"];
        if (!adminExclusions.includes(permission)) {
          return true;
        }
      }

      return permissions.includes(permission);
    },
    [permissions, roles, user]
  );

  /**
   * Check if user has any of the specified permissions
   */
  const hasAnyPermission = useCallback(
    (perms) => {
      return perms.some((p) => hasPermission(p));
    },
    [hasPermission]
  );

  /**
   * Check if user has all of the specified permissions
   */
  const hasAllPermissions = useCallback(
    (perms) => {
      return perms.every((p) => hasPermission(p));
    },
    [hasPermission]
  );

  /**
   * Check permission with context (for specific resource)
   * This calls the API for accurate context-based checking
   */
  const checkPermissionWithContext = useCallback(
    async (permission, context = {}) => {
      const cacheKey = `${permission}-${JSON.stringify(context)}`;

      // Check cache first
      if (permissionCache[cacheKey] !== undefined) {
        return permissionCache[cacheKey];
      }

      try {
        const result = await rbacService.checkPermission(permission, context);
        const allowed = result.data?.allowed || false;

        // Cache the result
        setPermissionCache((prev) => ({
          ...prev,
          [cacheKey]: allowed,
        }));

        return allowed;
      } catch (error) {
        console.error("Permission check failed:", error);
        return false;
      }
    },
    [permissionCache]
  );

  /**
   * Clear permission cache (call when context changes)
   */
  const clearPermissionCache = useCallback(() => {
    setPermissionCache({});
  }, []);

  // ==========================================================================
  // ROLE CHECKING HELPERS
  // ==========================================================================

  /**
   * Check if user is super admin
   */
  const isSuperAdmin = useCallback(() => {
    return (
      user?.system_role === "super_admin" || roles.system === "super_admin"
    );
  }, [user, roles]);

  /**
   * Check if user is system admin (super_admin or admin)
   */
  const isSystemAdmin = useCallback(() => {
    return (
      ["super_admin", "admin"].includes(user?.system_role) ||
      ["super_admin", "admin"].includes(roles.system)
    );
  }, [user, roles]);

  /**
   * Check if user has a specific system role
   */
  const hasSystemRole = useCallback(
    (role) => {
      return user?.system_role === role || roles.system === role;
    },
    [user, roles]
  );

  /**
   * Check if user has a specific division role
   */
  const hasDivisionRole = useCallback(
    (role) => {
      return roles.division === role;
    },
    [roles]
  );

  /**
   * Check if user has a specific team role
   */
  const hasTeamRole = useCallback(
    (role) => {
      return roles.team === role;
    },
    [roles]
  );

  /**
   * Check if user has a specific project role
   */
  const hasProjectRole = useCallback(
    (role) => {
      return roles.project === role;
    },
    [roles]
  );

  // ==========================================================================
  // CONVENIENCE PERMISSIONS
  // ==========================================================================

  const canManageUsers = useCallback(
    () => hasPermission("manage_all_users"),
    [hasPermission]
  );
  const canManageProjects = useCallback(
    () => hasPermission("manage_all_projects"),
    [hasPermission]
  );
  const canManageRbac = useCallback(
    () => hasPermission("manage_rbac"),
    [hasPermission]
  );
  const canViewAuditLogs = useCallback(
    () => hasPermission("view_audit_logs"),
    [hasPermission]
  );

  const canManageDivision = useCallback(
    () => hasPermission("manage_division"),
    [hasPermission]
  );
  const canManageTeam = useCallback(
    () => hasPermission("manage_team"),
    [hasPermission]
  );
  const canManageTeamMembers = useCallback(
    () => hasPermission("manage_team_members"),
    [hasPermission]
  );

  const canCreateProject = useCallback(
    () => hasPermission("create_project"),
    [hasPermission]
  );
  const canEditProject = useCallback(
    () => hasPermission("edit_project"),
    [hasPermission]
  );
  const canDeleteProject = useCallback(
    () => hasPermission("delete_project"),
    [hasPermission]
  );
  const canManageProjectMembers = useCallback(
    () => hasPermission("manage_project_members"),
    [hasPermission]
  );

  const canCreateTask = useCallback(
    () => hasPermission("create_task"),
    [hasPermission]
  );
  const canEditTask = useCallback(
    () => hasPermission("edit_task"),
    [hasPermission]
  );
  const canDeleteTask = useCallback(
    () => hasPermission("delete_task"),
    [hasPermission]
  );
  const canAssignTask = useCallback(
    () => hasPermission("assign_task"),
    [hasPermission]
  );
  const canChangeTaskStatus = useCallback(
    () => hasPermission("change_task_status"),
    [hasPermission]
  );

  const canManageSprints = useCallback(
    () => hasPermission("manage_sprints"),
    [hasPermission]
  );
  const canUseAi = useCallback(
    () => hasPermission("use_ai_features"),
    [hasPermission]
  );

  const value = {
    // State
    permissions,
    roles,
    loading,
    roleDefinitions,

    // Actions
    loadPermissions,
    loadRoleDefinitions,
    clearPermissionCache,

    // Permission checks
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    checkPermissionWithContext,

    // Role checks
    isSuperAdmin,
    isSystemAdmin,
    hasSystemRole,
    hasDivisionRole,
    hasTeamRole,
    hasProjectRole,

    // Convenience permissions
    canManageUsers,
    canManageProjects,
    canManageRbac,
    canViewAuditLogs,
    canManageDivision,
    canManageTeam,
    canManageTeamMembers,
    canCreateProject,
    canEditProject,
    canDeleteProject,
    canManageProjectMembers,
    canCreateTask,
    canEditTask,
    canDeleteTask,
    canAssignTask,
    canChangeTaskStatus,
    canManageSprints,
    canUseAi,
  };

  return <RbacContext.Provider value={value}>{children}</RbacContext.Provider>;
};

export const useRbac = () => {
  const context = useContext(RbacContext);
  if (!context) {
    throw new Error("useRbac must be used within RbacProvider");
  }
  return context;
};

// =============================================================================
// RBAC GUARD COMPONENT
// =============================================================================

/**
 * PermissionGate - Conditionally render children based on permissions
 *
 * Usage:
 * <PermissionGate permission="create_project">
 *   <button>Create Project</button>
 * </PermissionGate>
 *
 * <PermissionGate permissions={["edit_task", "delete_task"]} requireAll={false}>
 *   <button>Edit/Delete Task</button>
 * </PermissionGate>
 */
export const PermissionGate = ({
  permission,
  permissions,
  requireAll = true,
  fallback = null,
  children,
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useRbac();

  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions && Array.isArray(permissions)) {
    hasAccess = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
  }

  return hasAccess ? children : fallback;
};

/**
 * RoleGate - Conditionally render children based on roles
 *
 * Usage:
 * <RoleGate systemRole="super_admin">
 *   <button>Super Admin Only</button>
 * </RoleGate>
 */
export const RoleGate = ({
  systemRole,
  divisionRole,
  teamRole,
  projectRole,
  fallback = null,
  children,
}) => {
  const { hasSystemRole, hasDivisionRole, hasTeamRole, hasProjectRole } =
    useRbac();

  let hasAccess = false;

  if (systemRole) {
    hasAccess = hasSystemRole(systemRole);
  } else if (divisionRole) {
    hasAccess = hasDivisionRole(divisionRole);
  } else if (teamRole) {
    hasAccess = hasTeamRole(teamRole);
  } else if (projectRole) {
    hasAccess = hasProjectRole(projectRole);
  }

  return hasAccess ? children : fallback;
};

/**
 * AdminGate - Shorthand for system admin check
 */
export const AdminGate = ({ fallback = null, children }) => {
  const { isSystemAdmin } = useRbac();
  return isSystemAdmin() ? children : fallback;
};

/**
 * SuperAdminGate - Shorthand for super admin check
 */
export const SuperAdminGate = ({ fallback = null, children }) => {
  const { isSuperAdmin } = useRbac();
  return isSuperAdmin() ? children : fallback;
};

export default RbacContext;
