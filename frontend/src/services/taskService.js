import api from './api';

export const taskService = {
  async getByProject(projectId, params = {}) {
    const response = await api.get(`/tasks/projects/${projectId}/tasks`, { params });
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },

  async create(projectId, data) {
    const response = await api.post(`/tasks/projects/${projectId}/tasks`, data);
    return response.data;
  },

  async update(id, data) {
    const response = await api.put(`/tasks/${id}`, data);
    return response.data;
  },

  async updateStatus(id, status) {
    const response = await api.put(`/tasks/${id}/status`, { status });
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  },

  async assign(id, userId) {
    const response = await api.put(`/tasks/${id}/assign`, { assigned_to: userId });
    return response.data;
  },

  async getUserTasks(userId, params = {}) {
    const response = await api.get(`/tasks/users/${userId}/tasks`, { params });
    return response.data;
  }
};
