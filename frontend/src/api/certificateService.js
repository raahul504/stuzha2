import apiClient from './axios';

export const certificateService = {
  generateCertificate: async (courseId) => {
    const response = await apiClient.post(`/certificates/generate/${courseId}`);
    return response.data;
  },
};