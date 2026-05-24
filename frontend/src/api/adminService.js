import apiClient from './axios';

export const adminService = {
  createCourse: async (courseData) => {
    const response = await apiClient.post('/courses', courseData);
    return response.data;
  },

  getAllCourses: async () => {
    const response = await apiClient.get('/courses');
    return response.data;
  },

  getCourseById: async (id) => {
    const response = await apiClient.get(`/courses/${id}`);
    return response.data;
  },

  updateCourse: async (courseId, data) => {
    const response = await apiClient.put(`/courses/${courseId}`, data);
    return response.data;
  },

  deleteCourse: async (courseId) => {
    const response = await apiClient.delete(`/courses/${courseId}`);
    return response.data;
  },

  getModules: async (courseId) => {
    const response = await apiClient.get(`/courses/${courseId}/modules`);
    return response.data;
  },

  createModule: async (courseId, data) => {
    const response = await apiClient.post(`/courses/${courseId}/modules`, data);
    return response.data;
  },

  updateModule: async (moduleId, data) => {
    const response = await apiClient.put(`/modules/${moduleId}`, data);
    return response.data;
  },

  deleteModule: async (moduleId) => {
    const response = await apiClient.delete(`/modules/${moduleId}`);
    return response.data;
  },

  getContent: async (moduleId) => {
    const response = await apiClient.get(`/modules/${moduleId}/content`);
    return response.data;
  },

  createContent: async (moduleId, data) => {
    const response = await apiClient.post(`/modules/${moduleId}/content`, data);
    return response.data;
  },

  uploadVideo: async (moduleId, data, file) => {
    const formData = new FormData();
    formData.append('video', file);
    Object.keys(data).forEach(key => formData.append(key, data[key]));
    
    const response = await apiClient.post(`/videos/upload/${moduleId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  uploadArticle: async (moduleId, data, file) => {
  const formData = new FormData();
  formData.append('article', file);
  Object.keys(data).forEach(key => formData.append(key, data[key]));
  
  const response = await apiClient.post(`/articles/upload/${moduleId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
},

  deleteContent: async (contentId) => {
    const response = await apiClient.delete(`/content/${contentId}`);
    return response.data;
  },

  getQuestions: async (contentId) => {
    const response = await apiClient.get(`/content/${contentId}/questions`);
    return response.data;
  },

  addQuestion: async (contentId, data) => {
    const response = await apiClient.post(`/content/${contentId}/questions`, data);
    return response.data;
  },

  reorderModules: async (courseId, orders) => {
    try {
      const response = await apiClient.put(`/courses/${courseId}/modules/reorder`, { orders });
      return response.data;
    } catch (error) {
      console.error('Error reordering modules:', error);
      throw error;
    }
  },

  reorderContent: async (moduleId, orders) => {
    const response = await apiClient.put(`/modules/${moduleId}/content/reorder`, { orders });
    return response.data;
  },
};