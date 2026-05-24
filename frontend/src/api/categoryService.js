import apiClient from './axios';

export const categoryService = {
  getAllCategories: async () => {
    const response = await apiClient.get('/categories');
    return response.data;
  },

  createCategory: async (name, parentCategoryId = null) => {
    const response = await apiClient.post('/categories', { name, parentCategoryId });
    return response.data;
  },
};