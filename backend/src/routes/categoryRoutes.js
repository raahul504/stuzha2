const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.get('/', categoryController.getAllCategories); // public
router.post('/', authenticateToken, authorizeRole('ADMIN', 'INSTRUCTOR'), categoryController.createCategory);

module.exports = router;