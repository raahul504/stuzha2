const certificateService = require('../services/certificateService');
const path = require('path');
const fs = require('fs');

/**
 * Generate certificate
 * POST /api/certificates/generate/:courseId
 */
const generateCertificate = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const certificate = await certificateService.generateCertificate(req.user.id, courseId);

    res.json({
      message: 'Certificate generated successfully',
      certificate,
    });
  } catch (error) {
    if (
      error.message === 'Not enrolled in this course' ||
      error.message === 'Course not completed yet'
    ) {
      return res.status(400).json({ error: { message: error.message } });
    }
    next(error);
  }
};

/**
 * Download certificate
 * GET /api/certificates/download/:filename
 */
const downloadCertificate = async (req, res, next) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(certificateService.CERT_DIR, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: { message: 'Certificate not found' } });
    }

    res.download(filePath);
  } catch (error) {
    next(error);
  }
};

/**
 * Verify certificate
 * GET /api/certificates/verify/:certNumber
 */
const verifyCertificate = async (req, res, next) => {
  try {
    const { certNumber } = req.params;
    const result = await certificateService.verifyCertificate(certNumber);

    res.json(result);
  } catch (error) {
    if (error.message === 'Certificate not found') {
      return res.status(404).json({ error: { message: error.message } });
    }
    next(error);
  }
};

module.exports = {
  generateCertificate,
  downloadCertificate,
  verifyCertificate,
};