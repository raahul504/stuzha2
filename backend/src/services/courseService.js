const prisma = require('../config/database');
const embeddingService = require('./embeddingService');

const normalizeBoolean = (value) => {
  if (value === true || value === false) return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
};

/**
 * Create a new course
 */
const createCourse = async (courseData, creatorId) => {
  const { categoryIds, ...restData } = courseData;
  const isPublished = normalizeBoolean(restData.isPublished);

  const course = await prisma.course.create({
    data: {
      ...restData,
      price: (Math.round(Number(String(restData.price).trim()) * 100) / 100).toFixed(2),
      createdBy: creatorId,
      ...(isPublished !== undefined ? { isPublished } : {}),
      approvalStatus: isPublished ? 'PUBLISHED' : 'DRAFT',
      categories: categoryIds && categoryIds.length > 0 ? {
        create: categoryIds.map(categoryId => ({
          categoryId,
        })),
      } : undefined,
    },
    include: {
      modules: true,
      categories: {
        include: {
          category: true,
        },
      },
    },
  });

  // Auto-generate embedding if published at creation
  if (course.isPublished) {
    try {
      await embeddingService.embedCourse(course.id);
    } catch (embErr) {
      console.error('Failed to generate course embedding on create:', embErr.message);
    }
  }

  return course;
};

/**
 * Get all published courses
 */
const getAllCourses = async (userId = null) => {
  const courses = await prisma.course.findMany({
    include: {
      categories: {
        include: {
          category: true,
        },
      },
      modules: {
        include: {
          contentItems: {
            select: {
              id: true,
              title: true,
              contentType: true,
              orderIndex: true,
            },
            orderBy: {
              orderIndex: 'asc',
            },
          },
        },
        orderBy: {
          orderIndex: 'asc',
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // If user is logged in, check which courses they've purchased
  if (userId) {
    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      select: { courseId: true },
    });

    const enrolledCourseIds = new Set(enrollments.map((e) => e.courseId));

    return courses.map((course) => ({
      ...course,
      isPurchased: enrolledCourseIds.has(course.id),
    }));
  }

  return courses.map((course) => ({ ...course, isPurchased: false }));
};

/**
 * Get course by ID (with access control)
 */
const getCourseById = async (courseId, userId = null) => {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      categories: {
        include: {
          category: true,
        },
      },
      modules: {
        include: {
          contentItems: {
            include: {
              questions: {
                select: {
                  id: true,
                  questionType: true,
                  questionText: true,
                  optionA: true,
                  optionB: true,
                  optionC: true,
                  optionD: true,
                  orderIndex: true,
                  points: true,
                  // Don't include correctAnswer and explanation in student view
                },
                orderBy: {
                  orderIndex: 'asc',
                },
              },
            },
            orderBy: {
              orderIndex: 'asc',
            },
          },
        },
        orderBy: {
          orderIndex: 'asc',
        },
      },
    },
  });

  if (!course) {
    throw new Error('Course not found');
  }

  // Check if user has purchased
  let enrollment = null;
  let videoProgressMap = {};
  let assessmentAttemptsMap = {};

  if (userId) {
    enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      include: {
        videoProgress: true,
        assessmentAttempts: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // Create a map of contentItemId -> progress for easy lookup
    if (enrollment) {
      videoProgressMap = enrollment.videoProgress.reduce((acc, vp) => {
        acc[vp.contentItemId] = {
          lastPositionSeconds: vp.lastPositionSeconds,
          completed: vp.completed,
          completedAt: vp.completedAt,
        };
        return acc;
      }, {});

      // Create a map of contentItemId -> attempts for assessments
      assessmentAttemptsMap = enrollment.assessmentAttempts.reduce((acc, attempt) => {
        if (!acc[attempt.contentItemId]) {
          acc[attempt.contentItemId] = [];
        }
        acc[attempt.contentItemId].push(attempt);
        return acc;
      }, {});
    }
  }

  const isPurchased = !!enrollment;

  // If not purchased, return preview version
  if (!isPurchased) {
    return {
      ...course,
      isPurchased: false,
      modules: course.modules.map((module) => ({
        ...module,
        contentItems: module.contentItems.map((item) => ({
          id: item.id,
          title: item.title,
          contentType: item.contentType,
          description: item.description,
          orderIndex: item.orderIndex,
          isPreview: item.isPreview,
          // Remove actual content for non-purchased
          videoUrl: item.isPreview ? item.videoUrl : null,
          videoDurationSeconds: item.videoDurationSeconds,
          articleContent: null,
          articleFileUrl: null,
          questions: item.contentType === 'ASSESSMENT'
            ? item.questions : [],
        })),
      })),
    };
  }

  // Return full course with progress
  return {
    ...course,
    isPurchased: true,
    enrollment: {
      progressPercentage: enrollment.progressPercentage.toNumber(),
      completed: enrollment.completed,
    },
    modules: course.modules.map((module) => ({
      ...module,
      contentItems: module.contentItems.map((item) => {
        const baseItem = { ...item };

        // Add video progress if it's a video
        if (item.contentType === 'VIDEO' && videoProgressMap[item.id]) {
          baseItem.lastPositionSeconds = videoProgressMap[item.id].lastPositionSeconds;
          baseItem.videoCompleted = videoProgressMap[item.id].completed;
        }

        // Add assessment attempts if it's an assessment
        if (item.contentType === 'ASSESSMENT' && assessmentAttemptsMap[item.id]) {
          const attempts = assessmentAttemptsMap[item.id];
          const latestAttempt = attempts[0]; // Already sorted by createdAt desc
          const bestAttempt = attempts.reduce((best, current) =>
            current.score.toNumber() > best.score.toNumber() ? current : best
            , attempts[0]);

          baseItem.latestScore = latestAttempt.score.toNumber();
          baseItem.bestScore = bestAttempt.score.toNumber();
          baseItem.attemptCount = attempts.length;
          baseItem.hasPassed = attempts.some(a => a.passed);
        }

        return baseItem;
      }),
    })),
  };
};

/**
 * Get user's enrolled courses
 */
const getUserCourses = async (userId) => {
  const enrollments = await prisma.enrollment.findMany({
    where: { userId },
    include: {
      course: {
        include: {
          categories: {
            include: {
              category: true,
            },
          },
          modules: {
            include: {
              contentItems: {
                select: {
                  id: true,
                  title: true,
                  contentType: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      enrolledAt: 'desc',
    },
  });

  return enrollments.map((enrollment) => ({
    ...enrollment.course,
    progressPercentage: enrollment.progressPercentage.toNumber(),
    completed: enrollment.completed,
    enrolledAt: enrollment.enrolledAt,
  }));
};

/**
 * Enroll user in course (purchase)
 */
const enrollInCourse = async (userId, courseId, couponCode = null) => {
  // Check if course exists
  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    throw new Error('Course not found');
  }

  if (!course.isPublished) {
    throw new Error('Course is not available for enrollment');
  }

  // Check if already enrolled
  const existingEnrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId,
      },
    },
  });

  if (existingEnrollment) {
    throw new Error('Already enrolled in this course');
  }

  // Get all videos and assessments in the course
  const modules = await prisma.module.findMany({
    where: { courseId },
    include: {
      contentItems: {
        where: {
          contentType: {
            in: ['VIDEO', 'ASSESSMENT'],
          },
        },
      },
    },
  });

  // Add this block before the transaction
  let finalPrice = course.price;
  let couponId = null;

  if (couponCode) {
    const { validateCoupon, calculateDiscount } = require('./couponService');
    const coupon = await validateCoupon(couponCode, courseId);
    finalPrice = calculateDiscount(coupon, course.price);
    couponId = coupon.id;
  }

  // Create enrollment and initialize progress in a transaction
  const enrollment = await prisma.$transaction(async (tx) => {

    // Create enrollment
    const newEnrollment = await tx.enrollment.create({
      data: {
        userId,
        courseId,
        paymentAmount: finalPrice,
        paymentCurrency: course.currency,
        paymentStatus: 'completed', // For now, auto-complete (will add payment gateway later)
        couponId: couponId,
        discountedAmount: couponId ? Math.round(Number(String(course.price)) * 100) / 100 - finalPrice : null,
      },
    });

    // Initialize video progress for all videos
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

  if (couponId) {
    await prisma.coupon.update({
      where: { id: couponId },
      data: { usedCount: { increment: 1 } }
    });
  }

  return enrollment;
};

/**
 * Update course
 */
const updateCourse = async (courseId, updateData, userId) => {

  // Verify course exists
  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    throw new Error('Course not found');
  }

  // Get user to check role
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  // Allow if user is the creator OR if user is an ADMIN
  if (course.createdBy !== userId && user.role !== 'ADMIN') {
    console.log('Authorization failed:', { createdBy: course.createdBy, userId, role: user.role });
    throw new Error('Unauthorized to update this course');
  }

  // Extract categoryIds from updateData
  const { categoryIds, ...dataToUpdate } = updateData;
  const normalizedIsPublished = normalizeBoolean(dataToUpdate.isPublished);
  if (normalizedIsPublished !== undefined) dataToUpdate.isPublished = normalizedIsPublished;

  if (dataToUpdate.price !== undefined && dataToUpdate.price !== null && dataToUpdate.price !== '') {
    const priceNum = Math.round(Number(String(dataToUpdate.price).trim()) * 100) / 100;
    if (isNaN(priceNum)) throw new Error('Invalid price value');
    dataToUpdate.price = priceNum.toFixed(2);
  }

  if (dataToUpdate.estimatedDurationHours !== undefined) {
    if (dataToUpdate.estimatedDurationHours === '' || dataToUpdate.estimatedDurationHours === null) {
      dataToUpdate.estimatedDurationHours = null;
    } else {
      dataToUpdate.estimatedDurationHours = parseInt(dataToUpdate.estimatedDurationHours);
    }
  }

  // Handle courseIncludes - convert empty string to null
  if (dataToUpdate.courseIncludes !== undefined) {
    if (dataToUpdate.courseIncludes === '' || dataToUpdate.courseIncludes === null) {
      dataToUpdate.courseIncludes = null;
    }
  }

  // Handle requirements - convert empty string to null
  if (dataToUpdate.requirements !== undefined) {
    if (dataToUpdate.requirements === '' || dataToUpdate.requirements === null) {
      dataToUpdate.requirements = null;
    }
  }

  // Handle targetAudience - convert empty string to null
  if (dataToUpdate.targetAudience !== undefined) {
    if (dataToUpdate.targetAudience === '' || dataToUpdate.targetAudience === null) {
      dataToUpdate.targetAudience = null;
    }
  }

  try {
    // If categoryIds is provided, update the categories
    if (categoryIds !== undefined) {
      await prisma.$transaction(async (tx) => {
        // Delete existing category associations
        await tx.courseCategory.deleteMany({
          where: { courseId },
        });

        // Create new category associations
        if (categoryIds && categoryIds.length > 0) {
          await tx.courseCategory.createMany({
            data: categoryIds.map(categoryId => ({
              courseId,
              categoryId,
            })),
          });
        }

        // Update course data
        await tx.course.update({
          where: { id: courseId },
          data: dataToUpdate,
        });
      });
    } else {
      // Just update course data without touching categories
      await prisma.course.update({
        where: { id: courseId },
        data: dataToUpdate,
      });
    }

    // Fetch and return updated course with categories
    const updatedCourse = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
      },
    });

    // Sync embedding with current publish status (and refresh on any update)
    try {
      if (updatedCourse?.isPublished) {
        await embeddingService.embedCourse(courseId);
      } else {
        await embeddingService.deleteEmbedding(courseId);
      }
    } catch (embErr) {
      console.error('Failed to sync course embedding:', embErr.message);
    }

    return updatedCourse;
  } catch (error) {
    console.error('Prisma update error:', error);
    throw error;
  }
};

/**
 * Delete course
 */
const deleteCourse = async (courseId, userId) => {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    throw new Error('Course not found');
  }

  if (course.createdBy !== userId) {
    throw new Error('Unauthorized to delete this course');
  }

  if (course.isPublished) {
    throw new Error('Cannot delete a published course. Please unpublish it first.');
  }

  await prisma.course.delete({
    where: { id: courseId },
  });

  return { message: 'Course deleted successfully' };
};

module.exports = {
  createCourse,
  getAllCourses,
  getCourseById,
  getUserCourses,
  enrollInCourse,
  updateCourse,
  deleteCourse,
};