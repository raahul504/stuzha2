const express = require('express');
const router = express.Router();
const moduleController = require('../controllers/moduleController');
const { authenticateToken } = require('../middleware/auth');

// All module routes require authentication
router.post('/courses/:courseId/modules', authenticateToken, moduleController.createModule);
router.get('/courses/:courseId/modules', authenticateToken, moduleController.getModulesByCourse);
router.put('/courses/:courseId/modules/reorder', authenticateToken, moduleController.reorderModules);
router.put('/modules/:id', authenticateToken, moduleController.updateModule);
router.delete('/modules/:id', authenticateToken, moduleController.deleteModule);

module.exports = router;