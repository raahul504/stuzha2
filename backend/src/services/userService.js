// backend/src/services/userService.js - NEW FILE

const prisma = require('../config/database');
const { hashPassword, comparePassword } = require('../utils/password');

/**
 * Get user profile
 */
const getProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
};

/**
 * Update user profile
 */
const updateProfile = async (userId, updateData) => {
  const { firstName, lastName, email, phoneNumber } = updateData;

  // Check if email already exists (if changing email)
  if (email) {
    const existingUser = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        id: { not: userId },
      },
    });

    if (existingUser) {
      throw new Error('Email already in use');
    }
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(email && { email: email.toLowerCase(), emailVerified: false }),
      ...(phoneNumber !== undefined && { phoneNumber: phoneNumber || null }),
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      emailVerified: true,
    },
  });

  return user;
};

/**
 * Change password
 */
const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Verify current password
  const isValid = await comparePassword(currentPassword, user.passwordHash);
  if (!isValid) {
    throw new Error('Current password is incorrect');
  }

  // Hash new password
  const passwordHash = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  return { message: 'Password changed successfully' };
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
};