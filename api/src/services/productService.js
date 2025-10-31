const { pool } = require('../config/database');
const { getPagination } = require('../utils/helpers'); // Assuming this exists

class ProductService {

  /**
   * Converts MySQL's '?' placeholders to PostgreSQL's positional '$1, $2, $3...'
   */
  static buildPostgresQuery(sql, params) {
    if (!params) return [sql, []];
    let index = 1;
    // CRITICAL: Replace all '?' with $1, $2, etc., using the count of parameters
    const newSql = sql.replace(/\?/g, () => `$${index++}`);
    return [newSql, params];
  }

  /**
   * Executes a database query using the pg pool.
   */
  async executeQuery(sql, params = []) {
    const [query, pgParams] = ProductService.buildPostgresQuery(sql, params);
    // Use pool.query for pg, not pool.execute
    const result = await pool.query(query, pgParams);
    // For pg, results are in result.rows
    return result.rows;
  }

  // ------------------------------------------------------------------
  // Public Methods (Final PostgreSQL Queries)
  // ------------------------------------------------------------------

  async getProducts(filters = {}) {
    const {
      page = 1,
      limit = 10,
      category_id,
      search,
      min_price,
      max_price,
      in_stock,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = filters;

    const { offset, limit: queryLimit } = getPagination(page, limit);

    try {
      // ✅ FINAL FIX: Include products where is_active is NULL or TRUE
      let whereConditions = ['(p.is_active IS NULL OR p.is_active = TRUE)'];
      let queryParams = [];

      // --- Filters ---
      if (category_id) {
        whereConditions.push('p.category_id = ?');
        queryParams.push(category_id);
      }

      if (search) {
        const term = String(search).trim();
        // PostgreSQL uses ILIKE for case-insensitive search
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

      // --- Sorting (whitelisted) ---
      const allowedSortBy = ['created_at', 'price', 'name', 'stock_quantity'];
      const allowedSortOrder = ['ASC', 'DESC'];

      const sortBy = allowedSortBy.includes(sort_by) ? sort_by : 'created_at';
      const sortOrder = allowedSortOrder.includes(sort_order.toUpperCase())
        ? sort_order.toUpperCase()
        : 'DESC';

      // --- Count query ---
      // Using '::INT' to ensure correct typecasting for result
      const countQuery = `SELECT COUNT(*)::INT as total FROM products p ${whereClause}`;
      const countResult = await this.executeQuery(countQuery, queryParams);
      const total = parseInt(countResult[0].total);

      // --- Products query ---
      const productsQuery = `
        SELECT 
          p.product_id, p.name, p.description, p.price, p.stock_quantity, p.sku,
          p.image_url, p.brand, p.created_at,
          c.name as category_name, c.category_id,
          COALESCE(AVG(r.rating), 0) as average_rating,
          COUNT(r.review_id) as review_count
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.category_id
        LEFT JOIN reviews r ON p.product_id = r.product_id
        ${whereClause}
        GROUP BY 
          p.product_id, c.category_id, c.name, p.name, p.description, p.price, 
          p.stock_quantity, p.sku, p.image_url, p.brand, p.created_at
        ORDER BY p.${sortBy} ${sortOrder}
        LIMIT ? OFFSET ?
      `;

      // Pagination parameters are added to the end
      const productParams = [...queryParams, queryLimit, offset]; 
      const products = await this.executeQuery(productsQuery, productParams);

      // --- Attach product images ---
      for (let product of products) {
        const imagesQuery = 'SELECT url, alt_text, display_order FROM product_images WHERE product_id = ? ORDER BY display_order';
        const images = await this.executeQuery(imagesQuery, [product.product_id]);
        product.images = images;
      }

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
      // Calls the converted getProducts method
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
          p.image_url, p.brand, p.created_at, c.name as category_name, c.category_id,
          COALESCE(AVG(r.rating), 0) as average_rating, COUNT(r.review_id) as review_count
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.category_id
        LEFT JOIN reviews r ON p.product_id = r.product_id
        WHERE p.product_id = ? AND (p.is_active IS NULL OR p.is_active = TRUE)
        GROUP BY 
          p.product_id, c.category_id, c.name, p.name, p.description, p.price, 
          p.stock_quantity, p.sku, p.image_url, p.brand, p.created_at
      `;
      const products = await this.executeQuery(productsQuery, [productId]);

      if (products.length === 0) {
        throw new Error('Product not found');
      }
      const product = products[0];
      
      const images = await this.executeQuery('SELECT url, alt_text, display_order FROM product_images WHERE product_id = ? ORDER BY display_order', [product.product_id]);
      product.images = images;
      
      const relatedProductsQuery = `
        SELECT product_id, name, price, image_url, sku
        FROM products 
        WHERE category_id = ? AND product_id != ? AND (is_active IS NULL OR is_active = TRUE)
        LIMIT 4
      `;
      const relatedProducts = await this.executeQuery(relatedProductsQuery, [product.category_id, productId]);
      product.related_products = relatedProducts;

      return { success: true, data: product };
    } catch (error) {
      throw new Error(`Failed to get product: ${error.message}`);
    }
  }

  async getCategories() {
    try {
      const categoriesQuery = `
        SELECT 
          c.category_id,
          c.name,
          c.parent_id,
          COUNT(p.product_id)::INT as product_count
        FROM categories c
        LEFT JOIN products p ON c.category_id = p.category_id AND (p.is_active IS NULL OR p.is_active = TRUE)
        GROUP BY c.category_id
        ORDER BY c.name
      `;
      const categories = await this.executeQuery(categoriesQuery);
      return { success: true, data: categories };
    } catch (error) {
      throw new Error(`Failed to get categories: ${error.message}`);
    }
  }
  
  async createProduct(productData) {
    const { name, description, category_id, price, stock_quantity, sku, brand = 'HP', image_url } = productData;

    try {
      // Check if SKU already exists
      const existingProducts = await this.executeQuery(
        'SELECT product_id FROM products WHERE sku = ?',
        [sku]
      );

      if (existingProducts.length > 0) {
        throw new Error('Product with this SKU already exists');
      }

      const insertQuery = `
        INSERT INTO products (name, description, category_id, price, stock_quantity, sku, brand, image_url, is_active) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE)
        RETURNING product_id
      `;
      const result = await this.executeQuery(insertQuery, [name, description, category_id, price, stock_quantity, sku, brand, image_url]);

      return {
        success: true,
        message: 'Product created successfully',
        data: { product_id: result[0].product_id }
      };
    } catch (error) {
      // Check for PostgreSQL unique constraint violation (23505)
      if (error.code === '23505') {
        throw new Error('Product with this SKU already exists');
      }
      throw new Error(`Failed to create product: ${error.message}`);
    }
  }

  async updateProduct(productId, productData) {
    const { name, description, category_id, price, stock_quantity, sku, brand, image_url } = productData;
    // PostgreSQL uses CURRENT_TIMESTAMP or DB trigger for updated_at

    try {
      const updateQuery = `
        UPDATE products 
        SET name = ?, description = ?, category_id = ?, price = ?, stock_quantity = ?, sku = ?, brand = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP
        WHERE product_id = ?
      `;
      const result = await this.executeQuery(updateQuery, [name, description, category_id, price, stock_quantity, sku, brand, image_url, productId]);

      // pg returns row count in result.rowCount
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
      // Soft delete by setting is_active to FALSE
      const result = await this.executeQuery(
        'UPDATE products SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE product_id = ?',
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
    try {
      // Use client transaction for atomic update (best practice)
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Update product stock
        await client.query(
          'UPDATE products SET stock_quantity = stock_quantity + $1, updated_at = CURRENT_TIMESTAMP WHERE product_id = $2',
          [quantity, productId]
        );

        // Record inventory movement
        await client.query(
          'INSERT INTO inventory_movements (product_id, delta_quantity, reason, created_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)',
          [productId, quantity, reason]
        );
        
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
    } catch (error) {
      throw new Error(`Failed to update stock: ${error.message}`);
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
        WHERE (p.is_active IS NULL OR p.is_active = TRUE) AND p.stock_quantity > 0
        GROUP BY p.product_id
        ORDER BY average_rating DESC, p.created_at DESC
        LIMIT ?
      `;
      const products = await this.executeQuery(productsQuery, [limit]);

      return {
        success: true,
        data: products
      };
    } catch (error) {
      throw new Error(`Failed to get featured products: ${error.message}`);
    }
  }
}

module.exports = new ProductService();