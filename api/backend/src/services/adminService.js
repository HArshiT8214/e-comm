const { pool } = require('../config/database');

class AdminService {

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
    const [query, pgParams] = AdminService.buildPostgresQuery(sql, params);
    const result = await pool.query(query, pgParams);
    return result.rows;
  }

  // Dashboard Statistics
  async getDashboardStats() {
    try {
      // ✅ FIX: This query is now compatible with your schema
      const statsQuery = `
        SELECT 
          (SELECT COUNT(*)::INT FROM products) as total_products,
          (SELECT COUNT(*)::INT FROM products WHERE stock_quantity = 0) as out_of_stock,
          (SELECT COUNT(*)::INT FROM products WHERE stock_quantity < 10 AND stock_quantity > 0) as low_stock,
          (SELECT COUNT(*)::INT FROM orders WHERE DATE(created_at) = CURRENT_DATE) as today_orders,
          (SELECT COUNT(*)::INT FROM orders WHERE status = 'pending') as pending_orders,
          (SELECT COALESCE(SUM(total_amount), 0.00) FROM orders WHERE DATE(created_at) = CURRENT_DATE) as today_revenue,
          (SELECT COUNT(*)::INT FROM users WHERE role = 'customer') as total_customers,
          (SELECT COUNT(*)::INT FROM support_tickets WHERE status = 'open') as open_tickets
      `;
      const stats = await this.executeQuery(statsQuery);
      
      const recentOrdersQuery = `
        SELECT o.order_id, o.total_amount, o.status, o.created_at, 
               u.first_name, u.last_name, u.email
        FROM orders o
        JOIN users u ON o.user_id = u.user_id
        ORDER BY o.created_at DESC
        LIMIT 5
      `;
      const recentOrders = await this.executeQuery(recentOrdersQuery);
      
      const lowStockProductsQuery = `
        SELECT product_id, name, sku, stock_quantity
        FROM products
        WHERE stock_quantity < 10 AND stock_quantity > 0
        ORDER BY stock_quantity ASC
        LIMIT 5
      `;
      const lowStockProducts = await this.executeQuery(lowStockProductsQuery);

      return {
        overview: stats[0],
        recentOrders,
        lowStockProducts
      };
    } catch (error) {
      throw new Error(`Failed to fetch dashboard stats: ${error.message}`);
    }
  }

  // Printer Management (Get Printers)
  async getPrinters(page = 1, limit = 10, filters = {}) {
    try {
      const offset = (page - 1) * limit;
      let whereClause = 'WHERE TRUE';
      const queryParams = [];

      if (filters.search) {
        whereClause += ` AND (p.name ILIKE ? OR p.sku ILIKE ? OR p.description ILIKE ?)`;
        const searchTerm = `%${filters.search}%`;
        queryParams.push(searchTerm, searchTerm, searchTerm);
      }

      // ✅ FIX: Filter by 'category' (varchar)
      if (filters.category) {
        whereClause += ` AND p.category = ?`;
        queryParams.push(filters.category);
      }

      // ✅ FIX: Removed invalid JOIN on 'categories'
      const countQuery = `
        SELECT COUNT(*)::INT as total
        FROM products p
        ${whereClause}
      `;
      const countResult = await this.executeQuery(countQuery, queryParams);
      const total = parseInt(countResult[0].total);

      // ✅ FIX: Removed invalid JOIN on 'categories', selected 'p.category'
      const productsQuery = `
        SELECT 
          p.product_id, p.name, p.description, p.category as category_name,
          p.brand, p.price, p.stock_quantity, p.sku, p.image_url, p.created_at, p.updated_at
        FROM products p
        ${whereClause}
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
      `;
      
      queryParams.push(limit, offset);
      const products = await this.executeQuery(productsQuery, queryParams);

      return {
        products,
        pagination: {
          page,
          limit,
          total: total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch printers: ${error.message}`);
    }
  }

  // Printer Management (Get By ID)
  async getPrinterById(productId) {
    try {
      // ✅ FIX: Removed invalid JOIN on 'categories', selected 'p.category'
      const productsQuery = `
        SELECT 
          p.product_id, p.name, p.description, p.category as category_name,
          p.brand, p.price, p.stock_quantity, p.sku, p.image_url, p.created_at, p.updated_at
        FROM products p
        WHERE p.product_id = ?
      `;
      const products = await this.executeQuery(productsQuery, [productId]);

      if (products.length === 0) {
        return null;
      }

      // ✅ FIX: Removed query for non-existent 'product_images' table
      // const images = await this.executeQuery(...)

      return {
        ...products[0]
        // images
      };
    } catch (error) {
      throw new Error(`Failed to fetch printer: ${error.message}`);
    }
  }

  // Printer Management (Create Printer)
  async createPrinter(printerData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN'); // Start transaction

      const existingProduct = await client.query(
        'SELECT product_id FROM products WHERE sku = $1', 
        [printerData.sku]
      );

      if (existingProduct.rows.length > 0) {
        throw new Error('SKU already exists');
      }

      // ✅ FIX: Use 'category' (varchar)
      const insertResult = await client.query(`
        INSERT INTO products (name, description, category, brand, price, stock_quantity, sku, image_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING product_id
      `, [
        printerData.name,
        printerData.description,
        printerData.category, // Use category
        printerData.brand || 'HP',
        printerData.price,
        printerData.stock_quantity,
        printerData.sku,
        printerData.image_url || null
      ]);

      const productId = insertResult.rows[0].product_id;

      // Insert initial inventory movement (assuming 'inventory_movements' exists)
      if (printerData.stock_quantity > 0) {
        // await client.query(`
        //   INSERT INTO inventory_movements (product_id, delta_quantity, reason, reference_type, reference_id, created_at)
        //   VALUES ($1, $2, 'restock', 'initial', $3, CURRENT_TIMESTAMP)
        // `, [productId, printerData.stock_quantity, productId]);
      }

      await client.query('COMMIT'); 

      return await this.getPrinterById(productId);
    } catch (error) {
      await client.query('ROLLBACK'); 
      throw error;
    } finally {
      client.release();
    }
  }

  // Printer Management (Update Printer)
  async updatePrinter(productId, updateData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const existingProduct = await client.query(
        'SELECT product_id, stock_quantity FROM products WHERE product_id = $1',
        [productId]
      );

      if (existingProduct.rows.length === 0) {
        throw new Error('Product not found');
      }

      if (updateData.sku) {
        const skuCheck = await client.query(
          'SELECT product_id FROM products WHERE sku = $1 AND product_id != $2',
          [updateData.sku, productId]
        );

        if (skuCheck.rows.length > 0) {
          throw new Error('SKU already exists');
        }
      }

      // Build update query dynamically
      const updateFields = [];
      const updateValues = [];

      // ✅ FIX: Ensure 'category' is used, not 'category_id'
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined && key !== 'product_id' && key !== 'category_id') {
          updateFields.push(`${key} = $${updateFields.length + 1}`);
          updateValues.push(updateData[key]);
        }
      });
      
      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }

      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      updateValues.push(productId);

      const finalUpdateQuery = `
        UPDATE products 
        SET ${updateFields.join(', ')}
        WHERE product_id = $${updateValues.length}
      `;
      
      await client.query(finalUpdateQuery, updateValues);

      // Handle stock changes (assuming 'inventory_movements' exists)
      if (updateData.stock_quantity !== undefined) {
        // ... (stock change logic) ...
      }

      await client.query('COMMIT');

      return await this.getPrinterById(productId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Printer Management (Delete Printer)
  async deletePrinter(productId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // ... (Check if product exists) ...

      const orderItems = await client.query(
        'SELECT COUNT(*) as count FROM order_items WHERE product_id = $1',
        [productId]
      );

      if (parseInt(orderItems.rows[0].count) > 0) {
        throw new Error('Cannot delete product with existing orders');
      }

      // ✅ FIX: Removed deletes for non-existent tables ('product_images', 'wishlist_items')
      // await client.query('DELETE FROM inventory_movements WHERE product_id = $1', [productId]);
      await client.query('DELETE FROM reviews WHERE product_id = $1', [productId]);
      await client.query('DELETE FROM cart_items WHERE product_id = $1', [productId]);

      // Delete the product
      const result = await client.query('DELETE FROM products WHERE product_id = $1', [productId]);

      await client.query('COMMIT');
      return result.rowCount > 0;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Category Management (Get Categories)
  async getCategories() {
    try {
      // ✅ FIX: Get categories from 'products' table, as 'categories' table is not linked
      const categoriesQuery = `
        SELECT 
          category as name,
          COUNT(product_id)::INT as product_count
        FROM products
        WHERE category IS NOT NULL
        GROUP BY category
        ORDER BY category
      `;
      return await this.executeQuery(categoriesQuery);
    } catch (error) {
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }
  }

  // Category Management (Create Category)
  async createCategory(categoryData) {
    // This function is incompatible with your schema, as 'categories' is not a real table.
    // We will return an error or you must change your database schema.
    throw new Error("Cannot create category: 'categories' table is not in use.");
  }
}

module.exports = new AdminService();