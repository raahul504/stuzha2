// backend/src/routes/userRoutes.js - NEW FILE

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');

router.get('/profile', authenticateToken, userController.getProfile);
router.put('/profile', authenticateToken, userController.updateProfile);
router.put('/password', authenticateToken, userController.changePassword);
router.get('/recommendations', authenticateToken, userController.getRecommendations);
router.delete('/recommendations/:id', authenticateToken, userController.deleteRecommendation);

module.exports = router;