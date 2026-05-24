const prisma = require('../config/database');
const crypto = require('crypto');

/**
 * Generate session token for anonymous users
 */
const generateSessionToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Create or get conversation session
 */
const getOrCreateSession = async (userId = null, sessionToken = null) => {
  // Prioritise sessionToken lookup FIRST
  if (sessionToken) {
    const existing = await prisma.conversationSession.findUnique({
      where: { sessionToken },
    });
    if (existing) return existing; // return regardless of userId mismatch
  }

  if (userId) {
    const userSession = await prisma.conversationSession.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
    if (userSession) return userSession;

    const newToken = generateSessionToken();
    return await prisma.conversationSession.create({
      data: { userId, sessionToken: newToken, messagesJson: [] },
    });
  }

  // Anonymous with no token
  const newToken = generateSessionToken();
  return await prisma.conversationSession.create({
    data: { userId: null, sessionToken: newToken, messagesJson: [] },
  });
};

/**
 * Add message to conversation
 */
const addMessage = async (sessionToken, role, content) => {
  const session = await prisma.conversationSession.findUnique({
    where: { sessionToken },
  });

  if (!session) {
    throw new Error('Session not found');
  }

  const message = {
    role, // 'user' or 'assistant'
    content,
    timestamp: new Date().toISOString(),
  };

  const updatedMessages = [...session.messagesJson, message];

  return await prisma.conversationSession.update({
    where: { sessionToken },
    data: {
      messagesJson: updatedMessages,
      updatedAt: new Date(),
    },
  });
};

/**
 * Get conversation history
 */
const getConversationHistory = async (sessionToken) => {
  const session = await prisma.conversationSession.findUnique({
    where: { sessionToken },
  });

  if (!session) {
    throw new Error('Session not found');
  }

  return session.messagesJson;
};


/**
 * Update extracted information from conversation
 */
const updateExtractedInfo = async (sessionToken, extractedGoal, extractedPreferences, recommendedPathId = null) => {
  return await prisma.conversationSession.update({
    where: { sessionToken },
    data: {
      extractedGoal,
      extractedPreferences: extractedPreferences || {},
      recommendedPathId,
      updatedAt: new Date(),
    },
  });
};

/**
 * Get all learning paths
 */
const getAllLearningPaths = async () => {
  return await prisma.learningPath.findMany({
    orderBy: { name: 'asc' },
  });
};

/**
 * Find matching learning path based on keywords
 */
const CAREER_INTENT_PHRASES = [
  'want to become', 'want to be a', 'want to be an',
  'career in', 'career as', 'work as', 'work in',
  'job as', 'job in', 'looking to become', 'looking to be',
  'aspire to', 'goal is to become', 'goal is to be',
  'pursuing a career', 'get into', 'break into',
  'become a', 'become an',
];

const findMatchingPath = async (conversationHistory) => {
  const allPaths = await getAllLearningPaths();

  // Only look at last 4 user messages, not entire history
  const recentUserMessages = conversationHistory
    .filter(m => m.role === 'user' && typeof m.content === 'string')
    .slice(-4)
    .map(m => m.content.toLowerCase())
    .join(' ');

  if (!recentUserMessages.trim()) return null;

  // Layer A — career intent check on recent messages only
  const hasCareerIntent = CAREER_INTENT_PHRASES.some(phrase =>
    recentUserMessages.includes(phrase)
  );

  if (!hasCareerIntent) return null;

  const scored = allPaths.map(path => {
    let score = 0;

    // Score by goalKeywords
    path.goalKeywords.forEach(keyword => {
      if (recentUserMessages.includes(keyword.toLowerCase())) {
        score += 3; // keywords are high signal
      }
    });

    // Score by path name words
    path.name.toLowerCase().split(' ').forEach(word => {
      if (word.length > 3 && recentUserMessages.includes(word)) {
        score += 1;
      }
    });

    return { path, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const best = scored[0];
  // Minimum threshold to avoid false positives
  return best?.score >= 5 ? best.path : null;
};

/*const findMatchingCategory = async (conversationHistory) => {
  const allCategories = await prisma.category.findMany({
    include: { subCategories: true },
  });

  const recentUserMessages = conversationHistory
    .filter(m => m.role === 'user' && typeof m.content === 'string')
    .slice(-4)
    .map(m => m.content.toLowerCase())
    .join(' ');

  if (!recentUserMessages.trim()) return null;

  let bestMatch = null;
  let bestScore = 0;

  for (const mainCat of allCategories.filter(c => c.level === 0)) {
    for (const sub of mainCat.subCategories || []) {
      let score = 0;
      const subLower = sub.name.toLowerCase();
      const mainLower = mainCat.name.toLowerCase();

      // Direct subcategory name match
      if (recentUserMessages.includes(subLower)) score += 3;

      // Main category name match
      if (recentUserMessages.includes(mainLower)) score += 2;

      // Keyword fragments
      subLower.split(/\s+/).forEach(word => {
        if (word.length > 3 && recentUserMessages.includes(word)) score += 1;
      });

      if (score > bestScore) {
        bestScore = score;
        bestMatch = { category: mainCat, subcategory: sub };
      }
    }
  }

  return bestScore >= 2 ? bestMatch : null;
};
*/

/**
 * Find relevant courses for a topic-focused user intent
 * Uses semantic embedding search — cross-category by design
 * Replaces the old findMatchingCategory keyword approach
 */
const findRelevantCoursesByEmbedding = async (conversationHistory) => {
  const embeddingService = require('./embeddingService');

  // Build a focused query from the last 3 user messages
  const recentUserMessages = conversationHistory
    .filter(m => m.role === 'user' && typeof m.content === 'string')
    .slice(-3)
    .map(m => m.content)
    .join('. ');

  if (!recentUserMessages.trim()) return [];

  return await embeddingService.searchCoursesByEmbedding(recentUserMessages, 6);
};

/**
 * Get courses for learning path
 */
const getCoursesForPath = async (pathId) => {
  const path = await prisma.learningPath.findUnique({
    where: { id: pathId },
  });

  if (!path) return [];

  // Get all courses in the required categories
  const courses = await prisma.course.findMany({
    where: {
      isPublished: true,
      categories: {
        some: {
          categoryId: {
            in: path.requiredCategoryIds,
          },
        },
      },
    },
    include: {
      categories: {
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: { title: 'asc' },
  });

  return courses;
};

const getCoursesForSubcategory = async (subcategoryId) => {
  return await prisma.course.findMany({
    where: {
      isPublished: true,
      categories: {
        some: { categoryId: subcategoryId },
      },
    },
    include: {
      categories: {
        include: { category: { select: { id: true, name: true } } },
      },
    },
    orderBy: { title: 'asc' },
  });
};

/**
 * Get user's progress on learning path (if enrolled)
 */
const getPathProgress = async (userId, pathId) => {
  const path = await prisma.learningPath.findUnique({
    where: { id: pathId },
  });

  if (!path || !userId) return null;

  // Get user's enrollments in courses within this path
  const enrollments = await prisma.enrollment.findMany({
    where: {
      userId,
      course: {
        categories: {
          some: {
            categoryId: {
              in: path.requiredCategoryIds,
            },
          },
        },
      },
    },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          categories: {
            include: {
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return enrollments;
};

// In conversationService.js - add new function
const getCoursesWithContent = async () => {
  return await prisma.course.findMany({
    where: { isPublished: true },
    include: {
      categories: { include: { category: true } },
      modules: {
        include: {
          contentItems: {
            select: { title: true, contentType: true }
          }
        }
      }
    }
  });
};

module.exports = {
  generateSessionToken,
  getOrCreateSession,
  addMessage,
  getConversationHistory,
  updateExtractedInfo,
  getAllLearningPaths,
  findMatchingPath,
  findRelevantCoursesByEmbedding,
  getCoursesForPath,
  getCoursesForSubcategory,
  getPathProgress,
  getCoursesWithContent,
};