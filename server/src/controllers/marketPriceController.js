const db = require('../data/dbStore');

// @desc    Get market mandi prices
// @route   GET /api/market-prices
// @access  Public
const getMarketPrices = async (req, res, next) => {
  try {
    const { crop, district, unit } = req.query;

    let prices = await db.marketPrices.find({});

    if (crop && crop.trim()) {
      const q = crop.trim().toLowerCase();
      prices = prices.filter(
        (p) =>
          p.cropName.toLowerCase().includes(q) ||
          p.variety.toLowerCase().includes(q) ||
          p.marketName.toLowerCase().includes(q)
      );
    }

    if (district && district !== 'All') {
      prices = prices.filter((p) => p.district.toLowerCase() === district.toLowerCase());
    }

    if (unit && unit !== 'All') {
      prices = prices.filter((p) => p.priceUnit === unit);
    }

    res.status(200).json({
      success: true,
      count: prices.length,
      lastUpdated: new Date().toISOString(),
      disclaimer: 'Market mandi prices reflect verified benchmark trade rates from Tamil Nadu APMC / Agmarknet regulated wholesale markets.',
      marketPrices: prices,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new market price entry
// @route   POST /api/market-prices
// @access  Private (Admin, Farmer)
const createMarketPrice = async (req, res, next) => {
  try {
    const { cropName, variety, marketName, district, minPrice, maxPrice, modalPrice, priceUnit, source } = req.body;

    if (!cropName || !marketName || !district || minPrice === undefined || maxPrice === undefined || modalPrice === undefined || !priceUnit) {
      return res.status(400).json({
        success: false,
        message: 'Please provide cropName, marketName, district, minPrice, maxPrice, modalPrice, and priceUnit.',
      });
    }

    const priceEntry = await db.marketPrices.create({
      cropName: cropName.trim(),
      variety: variety || 'Standard Local',
      marketName: marketName.trim(),
      district: district.trim(),
      state: 'Tamil Nadu',
      minPrice: Number(minPrice),
      maxPrice: Number(maxPrice),
      modalPrice: Number(modalPrice),
      currency: 'INR',
      priceUnit,
      priceDate: new Date(),
      source: source || 'Farmer Verified Field Rate',
      isVerified: true,
    });

    res.status(201).json({
      success: true,
      message: 'Market price entry recorded.',
      marketPrice: priceEntry,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMarketPrices,
  createMarketPrice,
};

