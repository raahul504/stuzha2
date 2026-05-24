import apiClient from './axios';

export const couponService = {
    validate: async (code, courseId) => {
        const response = await apiClient.post('/coupons/validate', { code, courseId });
        return response.data;
    },
    getAll: async () => {
        const response = await apiClient.get('/coupons');
        return response.data;
    },
    create: async (data) => {
        const response = await apiClient.post('/coupons', data);
        return response.data;
    },
    update: async (id, data) => {
        const response = await apiClient.patch(`/coupons/${id}`, data);
        return response.data;
    },
    delete: async (id) => {
        const response = await apiClient.delete(`/coupons/${id}`);
        return response.data;
    },
};