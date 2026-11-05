const mongoose = require('mongoose');

const transportListingSchema = new mongoose.Schema(
  {
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    providerName: {
      type: String,
      required: true,
    },
    providerPhone: {
      type: String,
      default: '',
    },
    vehicleName: {
      type: String,
      required: [true, 'Vehicle name/model is required'],
      trim: true,
    },
    vehicleType: {
      type: String,
      enum: [
        'bike',
        'moped_carrier',
        'electric_scooter',
        'auto_rickshaw',
        'electric_auto',
        'mini_three_wheeler',
        'mini_pickup',
        'cargo_bike',
        'mini_truck',
        'pickup',
        'tractor_trolley'
      ],
      required: [true, 'Vehicle type is required'],
    },
    vehicleNumber: {
      type: String,
      required: [true, 'Vehicle registration number is required'],
      trim: true,
    },
    carryingCapacityKg: {
      type: Number,
      required: [true, 'Verified carrying capacity in kg is required'],
      min: 1,
    },
    carryingCapacityTonnes: {
      type: Number,
      default: function() {
        return (this.carryingCapacityKg || 0) / 1000;
      },
    },
    pricingModel: {
      type: String,
      enum: ['per_trip', 'per_km', 'custom_quotation', 'per_tonne', 'per_vehicle'],
      required: true,
    },
    baseRate: {
      type: Number,
      required: true,
      min: 0,
    },
    additionalCharges: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: 'INR',
      immutable: true,
    },
    pickupLocation: {
      state: { type: String, default: 'Tamil Nadu' },
      district: { type: String, default: 'Coimbatore' },
      town: { type: String, default: '' },
    },
    serviceAreas: {
      type: [String],
      default: ['Coimbatore', 'Tiruppur', 'Erode', 'Salem'],
    },
    images: {
      type: [String],
      default: [],
    },
    availabilityStatus: {
      type: String,
      enum: ['available', 'busy', 'offline'],
      default: 'available',
    },
    description: {
      type: String,
      default: '',
    },
    goodsPermitVerified: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TransportListing', transportListingSchema);


