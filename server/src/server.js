const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const upload = require('./middleware/upload');
const { protect } = require('./middleware/auth');

// Route files
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const machineryRoutes = require('./routes/machineryRoutes');
const transportRoutes = require('./routes/transportRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const marketPriceRoutes = require('./routes/marketPriceRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Initialize database
connectDB();

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads folder
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Image upload route
app.post('/api/upload', protect, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please select an image file to upload.' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.status(200).json({
    success: true,
    url: fileUrl,
    filename: req.file.filename,
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/machinery', machineryRoutes);
app.use('/api/transport', transportRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/market-prices', marketPriceRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Gen Baazar Agricultural Marketplace API is running smoothly.',
    currency: 'INR (₹)',
    timestamp: new Date().toISOString(),
  });
});

// Centralized error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[Gen Baazar Server] Running on http://localhost:${PORT}`);
  });
}

module.exports = app;

