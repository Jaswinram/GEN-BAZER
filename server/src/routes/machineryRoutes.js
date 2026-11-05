const express = require('express');
const router = express.Router();
const {
  getMachinery,
  getMachineryById,
  createMachinery,
  bookMachinery,
  getMyBookings,
  getOwnerBookings,
  updateBookingStatus,
} = require('../controllers/machineryController');
const { protect, authorizeRoles } = require('../middleware/auth');

router.get('/', getMachinery);
router.get('/bookings/my', protect, getMyBookings);
router.get('/bookings/owner', protect, authorizeRoles('machinery_owner', 'admin'), getOwnerBookings);
router.get('/:id', getMachineryById);
router.post('/', protect, authorizeRoles('machinery_owner', 'admin'), createMachinery);
router.post('/:id/book', protect, bookMachinery);
router.patch('/bookings/:id/status', protect, updateBookingStatus);

module.exports = router;

