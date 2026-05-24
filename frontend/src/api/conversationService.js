import apiClient from './axios';

export const conversationService = {

  // Initialize session
  initSession: async (sessionToken = null) => {
    const response = await apiClient.post('/conversation/init', {
      sessionToken,
    });
    return response.data;
  },

  // Send chat message
  sendMessage: async (message, sessionToken = null) => {
    const response = await apiClient.post('/conversation/chat', {
      message,
      sessionToken,
    });
    return response.data;
  },

  // Get courses for a learning path
  getPathCourses: async (pathId) => {
    const response = await apiClient.get(`/conversation/path/${pathId}/courses`);
    return response.data;
  },

  // Get courses for a subcategory
  getSubcategoryCourses: async (subcategoryId) => {
    const response = await apiClient.get(`/conversation/subcategory/${subcategoryId}/courses`);
    return response.data;
  },

  // Get courses by IDs
  getCoursesByIds: async (ids) => {
    const response = await apiClient.get(`/conversation/courses/by-ids?ids=${ids.join(',')}`);
    return response.data;
  },

  // Get session details
  getSession: async (sessionToken) => {
    const response = await apiClient.get(`/conversation/session/${sessionToken}`);
    return response.data;
  },

  // Reset conversation
  resetSession: async (sessionToken) => {
    const response = await apiClient.delete(`/conversation/session/${sessionToken}`);
    return response.data;
  },

  // Check SLM health
  checkHealth: async () => {
    const response = await apiClient.get('/conversation/health');
    return response.data;
  },
};