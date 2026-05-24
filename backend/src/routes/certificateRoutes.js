const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificateController');
const { authenticateToken } = require('../middleware/auth');

router.post('/certificates/generate/:courseId', authenticateToken, certificateController.generateCertificate);
router.get('/certificates/download/:filename', certificateController.downloadCertificate);
router.get('/certificates/verify/:certNumber', certificateController.verifyCertificate);

module.exports = router;