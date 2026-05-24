const prisma = require('../config/database');

/**
 * Persist a user recommendation (independent of conversation session lifecycle).
 */
const saveRecommendation = async ({ userId, learningPathId, courseIds, extractedGoal }) => {
  if (!userId) return null;

  return prisma.userRecommendation.create({
    data: {
      userId,
      learningPathId: learningPathId || null,
      courseIds: courseIds || [],
      extractedGoal,
    },
  });
};

/**
 * List recommendations for a user, most recent first, with path and course details.
 */
const getUserRecommendations = async (userId) => {
  const recommendations = await prisma.userRecommendation.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      learningPath: true,
    },
  });

  const allCourseIds = [...new Set(recommendations.flatMap((r) => r.courseIds))];

  const courses =
    allCourseIds.length > 0
      ? await prisma.course.findMany({
          where: {
            id: { in: allCourseIds },
            isPublished: true,
          },
          include: {
            categories: { include: { category: true } },
          },
        })
      : [];

  const courseById = new Map(courses.map((c) => [c.id, c]));

  return recommendations.map((rec) => ({
    id: rec.id,
    extractedGoal: rec.extractedGoal,
    createdAt: rec.createdAt,
    learningPath: rec.learningPath,
    courses: rec.courseIds
      .map((id) => courseById.get(id))
      .filter(Boolean),
  }));
};

/**
 * Delete a recommendation owned by the user.
 */
const deleteRecommendation = async (userId, recommendationId) => {
  const existing = await prisma.userRecommendation.findFirst({
    where: { id: recommendationId, userId },
  });

  if (!existing) {
    throw new Error('Recommendation not found');
  }

  await prisma.userRecommendation.delete({
    where: { id: recommendationId },
  });

  return { message: 'Recommendation deleted successfully' };
};

module.exports = {
  saveRecommendation,
  getUserRecommendations,
  deleteRecommendation,
};
