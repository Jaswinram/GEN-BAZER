const mongoose = require('mongoose');
const dbStore = require('../data/dbStore');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gen_baazar';
  try {
    console.log(`[Gen Baazar DB] Attempting connection to MongoDB at: ${uri}`);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500,
    });
    console.log('[Gen Baazar DB] Connected successfully to MongoDB via Mongoose!');
  } catch (error) {
    console.warn(`[Gen Baazar DB] MongoDB connection could not be established (${error.message}).`);
    console.log('[Gen Baazar DB] Running in resilient embedded storage mode with seed data active.');
  }

  // Pre-seed storage
  await dbStore.initStore();
};

module.exports = connectDB;

