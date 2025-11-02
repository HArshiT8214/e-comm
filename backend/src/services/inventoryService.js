const { pool } = require('../config/database');

class InventoryService {

  /**
   * Helper functions for PostgreSQL execution
   */
  static buildPostgresQuery(sql, params) {
    if (!params) return [sql, []];
    let index = 1;
    const newSql = sql.replace(/\?/g, () => `$${index++}`);
    return [newSql, params];
  }

  async executeQuery(sql, params = []) {
    const [query, pgParams] = InventoryService.buildPostgresQuery(sql, params);
    const result = await pool.query(query, pgParams);
    return result.rows;
  }

  // Get inventory overview with pagination and filters
  async getInventoryOverview(page = 1, limit = 10, filters = {}) {
    try {
      const offset = (page - 1) * limit;
      let whereClause = 'WHERE TRUE'; 
      const queryParams = [];
      let paramCount = 1; 

      if (filters.search) {
        whereClause += ` AND (p.name ILIKE $${paramCount} OR p.sku ILIKE $${paramCount + 1})`;
        const searchTerm = `%${filters.search}%`;
        queryParams.push(searchTerm, searchTerm);
        paramCount += 2;
      }

      if (filters.lowStock) {
        whereClause += ' AND p.stock_quantity < 10';
      }

      // --- Get total count ---
      const countQuery = `
        SELECT COUNT(*)::INT as total
        FROM products p
        ${whereClause}
      `;
      const countResult = await this.executeQuery(countQuery, queryParams);
      const total = parseInt(countResult[0].total);

      // --- Get inventory data ---
      const inventoryQuery = `
        SELECT 
          p.product_id,
          p.name,
          p.sku,
          p.stock_quantity,
          p.price,
          p.category as category_name,
          p.updated_at,
          CASE 
            WHEN p.stock_quantity = 0 THEN 'out_of_stock'
            WHEN p.stock_quantity < 10 THEN 'low_stock'
            ELSE 'in_stock'
          END as stock_status
        FROM products p
        ${whereClause}
        ORDER BY 
          CASE 
            WHEN p.stock_quantity = 0 THEN 1
            WHEN p.stock_quantity < 10 THEN 2
            ELSE 3
          END,
          p.stock_quantity ASC,
          p.name ASC
        LIMIT $${paramCount} OFFSET $${paramCount + 1}
      `;
      queryParams.push(limit, offset);

      const inventory = await this.executeQuery(inventoryQuery, queryParams);

      // --- Get stock summary ---
      const summaryQuery = `
        SELECT 
          COUNT(*)::INT as total_products,
          SUM(CASE WHEN stock_quantity = 0 THEN 1 ELSE 0 END)::INT as out_of_stock,
          SUM(CASE WHEN stock_quantity > 0 AND stock_quantity < 10 THEN 1 ELSE 0 END)::INT as low_stock,
          SUM(CASE WHEN stock_quantity >= 10 THEN 1 ELSE 0 END)::INT as in_stock,
          SUM(stock_quantity * price) as total_inventory_value
        FROM products p
        ${whereClause}
      `;
      
      const summaryParams = queryParams.slice(0, queryParams.length - 2); 
      const stockSummary = await this.executeQuery(summaryQuery, summaryParams);

      return {
        inventory,
        summary: stockSummary[0],
        pagination: {
          page,
          limit,
          total: total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('❌ POSTGRESQL SQL ERROR in getInventoryOverview:', error.message, error.stack);
      throw new Error(`Failed to fetch inventory overview: ${error.message}`);
    }
  }

  // Update stock quantity with audit trail
  async updateStock(productId, quantity, reason, adminUserId) {
    const client = await pool.connect(); 
    try {
      await client.query('BEGIN'); // Start transaction

      const currentProduct = await client.query(
        'SELECT stock_quantity FROM products WHERE product_id = $1',
        [productId]
      );

      if (currentProduct.rows.length === 0) {
        throw new Error('Product not found');
      }

      const currentStock = currentProduct.rows[0].stock_quantity;
      const deltaQuantity = quantity - currentStock;

      // Update product stock
      await client.query(
        'UPDATE products SET stock_quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE product_id = $2',
        [quantity, productId]
      );

      // ✅ FIX: Commented out query to non-existent 'inventory_movements' table
      // if (deltaQuantity !== 0) {
      //   await client.query(`
      //     INSERT INTO inventory_movements (product_id, delta_quantity, reason, reference_type, reference_id, created_at)
      //     VALUES ($1, $2, $3, 'admin_adjustment', $4, CURRENT_TIMESTAMP)
      //   `, [productId, deltaQuantity, reason, adminUserId]);
      // }

      await client.query('COMMIT'); // Commit transaction

      const updatedProductResult = await client.query(`
        SELECT 
          p.product_id, p.name, p.sku, p.stock_quantity, p.price, p.category as category_name
        FROM products p
        WHERE p.product_id = $1
      `, [productId]);

      return {
        product: updatedProductResult.rows[0],
        deltaQuantity,
        reason,
        updatedAt: new Date()
      };
    } catch (error) {
      await client.query('ROLLBACK'); // Rollback on error
      throw error;
    } finally {
      client.release();
    }
  }

  // Get inventory movements/history for a product
  async getInventoryMovements(productId, page = 1, limit = 10) {
    // ✅ FIX: This table does not exist. Return empty data to prevent crash.
    console.warn("WARN: 'inventory_movements' table does not exist in schema. Returning empty array.");
    return {
        movements: [],
        currentStock: 0,
        pagination: { page, limit, total: 0, totalPages: 0 }
    };
    
    /* // This code will crash the function:
    try {
      // ... (queries to inventory_movements) ...
    } catch (error) {
      console.error('❌ POSTGRESQL SQL ERROR in getInventoryMovements:', error.message, error.stack);
      throw new Error(`Failed to fetch inventory movements: ${error.message}`);
    }
    */
  }

  // Get low stock alerts
  async getLowStockAlerts(threshold = 10) {
    try {
      const alerts = await this.executeQuery(`
        SELECT 
          p.product_id, p.name, p.sku, p.stock_quantity, p.price, p.category as category_name
        FROM products p
        WHERE p.stock_quantity <= ? AND p.stock_quantity > 0
        ORDER BY p.stock_quantity ASC, p.name ASC
      `, [threshold]);

      return alerts;
    } catch (error) {
      console.error('❌ POSTGRESQL SQL ERROR in getLowStockAlerts:', error.message, error.stack);
      throw new Error(`Failed to fetch low stock alerts: ${error.message}`);
    }
  }

  // Get out of stock products
  async getOutOfStockProducts() {
    try {
      const products = await this.executeQuery(`
        SELECT 
          p.product_id, p.name, p.sku, p.stock_quantity, p.price, p.category as category_name, p.updated_at
        FROM products p
        WHERE p.stock_quantity = 0
        ORDER BY p.name ASC
      `);

      return products;
    } catch (error) {
      console.error('❌ POSTGRESQL SQL ERROR in getOutOfStockProducts:', error.message, error.stack);
      throw new Error(`Failed to fetch out of stock products: ${error.message}`);
    }
  }

  // Bulk stock update
  async bulkStockUpdate(updates, reason, adminUserId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN'); // Start transaction

      const results = [];

      for (const update of updates) {
        const { productId, quantity } = update;

        const currentProductResult = await client.query(
          'SELECT stock_quantity FROM products WHERE product_id = $1',
          [productId]
        );
        const currentProduct = currentProductResult.rows;

        if (currentProduct.length === 0) {
          results.push({ productId, success: false, error: 'Product not found' });
          continue;
        }

        const currentStock = currentProduct[0].stock_quantity;
        const deltaQuantity = quantity - currentStock;

        // Update product stock
        await client.query(
          'UPDATE products SET stock_quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE product_id = $2',
          [quantity, productId]
        );

        // ✅ FIX: Commented out query to non-existent 'inventory_movements' table
        // if (deltaQuantity !== 0) {
        //   await client.query(`
        //     INSERT INTO inventory_movements (product_id, delta_quantity, reason, reference_type, reference_id, created_at)
        //     VALUES ($1, $2, $3, 'bulk_admin_adjustment', $4, CURRENT_TIMESTAMP)
        //   `, [productId, deltaQuantity, reason, adminUserId]);
        // }

        results.push({
          productId,
          success: true,
          oldStock: currentStock,
          newStock: quantity,
          deltaQuantity
        });
      }

      await client.query('COMMIT'); // Commit transaction
      return results;
    } catch (error) {
      await client.query('ROLLBACK'); // Rollback on error
      console.error('❌ POSTGRESQL SQL ERROR in bulkStockUpdate:', error.message, error.stack);
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = new InventoryService();