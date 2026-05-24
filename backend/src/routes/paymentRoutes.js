const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticateToken } = require('../middleware/auth');

router.post('/create-order', authenticateToken, paymentController.createOrder);
router.post('/verify', authenticateToken, paymentController.verifyPayment);

// Webhook — no auth, raw body (registered separately in server.js)
router.post('/webhook', paymentController.webhook);

module.exports = router;