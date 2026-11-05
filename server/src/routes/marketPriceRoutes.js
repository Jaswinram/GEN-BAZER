const express = require('express');
const router = express.Router();
const {
  getMarketPrices,
  createMarketPrice,
} = require('../controllers/marketPriceController');
const { protect, authorizeRoles } = require('../middleware/auth');

router.get('/', getMarketPrices);
router.post('/', protect, authorizeRoles('farmer', 'admin'), createMarketPrice);

module.exports = router;

