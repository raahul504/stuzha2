import apiClient from './axios';

export const courseService = {
  // Get all courses
  getAllCourses: async () => {
    const response = await apiClient.get('/courses');
    return response.data;
  },

  // Get course by ID
  getCourseById: async (courseId) => {
    const response = await apiClient.get(`/courses/${courseId}`);
    return response.data;
  },

  // Get user's enrolled courses
  getMyCourses: async () => {
    const response = await apiClient.get('/courses/my-courses');
    return response.data;
  },

  // Enroll in course
  enrollInCourse: async (courseId, couponCode = null) => {
    const response = await apiClient.post(`/courses/${courseId}/enroll`, { couponCode });
    return response.data;
  },
};