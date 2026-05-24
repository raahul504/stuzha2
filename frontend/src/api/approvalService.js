import apiClient from './axios';

export const approvalService = {
    // Request publish approval
    requestPublish: async (courseId) => {
        const response = await apiClient.post(`/courses/${courseId}/request-publish`);
        return response.data;
    },

    // Request unpublish approval
    requestUnpublish: async (courseId) => {
        const response = await apiClient.post(`/courses/${courseId}/request-unpublish`);
        return response.data;
    },

    // Admin: Get pending publish requests
    getPendingPublishRequests: async () => {
        const response = await apiClient.get('/admin/approvals/publish-requests');
        return response.data;
    },

    // Admin: Get pending unpublish requests
    getPendingUnpublishRequests: async () => {
        const response = await apiClient.get('/admin/approvals/unpublish-requests');
        return response.data;
    },

    // Admin: Approve publish
    approvePublish: async (courseId) => {
        const response = await apiClient.post(`/admin/approvals/publish/${courseId}/approve`);
        return response.data;
    },

    // Admin: Disapprove publish
    disapprovePublish: async (courseId, reason) => {
        const response = await apiClient.post(`/admin/approvals/publish/${courseId}/disapprove`, {
            reason
        });
        return response.data;
    },

    // Admin: Approve unpublish
    approveUnpublish: async (courseId) => {
        const response = await apiClient.post(`/admin/approvals/unpublish/${courseId}/approve`);
        return response.data;
    },

    // Admin: Disapprove unpublish
    disapproveUnpublish: async (courseId, reason) => {
        const response = await apiClient.post(`/admin/approvals/unpublish/${courseId}/disapprove`, {
            reason
        });
        return response.data;
    },

    // Admin: Get approval history
    getApprovalHistory: async (courseId) => {
        const response = await apiClient.get(`/admin/approvals/history/${courseId}`);
        return response.data;
    },

    // Admin: Get all approval logs
    getAllApprovalLogs: async (filters = {}) => {
        const params = new URLSearchParams();
        Object.keys(filters).forEach(key => {
            if (filters[key]) {
                params.append(key, filters[key]);
            }
        });
        const response = await apiClient.get(`/admin/approvals/logs?${params}`);
        return response.data;
    }
};