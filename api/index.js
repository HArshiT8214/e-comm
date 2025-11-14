// Vercel serverless function entry point
// This file imports and exports the Express app from backend/src/index.js

const app = require('../backend/src/index.js');

// Export the Express app directly - Vercel handles the serverless function wrapper
// Vercel automatically strips the /api prefix from req.url
// So /api/products becomes /products in the Express app
module.exports = app;


