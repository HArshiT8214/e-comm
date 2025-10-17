const { pool } = require('../config/database');

class AdminService {
  // Dashboard Statistics
  async getDashboardStats() {
    try {
      const [stats] = await pool.execute(`
        SELECT 
          (SELECT COUNT(*) FROM products) as total_products,
          (SELECT COUNT(*) FROM products WHERE stock_quantity = 0) as out_of_stock,
          (SELECT COUNT(*) FROM products WHERE stock_quantity < 10) as low_stock,
          (SELECT COUNT(*) FROM orders WHERE DATE(created_at) = CURDATE()) as today_orders,
          (SELECT COUNT(*) FROM orders WHERE status = 'pending') as pending_orders,
          (SELECT SUM(total_amount) FROM orders WHERE DATE(created_at) = CURDATE()) as today_revenue,
          (SELECT COUNT(*) FROM users WHERE role = 'customer') as total_customers,
          (SELECT COUNT(*) FROM support_tickets WHERE status = 'open') as open_tickets
      `);
      
      const [recentOrders] = await pool.execute(`
        SELECT o.order_id, o.total_amount, o.status, o.created_at, 
               u.first_name, u.last_name, u.email
        FROM orders o
        JOIN users u ON o.user_id = u.user_id
        ORDER BY o.created_at DESC
        LIMIT 5
      `);
      
      const [lowStockProducts] = await pool.execute(`
        SELECT product_id, name, sku, stock_quantity
        FROM products
        WHERE stock_quantity < 10 AND stock_quantity > 0
        ORDER BY stock_quantity ASC
        LIMIT 5
      `);

      return {
        overview: stats[0],
        recentOrders,
        lowStockProducts
      };
    } catch (error) {
      throw new Error(`Failed to fetch dashboard stats: ${error.message}`);
    }
  }

  // Printer Management
  async getPrinters(page = 1, limit = 10, filters = {}) {
    try {
      const offset = (page - 1) * limit;
      let whereClause = 'WHERE 1=1';
      const queryParams = [];

      if (filters.search) {
        whereClause += ' AND (p.name LIKE ? OR p.sku LIKE ? OR p.description LIKE ?)';
        const searchTerm = `%${filters.search}%`;
        queryParams.push(searchTerm, searchTerm, searchTerm);
      }

      if (filters.category) {
        whereClause += ' AND p.category_id = ?';
        queryParams.push(filters.category);
      }

      // Get total count
      const [countResult] = await pool.execute(`
        SELECT COUNT(*) as total
        FROM products p
        JOIN categories c ON p.category_id = c.category_id
        ${whereClause}
      `, queryParams);

      // Get paginated results
      const [products] = await pool.execute(`
        SELECT 
          p.product_id,
          p.name,
          p.description,
          p.category_id,
          c.name as category_name,
          p.brand,
          p.price,
          p.stock_quantity,
          p.sku,
          p.image_url,
          p.created_at,
          p.updated_at
        FROM products p
        JOIN categories c ON p.category_id = c.category_id
        ${whereClause}
        ORDER BY p.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `, queryParams);

      return {
        products,
        pagination: {
          page,
          limit,
          total: countResult[0].total,
          totalPages: Math.ceil(countResult[0].total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch printers: ${error.message}`);
    }
  }

  async getPrinterById(productId) {
    try {
      const [products] = await pool.execute(`
        SELECT 
          p.product_id,
          p.name,
          p.description,
          p.category_id,
          c.name as category_name,
          p.brand,
          p.price,
          p.stock_quantity,
          p.sku,
          p.image_url,
          p.created_at,
          p.updated_at
        FROM products p
        JOIN categories c ON p.category_id = c.category_id
        WHERE p.product_id = ?
      `, [productId]);

      if (products.length === 0) {
        return null;
      }

      // Get product images
      const [images] = await pool.execute(`
        SELECT image_id, url, alt_text, display_order
        FROM product_images
        WHERE product_id = ?
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

  async createPrinter(printerData) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Check if SKU already exists
      const [existingProduct] = await connection.execute(
        'SELECT product_id FROM products WHERE sku = ?',
        [printerData.sku]
      );

      if (existingProduct.length > 0) {
        throw new Error('SKU already exists');
      }

      // Insert product
      const [result] = await connection.execute(`
        INSERT INTO products (name, description, category_id, brand, price, stock_quantity, sku, image_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
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

      const productId = result.insertId;

      // Insert initial inventory movement if stock > 0
      if (printerData.stock_quantity > 0) {
        await connection.execute(`
          INSERT INTO inventory_movements (product_id, delta_quantity, reason, reference_type, reference_id)
          VALUES (?, ?, 'restock', 'initial', ?)
        `, [productId, printerData.stock_quantity, productId]);
      }

      await connection.commit();

      // Return the created product
      return await this.getPrinterById(productId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async updatePrinter(productId, updateData) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Check if product exists
      const [existingProduct] = await connection.execute(
        'SELECT product_id, stock_quantity FROM products WHERE product_id = ?',
        [productId]
      );

      if (existingProduct.length === 0) {
        throw new Error('Product not found');
      }

      // Check SKU uniqueness if SKU is being updated
      if (updateData.sku) {
        const [skuCheck] = await connection.execute(
          'SELECT product_id FROM products WHERE sku = ? AND product_id != ?',
          [updateData.sku, productId]
        );

        if (skuCheck.length > 0) {
          throw new Error('SKU already exists');
        }
      }

      // Build update query dynamically
      const updateFields = [];
      const updateValues = [];

      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined && key !== 'product_id') {
          updateFields.push(`${key} = ?`);
          updateValues.push(updateData[key]);
        }
      });

      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }

      updateValues.push(productId);

      await connection.execute(`
        UPDATE products 
        SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE product_id = ?
      `, updateValues);

      // Handle stock changes
      if (updateData.stock_quantity !== undefined) {
        const oldStock = existingProduct[0].stock_quantity;
        const newStock = updateData.stock_quantity;
        const delta = newStock - oldStock;

        if (delta !== 0) {
          await connection.execute(`
            INSERT INTO inventory_movements (product_id, delta_quantity, reason, reference_type, reference_id)
            VALUES (?, ?, 'adjustment', 'admin_update', ?)
          `, [productId, delta, productId]);
        }
      }

      await connection.commit();

      return await this.getPrinterById(productId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async deletePrinter(productId) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Check if product exists
      const [existingProduct] = await connection.execute(
        'SELECT product_id FROM products WHERE product_id = ?',
        [productId]
      );

      if (existingProduct.length === 0) {
        return false;
      }

      // Check if product has orders
      const [orderItems] = await connection.execute(
        'SELECT COUNT(*) as count FROM order_items WHERE product_id = ?',
        [productId]
      );

      if (orderItems[0].count > 0) {
        throw new Error('Cannot delete product with existing orders');
      }

      // Delete related records first
      await connection.execute('DELETE FROM product_images WHERE product_id = ?', [productId]);
      await connection.execute('DELETE FROM inventory_movements WHERE product_id = ?', [productId]);
      await connection.execute('DELETE FROM reviews WHERE product_id = ?', [productId]);
      await connection.execute('DELETE FROM cart_items WHERE product_id = ?', [productId]);
      await connection.execute('DELETE FROM wishlist_items WHERE product_id = ?', [productId]);

      // Delete the product
      await connection.execute('DELETE FROM products WHERE product_id = ?', [productId]);

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Category Management
  async getCategories() {
    try {
      const [categories] = await pool.execute(`
        SELECT 
          c.category_id,
          c.name,
          c.parent_id,
          p.name as parent_name,
          c.created_at,
          COUNT(pr.product_id) as product_count
        FROM categories c
        LEFT JOIN categories p ON c.parent_id = p.category_id
        LEFT JOIN products pr ON c.category_id = pr.category_id
        GROUP BY c.category_id, c.name, c.parent_id, p.name, c.created_at
        ORDER BY c.parent_id, c.name
      `);

      return categories;
    } catch (error) {
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }
  }

  async createCategory(categoryData) {
    try {
      const [result] = await pool.execute(`
        INSERT INTO categories (name, parent_id)
        VALUES (?, ?)
      `, [categoryData.name, categoryData.parent_id || null]);

      const [newCategory] = await pool.execute(`
        SELECT 
          c.category_id,
          c.name,
          c.parent_id,
          p.name as parent_name,
          c.created_at
        FROM categories c
        LEFT JOIN categories p ON c.parent_id = p.category_id
        WHERE c.category_id = ?
      `, [result.insertId]);

      return newCategory[0];
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('Category name already exists');
      }
      throw new Error(`Failed to create category: ${error.message}`);
    }
  }
}

module.exports = new AdminService();
