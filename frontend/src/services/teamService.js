import api from "./api";

/**
 * Department Service
 */
export const departmentService = {
  // Get all departments (hierarchical)
  getAll: async (params = {}) => {
    const response = await api.get("/departments", { params });
    return response.data;
  },

  // Get flat list with pagination
  getList: async (params = {}) => {
    const response = await api.get("/departments", {
      params: { ...params, flat: true },
    });
    return response.data;
  },

  // Get department by ID
  getById: async (id) => {
    const response = await api.get(`/departments/${id}`);
    return response.data;
  },

  // Create department
  create: async (data) => {
    const response = await api.post("/departments", data);
    return response.data;
  },

  // Update department
  update: async (id, data) => {
    const response = await api.put(`/departments/${id}`, data);
    return response.data;
  },

  // Delete department
  delete: async (id) => {
    const response = await api.delete(`/departments/${id}`);
    return response.data;
  },

  // Get department statistics
  getStats: async (id) => {
    const response = await api.get(`/departments/${id}/stats`);
    return response.data;
  },

  // Reorder departments
  reorder: async (orders) => {
    const response = await api.put("/departments/reorder", { orders });
    return response.data;
  },
};

/**
 * Team Service
 */
export const teamService = {
  // Get all teams
  getAll: async (params = {}) => {
    const response = await api.get("/teams", { params });
    return response.data;
  },

  // Get team list (alias for getAll)
  getList: async (params = {}) => {
    const response = await api.get("/teams", { params });
    return response.data;
  },

  // Get team by ID
  getById: async (id) => {
    const response = await api.get(`/teams/${id}`);
    return response.data;
  },

  // Create team
  create: async (data) => {
    const response = await api.post("/teams", data);
    return response.data;
  },

  // Update team
  update: async (id, data) => {
    const response = await api.put(`/teams/${id}`, data);
    return response.data;
  },

  // Delete team
  delete: async (id) => {
    const response = await api.delete(`/teams/${id}`);
    return response.data;
  },

  // Get my teams
  getMyTeams: async () => {
    const response = await api.get("/teams/my-teams");
    return response.data;
  },

  // Get team members
  getMembers: async (teamId) => {
    const response = await api.get(`/teams/${teamId}/members`);
    return response.data;
  },

  // Add member to team
  addMember: async (teamId, data) => {
    const response = await api.post(`/teams/${teamId}/members`, data);
    return response.data;
  },

  // Update team member
  updateMember: async (teamId, userId, data) => {
    const response = await api.put(`/teams/${teamId}/members/${userId}`, data);
    return response.data;
  },

  // Remove member from team
  removeMember: async (teamId, userId) => {
    const response = await api.delete(`/teams/${teamId}/members/${userId}`);
    return response.data;
  },

  // Get available users to add to team
  getAvailableUsers: async (teamId, search = "") => {
    const response = await api.get(`/teams/${teamId}/available-users`, {
      params: { search },
    });
    return response.data;
  },
};

export default {
  department: departmentService,
  team: teamService,
};
