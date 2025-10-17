const express = require('express');
const router = express.Router();
const cartService = require('../services/cartService');
const { authenticateToken } = require('../middleware/auth');
const { validateCartItem } = require('../middleware/validation');

// Get cart items
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await cartService.getCartItems(req.user.user_id);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get cart count
router.get('/count', authenticateToken, async (req, res) => {
  try {
    const result = await cartService.getCartCount(req.user.user_id);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Add item to cart
router.post('/add', authenticateToken, validateCartItem, async (req, res) => {
  try {
    const result = await cartService.addToCart(req.user.user_id, req.body.productId, req.body.quantity);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Update cart item quantity
router.put('/items/:cartItemId', authenticateToken, async (req, res) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Valid quantity required'
      });
    }

    const result = await cartService.updateCartItem(req.user.user_id, req.params.cartItemId, quantity);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Remove item from cart
router.delete('/items/:cartItemId', authenticateToken, async (req, res) => {
  try {
    const result = await cartService.removeFromCart(req.user.user_id, req.params.cartItemId);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Clear cart
router.delete('/clear', authenticateToken, async (req, res) => {
  try {
    const result = await cartService.clearCart(req.user.user_id);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Validate cart before checkout
router.get('/validate', authenticateToken, async (req, res) => {
  try {
    const result = await cartService.validateCart(req.user.user_id);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
