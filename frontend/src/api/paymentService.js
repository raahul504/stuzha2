import apiClient from './axios';

export const paymentService = {
    createOrder: async (courseId, couponCode = null) => {
        const response = await apiClient.post('/payments/create-order', { courseId, couponCode });
        return response.data;
    },

    verifyPayment: async (data) => {
        const response = await apiClient.post('/payments/verify', data);
        return response.data;
    },
};