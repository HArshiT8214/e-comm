const { body, param, query, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// User validation rules
const validateUserRegistration = [
  body('firstName').trim().isLength({ min: 2, max: 100 }).withMessage('First name must be 2-100 characters'),
  body('lastName').trim().isLength({ min: 2, max: 100 }).withMessage('Last name must be 2-100 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number required'),
  handleValidationErrors
];

const validateUserLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
  handleValidationErrors
];

const validatePasswordReset = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  handleValidationErrors
];

const validatePasswordUpdate = [
  body('currentPassword').notEmpty().withMessage('Current password required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  handleValidationErrors
];

// Product validation rules
const validateProduct = [
  body('name').trim().isLength({ min: 2, max: 200 }).withMessage('Product name must be 2-200 characters'),
  body('description').optional().isLength({ max: 1000 }).withMessage('Description too long'),
  body('categoryId').isInt({ min: 1 }).withMessage('Valid category ID required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('stockQuantity').isInt({ min: 0 }).withMessage('Stock quantity must be non-negative'),
  body('sku').trim().isLength({ min: 3, max: 50 }).withMessage('SKU must be 3-50 characters'),
  handleValidationErrors
];

const validateProductId = [
  param('id').isInt({ min: 1 }).withMessage('Valid product ID required'),
  handleValidationErrors
];

// Cart validation rules
const validateCartItem = [
  body('productId').isInt({ min: 1 }).withMessage('Valid product ID required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  handleValidationErrors
];

// Order validation rules
const validateOrder = [
  body('shippingAddressId').isInt({ min: 1 }).withMessage('Valid shipping address required'),
  body('billingAddressId').isInt({ min: 1 }).withMessage('Valid billing address required'),
  body('paymentMethod').isIn(['credit_card', 'upi', 'paypal', 'cod']).withMessage('Valid payment method required'),
  handleValidationErrors
];

// Review validation rules
const validateReview = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().isLength({ max: 1000 }).withMessage('Comment too long'),
  handleValidationErrors
];

// Support ticket validation rules
const validateSupportTicket = [
  body('subject').trim().isLength({ min: 5, max: 200 }).withMessage('Subject must be 5-200 characters'),
  body('description').trim().isLength({ min: 10, max: 2000 }).withMessage('Description must be 10-2000 characters'),
  handleValidationErrors
];

// Pagination validation
const validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validatePasswordReset,
  validatePasswordUpdate,
  validateProduct,
  validateProductId,
  validateCartItem,
  validateOrder,
  validateReview,
  validateSupportTicket,
  validatePagination
};
