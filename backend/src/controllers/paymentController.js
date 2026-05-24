const paymentService = require('../services/paymentService');
const courseService = require('../services/courseService');

/**
 * Create Razorpay order
 * POST /api/payments/create-order
 */
const createOrder = async (req, res, next) => {
    try {
        const { courseId, couponCode } = req.body;
        if (!courseId) return res.status(400).json({ error: { message: 'courseId is required' } });

        const result = await paymentService.createOrder(req.user.id, courseId, couponCode || null);

        // Free course — enroll directly
        if (result.free) {
            const enrollment = await courseService.enrollInCourse(req.user.id, courseId, couponCode || null);
            return res.status(201).json({ free: true, enrollment });
        }

        res.json(result);
    } catch (error) {
        if (
            error.message === 'Course not found' ||
            error.message === 'Already enrolled in this course' ||
            error.message === 'Course is not available for enrollment'
        ) {
            return res.status(400).json({ error: { message: error.message } });
        }
        next(error);
    }
};

/**
 * Verify payment and enroll
 * POST /api/payments/verify
 */
const verifyPayment = async (req, res, next) => {
    try {
        const { razorpayOrderId, razorpayPaymentId, razorpaySignature, courseId, couponId } = req.body;

        if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !courseId) {
            return res.status(400).json({ error: { message: 'Missing payment details' } });
        }

        const enrollment = await paymentService.verifyAndEnroll(req.user.id, {
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
            courseId,
            couponId,
        });

        res.status(201).json({ message: 'Payment verified and enrolled successfully', enrollment });
    } catch (error) {
        if (error.message === 'Invalid payment signature') {
            return res.status(400).json({ error: { message: error.message } });
        }
        if (error.message === 'Payment not captured') {
            return res.status(400).json({ error: { message: error.message } });
        }
        next(error);
    }
};

/**
 * Razorpay webhook
 * POST /api/payments/webhook
 */
const webhook = async (req, res, next) => {
    try {
        const signature = req.headers['x-razorpay-signature'];
        if (!signature) return res.status(400).json({ error: { message: 'Missing signature' } });

        // req.body here is raw buffer — see server.js changes below
        const result = await paymentService.handleWebhook(req.body, signature);
        res.json({ status: 'ok', result });
    } catch (error) {
        if (error.message === 'Invalid webhook signature') {
            return res.status(400).json({ error: { message: error.message } });
        }
        next(error);
    }
};

module.exports = { createOrder, verifyPayment, webhook };