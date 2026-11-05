const mongoose = require('mongoose');

const transportBookingSchema = new mongoose.Schema(
  {
    transportListingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TransportListing',
      required: true,
    },
    vehicleName: {
      type: String,
      default: '',
    },
    vehicleNumber: {
      type: String,
      default: '',
    },
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    providerName: {
      type: String,
      default: '',
    },
    providerPhone: {
      type: String,
      default: '',
    },
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    requesterName: {
      type: String,
      required: true,
    },
    requesterPhone: {
      type: String,
      required: true,
    },
    pickupAddress: {
      type: String,
      required: true,
    },
    deliveryAddress: {
      type: String,
      required: true,
    },
    cargoType: {
      type: String,
      required: true,
    },
    cargoWeightKg: {
      type: Number,
      required: true,
    },
    cargoWeightTonnes: {
      type: Number,
      default: function() {
        return (this.cargoWeightKg || 0) / 1000;
      },
    },
    pickupTime: {
      type: String,
      default: '',
    },
    specialInstructions: {
      type: String,
      default: '',
    },
    pricingModel: {
      type: String,
      required: true,
    },
    vehicleCharge: {
      type: Number,
      default: 0,
    },
    additionalCharges: {
      type: Number,
      default: 0,
    },
    isQuotationRequired: {
      type: Boolean,
      default: false,
    },
    estimatedOrQuotedPrice: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: 'INR',
      immutable: true,
    },
    status: {
      type: String,
      enum: [
        'pending',
        'accepted',
        'driver_assigned',
        'pickup_completed',
        'in_transit',
        'delivered',
        'cancelled',
        'quoted',
        'rejected'
      ],
      default: 'pending',
    },
    driverInfo: {
      name: { type: String, default: '' },
      phone: { type: String, default: '' },
    },
    providerNotes: {
      type: String,
      default: '',
    },
    scheduledDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TransportBooking', transportBookingSchema);


