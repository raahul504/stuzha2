const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

// Protected routes
router.get('/my-courses', authenticateToken, courseController.getUserCourses);
router.post('/:id/enroll', authenticateToken, courseController.enrollInCourse);

// Admin/Instructor routes
router.post('/', authenticateToken, courseController.createCourse);
router.put('/:id', authenticateToken, courseController.updateCourse);
router.delete('/:id', authenticateToken, courseController.deleteCourse);

// Public routes (with optional auth)
router.get('/', optionalAuth, courseController.getAllCourses);
router.get('/:id', optionalAuth, courseController.getCourseById);

module.exports = router;