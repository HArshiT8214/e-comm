// const express = require('express');
// const router = express.Router();
// const productService = require('../services/productService');
// const { authenticateToken, requireRole, optionalAuth } = require('../middleware/auth');
// const { validateProduct, validateProductId, validatePagination } = require('../middleware/validation');

// // Get all products with filters
// router.get('/', async (req, res) => {
//   try {
//     const { page, limit, sort_by, sort_order } = req.query;
//     const products = await productService.getProducts({
//       page: parseInt(page) || 1,
//       limit: parseInt(limit) || 20,
//       sort_by,
//       sort_order,
//     });
//     res.json({ success: true, data: products });
//   } catch (err) {
//     console.error('Error fetching products:', err);
//     res.status(500).json({ success: false, message: 'Failed to get products' });
//   }
// });

// // Get product by ID
// router.get('/:id', optionalAuth, validateProductId, async (req, res) => {
//   try {
//     const result = await productService.getProductById(req.params.id);
//     res.json(result);
//   } catch (error) {
//     res.status(404).json({
//       success: false,
//       message: error.message
//     });
//   }
// });

// // Search products
// router.get('/search/:query', async (req, res) => {
//   try {
//     const { page, limit, sort_by, sort_order } = req.query;
//     const searchQuery = req.params.query;
//     const products = await productService.searchProducts({
//       query: searchQuery,
//       page: parseInt(page) || 1,
//       limit: parseInt(limit) || 20,
//       sort_by,
//       sort_order,
//     });
//     res.json({ success: true, data: products });
//   } catch (err) {
//     console.error('Error searching products:', err);
//     res.status(500).json({ success: false, message: 'Failed to search products' });
//   }
// });

// // Get featured products
// router.get('/featured/list', async (req, res) => {
//   try {
//     const limit = parseInt(req.query.limit) || 8;
//     const result = await productService.getFeaturedProducts(limit);
//     res.json(result);
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// });

// // Get categories
// router.get('/categories/list', async (req, res) => {
//   try {
//     const result = await productService.getCategories();
//     res.json(result);
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// });

// // Admin routes
// // Create product
// router.post('/', authenticateToken, requireRole(['admin']), validateProduct, async (req, res) => {
//   try {
//     const result = await productService.createProduct(req.body);
//     res.status(201).json(result);
//   } catch (error) {
//     res.status(400).json({
//       success: false,
//       message: error.message
//     });
//   }
// });

// // Update product
// router.put('/:id', authenticateToken, requireRole(['admin']), validateProductId, validateProduct, async (req, res) => {
//   try {
//     const result = await productService.updateProduct(req.params.id, req.body);
//     res.json(result);
//   } catch (error) {
//     res.status(400).json({
//       success: false,
//       message: error.message
//     });
//   }
// });

// // Delete product
// router.delete('/:id', authenticateToken, requireRole(['admin']), validateProductId, async (req, res) => {
//   try {
//     const result = await productService.deleteProduct(req.params.id);
//     res.json(result);
//   } catch (error) {
//     res.status(400).json({
//       success: false,
//       message: error.message
//     });
//   }
// });

// // Update stock
// router.put('/:id/stock', authenticateToken, requireRole(['admin']), validateProductId, async (req, res) => {
//   try {
//     const { quantity, reason } = req.body;
//     const result = await productService.updateStock(req.params.id, quantity, reason);
//     res.json(result);
//   } catch (error) {
//     res.status(400).json({
//       success: false,
//       message: error.message
//     });
//   }
// });

// module.exports = router;



// --------------- new  ----------------

const express = require('express');
const router = express.Router();
const productService = require('../services/productService'); // <- MUST be fixed if file path changes
const { authenticateToken, requireRole, optionalAuth } = require('../middleware/auth'); // <- MUST be fixed if file path changes
const { validateProduct, validateProductId } = require('../middleware/validation'); // <- MUST be fixed if file path changes

// Get all products with filters
router.get('/', async (req, res) => {
  try {
    const { page, limit, sort_by, sort_order } = req.query;
    const result = await productService.getProducts({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      sort_by,
      sort_order,
    });
    res.json(result);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ success: false, message: 'Failed to get products' });
  }
});

// Get product by ID
router.get('/:id', optionalAuth, validateProductId, async (req, res) => {
  try {
    const result = await productService.getProductById(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
});

// Search products
router.get('/search/:query', async (req, res) => {
  try {
    const { page, limit, sort_by, sort_order } = req.query;
    const searchQuery = req.params.query;
    const result = await productService.searchProducts(searchQuery, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      sort_by,
      sort_order,
    });
    res.json(result);
  } catch (err) {
    console.error('Error searching products:', err);
    res.status(500).json({ success: false, message: 'Failed to search products' });
  }
});

// Get featured products
router.get('/featured/list', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;
    const result = await productService.getFeaturedProducts(limit);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get categories
router.get('/categories/list', async (req, res) => {
  try {
    const result = await productService.getCategories();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Admin routes
router.post('/', authenticateToken, requireRole(['admin']), validateProduct, async (req, res) => {
  try {
    const result = await productService.createProduct(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

router.put('/:id', authenticateToken, requireRole(['admin']), validateProductId, validateProduct, async (req, res) => {
  try {
    const result = await productService.updateProduct(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

router.delete('/:id', authenticateToken, requireRole(['admin']), validateProductId, async (req, res) => {
  try {
    const result = await productService.deleteProduct(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

router.put('/:id/stock', authenticateToken, requireRole(['admin']), validateProductId, async (req, res) => {
  try {
    const { quantity, reason } = req.body;
    const result = await productService.updateStock(req.params.id, quantity, reason);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;