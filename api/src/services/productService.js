const { pool } = require('../config/database');
const { getPagination } = require('../utils/helpers'); // Assuming this helper exists

class ProductService {

  /**
   * Converts MySQL's '?' placeholders to PostgreSQL's positional '$1, $2, $3...'
   */
  static buildPostgresQuery(sql, params) {
    if (!params) return [sql, []];
    let index = 1;
    const newSql = sql.replace(/\?/g, () => `$${index++}`);
    return [newSql, params];
  }

  /**
   * Executes a database query using the pg pool.
   * ✅ FIX: This helper MUST return the *entire result* object, not just result.rows,
   * so that we can check result.rowCount for UPDATE/DELETE statements.
   */
  async executeQuery(sql, params = []) {
    const [query, pgParams] = ProductService.buildPostgresQuery(sql, params);
    const result = await pool.query(query, pgParams);
    return result; 
  }

  // ------------------------------------------------------------------
  // Public Methods (Corrected: 'category_id', 'is_active', 'product_images' removed)
  // ------------------------------------------------------------------

  async getProducts(filters = {}) {
    const {
      page = 1,
      limit = 10,
      category, // ✅ Use varchar category
      search,
      min_price,
      max_price,
      in_stock,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = filters;

    const { offset, limit: queryLimit } = getPagination(page, limit);

    try {
      let whereConditions = []; // ✅ Removed 'is_active'
      let queryParams = [];

      // --- Filters ---
      if (category) {
        whereConditions.push('p.category = ?'); // ✅ Use varchar category
        queryParams.push(category);
      }
      if (search) {
        const term = String(search).trim();
        whereConditions.push('(p.name ILIKE ? OR p.description ILIKE ? OR p.sku ILIKE ?)');
        const likeTerm = `%${term}%`;
        queryParams.push(likeTerm, likeTerm, likeTerm);
      }
      if (min_price) {
        whereConditions.push('p.price >= ?');
        queryParams.push(min_price);
      }
      if (max_price) {
        whereConditions.push('p.price <= ?');
        queryParams.push(max_price);
      }
      if (in_stock) {
        whereConditions.push('p.stock_quantity > 0');
      }

      const whereClause =
        whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // --- Sorting ---
      const allowedSortBy = ['created_at', 'price', 'name', 'stock_quantity'];
      const allowedSortOrder = ['ASC', 'DESC'];
      const sortBy = allowedSortBy.includes(sort_by) ? sort_by : 'created_at';
      const sortOrder = allowedSortOrder.includes(sort_order.toUpperCase())
        ? sort_order.toUpperCase()
        : 'DESC';

      // --- Count query ---
      const countQuery = `SELECT COUNT(*)::INT as total FROM products p ${whereClause}`;
      // ✅ FIX: Read from result.rows for SELECT
      const countResult = await this.executeQuery(countQuery, queryParams); 
      const total = parseInt(countResult.rows[0].total);

      // --- Products query ---
      const productsQuery = `
        SELECT 
          p.product_id, p.name, p.description, p.price, p.stock_quantity, p.sku,
          p.image_url, p.brand, p.created_at,
          p.category as category_name,
          COALESCE(AVG(r.rating), 0) as average_rating,
          COUNT(r.review_id) as review_count
        FROM products p
        LEFT JOIN reviews r ON p.product_id = r.product_id
        ${whereClause}
        GROUP BY 
          p.product_id, p.category, p.name, p.description, p.price, 
          p.stock_quantity, p.sku, p.image_url, p.brand, p.created_at
        ORDER BY p.${sortBy} ${sortOrder}
        LIMIT ? OFFSET ?
      `;

      const productParams = [...queryParams, queryLimit, offset]; 
      // ✅ FIX: Read from result.rows for SELECT
      const productsResult = await this.executeQuery(productsQuery, productParams); 
      const products = productsResult.rows;

      // ✅ FIX: Removed loop for non-existent 'product_images' table.

      return {
        success: true,
        data: {
          products,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      };
    } catch (error) {
      console.error('❌ POSTGRESQL SQL ERROR in getProducts:', error.message, error.stack); 
      throw new Error(`Failed to get products: ${error.message}`);
    }
  }

  async searchProducts(searchTerm, filters = {}) {
    try {
      return await this.getProducts({ ...filters, search: String(searchTerm) });
    } catch (error) {
      throw new Error(`Failed to search products: ${error.message}`);
    }
  }

  async getProductById(productId) {
    try {
      const productsQuery = `
        SELECT 
          p.product_id, p.name, p.description, p.price, p.stock_quantity, p.sku,
          p.image_url, p.brand, p.created_at, p.category as category_name,
          COALESCE(AVG(r.rating), 0) as average_rating, COUNT(r.review_id) as review_count
        FROM products p
        LEFT JOIN reviews r ON p.product_id = r.product_id
        WHERE p.product_id = ?
        GROUP BY 
          p.product_id, p.category, p.name, p.description, p.price, 
          p.stock_quantity, p.sku, p.image_url, p.brand, p.created_at
      `;
      // ✅ FIX: Read from result.rows for SELECT
      const productsResult = await this.executeQuery(productsQuery, [productId]);

      if (productsResult.rows.length === 0) {
        throw new Error('Product not found');
      }
      const product = productsResult.rows[0];
      
      // ✅ FIX: Removed 'product_images' query
      
      const relatedProductsQuery = `
        SELECT product_id, name, price, image_url, sku
        FROM products 
        WHERE category = ? AND product_id != ?
        LIMIT 4
      `;
      // ✅ FIX: Read from result.rows for SELECT
      const relatedProductsResult = await this.executeQuery(relatedProductsQuery, [product.category_name, productId]);
      product.related_products = relatedProductsResult.rows;

      return { success: true, data: product };
    } catch (error) {
      throw new Error(`Failed to get product: ${error.message}`);
    }
  }

  async getCategories() {
    try {
      const categoriesQuery = `
        SELECT 
          category as name,
          COUNT(product_id)::INT as product_count
        FROM products
        WHERE category IS NOT NULL
        GROUP BY category
        ORDER BY category
      `;
      // ✅ FIX: Read from result.rows for SELECT
      const categoriesResult = await this.executeQuery(categoriesQuery);
      return { success: true, data: categoriesResult.rows };
    } catch (error) {
      throw new Error(`Failed to get categories: ${error.message}`);
    }
  }
  
  async createProduct(productData) {
    const { name, description, category, price, stock_quantity, sku, brand = 'HP', image_url } = productData;

    try {
      // ✅ FIX: Read from result.rows for SELECT
      const existingProducts = await this.executeQuery(
        'SELECT product_id FROM products WHERE sku = ?',
        [sku]
      );

      if (existingProducts.rows.length > 0) {
        throw new Error('Product with this SKU already exists');
      }

      const insertQuery = `
        INSERT INTO products (name, description, category, price, stock_quantity, sku, brand, image_url) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        RETURNING product_id
      `;
      // ✅ FIX: Read from result.rows for SELECT (RETURNING)
      const result = await this.executeQuery(insertQuery, [name, description, category, price, stock_quantity, sku, brand, image_url]);

      return {
        success: true,
        message: 'Product created successfully',
        data: { product_id: result.rows[0].product_id }
      };
    } catch (error) {
      if (error.code === '23505') {
        throw new Error('Product with this SKU already exists');
      }
      throw new Error(`Failed to create product: ${error.message}`);
    }
  }

  async updateProduct(productId, productData) {
    const { name, description, category, price, stock_quantity, sku, brand, image_url } = productData;

    try {
      const updateQuery = `
        UPDATE products 
        SET name = ?, description = ?, category = ?, price = ?, stock_quantity = ?, sku = ?, brand = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP
        WHERE product_id = ?
      `;
      // ✅ FIX: Check result.rowCount
      const result = await this.executeQuery(updateQuery, [name, description, category, price, stock_quantity, sku, brand, image_url, productId]);

      if (result.rowCount === 0) {
        throw new Error('Product not found');
      }

      return {
        success: true,
        message: 'Product updated successfully'
      };
    } catch (error) {
      if (error.code === '23505') {
        throw new Error('Product with this SKU already exists');
      }
      throw new Error(`Failed to update product: ${error.message}`);
    }
  }

  async deleteProduct(productId) {
    try {
      // ✅ FIX: Check result.rowCount
      const result = await this.executeQuery(
        'DELETE FROM products WHERE product_id = ?',
        [productId]
      );

      if (result.rowCount === 0) {
        throw new Error('Product not found');
      }

      return {
        success: true,
        message: 'Product deleted successfully'
      };
    } catch (error) {
      throw new Error(`Failed to delete product: ${error.message}`);
    }
  }

  async updateStock(productId, quantity, reason = 'adjustment') {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        'UPDATE products SET stock_quantity = stock_quantity + $1, updated_at = CURRENT_TIMESTAMP WHERE product_id = $2',
        [quantity, productId]
      );
      
      // ✅ FIX: Commented out query to non-existent 'inventory_movements' table
      // await client.query(
      //   'INSERT INTO inventory_movements (product_id, delta_quantity, reason, created_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)',
      //   [productId, quantity, reason]
      // );
      
      await client.query('COMMIT');
      
      return {
        success: true,
        message: 'Stock updated successfully'
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getFeaturedProducts(limit = 8) {
    try {
      const productsQuery = `
        SELECT 
          p.product_id, p.name, p.price, p.image_url, p.sku,
          COALESCE(AVG(r.rating), 0) as average_rating,
          COUNT(r.review_id) as review_count
        FROM products p
        LEFT JOIN reviews r ON p.product_id = r.product_id
        WHERE p.stock_quantity > 0
        GROUP BY p.product_id
        ORDER BY average_rating DESC, p.created_at DESC
        LIMIT ?
      `;
      // ✅ FIX: Read from result.rows for SELECT
      const productsResult = await this.executeQuery(productsQuery, [limit]);
      return {
        success: true,
        data: productsResult.rows
      };
    } catch (error) {
      throw new Error(`Failed to get featured products: ${error.message}`);
    }
  }
}

module.exports = new ProductService();