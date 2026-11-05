const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    paymentReference: {
      type: String,
      required: true,
      unique: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
      immutable: true,
    },
    status: {
      type: String,
      enum: ['unpaid', 'pending', 'successful', 'failed', 'refunded'],
      default: 'pending',
    },
    gateway: {
      type: String,
      default: 'mock_development_gateway',
    },
    mode: {
      type: String,
      default: 'development_safe_mode',
    },
    gatewayPaymentId: {
      type: String,
      default: '',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);

