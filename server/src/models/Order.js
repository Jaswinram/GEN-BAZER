const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    price: {
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
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0.1,
    },
    quantityUnit: {
      type: String,
      required: true,
    },
    subtotal: {
      type: Number,
      required: true,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sellerName: {
      type: String,
      default: '',
    },
    image: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderReference: {
      type: String,
      required: true,
      unique: true,
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    buyerName: {
      type: String,
      required: true,
    },
    buyerEmail: {
      type: String,
      required: true,
    },
    buyerPhone: {
      type: String,
      required: true,
    },
    items: [orderItemSchema],
    subtotalAmount: {
      type: Number,
      required: true,
    },
    deliveryCharges: {
      type: Number,
      default: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
      immutable: true,
    },
    deliveryAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      addressLine: { type: String, required: true },
      district: { type: String, required: true },
      state: { type: String, default: 'Tamil Nadu' },
      pincode: { type: String, required: true },
    },
    orderStatus: {
      type: String,
      enum: ['pending', 'accepted', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'pending', 'successful', 'failed', 'refunded'],
      default: 'unpaid',
    },
    paymentMethod: {
      type: String,
      enum: ['online_development', 'cash_on_delivery', 'mock_gateway'],
      default: 'online_development',
    },
    paymentReference: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);

