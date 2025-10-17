const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const adminService = require('../services/adminService');
const inventoryService = require('../services/inventoryService');

// Apply authentication and admin role requirement to all admin routes
router.use(authenticateToken);
router.use(requireRole(['admin']));

// Admin dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    const stats = await adminService.getDashboardStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats',
      error: error.message
    });
  }
});

// Printer Management Routes
// Get all printers with pagination and filters
router.get('/printers', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, category } = req.query;
    const filters = { search, category };
    const printers = await adminService.getPrinters(parseInt(page), parseInt(limit), filters);
    
    res.json({
      success: true,
      data: printers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch printers',
      error: error.message
    });
  }
});

// Get single printer details
router.get('/printers/:id', async (req, res) => {
  try {
    const printer = await adminService.getPrinterById(req.params.id);
    
    if (!printer) {
      return res.status(404).json({
        success: false,
        message: 'Printer not found'
      });
    }
    
    res.json({
      success: true,
      data: printer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch printer details',
      error: error.message
    });
  }
});

// Create new printer
router.post('/printers', [
  body('name').notEmpty().withMessage('Printer name is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('category_id').isInt().withMessage('Valid category ID is required'),
  body('price').isDecimal().withMessage('Valid price is required'),
  body('stock_quantity').isInt().withMessage('Valid stock quantity is required'),
  body('sku').notEmpty().withMessage('SKU is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const printer = await adminService.createPrinter(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Printer created successfully',
      data: printer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create printer',
      error: error.message
    });
  }
});

// Update printer
router.put('/printers/:id', [
  body('name').optional().notEmpty().withMessage('Printer name cannot be empty'),
  body('description').optional().notEmpty().withMessage('Description cannot be empty'),
  body('category_id').optional().isInt().withMessage('Valid category ID is required'),
  body('price').optional().isDecimal().withMessage('Valid price is required'),
  body('stock_quantity').optional().isInt().withMessage('Valid stock quantity is required'),
  body('sku').optional().notEmpty().withMessage('SKU cannot be empty')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const printer = await adminService.updatePrinter(req.params.id, req.body);
    
    if (!printer) {
      return res.status(404).json({
        success: false,
        message: 'Printer not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Printer updated successfully',
      data: printer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update printer',
      error: error.message
    });
  }
});

// Delete printer
router.delete('/printers/:id', async (req, res) => {
  try {
    const deleted = await adminService.deletePrinter(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Printer not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Printer deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete printer',
      error: error.message
    });
  }
});

// Inventory Management Routes
// Get inventory overview
router.get('/inventory', async (req, res) => {
  try {
    const { page = 1, limit = 10, lowStock, search } = req.query;
    const filters = { lowStock: lowStock === 'true', search };
    const inventory = await inventoryService.getInventoryOverview(parseInt(page), parseInt(limit), filters);
    
    res.json({
      success: true,
      data: inventory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory',
      error: error.message
    });
  }
});

// Update stock quantity
router.put('/inventory/:productId', [
  body('quantity').isInt().withMessage('Valid quantity is required'),
  body('reason').isIn(['restock', 'adjustment', 'return', 'refund']).withMessage('Valid reason is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { quantity, reason } = req.body;
    const result = await inventoryService.updateStock(req.params.productId, quantity, reason, req.user.user_id);
    
    res.json({
      success: true,
      message: 'Stock updated successfully',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update stock',
      error: error.message
    });
  }
});

// Get inventory movements/history
router.get('/inventory/:productId/movements', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const movements = await inventoryService.getInventoryMovements(req.params.productId, parseInt(page), parseInt(limit));
    
    res.json({
      success: true,
      data: movements
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory movements',
      error: error.message
    });
  }
});

// Categories management
router.get('/categories', async (req, res) => {
  try {
    const categories = await adminService.getCategories();
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
});

// Create category
router.post('/categories', [
  body('name').notEmpty().withMessage('Category name is required'),
  body('parent_id').optional().isInt().withMessage('Valid parent ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const category = await adminService.createCategory(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create category',
      error: error.message
    });
  }
});

module.exports = router;
