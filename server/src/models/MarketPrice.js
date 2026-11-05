const mongoose = require('mongoose');

const marketPriceSchema = new mongoose.Schema(
  {
    cropName: {
      type: String,
      required: true,
      trim: true,
    },
    variety: {
      type: String,
      default: 'Common',
    },
    marketName: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      default: 'Tamil Nadu',
    },
    district: {
      type: String,
      required: true,
    },
    minPrice: {
      type: Number,
      required: true,
    },
    maxPrice: {
      type: Number,
      required: true,
    },
    modalPrice: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
      immutable: true,
    },
    priceUnit: {
      type: String,
      enum: ['kg', 'quintal'],
      required: true,
    },
    priceDate: {
      type: Date,
      default: Date.now,
    },
    source: {
      type: String,
      default: 'Tamil Nadu Agri Marketing & Agmarknet (Simulated Live Feed)',
    },
    isVerified: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MarketPrice', marketPriceSchema);

