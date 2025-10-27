const crypto = require('crypto');

// Generate random token for password reset
const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Generate random SKU
const generateSKU = (prefix = 'HP') => {
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${random}`;
};

// Calculate pagination
const getPagination = (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  return { offset, limit };
};

// Format response
const formatResponse = (success, message, data = null, errors = null) => {
  const response = { success, message };
  if (data !== null) response.data = data;
  if (errors !== null) response.errors = errors;
  return response;
};

// Sanitize user input
const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return input.trim().replace(/[<>]/g, '');
  }
  return input;
};

// Calculate order totals
const calculateOrderTotals = (items, discountAmount = 0, shippingAmount = 0, taxRate = 0.08) => {
  const subtotal = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  const tax = subtotal * taxRate;
  const total = subtotal + tax + shippingAmount - discountAmount;
  
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    shipping: shippingAmount,
    discount: discountAmount,
    total: Math.round(total * 100) / 100
  };
};

// Generate tracking number
const generateTrackingNumber = () => {
  const prefix = 'HP';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${timestamp}${random}`;
};

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Format currency
const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

// Generate order number
const generateOrderNumber = () => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp.slice(-6)}${random}`;
};

module.exports = {
  generateResetToken,
  generateSKU,
  getPagination,
  formatResponse,
  sanitizeInput,
  calculateOrderTotals,
  generateTrackingNumber,
  isValidEmail,
  formatCurrency,
  generateOrderNumber
};
