const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// ✅ --- DEBUG LOG 1 ---
console.log('SERVER-SIDE: Function initializing... Loading dependencies.');

try {
  // ✅ --- DEBUG LOG 2 ---
  console.log('SERVER-SIDE: Loading dotenv...');
  require('dotenv').config();

  // ✅ --- DEBUG LOG 3 ---
  console.log('SERVER-SIDE: Loading errorHandler...');
  const errorHandler = require('./middleware/errorHandler');

  // ✅ --- DEBUG LOG 4 ---
  console.log('SERVER-SIDE: Loading auth routes...');
  const authRoutes = require('./routes/auth');

  // ✅ --- DEBUG LOG 5 ---
  console.log('SERVER-SIDE: Loading product routes...');
  const productRoutes = require('./routes/products');

  // ✅ --- DEBUG LOG 6 ---
  console.log('SERVER-SIDE: Loading cart routes...');
  const cartRoutes = require('./routes/cart');

  // ✅ --- DEBUG LOG 7 ---
  console.log('SERVER-SIDE: Loading order routes...');
  const orderRoutes = require('./routes/orders');

  // ✅ --- DEBUG LOG 8 ---
  console.log('SERVER-SIDE: Loading review routes...');
  const reviewRoutes = require('./routes/reviews');

  // ✅ --- DEBUG LOG 9 ---
  console.log('SERVER-SIDE: Loading support routes...');
  const supportRoutes = require('./routes/support');

  // ✅ --- DEBUG LOG 10 ---
  console.log('SERVER-SIDE: Loading admin routes...');
  const adminRoutes = require('./routes/admin');

  // ✅ --- DEBUG LOG 11 ---
  console.log('SERVER-SIDE: All modules loaded. Configuring Express app...');
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

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      success: true,
      message: 'HP Printer Shop API is running',
      timestamp: new Date().toISOString()
    });
  });

  // API routes
  app.use('/auth', authRoutes);
  app.use('/products', productRoutes);
  app.use('/cart', cartRoutes);
  app.use('/orders', orderRoutes);
  app.use('/reviews', reviewRoutes);
  app.use('/support', supportRoutes);
  app.use('/admin', adminRoutes);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: 'API endpoint not found'
    });
  });

  // Error handling middleware
  app.use(errorHandler);

  // ✅ --- DEBUG LOG 12 ---
  console.log('SERVER-SIDE: Express app configured. Exporting handler.');

  module.exports = app;

} catch (error) {
  // ✅ --- DEBUG LOG 13 (CRITICAL) ---
  // If the crash happens during initialization, this will log it.
  console.error('SERVER-SIDE: CRASH DURING INITIALIZATION ❌');
  console.error(error);
  
  // Re-throw to ensure Vercel knows the function failed
  throw error;
}