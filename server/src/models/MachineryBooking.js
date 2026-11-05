const mongoose = require('mongoose');

const machineryBookingSchema = new mongoose.Schema(
  {
    machineryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MachineryListing',
      required: true,
    },
    machineryTitle: {
      type: String,
      required: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    renterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    renterName: {
      type: String,
      required: true,
    },
    renterPhone: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    durationUnits: {
      type: Number,
      required: true,
      min: [1, 'Duration units must be at least 1'],
    },
    unitType: {
      type: String,
      enum: ['hour', 'day', 'acre', 'hectare', 'trip', 'custom_quotation'],
      required: true,
    },
    unitPrice: {
      type: Number,
      required: true,
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
    bookingLocation: {
      state: { type: String, default: 'Tamil Nadu' },
      district: { type: String, default: 'Coimbatore' },
      address: { type: String, default: '' },
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
      default: 'pending',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MachineryBooking', machineryBookingSchema);

