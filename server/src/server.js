const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
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

// 1. Security Headers via Helmet
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// 2. Safe & Configurable CORS
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5000'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(new Error('Blocked by CORS security policy.'));
      }
    },
    credentials: true,
  })
);

// 3. Rate Limiting (Brute-Force & Denial-of-Service Protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15-minute window
  max: 30, // Max 30 attempts per 15 mins per IP
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  message: {
    success: false,
    message: 'Rate limit exceeded. Please throttle request frequency.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', apiLimiter);

// 4. Body parsers with safe request size bounds
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Static uploads folder
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Image upload route with strict file checking
app.post('/api/upload', protect, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please select a valid image file (JPG, PNG, WEBP) to upload.' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.status(200).json({
    success: true,
    url: fileUrl,
    filename: req.file.filename,
  });
});

// Mount Routes with specialized rate limiting on authentication
app.use('/api/auth', authLimiter, authRoutes);
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

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[Gen Baazar Server] Running on http://localhost:${PORT}`);
  });
}

module.exports = app;

