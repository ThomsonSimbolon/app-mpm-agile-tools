/**
 * =============================================================================
 * RBAC SERVICE - Frontend API calls for Role-Based Access Control
 * =============================================================================
 */

import api from "./api";

const rbacService = {
  // ==========================================================================
  // ROLE DEFINITIONS (for dropdowns)
  // ==========================================================================

  /**
   * Get all role definitions
   */
  getRoleDefinitions: async () => {
    const response = await api.get("/rbac/role-definitions");
    return response.data;
  },

  // ==========================================================================
  // DASHBOARD
  // ==========================================================================

  /**
   * Get RBAC dashboard statistics
   */
  getDashboardStats: async () => {
    const response = await api.get("/rbac/dashboard");
    return response.data;
  },

  // ==========================================================================
  // PERMISSIONS
  // ==========================================================================

  /**
   * Get all permissions
   */
  getPermissions: async () => {
    const response = await api.get("/rbac/permissions");
    return response.data;
  },

  /**
   * Get permission by code
   */
  getPermissionByCode: async (code) => {
    const response = await api.get(`/rbac/permissions/${code}`);
    return response.data;
  },

  /**
   * Create new permission
   */
  createPermission: async (data) => {
    const response = await api.post("/rbac/permissions", data);
    return response.data;
  },

  // ==========================================================================
  // ROLE-PERMISSION MAPPING
  // ==========================================================================

  /**
   * Get role-permission mappings
   */
  getRolePermissionMappings: async (params = {}) => {
    const response = await api.get("/rbac/role-permissions", { params });
    return response.data;
  },

  /**
   * Add permission to role
   */
  addPermissionToRole: async (data) => {
    const response = await api.post("/rbac/role-permissions", data);
    return response.data;
  },

  /**
   * Remove permission from role
   */
  removePermissionFromRole: async (data) => {
    const response = await api.delete("/rbac/role-permissions", { data });
    return response.data;
  },

  // ==========================================================================
  // USER ROLE MANAGEMENT
  // ==========================================================================

  /**
   * Get user roles
   */
  getUserRoles: async (userId) => {
    const response = await api.get(`/rbac/users/${userId}/roles`);
    return response.data;
  },

  /**
   * Update user system role
   */
  updateUserSystemRole: async (userId, data) => {
    const response = await api.put(`/rbac/users/${userId}/system-role`, data);
    return response.data;
  },

  /**
   * Assign division role to user
   */
  assignDivisionRole: async (userId, data) => {
    const response = await api.post(
      `/rbac/users/${userId}/division-role`,
      data
    );
    return response.data;
  },

  /**
   * Assign team role to user
   */
  assignTeamRole: async (userId, data) => {
    const response = await api.post(`/rbac/users/${userId}/team-role`, data);
    return response.data;
  },

  /**
   * Assign project role to user
   */
  assignProjectRole: async (userId, data) => {
    const response = await api.post(`/rbac/users/${userId}/project-role`, data);
    return response.data;
  },

  /**
   * Remove division role from user
   */
  removeDivisionRole: async (userId, data) => {
    const response = await api.delete(`/rbac/users/${userId}/division-role`, {
      data,
    });
    return response.data;
  },

  // ==========================================================================
  // EFFECTIVE PERMISSIONS (Current User)
  // ==========================================================================

  /**
   * Get current user's effective permissions
   */
  getMyPermissions: async (context = {}) => {
    const response = await api.get("/rbac/my-permissions", { params: context });
    return response.data;
  },

  /**
   * Check if current user has permission
   */
  checkPermission: async (permission, context = {}) => {
    const response = await api.post("/rbac/check-permission", {
      permission,
      ...context,
    });
    return response.data;
  },

  /**
   * Bulk check multiple permissions
   */
  bulkCheckPermissions: async (permissions, context = {}) => {
    const response = await api.post("/rbac/bulk-check-permissions", {
      permissions,
      ...context,
    });
    return response.data;
  },

  // ==========================================================================
  // AUDIT LOGS
  // ==========================================================================

  /**
   * Get audit logs
   */
  getAuditLogs: async (params = {}) => {
    const response = await api.get("/rbac/audit-logs", { params });
    return response.data;
  },
};

export default rbacService;
