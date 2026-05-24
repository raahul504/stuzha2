const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Static routes MUST come before dynamic /:messageId routes
router.get('/inbox', messageController.getInbox);
router.get('/unread-count', messageController.getUnreadCount);
router.get('/unanswered', messageController.getUnansweredQuestions);
router.post('/to-instructor', messageController.sendToInstructor);
router.post('/admin/to-instructor', messageController.sendAdminToInstructor);
router.post('/admin/to-user', messageController.sendAdminToUser);
router.post('/admin/bulk-reminders', messageController.sendBulkReminders);

// Dynamic routes come AFTER static routes
router.get('/:messageId', messageController.getConversation);
router.post('/:messageId/reply', messageController.replyToMessage);
router.put('/:messageId/read', messageController.markAsRead);

module.exports = router;