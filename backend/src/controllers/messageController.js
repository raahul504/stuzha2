const messageService = require('../services/messageService');
const Joi = require('joi');

// Validation schemas
const sendMessageSchema = Joi.object({
    courseId: Joi.string().uuid().required(),
    messageText: Joi.string().min(1).max(5000).required()
});

const replyMessageSchema = Joi.object({
    messageText: Joi.string().min(1).max(5000).required()
});

const adminMessageSchema = Joi.object({
    recipientId: Joi.string().uuid().required(),
    messageText: Joi.string().min(1).max(5000).required(),
    courseId: Joi.string().uuid().optional()
});

/**
 * Send message to instructor
 * POST /api/messages/to-instructor
 */
const sendToInstructor = async (req, res, next) => {
    try {
        const { error, value } = sendMessageSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                error: { message: error.details[0].message }
            });
        }

        const message = await messageService.sendUserToInstructorMessage(
            req.user.id,
            value.courseId,
            value.messageText
        );

        res.status(201).json({
            message: 'Message sent successfully',
            data: message
        });
    } catch (error) {
        if (error.message === 'Must be enrolled to message instructor' ||
            error.message === 'Course has no instructor') {
            return res.status(403).json({
                error: { message: error.message }
            });
        }
        next(error);
    }
};

/**
 * Reply to message
 * POST /api/messages/:messageId/reply
 */
const replyToMessage = async (req, res, next) => {
    try {
        const { messageId } = req.params;
        const { error, value } = replyMessageSchema.validate(req.body);

        if (error) {
            return res.status(400).json({
                error: { message: error.details[0].message }
            });
        }

        const reply = await messageService.replyToMessage(
            req.user.id,
            messageId,
            value.messageText
        );

        res.status(201).json({
            message: 'Reply sent successfully',
            data: reply
        });
    } catch (error) {
        if (error.message === 'Parent message not found') {
            return res.status(404).json({
                error: { message: error.message }
            });
        }
        if (error.message === 'Can only reply to messages sent to you' ||
            error.message === 'Students cannot reply to messages') {
            return res.status(403).json({
                error: { message: error.message }
            });
        }
        next(error);
    }
};

/**
 * Get inbox
 * GET /api/messages/inbox
 */
const getInbox = async (req, res, next) => {
    try {
        const { isRead, messageType } = req.query;

        const filters = {};
        if (isRead !== undefined) {
            filters.isRead = isRead === 'true';
        }
        if (messageType) {
            filters.messageType = messageType;
        }

        const messages = await messageService.getInbox(req.user.id, filters);

        res.json({
            messages,
            count: messages.length
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get conversation thread
 * GET /api/messages/:messageId
 */
const getConversation = async (req, res, next) => {
    try {
        const { messageId } = req.params;
        const conversation = await messageService.getConversation(req.user.id, messageId);

        res.json({ conversation });
    } catch (error) {
        if (error.message === 'Message not found') {
            return res.status(404).json({
                error: { message: error.message }
            });
        }
        if (error.message === 'Unauthorized') {
            return res.status(403).json({
                error: { message: error.message }
            });
        }
        next(error);
    }
};

/**
 * Mark message as read
 * PUT /api/messages/:messageId/read
 */
const markAsRead = async (req, res, next) => {
    try {
        const { messageId } = req.params;
        const message = await messageService.markAsRead(req.user.id, messageId);

        res.json({
            message: 'Message marked as read',
            data: message
        });
    } catch (error) {
        if (error.message === 'Message not found') {
            return res.status(404).json({
                error: { message: error.message }
            });
        }
        if (error.message === 'Can only mark your own messages as read') {
            return res.status(403).json({
                error: { message: error.message }
            });
        }
        next(error);
    }
};

/**
 * Get unread count
 * GET /api/messages/unread-count
 */
const getUnreadCount = async (req, res, next) => {
    try {
        const count = await messageService.getUnreadCount(req.user.id);

        res.json({ unreadCount: count });
    } catch (error) {
        next(error);
    }
};

/**
 * Admin: Get unanswered questions
 * GET /api/messages/unanswered
 */
const getUnansweredQuestions = async (req, res, next) => {
    try {
        // Verify admin
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({
                error: { message: 'Admin access required' }
            });
        }

        const { instructorId, courseId, olderThan } = req.query;

        const filters = {};
        if (instructorId) {
            filters.recipientId = instructorId;
        }
        if (courseId) {
            filters.courseId = courseId;
        }
        if (olderThan) {
            const hoursAgo = parseInt(olderThan);
            const date = new Date();
            date.setHours(date.getHours() - hoursAgo);
            filters.createdAt = { lt: date };
        }

        const questions = await messageService.getUnansweredQuestions(filters);

        res.json({
            questions,
            count: questions.length
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Admin: Send message to instructor
 * POST /api/messages/admin/to-instructor
 */
const sendAdminToInstructor = async (req, res, next) => {
    try {
        // Verify admin
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({
                error: { message: 'Admin access required' }
            });
        }

        const { error, value } = adminMessageSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                error: { message: error.details[0].message }
            });
        }

        const message = await messageService.sendAdminToInstructorMessage(
            req.user.id,
            value.recipientId,
            value.messageText,
            value.courseId
        );

        res.status(201).json({
            message: 'Message sent successfully',
            data: message
        });
    } catch (error) {
        if (error.message === 'Invalid instructor') {
            return res.status(400).json({
                error: { message: error.message }
            });
        }
        next(error);
    }
};

/**
 * Admin: Send message to user
 * POST /api/messages/admin/to-user
 */
const sendAdminToUser = async (req, res, next) => {
    try {
        // Verify admin
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({
                error: { message: 'Admin access required' }
            });
        }

        const { error, value } = adminMessageSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                error: { message: error.details[0].message }
            });
        }

        const message = await messageService.sendAdminToUserMessage(
            req.user.id,
            value.recipientId,
            value.messageText
        );

        res.status(201).json({
            message: 'Message sent successfully',
            data: message
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Admin: Send bulk reminders
 * POST /api/messages/admin/bulk-reminders
 */
const sendBulkReminders = async (req, res, next) => {
    try {
        // Verify admin
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({
                error: { message: 'Admin access required' }
            });
        }

        const { instructorIds, messageText } = req.body;

        if (!instructorIds || !Array.isArray(instructorIds) || instructorIds.length === 0) {
            return res.status(400).json({
                error: { message: 'instructorIds array is required' }
            });
        }

        if (!messageText || messageText.trim().length === 0) {
            return res.status(400).json({
                error: { message: 'messageText is required' }
            });
        }

        const result = await messageService.sendBulkReminders(
            req.user.id,
            instructorIds,
            messageText
        );

        res.json({
            message: 'Bulk reminders sent',
            ...result
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    sendToInstructor,
    replyToMessage,
    getInbox,
    getConversation,
    markAsRead,
    getUnreadCount,
    getUnansweredQuestions,
    sendAdminToInstructor,
    sendAdminToUser,
    sendBulkReminders
};