const express = require('express');
const router = express.Router();
const reviewService = require('../services/reviewService');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validateReview, validateProductId, validatePagination } = require('../middleware/validation');

// Add review
router.post('/:productId', authenticateToken, validateProductId, validateReview, async (req, res) => {
  try {
    const result = await reviewService.addReview(req.user.user_id, req.params.productId, req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get product reviews
router.get('/product/:productId', validateProductId, validatePagination, async (req, res) => {
  try {
    const result = await reviewService.getProductReviews(req.params.productId, req.query);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get product review statistics
router.get('/product/:productId/stats', validateProductId, async (req, res) => {
  try {
    const result = await reviewService.getProductReviewStats(req.params.productId);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get user reviews
router.get('/user/my-reviews', authenticateToken, validatePagination, async (req, res) => {
  try {
    const result = await reviewService.getUserReviews(req.user.user_id, req.query);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update review
router.put('/:reviewId', authenticateToken, validateReview, async (req, res) => {
  try {
    const result = await reviewService.updateReview(req.user.user_id, req.params.reviewId, req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Delete review
router.delete('/:reviewId', authenticateToken, async (req, res) => {
  try {
    const result = await reviewService.deleteReview(req.user.user_id, req.params.reviewId);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Admin routes
// Get recent reviews
router.get('/admin/recent', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const result = await reviewService.getRecentReviews(limit);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
