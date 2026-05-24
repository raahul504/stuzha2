const prisma = require('../config/database');

/**
 * Update video progress
 */
const updateVideoProgress = async (userId, contentItemId, progressData) => {
  
  // Verify user is enrolled
  const contentItem = await prisma.contentItem.findUnique({
    where: { id: contentItemId },
    include: { module: true },
  });

  if (!contentItem || contentItem.contentType !== 'VIDEO') {
    throw new Error('Invalid video content item');
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId: contentItem.module.courseId,
      },
    },
  });

  if (!enrollment) {
    throw new Error('Not enrolled in this course');
  }

  const { lastPositionSeconds, completed, totalWatchTimeSeconds } = progressData;

  // Check if video is already completed
  const existingProgress = await prisma.videoProgress.findUnique({
    where: {
      userId_contentItemId: {
        userId,
        contentItemId,
      },
    },
  });

  // If video is already completed AND we're not trying to update it with new data, don't recalculate
  // But always update the record with latest position/watch time
  const wasAlreadyCompleted = existingProgress && existingProgress.completed;
  
  if (wasAlreadyCompleted && !completed) {
    // Video was already completed, and we're not completing it again - just return
    return existingProgress;
  }

  // Update or create video progress
  console.log('About to upsert with:', { lastPositionSeconds, totalWatchTimeSeconds: totalWatchTimeSeconds || 0, completed: completed || false });
  const videoProgress = await prisma.videoProgress.upsert({
    where: {
      userId_contentItemId: {
        userId,
        contentItemId,
      },
    },
    update: {
      lastPositionSeconds,
      totalWatchTimeSeconds: totalWatchTimeSeconds || 0,
      completed: completed || false,
      completedAt: completed ? new Date() : null,
    },
    create: {
      userId,
      contentItemId,
      enrollmentId: enrollment.id,
      lastPositionSeconds,
      totalWatchTimeSeconds: totalWatchTimeSeconds || 0,
      durationSeconds: contentItem.videoDurationSeconds,
      completed: completed || false,
      completedAt: completed ? new Date() : null,
    },
  });

  console.log('videoProgress after upsert:', videoProgress);
  console.log('Checking if should recalculate: completed=', completed, 'wasAlreadyCompleted=', wasAlreadyCompleted);

  // Recalculate course progress whenever a video is marked as completed
  // This ensures progress is always accurate even if rewatching or updating completion status
  if (completed) {
    // Small delay to ensure database writes
    await new Promise(resolve => setTimeout(resolve, 100));
    await recalculateCourseProgress(enrollment.id);
  }

  return videoProgress;
};

/**
 * Submit assessment attempt
 */
const submitAssessment = async (userId, contentItemId, answers) => {
  // Verify assessment exists and user is enrolled
  const contentItem = await prisma.contentItem.findUnique({
    where: { id: contentItemId },
    include: {
      module: true,
      questions: true,
    },
  });

  if (!contentItem || contentItem.contentType !== 'ASSESSMENT') {
    throw new Error('Invalid assessment content item');
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId: contentItem.module.courseId,
      },
    },
  });

  if (!enrollment) {
    throw new Error('Not enrolled in this course');
  }

  // Allow retakes - removed the restriction on retaking passed assessments

  // Calculate score
  let correctCount = 0;
  let totalPoints = 0;
  let earnedPoints = 0;

  contentItem.questions.forEach((question) => {
    totalPoints += question.points;
    const userAnswer = answers[question.id];

    if (userAnswer && userAnswer.toUpperCase() === question.correctAnswer.toUpperCase()) {
      correctCount++;
      earnedPoints += question.points;
    }
  });

  const score = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
  const passed = score >= (contentItem.assessmentPassPercentage || 70);

  // Get attempt number
  const previousAttempts = await prisma.assessmentAttempt.count({
    where: {
      userId,
      contentItemId,
    },
  });

  const attemptNumber = previousAttempts + 1;

  // Save attempt
  const attempt = await prisma.assessmentAttempt.create({
    data: {
      userId,
      contentItemId,
      enrollmentId: enrollment.id,
      score,
      passed,
      answersJson: answers,
      startedAt: new Date(), // In real app, track actual start time
      attemptNumber,
    },
  });

  // Only recalculate course progress if this is the first passing attempt
  const hadPassedBefore = await prisma.assessmentAttempt.findFirst({
    where: {
      userId,
      contentItemId,
      passed: true,
      attemptNumber: { lt: attemptNumber },
    },
  });

  if (passed && !hadPassedBefore) {
    await recalculateCourseProgress(enrollment.id);
  }

  return {
    ...attempt,
    correctCount,
    totalQuestions: contentItem.questions.length,
    earnedPoints,
    totalPoints,
  };
};

/**
 * Recalculate course completion percentage
 */
const recalculateCourseProgress = async (enrollmentId) => {
  console.log('recalculateCourseProgress called for enrollmentId:', enrollmentId);
  
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      course: {
        include: {
          modules: {
            include: {
              contentItems: {
                where: {
                  contentType: { in: ['VIDEO', 'ASSESSMENT'] },
                },
              },
            },
          },
        },
      },
      videoProgress: true,
      assessmentAttempts: {
        orderBy: { createdAt: 'desc' },
        distinct: ['contentItemId'], // Get latest attempt per assessment
      },
    },
  });

  // Get all videos and assessments
  const allVideos = enrollment.course.modules.flatMap((m) =>
    m.contentItems.filter((c) => c.contentType === 'VIDEO')
  );
  const allAssessments = enrollment.course.modules.flatMap((m) =>
    m.contentItems.filter((c) => c.contentType === 'ASSESSMENT')
  );

  let totalWeight = 0;
  let completedWeight = 0;

  // Videos: weight by duration
  allVideos.forEach((video) => {
    const weight = video.videoDurationSeconds || 0;
    totalWeight += weight;

    const progress = enrollment.videoProgress.find(
      (vp) => vp.contentItemId === video.id
    );
    
    if (progress && progress.completed) {
      completedWeight += weight;
    }
  });

  // Assessments: fixed weight of 600 seconds each (10 min equivalent)
  const ASSESSMENT_WEIGHT = 600;
  allAssessments.forEach((assessment) => {
    totalWeight += ASSESSMENT_WEIGHT;

    const attempt = enrollment.assessmentAttempts.find(
      (a) => a.contentItemId === assessment.id
    );

    if (attempt && attempt.passed) {
      completedWeight += ASSESSMENT_WEIGHT;
    }
  });

  const progressPercentage = totalWeight > 0 ? (completedWeight / totalWeight) * 100 : 0;
  const completed = progressPercentage >= 100;
  const wasCompleted = enrollment.completed;

  // Update enrollment
  await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: {
      progressPercentage,
      completed,
      completedAt: completed ? new Date() : null,
    },
  });

  // Auto-generate certificate if just completed
  if (completed && !wasCompleted) {
    try {
      const certificateService = require('./certificateService');
      await certificateService.generateCertificate(enrollment.userId, enrollment.courseId);
    } catch (error) {
      console.error('Failed to auto-generate certificate:', error);
      // Don't throw - certificate can be generated later manually
    }
  }

  return { progressPercentage, completed };
};

/**
 * Get user's progress for a course
 */
const getCourseProgress = async (userId, courseId) => {
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: { userId, courseId },
    },
    include: {
      videoProgress: {
        include: {
          contentItem: {
            select: {
              id: true,
              title: true,
              moduleId: true,
            },
          },
        },
      },
      assessmentAttempts: {
        include: {
          contentItem: {
            select: {
              id: true,
              title: true,
              moduleId: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!enrollment) {
    throw new Error('Not enrolled in this course');
  }

  return {
    progressPercentage: enrollment.progressPercentage.toNumber(),
    completed: enrollment.completed,
    completedAt: enrollment.completedAt,
    videoProgress: enrollment.videoProgress,
    assessmentAttempts: enrollment.assessmentAttempts,
  };
};

module.exports = {
  updateVideoProgress,
  submitAssessment,
  getCourseProgress,
  recalculateCourseProgress,
};