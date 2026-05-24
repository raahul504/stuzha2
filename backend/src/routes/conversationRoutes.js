const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversationController');
const { optionalAuth } = require('../middleware/auth');
const { authenticateToken } = require('../middleware/auth');

// Initialise chat session
router.post('/init', optionalAuth, conversationController.initSession);

// Chat endpoint - works for both authenticated and anonymous users
router.post('/chat', optionalAuth, conversationController.chat);

// Get courses for a learning path
router.get('/path/:pathId/courses', optionalAuth, conversationController.getPathCourses);

// Get courses for a subcategory
router.get('/subcategory/:subcategoryId/courses', optionalAuth, conversationController.getSubcategoryCourses);

// Get courses by IDs
router.get('/courses/by-ids', optionalAuth, conversationController.getCoursesByIds);

// Get session details
router.get('/session/:sessionToken', conversationController.getSession);

// Reset session
router.delete('/session/:sessionToken', conversationController.resetSession);

// Health check
router.get('/health', conversationController.healthCheck);

// Embeddings
router.post('/admin/embeddings/refresh', authenticateToken, conversationController.refreshEmbeddings);

module.exports = router;