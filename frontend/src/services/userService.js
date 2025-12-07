import api from './api';

export const userService = {
  async getProfile(userId) {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },

  async updateProfile(userId, data) {
    const response = await api.put(`/users/${userId}`, data);
    return response.data;
  },

  async uploadAvatar(userId, file) {
    const formData = new FormData();
    formData.append('avatar', file);
    
    const response = await api.post(`/users/${userId}/avatar`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  async deleteAvatar(userId) {
    const response = await api.delete(`/users/${userId}/avatar`);
    return response.data;
  }
};
