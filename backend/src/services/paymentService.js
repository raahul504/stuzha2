const Razorpay = require('razorpay');
const crypto = require('crypto');
const prisma = require('../config/database');
const { validateCoupon, calculateDiscount } = require('./couponService');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Create Razorpay order
 */
const createOrder = async (userId, courseId, couponCode = null) => {
    // Check course exists and is published
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new Error('Course not found');
    if (!course.isPublished) throw new Error('Course is not available for enrollment');

    // Check not already enrolled
    const existing = await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId } },
    });
    if (existing) throw new Error('Already enrolled in this course');

    // Calculate final price
    let finalPrice = parseFloat(course.price);
    let couponId = null;

    if (couponCode) {
        const coupon = await validateCoupon(couponCode, courseId);
        finalPrice = calculateDiscount(coupon, course.price);
        couponId = coupon.id;
    }

    // Free course — skip Razorpay
    if (finalPrice === 0) {
        return { free: true, courseId, couponId, originalPrice: parseFloat(course.price) };
    }

    // Amount in paise
    const amountInPaise = Math.round(finalPrice * 100);

    try {
        const order = await razorpay.orders.create({
            amount: amountInPaise,
            currency: 'INR',
            receipt: `rcpt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            notes: {
                userId,
                courseId,
                couponId: couponId || '',
            },
        });
        console.log('Razorpay order created:', order);
        return {
            free: false,
            orderId: order.id,
            amount: amountInPaise,
            currency: 'INR',
            courseId,
            couponId,
            originalPrice: parseFloat(course.price),
            finalPrice,
            keyId: process.env.RAZORPAY_KEY_ID,
        };
    } catch (razorpayError) {
        console.error('Razorpay order creation failed:', razorpayError);
        throw razorpayError;
    }
};

/**
 * Verify payment signature and create enrollment
 */
const verifyAndEnroll = async (userId, { razorpayOrderId, razorpayPaymentId, razorpaySignature, courseId, couponId }) => {
    // Verify signature
    const body = razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex');

    if (expectedSignature !== razorpaySignature) {
        throw new Error('Invalid payment signature');
    }

    // Fetch payment details from Razorpay
    const payment = await razorpay.payments.fetch(razorpayPaymentId);
    if (payment.status !== 'captured') throw new Error('Payment not captured');

    // Create enrollment
    const enrollment = await createEnrollment(userId, courseId, {
        paymentAmount: payment.amount / 100,
        paymentCurrency: payment.currency,
        paymentTransactionId: razorpayPaymentId,
        paymentStatus: 'completed',
        couponId: couponId || null,
    });

    return enrollment;
};

/**
 * Handle webhook — fallback enrollment
 */
const handleWebhook = async (rawBody, signature) => {
    // Verify webhook signature
    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');

    if (expectedSignature !== signature) throw new Error('Invalid webhook signature');

    const body = JSON.parse(rawBody); // parse after verification
    const event = body.event;
    if (event !== 'payment.captured') return { ignored: true };

    const payment = body.payload.payment.entity;
    const { userId, courseId, couponId } = payment.notes;

    if (!userId || !courseId) return { ignored: true };

    // Check if already enrolled (frontend verify may have already done this)
    const existing = await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId } },
    });
    if (existing) return { alreadyEnrolled: true };

    await createEnrollment(userId, courseId, {
        paymentAmount: payment.amount / 100,
        paymentCurrency: payment.currency,
        paymentTransactionId: payment.id,
        paymentStatus: 'completed',
        couponId: couponId || null,
    });

    return { success: true };
};

/**
 * Shared enrollment creation logic
 */
const createEnrollment = async (userId, courseId, paymentData) => {
    const modules = await prisma.module.findMany({
        where: { courseId },
        include: {
            contentItems: {
                where: { contentType: { in: ['VIDEO', 'ASSESSMENT'] } },
            },
        },
    });

    const enrollment = await prisma.$transaction(async (tx) => {
        // Double-check inside transaction
        const existing = await tx.enrollment.findUnique({
            where: { userId_courseId: { userId, courseId } },
        });
        if (existing) return existing;

        const newEnrollment = await tx.enrollment.create({
            data: {
                userId,
                courseId,
                paymentAmount: paymentData.paymentAmount,
                paymentCurrency: paymentData.paymentCurrency,
                paymentTransactionId: paymentData.paymentTransactionId,
                paymentStatus: paymentData.paymentStatus,
                couponId: paymentData.couponId || null,
            },
        });

        const videoItems = modules.flatMap((m) =>
            m.contentItems.filter((item) => item.contentType === 'VIDEO')
        );

        if (videoItems.length > 0) {
            await tx.videoProgress.createMany({
                data: videoItems.map((item) => ({
                    userId,
                    contentItemId: item.id,
                    enrollmentId: newEnrollment.id,
                    durationSeconds: item.videoDurationSeconds,
                })),
            });
        }

        return newEnrollment;
    });

    return enrollment;
};

module.exports = { createOrder, verifyAndEnroll, handleWebhook };