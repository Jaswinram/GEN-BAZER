const mongoose = require('mongoose');

const machineryListingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Machinery title is required'],
      trim: true,
    },
    machineryType: {
      type: String,
      enum: [
        'tractor',
        'rotavator',
        'cultivator',
        'power_tiller',
        'combine_harvester',
        'paddy_transplanter',
        'seed_drill',
        'sprayer',
        'thresher',
        'water_pump',
        'tractor_trailer',
        'brush_cutter',
        'harvester',
        'ploughing_equipment',
        'other',
      ],
      required: [true, 'Machinery type is required'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ownerName: {
      type: String,
      required: true,
    },
    ownerPhone: {
      type: String,
      default: '',
    },
    rentalPrice: {
      type: Number,
      required: [true, 'Rental price is required'],
      min: [0, 'Rental price must be positive'],
    },
    currency: {
      type: String,
      default: 'INR',
      immutable: true,
    },
    rentalUnit: {
      type: String,
      enum: ['hour', 'day', 'acre', 'hectare', 'trip', 'custom_quotation'],
      required: [true, 'Rental pricing unit is required'],
    },
    specifications: {
      horsepower: { type: String, default: '' },
      fuelType: { type: String, default: 'Diesel' },
      modelYear: { type: String, default: '' },
      attachments: { type: [String], default: [] },
    },
    location: {
      state: { type: String, default: 'Tamil Nadu' },
      district: { type: String, default: 'Coimbatore' },
      town: { type: String, default: '' },
    },
    images: {
      type: [String],
      default: [],
    },
    availabilityStatus: {
      type: String,
      enum: ['available', 'booked', 'maintenance'],
      default: 'available',
    },
    bookingRules: {
      type: String,
      default: 'Operator included with diesel fuel costs borne by renter as agreed.',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MachineryListing', machineryListingSchema);

