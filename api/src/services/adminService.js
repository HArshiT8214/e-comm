const { pool } = require('../config/database');

class AdminService {

  /**
   * Helper functions for PostgreSQL execution (Must be copied from productService.js)
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
      // NOTE: PostgreSQL requires subqueries to return the same number of columns, 
      // and it doesn't support the non-standard MySQL subquery syntax. 
      // We run these as individual queries and combine the results.
      
      const statsQuery = `
        SELECT 
          (SELECT COUNT(*)::INT FROM products) as total_products,
          (SELECT COUNT(*)::INT FROM products WHERE stock_quantity = 0) as out_of_stock,
          (SELECT COUNT(*)::INT FROM products WHERE stock_quantity < 10) as low_stock,
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
      let whereClause = 'WHERE TRUE'; // PostgreSQL boolean
      const queryParams = [];
      let paramCount = 1;

      if (filters.search) {
        whereClause += ` AND (p.name ILIKE $${paramCount} OR p.sku ILIKE $${paramCount + 1} OR p.description ILIKE $${paramCount + 2})`;
        const searchTerm = `%${filters.search}%`;
        queryParams.push(searchTerm, searchTerm, searchTerm);
        paramCount += 3;
      }

      if (filters.category) {
        whereClause += ` AND p.category_id = $${paramCount}`;
        queryParams.push(filters.category);
        paramCount += 1;
      }

      // Get total count
      const countQuery = `
        SELECT COUNT(*)::INT as total
        FROM products p
        JOIN categories c ON p.category_id = c.category_id
        ${whereClause}
      `;
      const countResult = await this.executeQuery(countQuery, queryParams);
      const total = parseInt(countResult[0].total);

      // Get paginated results
      const productsQuery = `
        SELECT 
          p.product_id, p.name, p.description, p.category_id, c.name as category_name,
          p.brand, p.price, p.stock_quantity, p.sku, p.image_url, p.created_at, p.updated_at
        FROM products p
        JOIN categories c ON p.category_id = c.category_id
        ${whereClause}
        ORDER BY p.created_at DESC
        LIMIT $${paramCount} OFFSET $${paramCount + 1}
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
      const productsQuery = `
        SELECT 
          p.product_id, p.name, p.description, p.category_id, c.name as category_name,
          p.brand, p.price, p.stock_quantity, p.sku, p.image_url, p.created_at, p.updated_at
        FROM products p
        JOIN categories c ON p.category_id = c.category_id
        WHERE p.product_id = $1
      `;
      const products = await this.executeQuery(productsQuery, [productId]);

      if (products.length === 0) {
        return null;
      }

      // Get product images
      const images = await this.executeQuery(`
        SELECT image_id, url, alt_text, display_order
        FROM product_images
        WHERE product_id = $1
        ORDER BY display_order ASC
      `, [productId]);

      return {
        ...products[0],
        images
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

      // Check if SKU already exists
      const existingProduct = await client.query(
        'SELECT product_id FROM products WHERE sku = $1',
        [printerData.sku]
      );

      if (existingProduct.rows.length > 0) {
        throw new Error('SKU already exists');
      }

      // Insert product and use RETURNING to get ID
      const insertResult = await client.query(`
        INSERT INTO products (name, description, category_id, brand, price, stock_quantity, sku, image_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING product_id
      `, [
        printerData.name,
        printerData.description,
        printerData.category_id,
        printerData.brand || 'HP',
        printerData.price,
        printerData.stock_quantity,
        printerData.sku,
        printerData.image_url || null
      ]);

      const productId = insertResult.rows[0].product_id;

      // Insert initial inventory movement if stock > 0
      if (printerData.stock_quantity > 0) {
        await client.query(`
          INSERT INTO inventory_movements (product_id, delta_quantity, reason, reference_type, reference_id, created_at)
          VALUES ($1, $2, 'restock', 'initial', $3, CURRENT_TIMESTAMP)
        `, [productId, printerData.stock_quantity, productId]);
      }

      await client.query('COMMIT'); // Commit transaction

      // Return the created product
      return await this.getPrinterById(productId);
    } catch (error) {
      await client.query('ROLLBACK'); // Rollback on error
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

      // Check if product exists
      const existingProduct = await client.query(
        'SELECT product_id, stock_quantity FROM products WHERE product_id = $1',
        [productId]
      );

      if (existingProduct.rows.length === 0) {
        throw new Error('Product not found');
      }

      // Check SKU uniqueness if SKU is being updated
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

      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined && key !== 'product_id') {
          updateFields.push(`${key} = $${updateFields.length + 1}`);
          updateValues.push(updateData[key]);
        }
      });

      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }

      // Add updated_at time and product ID to values
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      updateValues.push(productId);

      const finalUpdateQuery = `
        UPDATE products 
        SET ${updateFields.join(', ')}
        WHERE product_id = $${updateValues.length}
      `;
      await client.query(finalUpdateQuery, updateValues);

      // Handle stock changes
      if (updateData.stock_quantity !== undefined) {
        const oldStock = existingProduct.rows[0].stock_quantity;
        const newStock = updateData.stock_quantity;
        const delta = newStock - oldStock;

        if (delta !== 0) {
          await client.query(`
            INSERT INTO inventory_movements (product_id, delta_quantity, reason, reference_type, reference_id, created_at)
            VALUES ($1, $2, 'adjustment', 'admin_update', $3, CURRENT_TIMESTAMP)
          `, [productId, delta, productId]);
        }
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

      // Check if product exists
      const existingProduct = await client.query(
        'SELECT product_id FROM products WHERE product_id = $1',
        [productId]
      );

      if (existingProduct.rows.length === 0) {
        return false;
      }

      // Check if product has orders
      const orderItems = await client.query(
        'SELECT COUNT(*) as count FROM order_items WHERE product_id = $1',
        [productId]
      );

      if (parseInt(orderItems.rows[0].count) > 0) {
        throw new Error('Cannot delete product with existing orders');
      }

      // Delete related records (ON DELETE CASCADE in schema handles most, but explicit is safer)
      await client.query('DELETE FROM product_images WHERE product_id = $1', [productId]);
      await client.query('DELETE FROM inventory_movements WHERE product_id = $1', [productId]);
      await client.query('DELETE FROM reviews WHERE product_id = $1', [productId]);
      await client.query('DELETE FROM cart_items WHERE product_id = $1', [productId]);
      await client.query('DELETE FROM wishlist_items WHERE product_id = $1', [productId]);

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
      const categoriesQuery = `
        SELECT 
          c.category_id, c.name, c.parent_id, p.name as parent_name, c.created_at,
          COUNT(pr.product_id)::INT as product_count
        FROM categories c
        LEFT JOIN categories p ON c.parent_id = p.category_id
        LEFT JOIN products pr ON c.category_id = pr.category_id
        GROUP BY c.category_id, c.name, c.parent_id, p.name, c.created_at
        ORDER BY c.parent_id, c.name
      `;
      return await this.executeQuery(categoriesQuery);
    } catch (error) {
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }
  }

  // Category Management (Create Category)
  async createCategory(categoryData) {
    try {
      const insertResult = await this.executeQuery(`
        INSERT INTO categories (name, parent_id)
        VALUES (?, ?)
        RETURNING category_id
      `, [categoryData.name, categoryData.parent_id || null]);

      const categoryId = insertResult[0].category_id;

      const newCategoryQuery = `
        SELECT 
          c.category_id, c.name, c.parent_id, p.name as parent_name, c.created_at
        FROM categories c
        LEFT JOIN categories p ON c.parent_id = p.category_id
        WHERE c.category_id = $1
      `;
      const newCategory = await pool.query(newCategoryQuery, [categoryId]);

      return newCategory.rows[0];
    } catch (error) {
      // Check for PostgreSQL unique constraint error code (23505)
      if (error.code === '23505') {
        throw new Error('Category name already exists');
      }
      throw new Error(`Failed to create category: ${error.message}`);
    }
  }
}

module.exports = new AdminService();