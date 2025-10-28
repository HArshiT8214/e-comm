const { pool } = require('../config/database');

class InventoryService {

  /**
   * Converts MySQL's '?' placeholders to PostgreSQL's positional '$1, $2, $3...'
   * @param {string} sql - The raw SQL string with '?' placeholders.
   * @param {Array<any>} params - The parameters to substitute.
   * @returns {[string, Array<any>]} The new SQL string and parameters array.
   */
  static buildPostgresQuery(sql, params) {
    if (!params) return [sql, []];
    let index = 1;
    // Replace all '?' with $1, $2, etc., using the count of parameters
    const newSql = sql.replace(/\?/g, () => `$${index++}`);
    return [newSql, params];
  }

  /**
   * Executes a database query using the pg pool.
   * @param {string} sql - The SQL query (must use '?').
   * @param {Array<any>} params - The parameters.
   * @returns {Array<any>} The result rows.
   */
  async executeQuery(sql, params = []) {
    const [query, pgParams] = InventoryService.buildPostgresQuery(sql, params);
    const result = await pool.query(query, pgParams);
    return result.rows;
  }

  // Get inventory overview with pagination and filters
  async getInventoryOverview(page = 1, limit = 10, filters = {}) {
    try {
      const offset = (page - 1) * limit;
      let whereClause = 'WHERE TRUE'; // Use TRUE for PostgreSQL
      const queryParams = [];
      let paramCount = 1;

      if (filters.search) {
        // Use ILIKE for case-insensitive search
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
        SELECT COUNT(*) as total
        FROM products p
        JOIN categories c ON p.category_id = c.category_id
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
        LIMIT $${paramCount} OFFSET $${paramCount + 1}
      `;
      // Pagination parameters are added directly to the queryParams array
      queryParams.push(limit, offset);

      const inventory = await this.executeQuery(inventoryQuery, queryParams);

      // --- Get stock summary ---
      const summaryQuery = `
        SELECT 
          COUNT(*) as total_products,
          SUM(CASE WHEN stock_quantity = 0 THEN 1 ELSE 0 END) as out_of_stock,
          SUM(CASE WHEN stock_quantity > 0 AND stock_quantity < 10 THEN 1 ELSE 0 END) as low_stock,
          SUM(CASE WHEN stock_quantity >= 10 THEN 1 ELSE 0 END) as in_stock,
          SUM(stock_quantity * price) as total_inventory_value
        FROM products p
        ${whereClause.replace(/\$\d+/g, '?')} -- Reset placeholders for safety
      `;
      
      // Remove limit/offset parameters for the summary query
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
    // Use client transaction for atomic updates (pg equivalent of MySQL connection.execute)
    const client = await pool.connect(); 
    try {
      await client.query('BEGIN'); // Start transaction

      // Get current stock
      const currentProduct = await client.query(
        'SELECT stock_quantity FROM products WHERE product_id = $1',
        [productId]
      );

      if (currentProduct.rows.length === 0) {
        throw new Error('Product not found');
      }

      const currentStock = currentProduct.rows[0].stock_quantity;
      const deltaQuantity = quantity - currentStock;

      // Update product stock (use CURRENT_TIMESTAMP for PostgreSQL)
      await client.query(
        'UPDATE products SET stock_quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE product_id = $2',
        [quantity, productId]
      );

      // Record inventory movement if there's a change
      if (deltaQuantity !== 0) {
        await client.query(`
          INSERT INTO inventory_movements (product_id, delta_quantity, reason, reference_type, reference_id, created_at)
          VALUES ($1, $2, $3, 'admin_adjustment', $4, CURRENT_TIMESTAMP)
        `, [productId, deltaQuantity, reason, adminUserId]);
      }

      await client.query('COMMIT'); // Commit transaction

      // Return updated product info
      const updatedProductResult = await client.query(`
        SELECT 
          p.product_id, p.name, p.sku, p.stock_quantity, p.price, c.name as category_name
        FROM products p
        JOIN categories c ON p.category_id = c.category_id
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
    try {
      const offset = (page - 1) * limit;
      let paramCount = 1;

      // Get total count
      const countResult = await this.executeQuery(
        'SELECT COUNT(*) as total FROM inventory_movements WHERE product_id = ?',
        [productId]
      );
      const total = parseInt(countResult[0].total);

      // Get movements with pagination
      const movementsQuery = `
        SELECT 
          im.movement_id, im.delta_quantity, im.reason, im.reference_type, im.reference_id, im.created_at,
          p.name as product_name, p.sku
        FROM inventory_movements im
        JOIN products p ON im.product_id = p.product_id
        WHERE im.product_id = $${paramCount}
        ORDER BY im.created_at DESC
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `;
      const movements = await pool.query(movementsQuery, [productId, limit, offset]);

      // Get current stock for context
      const currentStockResult = await this.executeQuery(
        'SELECT stock_quantity FROM products WHERE product_id = ?',
        [productId]
      );

      return {
        movements: movements.rows,
        currentStock: currentStockResult[0]?.stock_quantity || 0,
        pagination: {
          page,
          limit,
          total: total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('❌ POSTGRESQL SQL ERROR in getInventoryMovements:', error.message, error.stack);
      throw new Error(`Failed to fetch inventory movements: ${error.message}`);
    }
  }

  // Get low stock alerts
  async getLowStockAlerts(threshold = 10) {
    try {
      const alerts = await this.executeQuery(`
        SELECT 
          p.product_id, p.name, p.sku, p.stock_quantity, p.price, c.name as category_name
        FROM products p
        JOIN categories c ON p.category_id = c.category_id
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
          p.product_id, p.name, p.sku, p.stock_quantity, p.price, c.name as category_name, p.updated_at
        FROM products p
        JOIN categories c ON p.category_id = c.category_id
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

        // Get current stock
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

        // Record inventory movement if there's a change
        if (deltaQuantity !== 0) {
          await client.query(`
            INSERT INTO inventory_movements (product_id, delta_quantity, reason, reference_type, reference_id, created_at)
            VALUES ($1, $2, $3, 'bulk_admin_adjustment', $4, CURRENT_TIMESTAMP)
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