// Vercel serverless function entry point
// This file imports and exports the Express app from backend/src/index.js

const app = require('../backend/src/index.js');

module.exports = app;

