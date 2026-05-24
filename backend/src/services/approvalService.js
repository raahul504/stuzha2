const prisma = require('../config/database');

/**
 * Request course publish approval
 */
const requestPublishApproval = async (courseId, userId) => {
    const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
            modules: {
                include: {
                    contentItems: true
                }
            },
            creator: true
        }
    });

    if (!course) {
        throw new Error('Course not found');
    }

    if (course.createdBy !== userId) {
        throw new Error('Unauthorized');
    }

    if (course.approvalStatus === 'PENDING_PUBLISH') {
        throw new Error('Publish approval already pending');
    }

    if (course.approvalStatus === 'PUBLISHED') {
        throw new Error('Course is already published');
    }

    // Validate course has content
    if (course.modules.length === 0) {
        throw new Error('Course must have at least one module');
    }

    const hasContent = course.modules.some(m => m.contentItems.length > 0);
    if (!hasContent) {
        throw new Error('Course must have content');
    }

    const instructor = await prisma.user.findUnique({
        where: { id: userId },
        select: { phoneNumber: true }
    });

    if (!instructor.phoneNumber) {
        throw new Error('Please add a contact number to your profile before requesting publish');
    }

    // Update status
    const updated = await prisma.course.update({
        where: { id: courseId },
        data: {
            approvalStatus: 'PENDING_PUBLISH'
        }
    });

    // Get all admins
    const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' }
    });

    // Send message to all admins
    for (const admin of admins) {
        await prisma.message.create({
            data: {
                courseId,
                senderId: userId,
                recipientId: admin.id,
                messageText: `${course.creator.firstName} ${course.creator.lastName} has requested to publish the course "${course.title}". Please review it in the approval dashboard.`,
                messageType: 'INSTRUCTOR_TO_USER'  // Using this type for instructor-to-admin communication
            }
        });

        // Create notification
        await prisma.notification.create({
            data: {
                userId: admin.id,
                notificationType: 'ADMIN_MESSAGE',
                title: 'New Publish Request',
                message: `${course.creator.firstName} ${course.creator.lastName} requested to publish "${course.title}"`,
                relatedEntityId: courseId,
                relatedEntityType: 'course'
            }
        });
    }

    return updated;
};

/**
 * Request course unpublish approval
 */
const requestUnpublishApproval = async (courseId, userId) => {
    const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
            creator: true
        }
    });

    if (!course) {
        throw new Error('Course not found');
    }

    if (course.createdBy !== userId) {
        throw new Error('Unauthorized');
    }

    if (course.approvalStatus !== 'PUBLISHED') {
        throw new Error('Course is not published');
    }

    if (course.approvalStatus === 'PENDING_UNPUBLISH') {
        throw new Error('Unpublish approval already pending');
    }

    // Update status
    const updated = await prisma.course.update({
        where: { id: courseId },
        data: {
            approvalStatus: 'PENDING_UNPUBLISH'
        }
    });

    // Get all admins
    const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' }
    });

    // Send message to all admins
    for (const admin of admins) {
        await prisma.message.create({
            data: {
                courseId,
                senderId: userId,
                recipientId: admin.id,
                messageText: `${course.creator.firstName} ${course.creator.lastName} has requested to unpublish the course "${course.title}". Please review it in the approval dashboard.`,
                messageType: 'INSTRUCTOR_TO_USER'
            }
        });

        // Create notification
        await prisma.notification.create({
            data: {
                userId: admin.id,
                notificationType: 'ADMIN_MESSAGE',
                title: 'New Unpublish Request',
                message: `${course.creator.firstName} ${course.creator.lastName} requested to unpublish "${course.title}"`,
                relatedEntityId: courseId,
                relatedEntityType: 'course'
            }
        });
    }

    return updated;
};

/**
 * Admin: Get pending publish requests
 */
const getPendingPublishRequests = async () => {
    return await prisma.course.findMany({
        where: {
            approvalStatus: 'PENDING_PUBLISH'
        },
        include: {
            creator: {
                select: { id: true, firstName: true, lastName: true, email: true }
            },
            modules: {
                orderBy: { orderIndex: 'asc' },
                include: {
                    contentItems: {
                        orderBy: { orderIndex: 'asc' },
                        include: {
                            questions: {
                                orderBy: { orderIndex: 'asc' }
                            }
                        }
                    }
                }
            },
            categories: {
                include: {
                    category: true
                }
            },
            enrollments: {
                select: {
                    id: true,
                    user: {
                        select: { firstName: true, lastName: true }
                    }
                }
            }
        },
        orderBy: { updatedAt: 'desc' }
    });
};

/**
 * Admin: Get pending unpublish requests
 */
const getPendingUnpublishRequests = async () => {
    return await prisma.course.findMany({
        where: {
            approvalStatus: 'PENDING_UNPUBLISH'
        },
        include: {
            creator: {
                select: { id: true, firstName: true, lastName: true, email: true }
            },
            modules: {
                orderBy: { orderIndex: 'asc' },
                include: {
                    contentItems: {
                        orderBy: { orderIndex: 'asc' },
                        include: {
                            questions: {
                                orderBy: { orderIndex: 'asc' }
                            }
                        }
                    }
                }
            },
            categories: {
                include: {
                    category: true
                }
            },
            enrollments: {
                select: {
                    id: true,
                    user: {
                        select: { firstName: true, lastName: true }
                    }
                }
            }
        },
        orderBy: { updatedAt: 'desc' }
    });
};

/**
 * Admin: Approve publish request
 */
const approvePublish = async (courseId, adminId) => {
    const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
            creator: true
        }
    });

    if (!course) {
        throw new Error('Course not found');
    }

    if (course.approvalStatus !== 'PENDING_PUBLISH') {
        throw new Error('No pending publish request');
    }

    const previousStatus = course.approvalStatus;

    // Update course
    const updated = await prisma.course.update({
        where: { id: courseId },
        data: {
            approvalStatus: 'PUBLISHED',
            isPublished: true,
            approvalMessage: null
        }
    });

    // Auto-generate embedding when course is published
    try {
        const embeddingService = require('./embeddingService');
        await embeddingService.embedCourse(courseId);
    } catch (embErr) {
        console.error('Failed to generate course embedding:', embErr.message);
        // Non-blocking — embedding can be regenerated manually
    }

    // Create audit log
    await prisma.courseApprovalLog.create({
        data: {
            courseId,
            adminId,
            action: 'APPROVED_PUBLISH',
            previousStatus,
            newStatus: 'PUBLISHED'
        }
    });

    // Notify instructor
    try {
        await prisma.message.create({
            data: {
                courseId,
                senderId: adminId,
                recipientId: course.createdBy,
                messageText: `Your course "${course.title}" has been approved and is now live!`,
                messageType: 'ADMIN_TO_INSTRUCTOR'
            }
        });
        await prisma.notification.create({
            data: {
                userId: course.createdBy,
                notificationType: 'COURSE_PUBLISH_APPROVED',
                title: 'Course Approved!',
                message: `Your course "${course.title}" has been approved and published.`,
                relatedEntityId: courseId,
                relatedEntityType: 'course'
            }
        });
    } catch (notifError) {
        console.error('Failed to send approval notification:', notifError);
    }

    return updated;
};

/**
 * Admin: Disapprove publish request
 */
const disapprovePublish = async (courseId, adminId, reason) => {
    const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
            creator: true
        }
    });

    if (!course) {
        throw new Error('Course not found');
    }

    if (course.approvalStatus !== 'PENDING_PUBLISH') {
        throw new Error('No pending publish request');
    }

    const previousStatus = course.approvalStatus;

    // Update course
    const updated = await prisma.course.update({
        where: { id: courseId },
        data: {
            approvalStatus: 'DRAFT',
            approvalMessage: reason || null
        }
    });

    // Create audit log
    await prisma.courseApprovalLog.create({
        data: {
            courseId,
            adminId,
            action: 'DISAPPROVED_PUBLISH',
            previousStatus,
            newStatus: 'DRAFT',
            reason
        }
    });

    // Notify instructor
    try {
        await prisma.notification.create({
            data: {
                userId: course.createdBy,
                notificationType: 'COURSE_PUBLISH_DISAPPROVED',
                title: 'Course Publish Request Declined',
                message: `Your publish request for "${course.title}" was declined`,
                relatedEntityId: courseId,
                relatedEntityType: 'course'
            }
        });

        const messageText = reason
            ? `Your publish request for "${course.title}" was declined. Reason: ${reason}`
            : `Your publish request for "${course.title}" was declined.`;

        await prisma.message.create({
            data: {
                courseId,
                senderId: adminId,
                recipientId: course.createdBy,
                messageText,
                messageType: 'ADMIN_TO_INSTRUCTOR'
            }
        });
    } catch (notifError) {
        console.error('Failed to send disapproval notification:', notifError);
    }

    return updated;
};

/**
 * Admin: Approve unpublish request
 */
const approveUnpublish = async (courseId, adminId) => {
    const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
            creator: true
        }
    });

    if (!course) {
        throw new Error('Course not found');
    }

    if (course.approvalStatus !== 'PENDING_UNPUBLISH') {
        throw new Error('No pending unpublish request');
    }

    const previousStatus = course.approvalStatus;

    // Update course
    const updated = await prisma.course.update({
        where: { id: courseId },
        data: {
            approvalStatus: 'DRAFT',
            isPublished: false,
            approvalMessage: null
        }
    });

    // Remove embedding when course is unpublished
    try {
        const embeddingService = require('./embeddingService');
        await embeddingService.deleteEmbedding(courseId);
    } catch (embErr) {
        console.error('Failed to delete course embedding:', embErr.message);
    }

    // Create audit log
    await prisma.courseApprovalLog.create({
        data: {
            courseId,
            adminId,
            action: 'APPROVED_UNPUBLISH',
            previousStatus,
            newStatus: 'DRAFT'
        }
    });

    // Notify instructor
    try {
        await prisma.notification.create({
            data: {
                userId: course.createdBy,
                notificationType: 'COURSE_UNPUBLISH_APPROVED',
                title: 'Course Unpublished',
                message: `Your course "${course.title}" has been unpublished`,
                relatedEntityId: courseId,
                relatedEntityType: 'course'
            }
        });

        await prisma.message.create({
            data: {
                courseId,
                senderId: adminId,
                recipientId: course.createdBy,
                messageText: `Your unpublish request for "${course.title}" has been approved.`,
                messageType: 'ADMIN_TO_INSTRUCTOR'
            }
        });
    } catch (notifError) {
        console.error('Failed to send unpublish approval notification:', notifError);
    }

    return updated;
};

/**
 * Admin: Disapprove unpublish request
 */
const disapproveUnpublish = async (courseId, adminId, reason) => {
    const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
            creator: true
        }
    });

    if (!course) {
        throw new Error('Course not found');
    }

    if (course.approvalStatus !== 'PENDING_UNPUBLISH') {
        throw new Error('No pending unpublish request');
    }

    const previousStatus = course.approvalStatus;

    // Update course
    const updated = await prisma.course.update({
        where: { id: courseId },
        data: {
            approvalStatus: 'PUBLISHED',
            approvalMessage: reason || null
        }
    });

    // Create audit log
    await prisma.courseApprovalLog.create({
        data: {
            courseId,
            adminId,
            action: 'DISAPPROVED_UNPUBLISH',
            previousStatus,
            newStatus: 'PUBLISHED',
            reason
        }
    });

    // Notify instructor
    try {
        await prisma.notification.create({
            data: {
                userId: course.createdBy,
                notificationType: 'COURSE_UNPUBLISH_DISAPPROVED',
                title: 'Unpublish Request Declined',
                message: `Your unpublish request for "${course.title}" was declined`,
                relatedEntityId: courseId,
                relatedEntityType: 'course'
            }
        });

        const messageText = reason
            ? `Your unpublish request for "${course.title}" was declined. Reason: ${reason}`
            : `Your unpublish request for "${course.title}" was declined.`;

        await prisma.message.create({
            data: {
                courseId,
                senderId: adminId,
                recipientId: course.createdBy,
                messageText,
                messageType: 'ADMIN_TO_INSTRUCTOR'
            }
        });
    } catch (notifError) {
        console.error('Failed to send unpublish disapproval notification:', notifError);
    }

    return updated;
};

/**
 * Admin: Get approval history for a course
 */
const getApprovalHistory = async (courseId) => {
    return await prisma.courseApprovalLog.findMany({
        where: { courseId },
        include: {
            admin: {
                select: { id: true, firstName: true, lastName: true, email: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
};

/**
 * Admin: Get all approval logs with filters
 */
const getAllApprovalLogs = async (filters = {}) => {
    const { search, adminId, action, startDate, endDate } = filters;

    const where = {};

    // Search filter (course title or admin name)
    if (search) {
        where.OR = [
            { course: { title: { contains: search, mode: 'insensitive' } } },
            { admin: { firstName: { contains: search, mode: 'insensitive' } } },
            { admin: { lastName: { contains: search, mode: 'insensitive' } } }
        ];
    }

    // Admin filter
    if (adminId) {
        where.adminId = adminId;
    }

    // Action filter
    if (action) {
        where.action = action;
    }

    // Date range filter
    if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
            where.createdAt.gte = new Date(startDate);
        }
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            where.createdAt.lte = end;
        }
    }

    const logs = await prisma.courseApprovalLog.findMany({
        where,
        include: {
            course: {
                select: {
                    id: true,
                    title: true,
                    thumbnailUrl: true,
                    creator: {
                        select: { id: true, firstName: true, lastName: true }
                    }
                }
            },
            admin: {
                select: { id: true, firstName: true, lastName: true, email: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    return logs;
};

module.exports = {
    requestPublishApproval,
    requestUnpublishApproval,
    getPendingPublishRequests,
    getPendingUnpublishRequests,
    approvePublish,
    disapprovePublish,
    approveUnpublish,
    disapproveUnpublish,
    getApprovalHistory,
    getAllApprovalLogs
};