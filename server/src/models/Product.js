const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    images: {
      type: [String],
      default: [],
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sellerName: {
      type: String,
      required: true,
    },
    sellerRole: {
      type: String,
      enum: ['farmer', 'supplier'],
      default: 'farmer',
    },
    sellerPhone: {
      type: String,
      default: '',
    },
    // Financial and unit pricing - separate price unit from quantity unit!
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    currency: {
      type: String,
      default: 'INR',
      immutable: true,
    },
    priceUnit: {
      type: String,
      required: [true, 'Price unit is required (e.g. kg, quintal, bag, pack)'],
      trim: true,
    },
    availableQuantity: {
      type: Number,
      required: [true, 'Available quantity is required'],
      min: [0, 'Quantity cannot be negative'],
    },
    quantityUnit: {
      type: String,
      required: [true, 'Quantity unit is required (e.g. kg, quintal, bag, pack)'],
      trim: true,
    },
    minOrderQuantity: {
      type: Number,
      default: 1,
      min: [0.1, 'Minimum order quantity must be positive'],
    },
    location: {
      state: { type: String, default: 'Tamil Nadu' },
      district: { type: String, default: 'Coimbatore' },
      villageOrTaluk: { type: String, default: '' },
    },
    safetyInstructions: {
      type: String,
      default: '', // Required/recommended for chemical inputs (fertilizers/pesticides)
    },
    stockStatus: {
      type: String,
      enum: ['in_stock', 'low_stock', 'out_of_stock'],
      default: 'in_stock',
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Auto update stock status before save
productSchema.pre('save', function (next) {
  if (this.availableQuantity <= 0) {
    this.stockStatus = 'out_of_stock';
  } else if (this.availableQuantity <= 5) {
    this.stockStatus = 'low_stock';
  } else {
    this.stockStatus = 'in_stock';
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);

