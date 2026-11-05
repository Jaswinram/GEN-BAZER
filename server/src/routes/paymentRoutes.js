const express = require('express');
const router = express.Router();
const {
  initiatePayment,
  verifyPayment,
  getPaymentStatus,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.post('/initiate', protect, initiatePayment);
router.post('/verify', protect, verifyPayment);
router.get('/:reference', protect, getPaymentStatus);

module.exports = router;

