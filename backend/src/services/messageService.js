const prisma = require('../config/database');

/**
 * Send message from user to instructor
 */
const sendUserToInstructorMessage = async (userId, courseId, messageText) => {
    // Verify user is enrolled
    const enrollment = await prisma.enrollment.findUnique({
        where: {
            userId_courseId: { userId, courseId }
        },
        include: {
            course: true,
            user: true
        }
    });

    if (!enrollment) {
        throw new Error('Must be enrolled to message instructor');
    }

    const instructorId = enrollment.course.createdBy;

    if (!instructorId) {
        throw new Error('Course has no instructor');
    }

    // Create message
    const message = await prisma.message.create({
        data: {
            courseId,
            senderId: userId,
            recipientId: instructorId,
            messageText,
            messageType: 'USER_TO_INSTRUCTOR'
        },
        include: {
            sender: {
                select: { id: true, firstName: true, lastName: true, email: true }
            },
            recipient: {
                select: { id: true, firstName: true, lastName: true, email: true }
            },
            course: {
                select: { id: true, title: true }
            }
        }
    });

    // Create notification for instructor
    await prisma.notification.create({
        data: {
            userId: instructorId,
            notificationType: 'NEW_USER_QUESTION',
            title: 'New Question from Student',
            message: `${enrollment.user.firstName} asked a question in ${enrollment.course.title}`,
            relatedEntityId: message.id,
            relatedEntityType: 'message'
        }
    });

    return message;
};

/**
 * Reply to message (instructor to user or admin to instructor/user)
 */
const replyToMessage = async (userId, parentMessageId, messageText) => {
    // Get parent message
    const parentMessage = await prisma.message.findUnique({
        where: { id: parentMessageId },
        include: {
            course: true,
            sender: true,
            recipient: true
        }
    });

    if (!parentMessage) {
        throw new Error('Parent message not found');
    }

    // Verify user is part of the conversation (either sender or recipient)
    if (parentMessage.recipientId !== userId && parentMessage.senderId !== userId) {
        throw new Error('Can only reply to messages in your conversation');
    }

    // Determine recipient - it should be the "other" person in the parent message
    const recipientId = parentMessage.senderId === userId ? parentMessage.recipientId : parentMessage.senderId;

    // Determine message type
    const user = await prisma.user.findUnique({ where: { id: userId } });
    let messageType;

    if (user.role === 'ADMIN') {
        const recipient = await prisma.user.findUnique({ where: { id: recipientId } });
        messageType = recipient.role === 'INSTRUCTOR' ? 'ADMIN_TO_INSTRUCTOR' : 'ADMIN_TO_USER';
    } else if (user.role === 'INSTRUCTOR') {
        messageType = 'INSTRUCTOR_TO_USER';
    } else if (user.role === 'STUDENT') {
        messageType = 'USER_TO_INSTRUCTOR';
    } else {
        throw new Error('Unauthorized role');
    }

    // Create reply
    const reply = await prisma.message.create({
        data: {
            courseId: parentMessage.courseId,
            senderId: userId,
            recipientId: recipientId,
            messageText,
            messageType,
            parentMessageId: parentMessage.id // Use the provided messageId as the parent
        },
        include: {
            sender: {
                select: { id: true, firstName: true, lastName: true, email: true }
            },
            recipient: {
                select: { id: true, firstName: true, lastName: true, email: true }
            },
            course: {
                select: { id: true, title: true }
            }
        }
    });

    // Create notification
    let notifType = 'ADMIN_MESSAGE';
    let title = 'New Message';

    if (messageType === 'INSTRUCTOR_TO_USER') {
        notifType = 'INSTRUCTOR_REPLY';
        title = 'Instructor Replied';
    } else if (messageType === 'USER_TO_INSTRUCTOR') {
        notifType = 'NEW_USER_QUESTION';
        title = 'Student Replied';
    } else if (messageType === 'ADMIN_TO_INSTRUCTOR' || messageType === 'ADMIN_TO_USER') {
        notifType = 'ADMIN_MESSAGE';
        title = 'Message from Admin';
    }

    await prisma.notification.create({
        data: {
            userId: recipientId, // Send to the person who just received the message
            notificationType: notifType,
            title: title,
            message: `You have a new reply from ${user.firstName}`,
            relatedEntityId: reply.id,
            relatedEntityType: 'message'
        }
    });

    return reply;
};

/**
 * Get user's inbox (received messages)
 */
const getInbox = async (userId, filters = {}) => {
    const { isRead, messageType, search, courseId, senderId, ...otherFilters } = filters;

    const where = {
        parentMessageId: null, // Only root messages
        AND: [
            {
                OR: [
                    { recipientId: userId },
                    { senderId: userId }
                ]
            }
        ]
    };

    // Add search filter
    if (search) {
        where.AND.push({
            OR: [
                { messageText: { contains: search, mode: 'insensitive' } },
                { sender: { firstName: { contains: search, mode: 'insensitive' } } },
                { sender: { lastName: { contains: search, mode: 'insensitive' } } },
                { course: { title: { contains: search, mode: 'insensitive' } } }
            ]
        });
    }

    // Add course filter
    if (courseId) {
        where.AND.push({ courseId });
    }

    // Add sender filter
    if (senderId) {
        where.AND.push({ senderId });
    }

    // Add messageType if provided
    if (messageType) {
        where.AND.push({ messageType });
    }

    // Add other filters
    Object.keys(otherFilters).forEach(key => {
        where.AND.push({ [key]: otherFilters[key] });
    });

    // Handle isRead filtering
    if (isRead !== undefined) {
        const isReadBool = isRead === 'true' || isRead === true;
        where.AND.push({
            OR: [
                // Case 1: The root message itself matches the isRead status for the user
                {
                    recipientId: userId,
                    isRead: isReadBool
                },
                // Case 2: The root message is not necessarily the one with the status, but some reply is
                {
                    replies: {
                        some: {
                            recipientId: userId,
                            isRead: isReadBool
                        }
                    }
                }
            ]
        });
    }

    const messages = await prisma.message.findMany({
        where,
        include: {
            sender: {
                select: { id: true, firstName: true, lastName: true, email: true }
            },
            course: {
                select: { id: true, title: true }
            },
            replies: {
                include: {
                    sender: {
                        select: { id: true, firstName: true, lastName: true, email: true }
                    }
                },
                orderBy: { createdAt: 'asc' }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    return messages;
};

/**
 * Get conversation thread
 */
const getConversation = async (userId, messageId) => {
    const message = await prisma.message.findUnique({
        where: { id: messageId },
        include: {
            sender: {
                select: { id: true, firstName: true, lastName: true, email: true }
            },
            recipient: {
                select: { id: true, firstName: true, lastName: true, email: true }
            },
            course: {
                select: { id: true, title: true }
            },
            replies: {
                include: {
                    sender: {
                        select: { id: true, firstName: true, lastName: true, email: true }
                    },
                    recipient: {
                        select: { id: true, firstName: true, lastName: true, email: true }
                    }
                },
                orderBy: { createdAt: 'asc' }
            }
        }
    });

    if (!message) {
        throw new Error('Message not found');
    }

    // Verify access
    if (message.senderId !== userId && message.recipientId !== userId) {
        throw new Error('Unauthorized');
    }

    return message;
};

/**
 * Mark message as read
 */
const markAsRead = async (userId, messageId) => {
    const message = await prisma.message.findUnique({
        where: { id: messageId }
    });

    if (!message) {
        throw new Error('Message not found');
    }

    // Verify user is part of the conversation
    if (message.recipientId !== userId && message.senderId !== userId) {
        throw new Error('Unauthorized');
    }

    // Mark the message itself as read if user is the recipient
    if (message.recipientId === userId) {
        await prisma.message.update({
            where: { id: messageId },
            data: { isRead: true }
        });
    }

    // If it's a root message, mark all unread replies where user is recipient as read
    // This ensures that when a student/instructor opens a conversation thread, 
    // all messages they've received in that thread are marked as read.
    if (message.parentMessageId === null) {
        await prisma.message.updateMany({
            where: {
                parentMessageId: messageId,
                recipientId: userId,
                isRead: false
            },
            data: { isRead: true }
        });
    }

    return { id: messageId, isRead: true };
};

/**
 * Get unread count
 */
const getUnreadCount = async (userId) => {
    return await prisma.message.count({
        where: {
            recipientId: userId,
            isRead: false
        }
    });
};

/**
 * Admin: Get all unanswered user questions
 */
const getUnansweredQuestions = async (filters = {}) => {
    const messages = await prisma.message.findMany({
        where: {
            messageType: 'USER_TO_INSTRUCTOR',
            isRead: false,
            replies: {
                none: {}
            },
            ...filters
        },
        include: {
            sender: {
                select: { id: true, firstName: true, lastName: true, email: true }
            },
            recipient: {
                select: { id: true, firstName: true, lastName: true, email: true }
            },
            course: {
                select: { id: true, title: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    return messages;
};

/**
 * Admin: Send message to instructor
 */
const sendAdminToInstructorMessage = async (adminId, instructorId, messageText, courseId = null) => {
    // Verify admin role
    const admin = await prisma.user.findUnique({ where: { id: adminId } });
    if (admin.role !== 'ADMIN') {
        throw new Error('Only admins can send admin messages');
    }

    // Verify instructor exists
    const instructor = await prisma.user.findUnique({ where: { id: instructorId } });
    if (!instructor || instructor.role !== 'INSTRUCTOR') {
        throw new Error('Invalid instructor');
    }

    const message = await prisma.message.create({
        data: {
            courseId,
            senderId: adminId,
            recipientId: instructorId,
            messageText,
            messageType: 'ADMIN_TO_INSTRUCTOR'
        },
        include: {
            sender: {
                select: { id: true, firstName: true, lastName: true, email: true }
            },
            recipient: {
                select: { id: true, firstName: true, lastName: true, email: true }
            }
        }
    });

    await prisma.notification.create({
        data: {
            userId: instructorId,
            notificationType: 'ADMIN_MESSAGE',
            title: 'Message from Admin',
            message: 'You have received a message from the admin',
            relatedEntityId: message.id,
            relatedEntityType: 'message'
        }
    });

    return message;
};

/**
 * Admin: Send message to user (one-way)
 */
const sendAdminToUserMessage = async (adminId, userId, messageText) => {
    // Verify admin role
    const admin = await prisma.user.findUnique({ where: { id: adminId } });
    if (admin.role !== 'ADMIN') {
        throw new Error('Only admins can send admin messages');
    }

    const message = await prisma.message.create({
        data: {
            senderId: adminId,
            recipientId: userId,
            messageText,
            messageType: 'ADMIN_TO_USER'
        },
        include: {
            sender: {
                select: { id: true, firstName: true, lastName: true, email: true }
            },
            recipient: {
                select: { id: true, firstName: true, lastName: true, email: true }
            }
        }
    });

    await prisma.notification.create({
        data: {
            userId,
            notificationType: 'ADMIN_MESSAGE',
            title: 'Message from Admin',
            message: 'You have received a message from the admin',
            relatedEntityId: message.id,
            relatedEntityType: 'message'
        }
    });

    return message;
};

/**
 * Admin: Send bulk reminders to multiple instructors
 */
const sendBulkReminders = async (adminId, instructorIds, messageText) => {
    // Verify admin role
    const admin = await prisma.user.findUnique({ where: { id: adminId } });
    if (admin.role !== 'ADMIN') {
        throw new Error('Only admins can send bulk reminders');
    }

    const results = [];

    for (const instructorId of instructorIds) {
        try {
            const instructor = await prisma.user.findUnique({ where: { id: instructorId } });
            if (!instructor || instructor.role !== 'INSTRUCTOR') {
                results.push({ instructorId, success: false, error: 'Invalid instructor' });
                continue;
            }

            const message = await prisma.message.create({
                data: {
                    senderId: adminId,
                    recipientId: instructorId,
                    messageText,
                    messageType: 'ADMIN_TO_INSTRUCTOR'
                }
            });

            await prisma.notification.create({
                data: {
                    userId: instructorId,
                    notificationType: 'ADMIN_MESSAGE',
                    title: 'Reminder from Admin',
                    message: 'You have unanswered student questions',
                    relatedEntityId: message.id,
                    relatedEntityType: 'message'
                }
            });

            results.push({ instructorId, success: true, messageId: message.id });
        } catch (error) {
            results.push({ instructorId, success: false, error: error.message });
        }
    }

    return {
        total: instructorIds.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results
    };
};

module.exports = {
    sendUserToInstructorMessage,
    replyToMessage,
    getInbox,
    getConversation,
    markAsRead,
    getUnreadCount,
    getUnansweredQuestions,
    sendAdminToInstructorMessage,
    sendAdminToUserMessage,
    sendBulkReminders
};