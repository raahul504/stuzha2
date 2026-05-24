const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const prisma = require('../config/database');

// Get user notifications
router.get('/', authenticateToken, async (req, res, next) => {
    try {
        const { isRead } = req.query;

        const where = { userId: req.user.id };
        if (isRead !== undefined) {
            where.isRead = isRead === 'true';
        }

        const notifications = await prisma.notification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        res.json({ notifications });
    } catch (error) {
        next(error);
    }
});

// Get unread count
router.get('/unread-count', authenticateToken, async (req, res, next) => {
    try {
        const count = await prisma.notification.count({
            where: {
                userId: req.user.id,
                isRead: false
            }
        });

        res.json({ unreadCount: count });
    } catch (error) {
        next(error);
    }
});

// Mark notification as read
router.put('/:notificationId/read', authenticateToken, async (req, res, next) => {
    try {
        const { notificationId } = req.params;

        const notification = await prisma.notification.findUnique({
            where: { id: notificationId }
        });

        if (!notification) {
            return res.status(404).json({
                error: { message: 'Notification not found' }
            });
        }

        if (notification.userId !== req.user.id) {
            return res.status(403).json({
                error: { message: 'Unauthorized' }
            });
        }

        const updated = await prisma.notification.update({
            where: { id: notificationId },
            data: { isRead: true }
        });

        res.json({
            message: 'Notification marked as read',
            notification: updated
        });
    } catch (error) {
        next(error);
    }
});

// Mark all notifications as read
router.put('/mark-all-read', authenticateToken, async (req, res, next) => {
    try {
        await prisma.notification.updateMany({
            where: {
                userId: req.user.id,
                isRead: false
            },
            data: { isRead: true }
        });

        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;