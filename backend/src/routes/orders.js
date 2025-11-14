const express = require('express');
const router = express.Router();
const orderService = require('../services/orderService');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validateOrder, validatePagination } = require('../middleware/validation');

// Create order from cart
router.post('/', authenticateToken, validateOrder, async (req, res) => {
  try {
    const result = await orderService.createOrder(req.user.user_id, req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get user orders
router.get('/', authenticateToken, validatePagination, async (req, res) => {
  try {
    const result = await orderService.getUserOrders(req.user.user_id, req.query);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get order by ID
router.get('/:orderId', authenticateToken, async (req, res) => {
  try {
    const result = await orderService.getOrderById(req.params.orderId, req.user.user_id);
    res.json(result);
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
});

// Cancel order
router.put('/:orderId/cancel', authenticateToken, async (req, res) => {
  try {
    const result = await orderService.cancelOrder(req.params.orderId, req.user.user_id);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Admin routes
// Update order status
router.put('/:orderId/status', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const result = await orderService.updateOrderStatus(req.params.orderId, status, req.user.user_id);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get all orders (admin)
router.get('/admin/all', authenticateToken, requireRole(['admin']), validatePagination, async (req, res) => {
  try {
    const result = await orderService.getAllOrders(req.query);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get order statistics (admin)
router.get('/admin/statistics', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const result = await orderService.getOrderStatistics();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
