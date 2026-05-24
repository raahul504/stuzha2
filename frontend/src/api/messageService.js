import apiClient from './axios';

export const messageService = {
    // Send message to instructor
    sendToInstructor: async (courseId, messageText) => {
        const response = await apiClient.post('/messages/to-instructor', {
            courseId,
            messageText
        });
        return response.data;
    },

    // Reply to message
    replyToMessage: async (messageId, messageText) => {
        const response = await apiClient.post(`/messages/${messageId}/reply`, {
            messageText
        });
        return response.data;
    },

    // Get inbox
    getInbox: async (filters = {}) => {
        const params = new URLSearchParams(filters);
        const response = await apiClient.get(`/messages/inbox?${params}`);
        return response.data;
    },

    // Get conversation
    getConversation: async (messageId) => {
        const response = await apiClient.get(`/messages/${messageId}`);
        return response.data;
    },

    // Mark as read
    markAsRead: async (messageId) => {
        const response = await apiClient.put(`/messages/${messageId}/read`);
        return response.data;
    },

    // Get unread count
    // skipAuthRedirect: true — prevents a 401 on this background poll from triggering
    // the session-expired redirect. It's a soft background request, not user-initiated.
    getUnreadCount: async () => {
        const response = await apiClient.get('/messages/unread-count', {
            skipAuthRedirect: true,
        });
        return response.data;
    },

    // Admin: Get unanswered questions
    getUnansweredQuestions: async (filters = {}) => {
        const params = new URLSearchParams(filters);
        const response = await apiClient.get(`/messages/unanswered?${params}`);
        return response.data;
    },

    // Admin: Send to instructor
    sendAdminToInstructor: async (recipientId, messageText, courseId = null) => {
        const response = await apiClient.post('/messages/admin/to-instructor', {
            recipientId,
            messageText,
            courseId
        });
        return response.data;
    },

    // Admin: Send to user
    sendAdminToUser: async (recipientId, messageText) => {
        const response = await apiClient.post('/messages/admin/to-user', {
            recipientId,
            messageText
        });
        return response.data;
    },

    // Admin: Send bulk reminders
    sendBulkReminders: async (instructorIds, messageText) => {
        const response = await apiClient.post('/messages/admin/bulk-reminders', {
            instructorIds,
            messageText
        });
        return response.data;
    }
};