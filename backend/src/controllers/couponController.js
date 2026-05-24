const prisma = require('../config/database');
const couponService = require('../services/couponService');
const Joi = require('joi');

const createSchema = Joi.object({
    code: Joi.string().min(3).max(20).required(),
    discountType: Joi.string().valid('PERCENTAGE', 'FIXED').required(),
    discountValue: Joi.number().positive().required(),
    maxUses: Joi.number().integer().positive().optional().allow(null),
    expiresAt: Joi.date().iso().optional().allow(null),
    courseId: Joi.string().uuid().optional().allow(null),
});

const validate = async (req, res, next) => {
    try {
        const { code, courseId } = req.body;
        if (!code || !courseId) return res.status(400).json({ error: { message: 'code and courseId are required' } });

        const coupon = await couponService.validateCoupon(code, courseId);

        const course = await prisma.course.findUnique({ where: { id: courseId }, select: { price: true } });
        if (!course) return res.status(404).json({ error: { message: 'Course not found' } });

        const finalPrice = couponService.calculateDiscount(coupon, course.price);

        res.json({
            valid: true,
            discountType: coupon.discountType,
            discountValue: Math.round(Number(String(coupon.discountValue)) * 100) / 100,
            originalPrice: Math.round(Number(String(course.price)) * 100) / 100,
            finalPrice,
            couponId: coupon.id,
        });
    } catch (error) {
        res.status(400).json({ error: { message: error.message } });
    }
};

const create = async (req, res, next) => {
    try {
        if (req.user.role !== 'ADMIN') return res.status(403).json({ error: { message: 'Admin access required' } });
        const { error, value } = createSchema.validate(req.body);
        if (error) return res.status(400).json({ error: { message: error.details[0].message } });
        const coupon = await couponService.createCoupon(value);
        res.status(201).json({ message: 'Coupon created', data: coupon });
    } catch (error) {
        if (error.message.includes('Unique constraint')) return res.status(400).json({ error: { message: 'Coupon code already exists' } });
        next(error);
    }
};

const getAll = async (req, res, next) => {
    try {
        if (req.user.role !== 'ADMIN') return res.status(403).json({ error: { message: 'Admin access required' } });
        const coupons = await couponService.getAllCoupons();
        res.json({ coupons });
    } catch (error) {
        next(error);
    }
};

const update = async (req, res, next) => {
    try {
        if (req.user.role !== 'ADMIN') return res.status(403).json({ error: { message: 'Admin access required' } });
        const coupon = await couponService.updateCoupon(req.params.id, req.body);
        res.json({ message: 'Coupon updated', data: coupon });
    } catch (error) {
        if (error.message === 'Coupon not found') return res.status(404).json({ error: { message: error.message } });
        next(error);
    }
};

const remove = async (req, res, next) => {
    try {
        if (req.user.role !== 'ADMIN') return res.status(403).json({ error: { message: 'Admin access required' } });
        await couponService.deleteCoupon(req.params.id);
        res.json({ message: 'Coupon deleted' });
    } catch (error) {
        if (error.message === 'Coupon not found') return res.status(404).json({ error: { message: error.message } });
        next(error);
    }
};

module.exports = { validate, create, getAll, update, remove };