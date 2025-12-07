import api from './api';

export const commentService = {
  async getByTask(taskId) {
    const response = await api.get(`/comments/tasks/${taskId}/comments`);
    return response.data;
  },

  async create(taskId, content) {
    const response = await api.post(`/comments/tasks/${taskId}/comments`, { content });
    return response.data;
  },

  async update(id, content) {
    const response = await api.put(`/comments/${id}`, { content });
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/comments/${id}`);
    return response.data;
  }
};
