const express = require('express');
const router = express.Router();
const approvalController = require('../controllers/approvalController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Instructor routes
router.post('/courses/:courseId/request-publish', approvalController.requestPublish);
router.post('/courses/:courseId/request-unpublish', approvalController.requestUnpublish);

// Admin routes
router.get('/admin/approvals/publish-requests', approvalController.getPendingPublishRequests);
router.get('/admin/approvals/unpublish-requests', approvalController.getPendingUnpublishRequests);
router.post('/admin/approvals/publish/:courseId/approve', approvalController.approvePublish);
router.post('/admin/approvals/publish/:courseId/disapprove', approvalController.disapprovePublish);
router.post('/admin/approvals/unpublish/:courseId/approve', approvalController.approveUnpublish);
router.post('/admin/approvals/unpublish/:courseId/disapprove', approvalController.disapproveUnpublish);
router.get('/admin/approvals/history/:courseId', approvalController.getApprovalHistory);
router.get('/admin/approvals/logs', approvalController.getAllApprovalLogs);

module.exports = router;