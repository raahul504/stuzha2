const conversationService = require('../services/conversationService');
const slmService = require('../services/slmService');
const recommendationService = require('../services/recommendationService');
const { extractGoalFromHistory } = require('../utils/extractGoal');
const Joi = require('joi');
const prisma = require('../config/database');

const chatSchema = Joi.object({
  message: Joi.string().min(1).max(1000).required(),
  sessionToken: Joi.string().allow(null).optional(),
});

/**
 * Get or create session for current user
 * POST /api/conversation/init
 */
const initSession = async (req, res, next) => {
  try {
    console.log('=== INIT SESSION CALLED ===');
    console.log('User ID:', req.user?.id);
    console.log('Request body:', req.body);
    console.log('Stack trace:', new Error().stack); // This shows WHERE it's called from

    const userId = req.user?.id || null;
    const { sessionToken } = req.body;

    const session = await conversationService.getOrCreateSession(userId, sessionToken);

    res.json({
      sessionToken: session.sessionToken,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Start or continue conversation
 * POST /api/conversation/chat
 */
const chat = async (req, res, next) => {
  try {
    console.log('Received chat request:', req.body);
    const { error, value } = chatSchema.validate(req.body);
    if (error) {
      console.error('Validation error:', error.details[0].message);
      return res.status(400).json({
        error: { message: error.details[0].message },
      });
    }

    const { message, sessionToken } = value;
    const userId = req.user?.id || null;

    // Get or create session
    const session = await conversationService.getOrCreateSession(userId, sessionToken);

    // Add user message to history
    await conversationService.addMessage(session.sessionToken, 'user', message);

    const embeddingService = require('../services/embeddingService');
    try {
      await embeddingService.embedUserQuery(session.sessionToken, message);
    } catch (embedErr) {
      console.error('Failed to embed user query:', embedErr.message);
    }

    // Get conversation history for context
    const history = await conversationService.getConversationHistory(session.sessionToken);

    //Get all learning paths for LLM context
    const learningPaths = await conversationService.getAllLearningPaths();
    const allCategories = await prisma.category.findMany({
      where: { level: 0 },
      include: { subCategories: { orderBy: { orderIndex: 'asc' } } },
      orderBy: { orderIndex: 'asc' },
    });

    const publishedCourses = await conversationService.getCoursesWithContent();
    const { message: assistantMessage } = await slmService.generateResponse(
      history,
      learningPaths,
      allCategories,
      publishedCourses
    );

    // Get updated history and score for recommendation
    const updatedHistory = await conversationService.getConversationHistory(session.sessionToken);
    const userMessageCount = updatedHistory.filter(m => m.role === 'user').length;
    // Clean [READY] from the message shown to user
    const cleanMessage = assistantMessage.replace(/\[READY\]|READY$/gim, '').trim();
    // Add assistant message to history
    await conversationService.addMessage(session.sessionToken, 'assistant', cleanMessage);
    // Only score if LLM signals readiness
    const isReady = /\[READY\]|READY$/im.test(assistantMessage);
    const alreadyRecommended = session.recommendedPathId;

    let recommendedPath = null;
    let recommendedCourses = null;

    if (isReady && !alreadyRecommended) {
      // Try full career path first
      const pathMatch = await conversationService.findMatchingPath(updatedHistory);
      
      if (pathMatch) {
        const preferences = slmService.extractPreferences(updatedHistory);
        await conversationService.updateExtractedInfo(
          session.sessionToken,
          pathMatch.name,
          preferences,
          pathMatch.id
        );
        recommendedPath = pathMatch;

        if (userId) {
          const pathCourses = await conversationService.getCoursesForPath(pathMatch.id);
          await recommendationService.saveRecommendation({
            userId,
            learningPathId: pathMatch.id,
            courseIds: pathCourses.map((c) => c.id),
            extractedGoal: pathMatch.name,
          });
        }
      } else {
        // Use embedding search for topic-focused recommendations
        const relevantCourses = await conversationService.findRelevantCoursesByEmbedding(updatedHistory);
        if (relevantCourses.length > 0) {
          recommendedCourses = relevantCourses;
          // Persist course IDs to session for reload recovery
          await conversationService.updateExtractedInfo(
            session.sessionToken,
            'topic_recommendation',
            { recommendedCourseIds: relevantCourses.map(c => c.id) },
            null
          );

          if (userId && relevantCourses.length > 0) {
            await recommendationService.saveRecommendation({
              userId,
              learningPathId: null,
              courseIds: relevantCourses.map((c) => c.id),
              extractedGoal: extractGoalFromHistory(updatedHistory),
            });
          }
        }
      }
    }

    res.json({
      sessionToken: session.sessionToken,
      message: cleanMessage,
      recommendation: recommendedPath,
      recommendedCourses: recommendedCourses,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh embeddings
 * POST /api/conversation/admin/embeddings/refresh
 */
const refreshEmbeddings = async (req, res, next) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: { message: 'Admin access required' } });
    }
    const embeddingService = require('../services/embeddingService');
    await embeddingService.embedAllCourses();
    res.json({ message: 'Embeddings refreshed successfully' });
  } catch (error) {
    next(error);
  }
};
/**
 * Get courses for recommended path
 * GET /api/conversation/path/:pathId/courses
 */
const getPathCourses = async (req, res, next) => {
  try {
    const { pathId } = req.params;
    const userId = req.user?.id || null;

    const courses = await conversationService.getCoursesForPath(pathId);
    const progress = userId ? await conversationService.getPathProgress(userId, pathId) : null;

    res.json({
      courses,
      progress,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get courses for recommended subcategory
 * GET /api/conversation/subcategory/:subcategoryId/courses
 */
const getSubcategoryCourses = async (req, res, next) => {
  try {
    const { subcategoryId } = req.params;
    const courses = await conversationService.getCoursesForSubcategory(subcategoryId);
    res.json({ courses });
  } catch (error) {
    next(error);
  }
};

const getCoursesByIds = async (req, res, next) => {
  try {
    const { ids } = req.query;
    if (!ids) return res.json({ courses: [] });
    
    const idArray = ids.split(',').filter(Boolean);
    const courses = await prisma.course.findMany({
      where: {
        id: { in: idArray },
        isPublished: true,
      },
      include: {
        categories: { include: { category: true } },
      },
    });
    res.json({ courses });
  } catch (error) {
    next(error);
  }
};

/**
 * Get session details
 * GET /api/conversation/session/:sessionToken
 */
const getSession = async (req, res, next) => {
  try {
    const { sessionToken } = req.params;

    const session = await conversationService.getOrCreateSession(null, sessionToken);
    const history = await conversationService.getConversationHistory(sessionToken);

    let recommendedPath = null;
    if (session.recommendedPathId) {
      recommendedPath = await prisma.learningPath.findUnique({
        where: { id: session.recommendedPathId }
      });
    }

    res.json({
      session: {
        sessionToken: session.sessionToken,
        extractedGoal: session.extractedGoal,
        extractedPreferences: session.extractedPreferences,
        recommendedPathId: session.recommendedPathId,
        recommendedPath,
      },
      history,
    });
  } catch (error) {
    if (error.message === 'Session not found') {
      return res.status(404).json({ error: { message: error.message } });
    }
    next(error);
  }
};

/**
 * Reset conversation
 * DELETE /api/conversation/session/:sessionToken
 */
const resetSession = async (req, res, next) => {
  try {
    const { sessionToken } = req.params;

    await prisma.conversationSession.delete({
      where: { sessionToken },
    });

    res.json({ message: 'Session reset successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Health check for SLM
 * GET /api/conversation/health
 */
const healthCheck = async (req, res, next) => {
  try {
    const isHealthy = await slmService.checkOllamaHealth();

    res.json({
      status: isHealthy ? 'ok' : 'degraded',
      ollama: isHealthy,
      model: slmService.MODEL_NAME,
      url: slmService.OLLAMA_BASE_URL,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  chat,
  getPathCourses,
  getSubcategoryCourses,
  refreshEmbeddings,
  getSession,
  resetSession,
  healthCheck,
  initSession,
  getCoursesByIds,
};