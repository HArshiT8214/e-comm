const { pool } = require('../config/database');

class InventoryService {
  // Get inventory overview with pagination and filters
  async getInventoryOverview(page = 1, limit = 10, filters = {}) {
    try {
      const offset = (page - 1) * limit;
      let whereClause = 'WHERE 1=1';
      const queryParams = [];

      if (filters.search) {
        whereClause += ' AND (p.name LIKE ? OR p.sku LIKE ?)';
        const searchTerm = `%${filters.search}%`;
        queryParams.push(searchTerm, searchTerm);
      }

      if (filters.lowStock) {
        whereClause += ' AND p.stock_quantity < 10';
      }

      // Get total count
      const [countResult] = await pool.execute(`
        SELECT COUNT(*) as total
        FROM products p
        JOIN categories c ON p.category_id = c.category_id
        ${whereClause}
      `, queryParams);

      // Get inventory data
      const [inventory] = await pool.execute(`
        SELECT 
          p.product_id,
          p.name,
          p.sku,
          p.stock_quantity,
          p.price,
          c.name as category_name,
          p.updated_at,
          CASE 
            WHEN p.stock_quantity = 0 THEN 'out_of_stock'
            WHEN p.stock_quantity < 10 THEN 'low_stock'
            ELSE 'in_stock'
          END as stock_status
        FROM products p
        JOIN categories c ON p.category_id = c.category_id
        ${whereClause}
        ORDER BY 
          CASE 
            WHEN p.stock_quantity = 0 THEN 1
            WHEN p.stock_quantity < 10 THEN 2
            ELSE 3
          END,
          p.stock_quantity ASC,
          p.name ASC
        LIMIT ${limit} OFFSET ${offset}
      `, queryParams);

      // Get stock summary
      const [stockSummary] = await pool.execute(`
        SELECT 
          COUNT(*) as total_products,
          SUM(CASE WHEN stock_quantity = 0 THEN 1 ELSE 0 END) as out_of_stock,
          SUM(CASE WHEN stock_quantity > 0 AND stock_quantity < 10 THEN 1 ELSE 0 END) as low_stock,
          SUM(CASE WHEN stock_quantity >= 10 THEN 1 ELSE 0 END) as in_stock,
          SUM(stock_quantity * price) as total_inventory_value
        FROM products p
        ${whereClause}
      `, queryParams);

      return {
        inventory,
        summary: stockSummary[0],
        pagination: {
          page,
          limit,
          total: countResult[0].total,
          totalPages: Math.ceil(countResult[0].total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch inventory overview: ${error.message}`);
    }
  }

  // Update stock quantity with audit trail
  async updateStock(productId, quantity, reason, adminUserId) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Get current stock
      const [currentProduct] = await connection.execute(
        'SELECT stock_quantity FROM products WHERE product_id = ?',
        [productId]
      );

      if (currentProduct.length === 0) {
        throw new Error('Product not found');
      }

      const currentStock = currentProduct[0].stock_quantity;
      const deltaQuantity = quantity - currentStock;

      // Update product stock
      await connection.execute(
        'UPDATE products SET stock_quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE product_id = ?',
        [quantity, productId]
      );

      // Record inventory movement if there's a change
      if (deltaQuantity !== 0) {
        await connection.execute(`
          INSERT INTO inventory_movements (product_id, delta_quantity, reason, reference_type, reference_id)
          VALUES (?, ?, ?, 'admin_adjustment', ?)
        `, [productId, deltaQuantity, reason, adminUserId]);
      }

      await connection.commit();

      // Return updated product info
      const [updatedProduct] = await connection.execute(`
        SELECT 
          p.product_id,
          p.name,
          p.sku,
          p.stock_quantity,
          p.price,
          c.name as category_name
        FROM products p
        JOIN categories c ON p.category_id = c.category_id
        WHERE p.product_id = ?
      `, [productId]);

      return {
        product: updatedProduct[0],
        deltaQuantity,
        reason,
        updatedAt: new Date()
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Get inventory movements/history for a product
  async getInventoryMovements(productId, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;

      // Get total count
      const [countResult] = await pool.execute(
        'SELECT COUNT(*) as total FROM inventory_movements WHERE product_id = ?',
        [productId]
      );

      // Get movements with pagination
      const [movements] = await pool.execute(`
        SELECT 
          im.movement_id,
          im.delta_quantity,
          im.reason,
          im.reference_type,
          im.reference_id,
          im.created_at,
          p.name as product_name,
          p.sku
        FROM inventory_movements im
        JOIN products p ON im.product_id = p.product_id
        WHERE im.product_id = ?
        ORDER BY im.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `, [productId]);

      // Get current stock for context
      const [currentStock] = await pool.execute(
        'SELECT stock_quantity FROM products WHERE product_id = ?',
        [productId]
      );

      return {
        movements,
        currentStock: currentStock[0]?.stock_quantity || 0,
        pagination: {
          page,
          limit,
          total: countResult[0].total,
          totalPages: Math.ceil(countResult[0].total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch inventory movements: ${error.message}`);
    }
  }

  // Get low stock alerts
  async getLowStockAlerts(threshold = 10) {
    try {
      const [alerts] = await pool.execute(`
        SELECT 
          p.product_id,
          p.name,
          p.sku,
          p.stock_quantity,
          p.price,
          c.name as category_name
        FROM products p
        JOIN categories c ON p.category_id = c.category_id
        WHERE p.stock_quantity <= ? AND p.stock_quantity > 0
        ORDER BY p.stock_quantity ASC, p.name ASC
      `, [threshold]);

      return alerts;
    } catch (error) {
      throw new Error(`Failed to fetch low stock alerts: ${error.message}`);
    }
  }

  // Get out of stock products
  async getOutOfStockProducts() {
    try {
      const [products] = await pool.execute(`
        SELECT 
          p.product_id,
          p.name,
          p.sku,
          p.stock_quantity,
          p.price,
          c.name as category_name,
          p.updated_at
        FROM products p
        JOIN categories c ON p.category_id = c.category_id
        WHERE p.stock_quantity = 0
        ORDER BY p.name ASC
      `);

      return products;
    } catch (error) {
      throw new Error(`Failed to fetch out of stock products: ${error.message}`);
    }
  }

  // Bulk stock update
  async bulkStockUpdate(updates, reason, adminUserId) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const results = [];

      for (const update of updates) {
        const { productId, quantity } = update;

        // Get current stock
        const [currentProduct] = await connection.execute(
          'SELECT stock_quantity FROM products WHERE product_id = ?',
          [productId]
        );

        if (currentProduct.length === 0) {
          results.push({ productId, success: false, error: 'Product not found' });
          continue;
        }

        const currentStock = currentProduct[0].stock_quantity;
        const deltaQuantity = quantity - currentStock;

        // Update product stock
        await connection.execute(
          'UPDATE products SET stock_quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE product_id = ?',
          [quantity, productId]
        );

        // Record inventory movement if there's a change
        if (deltaQuantity !== 0) {
          await connection.execute(`
            INSERT INTO inventory_movements (product_id, delta_quantity, reason, reference_type, reference_id)
            VALUES (?, ?, ?, 'bulk_admin_adjustment', ?)
          `, [productId, deltaQuantity, reason, adminUserId]);
        }

        results.push({
          productId,
          success: true,
          oldStock: currentStock,
          newStock: quantity,
          deltaQuantity
        });
      }

      await connection.commit();
      return results;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = new InventoryService();
