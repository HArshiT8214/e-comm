const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// We no longer need the 'path' module
// const path = require('path'); 

// const { testConnection } = require('./config/database'); // Commented out to prevent startup crashes
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const reviewRoutes = require('./routes/reviews');
const supportRoutes = require('./routes/support');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3001; 

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, 
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});
app.use(limiter);

// ❌ REMOVED: app.use(express.static('public'));
// Vercel's vercel.json handles static file serving, not this file.

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'HP Printer Shop API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
// Vercel routes '/api/...' to this file, and Express handles the sub-path
app.use('/auth', authRoutes);
app.use('/products', productRoutes);
app.use('/cart', cartRoutes);
app.use('/orders', orderRoutes);
app.use('/reviews', reviewRoutes);
app.use('/support', supportRoutes);
app.use('/admin', adminRoutes);

// ❌ REMOVED: app.get('*', ...)
// Vercel's vercel.json handles the SPA fallback, not this file.

// 404 handler
// This will now correctly catch API routes that don't exist
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});


// Error handling middleware
app.use(errorHandler);

// ---------------------------------------------------------------------------------
// CRITICAL CHANGE: Export the Express app instance for Vercel Serverless execution.
// ---------------------------------------------------------------------------------
module.exports = app;