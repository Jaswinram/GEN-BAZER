const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getSellerOrders,
  getOrderById,
  updateOrderStatus,
} = require('../controllers/orderController');
const { protect, authorizeRoles } = require('../middleware/auth');

router.post('/', protect, createOrder);
router.get('/my', protect, getMyOrders);
router.get('/seller', protect, authorizeRoles('farmer', 'supplier', 'admin'), getSellerOrders);
router.get('/:id', protect, getOrderById);
router.patch('/:id/status', protect, updateOrderStatus);

module.exports = router;

