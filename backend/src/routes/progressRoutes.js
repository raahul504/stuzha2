const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progressController');
const { authenticateToken } = require('../middleware/auth');

// All progress routes require authentication
router.put('/progress/video/:contentItemId', authenticateToken, progressController.updateVideoProgress);
router.post('/progress/assessment/:contentItemId/submit', authenticateToken, progressController.submitAssessment);
router.get('/progress/course/:courseId', authenticateToken, progressController.getCourseProgress);

module.exports = router;