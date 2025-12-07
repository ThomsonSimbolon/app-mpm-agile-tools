import api from './api';

export const projectService = {
  async getAll(params = {}) {
    const response = await api.get('/projects', { params });
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },

  async create(data) {
    const response = await api.post('/projects', data);
    return response.data;
  },

  async update(id, data) {
    const response = await api.put(`/projects/${id}`, data);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/projects/${id}`);
    return response.data;
  },

  async getStatistics(id) {
    const response = await api.get(`/projects/${id}/statistics`);
    return response.data;
  },

  async addMember(id, userId, role) {
    const response = await api.post(`/projects/${id}/members`, { user_id: userId, role });
    return response.data;
  },

  async removeMember(id, userId) {
    const response = await api.delete(`/projects/${id}/members/${userId}`);
    return response.data;
  }
};
