import api from "./api";

export const userService = {
  async getAll(params = {}) {
    const response = await api.get("/users", { params });
    return response.data;
  },

  async getAllUsers(params = {}) {
    const response = await api.get("/users", { params });
    return response.data;
  },

  async getById(userId) {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },

  async getProfile(userId) {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },

  async create(data) {
    const response = await api.post("/users", data);
    return response.data;
  },

  async update(userId, data) {
    const response = await api.put(`/users/${userId}`, data);
    return response.data;
  },

  async adminUpdate(userId, data) {
    const response = await api.put(`/users/${userId}/admin`, data);
    return response.data;
  },

  async updateProfile(userId, data) {
    const response = await api.put(`/users/${userId}`, data);
    return response.data;
  },

  async updateStatus(userId, status) {
    const response = await api.put(`/users/${userId}/status`, { status });
    return response.data;
  },

  async resetPassword(userId, newPassword) {
    const response = await api.post(`/users/${userId}/reset-password`, {
      new_password: newPassword,
    });
    return response.data;
  },

  async delete(userId) {
    const response = await api.delete(`/users/${userId}`);
    return response.data;
  },

  async uploadAvatar(userId, file) {
    const formData = new FormData();
    formData.append("avatar", file);

    const response = await api.post(`/users/${userId}/avatar`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  async deleteAvatar(userId) {
    const response = await api.delete(`/users/${userId}/avatar`);
    return response.data;
  },

  async search(query) {
    const response = await api.get("/users/search", { params: { q: query } });
    return response.data;
  },
};
