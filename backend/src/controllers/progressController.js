const progressService = require('../services/progressService');
const Joi = require('joi');

const updateVideoProgressSchema = Joi.object({
  lastPositionSeconds: Joi.number().integer().min(0).required(),
  completed: Joi.boolean().optional(),
  totalWatchTimeSeconds: Joi.number().min(0).optional().default(0)
});

const submitAssessmentSchema = Joi.object({
  answers: Joi.object().pattern(
    Joi.string(), // question ID
    Joi.string()  // answer (A/B/C/D or TRUE/FALSE)
  ).required(),
});

/**
 * Update video progress
 * PUT /api/progress/video/:contentItemId
 */
const updateVideoProgress = async (req, res, next) => {
  try {
    const { contentItemId } = req.params;
    const { error, value } = updateVideoProgressSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        error: { message: error.details[0].message },
      });
    }

    const progress = await progressService.updateVideoProgress(
      req.user.id,
      contentItemId,
      value
    );

    res.json({
      message: 'Video progress updated',
      progress,
    });
  } catch (error) {
    if (
      error.message === 'Invalid video content item' ||
      error.message === 'Not enrolled in this course'
    ) {
      return res.status(error.message === 'Invalid video content item' ? 400 : 403).json({
        error: { message: error.message },
      });
    }
    next(error);
  }
};

/**
 * Submit assessment
 * POST /api/progress/assessment/:contentItemId/submit
 */
const submitAssessment = async (req, res, next) => {
  try {
    const { contentItemId } = req.params;
    const { error, value } = submitAssessmentSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        error: { message: error.details[0].message },
      });
    }

    const result = await progressService.submitAssessment(
      req.user.id,
      contentItemId,
      value.answers
    );

    res.json({
      message: result.passed ? 'Assessment passed!' : 'Assessment completed',
      result: {
        score: result.score.toNumber(),
        passed: result.passed,
        correctCount: result.correctCount,
        totalQuestions: result.totalQuestions,
        earnedPoints: result.earnedPoints,
        totalPoints: result.totalPoints,
        attemptNumber: result.attemptNumber,
      },
    });
  } catch (error) {
    if (
      error.message === 'Invalid assessment content item' ||
      error.message === 'Not enrolled in this course'
    ) {
      return res.status(error.message === 'Invalid assessment content item' ? 400 : 403).json({
        error: { message: error.message },
      });
    }
    next(error);
  }
};

/**
 * Get course progress
 * GET /api/progress/course/:courseId
 */
const getCourseProgress = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const progress = await progressService.getCourseProgress(req.user.id, courseId);

    res.json({ progress });
  } catch (error) {
    if (error.message === 'Not enrolled in this course') {
      return res.status(403).json({
        error: { message: error.message },
      });
    }
    next(error);
  }
};

module.exports = {
  updateVideoProgress,
  submitAssessment,
  getCourseProgress,
};