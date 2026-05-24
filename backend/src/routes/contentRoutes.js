const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');
const assessmentController = require('../controllers/assessmentController');
const { authenticateToken } = require('../middleware/auth');
const { uploadArticle } = require('../middleware/upload')

// Content routes
router.post('/modules/:moduleId/content', authenticateToken, contentController.createContentItem);
router.get('/modules/:moduleId/content', authenticateToken, contentController.getContentByModule);
router.put('/modules/:moduleId/content/reorder', authenticateToken, contentController.reorderContentItems);
router.put('/content/:id', authenticateToken, contentController.updateContentItem);
router.delete('/content/:id', authenticateToken, contentController.deleteContentItem);
router.post('/articles/upload/:moduleId', authenticateToken, uploadArticle, contentController.uploadArticle);
router.get('/articles/view/:filename', contentController.downloadArticle);

// Assessment question routes
router.post('/content/:contentId/questions', authenticateToken, assessmentController.addQuestion);
router.get('/content/:contentId/questions', authenticateToken, assessmentController.getQuestionsByAssessment);
router.put('/questions/:id', authenticateToken, assessmentController.updateQuestion);
router.delete('/questions/:id', authenticateToken, assessmentController.deleteQuestion);

router.get('/modules/:moduleId/content', authenticateToken, contentController.getModuleContent);
router.get('/content/:contentItemId', authenticateToken, contentController.getContentItem);

module.exports = router;