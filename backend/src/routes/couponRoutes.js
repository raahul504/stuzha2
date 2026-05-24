const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.post('/validate', couponController.validate);
router.post('/', couponController.create);
router.get('/', couponController.getAll);
router.patch('/:id', couponController.update);
router.delete('/:id', couponController.remove);

module.exports = router;