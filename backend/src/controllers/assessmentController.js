const assessmentService = require('../services/assessmentService');
const Joi = require('joi');

const addQuestionSchema = Joi.object({
  questionType: Joi.string().valid('MCQ', 'TRUE_FALSE').required(),
  questionText: Joi.string().min(5).required(),
  correctAnswer: Joi.string().required(),
  explanation: Joi.string().optional(),
  points: Joi.number().integer().min(1).default(1),
  
  // MCQ options (required only for MCQ)
  optionA: Joi.string().when('questionType', {
    is: 'MCQ',
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),
  optionB: Joi.string().when('questionType', {
    is: 'MCQ',
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),
  optionC: Joi.string().when('questionType', {
    is: 'MCQ',
    then: Joi.optional(),
    otherwise: Joi.forbidden(),
  }),
  optionD: Joi.string().when('questionType', {
    is: 'MCQ',
    then: Joi.optional(),
    otherwise: Joi.forbidden(),
  }),
});

/**
 * Add question to assessment
 * POST /api/content/:contentId/questions
 */
const addQuestion = async (req, res, next) => {
  try {
    const { contentId } = req.params;
    const { error, value } = addQuestionSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        error: { message: error.details[0].message },
      });
    }

    const question = await assessmentService.addQuestion(contentId, value, req.user.id);

    res.status(201).json({
      message: 'Question added successfully',
      question,
    });
  } catch (error) {
    if (
      error.message === 'Content item not found' ||
      error.message === 'Content item is not an assessment' ||
      error.message === 'Unauthorized to modify this assessment' ||
      error.message === 'MCQ must have at least options A and B'
    ) {
      const status = error.message === 'Content item not found' ? 404 : 400;
      return res.status(status).json({
        error: { message: error.message },
      });
    }
    next(error);
  }
};

/**
 * Get questions for assessment
 * GET /api/content/:contentId/questions
 */
const getQuestionsByAssessment = async (req, res, next) => {
  try {
    const { contentId } = req.params;
    const questions = await assessmentService.getQuestionsByAssessment(contentId);

    res.json({ questions });
  } catch (error) {
    next(error);
  }
};

/**
 * Update question
 * PUT /api/questions/:id
 */
const updateQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const question = await assessmentService.updateQuestion(id, req.body, req.user.id);

    res.json({
      message: 'Question updated successfully',
      question,
    });
  } catch (error) {
    if (error.message === 'Question not found' || error.message === 'Unauthorized to modify this question') {
      return res.status(error.message === 'Question not found' ? 404 : 403).json({
        error: { message: error.message },
      });
    }
    next(error);
  }
};

/**
 * Delete question
 * DELETE /api/questions/:id
 */
const deleteQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await assessmentService.deleteQuestion(id, req.user.id);

    res.json(result);
  } catch (error) {
    if (error.message === 'Question not found' || error.message === 'Unauthorized to delete this question') {
      return res.status(error.message === 'Question not found' ? 404 : 403).json({
        error: { message: error.message },
      });
    }
    next(error);
  }
};

module.exports = {
  addQuestion,
  getQuestionsByAssessment,
  updateQuestion,
  deleteQuestion,
};