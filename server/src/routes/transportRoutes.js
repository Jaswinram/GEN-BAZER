const express = require('express');
const router = express.Router();
const {
  getTransportListings,
  getTransportById,
  createTransportListing,
  requestTransport,
  getMyRequests,
  getProviderRequests,
  updateRequestStatus,
} = require('../controllers/transportController');
const { protect, authorizeRoles } = require('../middleware/auth');

router.get('/', getTransportListings);
router.get('/requests/my', protect, getMyRequests);
router.get('/requests/provider', protect, authorizeRoles('transport_provider', 'admin'), getProviderRequests);
router.get('/:id', getTransportById);
router.post('/', protect, authorizeRoles('transport_provider', 'admin'), createTransportListing);
router.post('/:id/request', protect, requestTransport);
router.patch('/requests/:id', protect, updateRequestStatus);

module.exports = router;

