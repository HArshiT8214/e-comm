// Vercel serverless function entry point
// This file imports and exports the Express app from backend/src/index.js

const app = require('../backend/src/index.js');

// Vercel serverless function handler
// Vercel automatically routes /api/* to this function
// We need to strip the /api prefix from the path so Express routes match correctly
module.exports = (req, res) => {
  // Get the original path from various possible locations
  let path = req.url || req.path || req.originalUrl || '/';
  
  // Vercel should strip /api automatically, but ensure it's stripped
  // Handle cases like: /api/products, /api/products/categories/list, etc.
  if (path.startsWith('/api')) {
    path = path.replace(/^\/api\/?/, '') || '/';
  }
  
  // Ensure path starts with / (handle empty string case)
  if (!path || path === '' || !path.startsWith('/')) {
    path = '/' + (path || '');
  }
  
  // Normalize the path (remove double slashes, etc.)
  path = path.replace(/\/+/g, '/');
  
  // Update all path-related properties on the request object
  req.url = path;
  req.path = path;
  req.originalUrl = req.originalUrl ? req.originalUrl.replace(/^\/api\/?/, '') || '/' : path;
  req.baseUrl = '';
  
  // Pass to Express app
  return app(req, res);
};


