const express = require('express');
const router = express.Router();
const {
  getPlatformStats,
  getAllUsers,
  updateUserStatus,
  getReports,
  updateReport,
  submitReport,
  getAllProducts,
  getAllOrders,
  getAllMachinery,
  getAllTransport,
  getAllPayments,
} = require('../controllers/adminController');
const { protect, authorizeRoles } = require('../middleware/auth');

router.get('/stats', protect, authorizeRoles('admin'), getPlatformStats);
router.get('/users', protect, authorizeRoles('admin'), getAllUsers);
router.patch('/users/:id/status', protect, authorizeRoles('admin'), updateUserStatus);
router.get('/products', protect, authorizeRoles('admin'), getAllProducts);
router.get('/orders', protect, authorizeRoles('admin'), getAllOrders);
router.get('/machinery', protect, authorizeRoles('admin'), getAllMachinery);
router.get('/transport', protect, authorizeRoles('admin'), getAllTransport);
router.get('/payments', protect, authorizeRoles('admin'), getAllPayments);
router.get('/reports', protect, authorizeRoles('admin'), getReports);
router.patch('/reports/:id', protect, authorizeRoles('admin'), updateReport);
router.post('/reports', protect, submitReport);

module.exports = router;

