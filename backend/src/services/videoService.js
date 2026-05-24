const prisma = require('../config/database');
const fs = require('fs');
const path = require('path');

/**
 * Upload video and create content item
 */
const uploadVideo = async (moduleId, videoData, file, userId) => {
  const isPreview = String(videoData.isPreview).toLowerCase() === 'true';
  const videoDurationSeconds = Number(videoData.videoDurationSeconds);
  const videoSizeBytes = Number(file.size);
  const module = await prisma.module.findUnique({
    where: { id: moduleId },
    include: { course: true },
  });

  if (!module) {
    throw new Error('Module not found');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (module.course.createdBy !== userId && user?.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }

  const lastContent = await prisma.contentItem.findFirst({
    where: { moduleId },
    orderBy: { orderIndex: 'desc' },
  });

  const orderIndex = lastContent ? lastContent.orderIndex + 1 : 0;

  const videoUrl = `/api/videos/stream/${file.filename}`;

  const contentItem = await prisma.contentItem.create({
    data: {
      moduleId,
      contentType: 'VIDEO',
      title: videoData.title,
      description: videoData.description,
      isPreview,
      videoUrl,
      videoDurationSeconds,
      videoSizeBytes,
      orderIndex,
    },
  });

  if (contentItem.videoSizeBytes) {
    contentItem.videoSizeBytes = contentItem.videoSizeBytes.toString();
  }

  return contentItem;
};

/**
 * Check if user can access video
 */
const canAccessVideo = async (userId, filename) => {
  const contentItem = await prisma.contentItem.findFirst({
    where: {
      videoUrl: `/api/videos/stream/${filename}`,
    },
    include: {
      module: {
        include: { course: true },
      },
    },
  });

  if (!contentItem) {
    return { allowed: false, message: 'Video not found' };
  }

  // If preview video, allow everyone
  if (contentItem.isPreview) {
    return { allowed: true, contentItem };
  }

  // Check enrollment
  if (!userId) {
    return { allowed: false, message: 'Authentication required' };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user?.role === 'ADMIN' || contentItem.module.course.createdBy === userId) {
    return { allowed: true, contentItem };
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId: contentItem.module.course.id,
      },
    },
  });

  if (!enrollment) {
    return { allowed: false, message: 'Not enrolled in this course' };
  }

  return { allowed: true, contentItem };
};

module.exports = {
  uploadVideo,
  canAccessVideo,
};