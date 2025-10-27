const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { testConnection } = require('./src/config/database');
const errorHandler = require('./src/middleware/errorHandler');

// Import routes
const authRoutes = require('./src/routes/auth');
const productRoutes = require('./src/routes/products');
const cartRoutes = require('./src/routes/cart');
const orderRoutes = require('./src/routes/orders');
const reviewRoutes = require('./src/routes/reviews');
const supportRoutes = require('./src/routes/support');
const adminRoutes = require('./src/routes/admin');

const app = express();
const PORT = process.env.PORT || 3001; // Kept for local testing, but ignored by Vercel

// Security middleware
app.use(helmet());

// CORS configuration (Note: This is technically unnecessary when proxying within Vercel, 
// but is good practice for local testing and external services.)
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});
app.use(limiter);

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
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});


// Error handling middleware
app.use(errorHandler);

// ---------------------------------------------------------------------------------
// ⚠️ CRITICAL CHANGE: Export the Express app instance for Vercel Serverless execution.
// ---------------------------------------------------------------------------------

// The original startServer() and app.listen() block has been removed as Vercel handles 
// starting the server. Only the export is needed.
module.exports = app;

// ---------------------------------------------------------------------------------

// Keep the database connection test running outside the Express flow if necessary, 
// but ensure it doesn't block the export. For simplicity, the remaining process 
// handlers have been omitted as Vercel handles these automatically.