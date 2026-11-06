const express = require('express');
const router = express.Router();
const {
  getPlatformStats,
  getPlatformAnalytics,
  getAllUsers,
  updateUserStatus,
  getAllProducts,
  updateProductStatus,
  deleteProductByAdmin,
  getAllMachinery,
  updateMachineryStatus,
  deleteMachineryByAdmin,
  getAllTransport,
  updateTransportStatus,
  getAllOrders,
  getAllBookings,
  getAllPayments,
  getPlatformActivity,
  getReports,
  updateReport,
  submitReport,
} = require('../controllers/adminController');
const { protect, authorizeRoles } = require('../middleware/auth');

// Public/Private user report submission
router.post('/reports', protect, submitReport);

// All subsequent routes strictly require authenticated administrator credentials
router.use(protect);
router.use(authorizeRoles('admin'));

// Core Analytics & Stats
router.get('/stats', getPlatformStats);
router.get('/analytics', getPlatformAnalytics);
router.get('/activity', getPlatformActivity);

// User Management
router.get('/users', getAllUsers);
router.patch('/users/:id/status', updateUserStatus);

// Product Management
router.get('/products', getAllProducts);
router.patch('/products/:id/status', updateProductStatus);
router.delete('/products/:id', deleteProductByAdmin);

// Machinery Management
router.get('/machinery', getAllMachinery);
router.patch('/machinery/:id/status', updateMachineryStatus);
router.delete('/machinery/:id', deleteMachineryByAdmin);

// Transport Management
router.get('/transport', getAllTransport);
router.patch('/transport/:id/status', updateTransportStatus);

// Orders & Financials
router.get('/orders', getAllOrders);
router.get('/bookings', getAllBookings);
router.get('/payments', getAllPayments);

// Complaints & Moderation
router.get('/reports', getReports);
router.patch('/reports/:id', updateReport);

module.exports = router;
