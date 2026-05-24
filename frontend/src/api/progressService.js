import apiClient from './axios';

export const progressService = {
  updateVideoProgress: async (contentId, lastPositionSeconds, completed = false, totalWatchTimeSeconds = 0) => {
    const response = await apiClient.put(`/progress/video/${contentId}`, {
      lastPositionSeconds,
      completed,
      totalWatchTimeSeconds,
    });
    return response.data;
  },

  submitAssessment: async (contentId, answers) => {
    const response = await apiClient.post(`/progress/assessment/${contentId}/submit`, {
      answers,
    });
    return response.data;
  },
};