import apiClient from './axios';

export const notificationService = {
    // Get notifications
    getNotifications: async (isRead = undefined) => {
        const params = isRead !== undefined ? `?isRead=${isRead}` : '';
        const response = await apiClient.get(`/notifications${params}`);
        return response.data;
    },

    // Get unread count
    getUnreadCount: async () => {
        const response = await apiClient.get('/notifications/unread-count');
        return response.data;
    },

    // Mark as read
    markAsRead: async (notificationId) => {
        const response = await apiClient.put(`/notifications/${notificationId}/read`);
        return response.data;
    },

    // Mark all as read
    markAllAsRead: async () => {
        const response = await apiClient.put('/notifications/mark-all-read');
        return response.data;
    }
};