const prisma = require('../config/database');

const checkPermission = async (userId, contentItemId) => {
  const contentItem = await prisma.contentItem.findUnique({
    where: { id: contentItemId },
    include: { module: { include: { course: true } } },
  });

  if (!contentItem) throw new Error('Content item not found');

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  
  if (user.role === 'ADMIN' || user.role === 'INSTRUCTOR') return contentItem;
  if (contentItem.module.course.createdBy === userId) return contentItem;
  
  throw new Error('Unauthorized');
};

/**
 * Add question to assessment
 */
const addQuestion = async (contentItemId, questionData, userId) => {
  // Verify content item is an assessment and user has permission
  const contentItem = await checkPermission(userId, contentItemId);

  if (!contentItem) {
    throw new Error('Content item not found');
  }

  if (contentItem.contentType !== 'ASSESSMENT') {
    throw new Error('Content item is not an assessment');
  }

  // Permission already checked by checkPermission function

  // Get next order index
  const lastQuestion = await prisma.assessmentQuestion.findFirst({
    where: { contentItemId },
    orderBy: { orderIndex: 'desc' },
  });

  const orderIndex = lastQuestion ? lastQuestion.orderIndex + 1 : 0;

  // Validate question type
  const { questionType, correctAnswer, ...rest } = questionData;

  let questionPayload = {
    contentItemId,
    questionType,
    questionText: rest.questionText,
    correctAnswer,
    explanation: rest.explanation,
    points: rest.points || 1,
    orderIndex,
  };

  // Add MCQ options if applicable
  if (questionType === 'MCQ') {
    if (!rest.optionA || !rest.optionB) {
      throw new Error('MCQ must have at least options A and B');
    }
    questionPayload = {
      ...questionPayload,
      optionA: rest.optionA,
      optionB: rest.optionB,
      optionC: rest.optionC,
      optionD: rest.optionD,
    };
  }

  const question = await prisma.assessmentQuestion.create({
    data: questionPayload,
  });

  return question;
};

/**
 * Get questions for assessment
 */
const getQuestionsByAssessment = async (contentItemId) => {
  const questions = await prisma.assessmentQuestion.findMany({
    where: { contentItemId },
    orderBy: { orderIndex: 'asc' },
  });

  return questions;
};

/**
 * Update question
 */
const updateQuestion = async (questionId, updateData, userId) => {
  const question = await prisma.assessmentQuestion.findUnique({
    where: { id: questionId },
    include: { contentItem: true },
  });

  if (!question) {
    throw new Error('Question not found');
  }

  const updated = await prisma.assessmentQuestion.update({
    where: { id: questionId },
    data: updateData,
  });

  return updated;
};

/**
 * Delete question
 */
const deleteQuestion = async (questionId, userId) => {
  const question = await prisma.assessmentQuestion.findUnique({
    where: { id: questionId },
    include: { contentItem: true } ,
  });

  if (!question) {
    throw new Error('Question not found');
  }

  await prisma.assessmentQuestion.delete({
    where: { id: questionId },
  });

  return { message: 'Question deleted successfully' };
};

module.exports = {
  addQuestion,
  getQuestionsByAssessment,
  updateQuestion,
  deleteQuestion,
};