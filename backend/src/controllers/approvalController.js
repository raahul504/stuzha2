const approvalService = require('../services/approvalService');
const Joi = require('joi');
const prisma = require('../config/database');

// Validation schemas
const disapprovalSchema = Joi.object({
    reason: Joi.string().min(1).max(1000).optional()
});

/**
 * Request publish approval
 * POST /api/courses/:courseId/request-publish
 */
const requestPublish = async (req, res, next) => {
    try {
        const { courseId } = req.params;
        const course = await approvalService.requestPublishApproval(courseId, req.user.id);

        res.json({
            message: 'Publish approval requested successfully',
            course
        });
    } catch (error) {
        if (error.message === 'Course not found') {
            return res.status(404).json({
                error: { message: error.message }
            });
        }
        if (error.message === 'Unauthorized' ||
            error.message === 'Publish approval already pending' ||
            error.message === 'Course is already published' ||
            error.message === 'Course must have at least one module' ||
            error.message === 'Course must have content' ||
            error.message === 'Please add a contact number to your profile before requesting publish') {
            return res.status(400).json({
                error: { message: error.message }
            });
        }
        next(error);
    }
};

/**
 * Request unpublish approval
 * POST /api/courses/:courseId/request-unpublish
 */
const requestUnpublish = async (req, res, next) => {
    try {
        const { courseId } = req.params;
        const course = await approvalService.requestUnpublishApproval(courseId, req.user.id);

        res.json({
            message: 'Unpublish approval requested successfully',
            course
        });
    } catch (error) {
        if (error.message === 'Course not found') {
            return res.status(404).json({
                error: { message: error.message }
            });
        }
        if (error.message === 'Unauthorized' ||
            error.message === 'Course is not published' ||
            error.message === 'Unpublish approval already pending') {
            return res.status(400).json({
                error: { message: error.message }
            });
        }
        next(error);
    }
};

/**
 * Admin: Get pending publish requests
 * GET /api/admin/approvals/publish-requests
 */
const getPendingPublishRequests = async (req, res, next) => {
    try {
        // Verify admin
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({
                error: { message: 'Admin access required' }
            });
        }

        const requests = await approvalService.getPendingPublishRequests();

        res.json({
            requests,
            count: requests.length
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Admin: Get pending unpublish requests
 * GET /api/admin/approvals/unpublish-requests
 */
const getPendingUnpublishRequests = async (req, res, next) => {
    try {
        // Verify admin
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({
                error: { message: 'Admin access required' }
            });
        }

        const requests = await approvalService.getPendingUnpublishRequests();

        res.json({
            requests,
            count: requests.length
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Admin: Approve publish request
 * POST /api/admin/approvals/publish/:courseId/approve
 */
const approvePublish = async (req, res, next) => {
    try {
        // Verify admin
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({
                error: { message: 'Admin access required' }
            });
        }

        const { courseId } = req.params;
        const course = await approvalService.approvePublish(courseId, req.user.id);

        res.json({
            message: 'Course publish approved successfully',
            course
        });
    } catch (error) {
        if (error.message === 'Course not found') {
            return res.status(404).json({
                error: { message: error.message }
            });
        }
        if (error.message === 'No pending publish request') {
            return res.status(400).json({
                error: { message: error.message }
            });
        }
        next(error);
    }
};

/**
 * Admin: Disapprove publish request
 * POST /api/admin/approvals/publish/:courseId/disapprove
 */
const disapprovePublish = async (req, res, next) => {
    try {
        // Verify admin
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({
                error: { message: 'Admin access required' }
            });
        }

        const { courseId } = req.params;
        const { error, value } = disapprovalSchema.validate(req.body);

        if (error) {
            return res.status(400).json({
                error: { message: error.details[0].message }
            });
        }

        const course = await approvalService.disapprovePublish(
            courseId,
            req.user.id,
            value.reason
        );

        res.json({
            message: 'Course publish request disapproved',
            course
        });
    } catch (error) {
        if (error.message === 'Course not found') {
            return res.status(404).json({
                error: { message: error.message }
            });
        }
        if (error.message === 'No pending publish request') {
            return res.status(400).json({
                error: { message: error.message }
            });
        }
        next(error);
    }
};

/**
 * Admin: Approve unpublish request
 * POST /api/admin/approvals/unpublish/:courseId/approve
 */
const approveUnpublish = async (req, res, next) => {
    try {
        // Verify admin
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({
                error: { message: 'Admin access required' }
            });
        }

        const { courseId } = req.params;
        const course = await approvalService.approveUnpublish(courseId, req.user.id);

        res.json({
            message: 'Course unpublish approved successfully',
            course
        });
    } catch (error) {
        if (error.message === 'Course not found') {
            return res.status(404).json({
                error: { message: error.message }
            });
        }
        if (error.message === 'No pending unpublish request') {
            return res.status(400).json({
                error: { message: error.message }
            });
        }
        next(error);
    }
};

/**
 * Admin: Disapprove unpublish request
 * POST /api/admin/approvals/unpublish/:courseId/disapprove
 */
const disapproveUnpublish = async (req, res, next) => {
    try {
        // Verify admin
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({
                error: { message: 'Admin access required' }
            });
        }

        const { courseId } = req.params;
        const { error, value } = disapprovalSchema.validate(req.body);

        if (error) {
            return res.status(400).json({
                error: { message: error.details[0].message }
            });
        }

        const course = await approvalService.disapproveUnpublish(
            courseId,
            req.user.id,
            value.reason
        );

        res.json({
            message: 'Course unpublish request disapproved',
            course
        });
    } catch (error) {
        if (error.message === 'Course not found') {
            return res.status(404).json({
                error: { message: error.message }
            });
        }
        if (error.message === 'No pending unpublish request') {
            return res.status(400).json({
                error: { message: error.message }
            });
        }
        next(error);
    }
};

/**
 * Admin: Get approval history for a course
 * GET /api/admin/approvals/history/:courseId
 */
const getApprovalHistory = async (req, res, next) => {
    try {
        const { courseId } = req.params;
        // Verify admin
        if (req.user.role !== 'ADMIN' && req.user.role !== 'INSTRUCTOR') {
            return res.status(403).json({
                error: { message: 'Access denied' }
            });
        }

        // If instructor, verify they own the course
        if (req.user.role === 'INSTRUCTOR') {
            const course = await prisma.course.findUnique({
                where: { id: courseId },
                select: { createdBy: true }
            });

            if (!course || course.createdBy !== req.user.id) {
                return res.status(403).json({
                    error: { message: 'You can only view history for your own courses' }
                });
            }
        }

        const history = await approvalService.getApprovalHistory(courseId);

        res.json({
            history,
            count: history.length
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Admin: Get all approval logs with filters
 * GET /api/admin/approvals/logs
 */
const getAllApprovalLogs = async (req, res, next) => {
    try {
        // Verify admin
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({
                error: { message: 'Admin access required' }
            });
        }

        const { search, adminId, action, startDate, endDate } = req.query;

        const filters = {};
        if (search) filters.search = search;
        if (adminId) filters.adminId = adminId;
        if (action) filters.action = action;
        if (startDate) filters.startDate = startDate;
        if (endDate) filters.endDate = endDate;

        const logs = await approvalService.getAllApprovalLogs(filters);

        res.json({
            logs,
            count: logs.length
        });
    } catch (error) {
        next(error);
    }
};
module.exports = {
    requestPublish,
    requestUnpublish,
    getPendingPublishRequests,
    getPendingUnpublishRequests,
    approvePublish,
    disapprovePublish,
    approveUnpublish,
    disapproveUnpublish,
    getApprovalHistory,
    getAllApprovalLogs
};