const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path'); // 💡 ADDED: Required for serving static files correctly
require('dotenv').config();

const { testConnection } = require('./config/database');
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

// ---------------------------------------------------------------------
// 💡 CRITICAL FIX: STATIC FILE SERVING 
// This must run before API routes to correctly serve frontend assets (manifest.json, etc.).
// Assuming your frontend build output is located in a directory named 'public'.
// ---------------------------------------------------------------------
app.use(express.static('public')); 

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

// ---------------------------------------------------------------------
// 💡 SPA FALLBACK: Catch-all route for client-side routing
// This sends the main index.html file for any route not matched by express.static 
// or the API routes, allowing the frontend router (e.g., React Router) to take over.
// ---------------------------------------------------------------------
app.get('*', (req, res, next) => {
  // If the request is trying to reach an API path, let it continue to the 404 handler below
  if (req.originalUrl.startsWith('/api') || req.originalUrl === '/health') {
    return next(); 
  }
  
  // Otherwise, serve the main index.html file
  // Assumes 'index.html' is in the 'public' directory
  res.sendFile(path.resolve(__dirname, 'public', 'index.html')); 
});


// 404 handler
// This now primarily catches unhandled API routes (i.e., paths starting with /api that don't exist)
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

// ---------------------------------------------------------------------------------
// Keep the database connection test running outside the Express flow if necessary
// testConnection(); // Uncomment if you need to run the test