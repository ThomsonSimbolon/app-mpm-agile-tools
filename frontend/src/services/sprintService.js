import api from './api';

export const sprintService = {
  async getByProject(projectId) {
    const response = await api.get(`/sprints/projects/${projectId}/sprints`);
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/sprints/${id}`);
    return response.data;
  },

  async create(projectId, data) {
    const response = await api.post(`/sprints/projects/${projectId}/sprints`, data);
    return response.data;
  },

  async update(id, data) {
    const response = await api.put(`/sprints/${id}`, data);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/sprints/${id}`);
    return response.data;
  },

  async start(id) {
    const response = await api.post(`/sprints/${id}/start`);
    return response.data;
  },

  async complete(id) {
    const response = await api.post(`/sprints/${id}/complete`);
    return response.data;
  },

  async getBurndown(id) {
    const response = await api.get(`/sprints/${id}/burndown`);
    return response.data;
  }
};
