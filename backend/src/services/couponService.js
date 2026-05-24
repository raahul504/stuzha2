const prisma = require('../config/database');

const validateCoupon = async (code, courseId) => {
    const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });

    if (!coupon) throw new Error('Invalid coupon code');
    if (!coupon.isActive) throw new Error('Coupon is no longer active');
    if (coupon.expiresAt && new Date() > coupon.expiresAt) throw new Error('Coupon has expired');
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) throw new Error('Coupon usage limit reached');
    if (coupon.courseId && coupon.courseId !== courseId) throw new Error('Coupon is not valid for this course');

    return coupon;
};

const calculateDiscount = (coupon, originalPrice) => {
    const price = Math.round(Number(String(originalPrice).trim()) * 100) / 100;
    const discountValue = Math.round(Number(String(coupon.discountValue).trim()) * 100) / 100;

    if (coupon.discountType === 'PERCENTAGE') {
        const discount = (price * discountValue) / 100;
        return Math.round(Math.max(0, price - discount) * 100) / 100;
    } else {
        return Math.round(Math.max(0, price - discountValue) * 100) / 100;
    }
};

const createCoupon = async (data) => {
    const couponData = {
        code: data.code.toUpperCase(),
        discountType: data.discountType,
        discountValue: data.discountValue,
        maxUses: data.maxUses || null,
        expiresAt: data.expiresAt || null,
        isActive: true,
        courseId: data.courseId || null,
    };
    return await prisma.coupon.create({ data: couponData });
};

const getAllCoupons = async () => {
    return await prisma.coupon.findMany({
        include: { course: { select: { id: true, title: true } } },
        orderBy: { createdAt: 'desc' }
    });
};

const updateCoupon = async (id, data) => {
    const coupon = await prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new Error('Coupon not found');
    return await prisma.coupon.update({ where: { id }, data });
};

const deleteCoupon = async (id) => {
    const coupon = await prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new Error('Coupon not found');
    await prisma.coupon.delete({ where: { id } });
};

module.exports = { validateCoupon, calculateDiscount, createCoupon, getAllCoupons, updateCoupon, deleteCoupon };