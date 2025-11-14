// Vercel serverless function entry point
// This file imports and exports the Express app from backend/src/index.js

const app = require('../backend/src/index.js');

// Vercel serverless function handler
// When Vercel routes /api/* to this function, it may pass the path in different ways
// We need to extract the actual route path and strip the /api prefix
module.exports = (req, res) => {
  // Vercel passes the path in req.url
  // For /api/products, req.url might be "/products" (already stripped) or "/api/products"
  // We need to handle both cases
  
  let path = req.url || '/';
  
  // If path still has /api prefix, strip it
  if (path.startsWith('/api')) {
    path = path.replace(/^\/api\/?/, '') || '/';
  }
  
  // Handle empty path
  if (!path || path === '') {
    path = '/';
  }
  
  // Ensure path starts with /
  if (!path.startsWith('/')) {
    path = '/' + path;
  }
  
  // Normalize path (remove double slashes)
  path = path.replace(/\/+/g, '/');
  
  // Update request object with cleaned path
  req.url = path;
  req.path = path;
  
  // Update originalUrl if it exists
  if (req.originalUrl) {
    if (req.originalUrl.startsWith('/api')) {
      req.originalUrl = req.originalUrl.replace(/^\/api\/?/, '') || '/';
    }
  } else {
    req.originalUrl = path;
  }
  
  req.baseUrl = '';
  
  // Pass to Express app
  return app(req, res);
};


