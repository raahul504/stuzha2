const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');
const { uploadVideo } = require('../middleware/upload');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

router.post('/videos/upload/:moduleId', authenticateToken, uploadVideo, videoController.uploadVideo);
router.get('/videos/stream/:filename', optionalAuth, videoController.streamVideo);

module.exports = router;