// backend/src/index.js

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Load environment variables
require('dotenv').config();

// Import middleware & routes
const errorHandler = require('./middleware/errorHandler.js');
const authRoutes = require('./routes/auth.js');
const productRoutes = require('./routes/products.js');
const cartRoutes = require('./routes/cart.js');
const orderRoutes = require('./routes/orders.js');
const reviewRoutes = require('./routes/reviews.js');
const supportRoutes = require('./routes/support.js');
const adminRoutes = require('./routes/admin.js');

// Initialize app
const app = express();

// Trust proxy (required for Render, Vercel, and other platforms behind reverse proxy)
// This fixes the express-rate-limit X-Forwarded-For warning
app.set('trust proxy', true);

// ----------- DEBUG ROUTES (KEEP ABOVE 404 HANDLER) -----------
app.get('/', (req, res) => res.send('Backend root is live ✅'));
app.get('/products/debug', (req, res) => res.send('Products route active ✅'));

// Security Middleware
app.use(helmet());

// CORS (Important for Vercel + React)
// Allow both production and preview deployment URLs
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.CORS_ORIGIN,
  "https://hp-printer-ecommerce.vercel.app",
  // Allow all Vercel preview deployments
  /^https:\/\/hp-printer-ecommerce.*\.vercel\.app$/,
  /^https:\/\/.*-harshits-projects-.*\.vercel\.app$/,
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // Check if origin matches any allowed pattern
      const isAllowed = allowedOrigins.some(allowedOrigin => {
        if (!allowedOrigin) return false;
        if (typeof allowedOrigin === 'string') {
          return origin === allowedOrigin;
        }
        if (allowedOrigin instanceof RegExp) {
          return allowedOrigin.test(origin);
        }
        return false;
      });
      
      if (isAllowed) {
        callback(null, true);
      } else {
        // In development, allow localhost
        if (process.env.NODE_ENV !== 'production' && origin.includes('localhost')) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      }
    },
    credentials: true,
  })
);

// Rate Limiter
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { success: false, message: "Too many requests. Try again later." },
  })
);

// Body Parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ------------ HEALTH CHECK ------------
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: "HP Printer Shop API running",
    timestamp: new Date().toISOString(),
  });
});

// ------------ MAIN API ROUTES (IMPORTANT!) ------------
app.use('/auth', authRoutes);
app.use('/products', productRoutes);
app.use('/cart', cartRoutes);
app.use('/orders', orderRoutes);
app.use('/reviews', reviewRoutes);
app.use('/support', supportRoutes);
app.use('/admin', adminRoutes);

// ------------ 404 HANDLER (KEEP LAST ALWAYS) ------------
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
});

// ------------ GLOBAL ERROR HANDLER ------------
app.use(errorHandler);

// Export for Vercel Serverless
module.exports = app;

// Optional: run locally if not serverless
if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
}
