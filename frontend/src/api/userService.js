// frontend/src/api/userService.js - NEW FILE

import apiClient from './axios';

export const userService = {
  getProfile: async () => {
    const response = await apiClient.get('/user/profile');
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await apiClient.put('/user/profile', data);
    return response.data;
  },

  changePassword: async (currentPassword, newPassword) => {
    const response = await apiClient.put('/user/password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  getRecommendations: async () => {
    const response = await apiClient.get('/user/recommendations');
    return response.data;
  },

  deleteRecommendation: async (id) => {
    const response = await apiClient.delete(`/user/recommendations/${id}`);
    return response.data;
  },
};