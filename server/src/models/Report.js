const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reporterName: {
      type: String,
      required: true,
    },
    targetType: {
      type: String,
      enum: ['product', 'machinery', 'transport', 'user'],
      required: true,
    },
    targetId: {
      type: String,
      required: true,
    },
    targetTitle: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    details: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['open', 'investigating', 'resolved', 'dismissed'],
      default: 'open',
    },
    adminNotes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Report', reportSchema);

