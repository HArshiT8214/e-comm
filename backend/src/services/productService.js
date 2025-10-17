



// const { pool } = require('../config/database');
// const { getPagination } = require('../utils/helpers');

// class ProductService {
//   // async getProducts(filters = {}) {
//   //   const {
//   //     page = 1,
//   //     limit = 10,
//   //     category_id,
//   //     search,
//   //     min_price,
//   //     max_price,
//   //     in_stock,
//   //     sort_by = 'created_at',
//   //     sort_order = 'DESC'
//   //   } = filters;

//   //   const { offset, limit: queryLimit } = getPagination(page, limit);

//   //   try {
//   //     let whereConditions = ['p.is_active = 1'];
//   //     let baseParams = [];
//   //     let queryParams = [];

//   //     // Build WHERE clause
//   //     if (category_id) {
//   //       whereConditions.push('p.category_id = ?');
//   //       baseParams.push(category_id);
//   //     }

//   //     if (search) {
//   //       whereConditions.push('(p.name LIKE ? OR p.description LIKE ? OR p.sku LIKE ?)');
//   //       const searchTerm = `%${search}%`;
//   //       baseParams.push(searchTerm, searchTerm, searchTerm);
//   //     }

//   //     if (min_price) {
//   //       whereConditions.push('p.price >= ?');
//   //       baseParams.push(min_price);
//   //     }

//   //     if (max_price) {
//   //       whereConditions.push('p.price <= ?');
//   //       baseParams.push(max_price);
//   //     }

//   //     if (in_stock) {
//   //       whereConditions.push('p.stock_quantity > 0');
//   //     }

//   //     const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

//   //     // Whitelist sort_by and sort_order
//   //     const allowedSortBy = ['created_at', 'price', 'name', 'stock_quantity'];
//   //     const allowedSortOrder = ['ASC', 'DESC'];

//   //     const sortBy = allowedSortBy.includes(sort_by) ? sort_by : 'created_at';
//   //     const sortOrder = allowedSortOrder.includes(sort_order.toUpperCase()) ? sort_order.toUpperCase() : 'DESC';

//   //     // --- Count query ---
//   //     const countQuery = `
//   //       SELECT COUNT(*) as total 
//   //       FROM products p 
//   //       ${whereClause}
//   //     `;
//   //     const [countResult] = await pool.execute(countQuery, queryParams);
//   //     const total = countResult[0].total;

//   //     // --- Products query ---
//   //     const productsQuery = `
//   //       SELECT 
//   //         p.product_id,
//   //         p.name,
//   //         p.description,
//   //         p.price,
//   //         p.stock_quantity,
//   //         p.sku,
//   //         p.image_url,
//   //         p.brand,
//   //         p.created_at,
//   //         c.name as category_name,
//   //         c.category_id,
//   //         COALESCE(AVG(r.rating), 0) as average_rating,
//   //         COUNT(r.review_id) as review_count
//   //       FROM products p
//   //       LEFT JOIN categories c ON p.category_id = c.category_id
//   //       LEFT JOIN reviews r ON p.product_id = r.product_id
//   //       ${whereClause}
//   //       GROUP BY p.product_id, p.name, p.description, p.price, p.stock_quantity, p.sku, p.image_url, p.brand, p.created_at, c.name, c.category_id
//   //       ORDER BY p.${sortBy} ${sortOrder}
//   //       LIMIT ${queryLimit} OFFSET ${offset}
//   //     `;

//   //     // const productParams = [...baseParams, queryLimit, offset];
//   //     // const [products] = await pool.execute(productsQuery, productParams);
//   //     const productParams = [...baseParams, Number(queryLimit), Number(offset)];
//   //     console.log("👉 queryLimit:", queryLimit, "offset:", offset);
//   //     console.log("👉 baseParams:", baseParams);
//   //     console.log("👉 productParams:", productParams);
//   //     const [products] = await pool.execute(productsQuery, productParams);


//   //     // Attach product images
//   //     for (let product of products) {
//   //       const [images] = await pool.execute(
//   //         'SELECT url, alt_text, display_order FROM product_images WHERE product_id = ? ORDER BY display_order',
//   //         [product.product_id]
//   //       );
//   //       product.images = images;
//   //     }

//   //     return {
//   //       success: true,
//   //       data: {
//   //         products,
//   //         pagination: {
//   //           page: parseInt(page),
//   //           limit: parseInt(limit),
//   //           total,
//   //           pages: Math.ceil(total / limit)
//   //         }
//   //       }
//   //     };
//   //   } catch (error) {
//   //     console.error("❌ SQL ERROR in getProducts:", error.sqlMessage || error.message, {
//   //       sql: error.sql,
//   //       params: error.parameters || error.values
//   //     });
//   //     throw new Error(`Failed to get products: ${error.message}`);
//   //   }
//   // }



//   async getProducts(filters = {}) {
//     const {
//       page = 1,
//       limit = 10,
//       category_id,
//       search,
//       min_price,
//       max_price,
//       in_stock,
//       sort_by = 'created_at',
//       sort_order = 'DESC'
//     } = filters;

//     const { offset, limit: queryLimit } = getPagination(page, limit);

//     try {
//       let whereConditions = ['p.is_active = 1'];
//       let queryParams = [];   // ✅ always initialize as array

//       // --- Filters ---
//       if (category_id) {
//         whereConditions.push('p.category_id = ?');
//         queryParams.push(category_id);
//       }

//       if (search) {
//         const term = String(search).trim();   // ✅ force string
//         whereConditions.push('(p.name LIKE ? OR p.description LIKE ? OR p.sku LIKE ?)');
//         const likeTerm = `%${term}%`;
//         queryParams.push(likeTerm, likeTerm, likeTerm);
//       }

//       if (min_price) {
//         whereConditions.push('p.price >= ?');
//         queryParams.push(min_price);
//       }

//       if (max_price) {
//         whereConditions.push('p.price <= ?');
//         queryParams.push(max_price);
//       }

//       if (in_stock) {
//         whereConditions.push('p.stock_quantity > 0');
//       }

//       const whereClause =
//         whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

//       // --- Sorting (whitelisted) ---
//       const allowedSortBy = ['created_at', 'price', 'name', 'stock_quantity'];
//       const allowedSortOrder = ['ASC', 'DESC'];

//       const sortBy = allowedSortBy.includes(sort_by) ? sort_by : 'created_at';
//       const sortOrder = allowedSortOrder.includes(sort_order.toUpperCase())
//         ? sort_order.toUpperCase()
//         : 'DESC';

//       // --- Count query ---
//       const countQuery = `
//         SELECT COUNT(*) as total 
//         FROM products p 
//         ${whereClause}
//       `;
//       const [countResult] = await pool.execute(countQuery, queryParams);
//       const total = countResult[0].total;

//       // --- Products query ---
//       const productsQuery = `
//         SELECT 
//           p.product_id,
//           p.name,
//           p.description,
//           p.price,
//           p.stock_quantity,
//           p.sku,
//           p.image_url,
//           p.brand,
//           p.created_at,
//           c.name as category_name,
//           c.category_id,
//           COALESCE(AVG(r.rating), 0) as average_rating,
//           COUNT(r.review_id) as review_count
//         FROM products p
//         LEFT JOIN categories c ON p.category_id = c.category_id
//         LEFT JOIN reviews r ON p.product_id = r.product_id
//         ${whereClause}
//         GROUP BY p.product_id, p.name, p.description, p.price, p.stock_quantity, p.sku,
//                  p.image_url, p.brand, p.created_at, c.name, c.category_id
//         ORDER BY p.${sortBy} ${sortOrder}
//         LIMIT ? OFFSET ?
//       `;

//       const productParams = [...queryParams, queryLimit, offset];  // ✅ safe now
//       console.log('Executing SQL:', productsQuery, productParams); // debug log

//       const [products] = await pool.execute(productsQuery, productParams);

//       // --- Attach product images ---
//       for (let product of products) {
//         const [images] = await pool.execute(
//           'SELECT url, alt_text, display_order FROM product_images WHERE product_id = ? ORDER BY display_order',
//           [product.product_id]
//         );
//         product.images = images;
//       }

//       return {
//         success: true,
//         data: {
//           products,
//           pagination: {
//             page: parseInt(page),
//             limit: parseInt(limit),
//             total,
//             pages: Math.ceil(total / limit)
//           }
//         }
//       };
//     } catch (error) {
//       console.error('❌ SQL ERROR in getProducts:', error.message, {
//         sql: error.sql,
//         params: error.parameters || error.values
//       });
//       throw new Error(`Failed to get products: ${error.message}`);
//     }
//   }


//   // ✅ Search products with pagination + total count
//   // Inside ProductService class

//   async searchProducts(searchTerm, filters = {}) {
//     try {
//       return await this.getProducts({
//         ...filters,
//         search: String(searchTerm)   // ✅ force string
//       });
//     } catch (error) {
//       console.error('❌ SQL ERROR in searchProducts:', error.message, {
//         sql: error.sql,
//         params: error.parameters || error.values
//       });
//       throw new Error(`Failed to search products: ${error.message}`);
//     }
//   }







//   // Get product by ID
//   async getProductById(productId) {
//     try {
//       const [products] = await pool.execute(
//         `SELECT 
//           p.product_id,
//           p.name,
//           p.description,
//           p.price,
//           p.stock_quantity,
//           p.sku,
//           p.image_url,
//           p.brand,
//           p.created_at,
//           c.name as category_name,
//           c.category_id,
//           COALESCE(AVG(r.rating), 0) as average_rating,
//           COUNT(r.review_id) as review_count
//         FROM products p
//         LEFT JOIN categories c ON p.category_id = c.category_id
//         LEFT JOIN reviews r ON p.product_id = r.product_id
//         WHERE p.product_id = ? AND p.is_active = 1
//         GROUP BY p.product_id, p.name, p.description, p.price, p.stock_quantity, p.sku, p.image_url, p.brand, p.created_at, c.name, c.category_id`,
//         [productId]
//       );

//       if (products.length === 0) {
//         throw new Error('Product not found');
//       }

//       const product = products[0];

//       // Get product images
//       const [images] = await pool.execute(
//         'SELECT url, alt_text, display_order FROM product_images WHERE product_id = ? ORDER BY display_order',
//         [productId]
//       );
//       product.images = images;

//       // Get related products (same category)
//       const [relatedProducts] = await pool.execute(
//         `SELECT 
//           product_id,
//           name,
//           price,
//           image_url,
//           sku
//         FROM products 
//         WHERE category_id = ? AND product_id != ? AND is_active = 1 
//         LIMIT 4`,
//         [product.category_id, productId]
//       );
//       product.related_products = relatedProducts;

//       return {
//         success: true,
//         data: product
//       };
//     } catch (error) {
//       throw new Error(`Failed to get product: ${error.message}`);
//     }
//   }

//   // Get categories
//   async getCategories() {
//     try {
//       const [categories] = await pool.execute(
//         `SELECT 
//           c.category_id,
//           c.name,
//           c.parent_id,
//           COUNT(p.product_id) as product_count
//         FROM categories c
//         LEFT JOIN products p ON c.category_id = p.category_id AND p.is_active = 1
//         GROUP BY c.category_id, c.name, c.parent_id
//         ORDER BY c.name`
//       );

//       return {
//         success: true,
//         data: categories
//       };
//     } catch (error) {
//       throw new Error(`Failed to get categories: ${error.message}`);
//     }
//   }

//   // Create product (admin only)
//   async createProduct(productData) {
//     const { name, description, category_id, price, stock_quantity, sku, brand = 'HP', image_url } = productData;

//     try {
//       // Check if SKU already exists
//       const [existingProducts] = await pool.execute(
//         'SELECT product_id FROM products WHERE sku = ?',
//         [sku]
//       );

//       if (existingProducts.length > 0) {
//         throw new Error('Product with this SKU already exists');
//       }

//       const [result] = await pool.execute(
//         `INSERT INTO products (name, description, category_id, price, stock_quantity, sku, brand, image_url, is_active) 
//          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
//         [name, description, category_id, price, stock_quantity, sku, brand, image_url]
//       );

//       return {
//         success: true,
//         message: 'Product created successfully',
//         data: { product_id: result.insertId }
//       };
//     } catch (error) {
//       throw new Error(`Failed to create product: ${error.message}`);
//     }
//   }

//   // Update product (admin only)
//   async updateProduct(productId, productData) {
//     const { name, description, category_id, price, stock_quantity, sku, brand, image_url } = productData;

//     try {
//       const [result] = await pool.execute(
//         `UPDATE products 
//          SET name = ?, description = ?, category_id = ?, price = ?, stock_quantity = ?, sku = ?, brand = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP 
//          WHERE product_id = ?`,
//         [name, description, category_id, price, stock_quantity, sku, brand, image_url, productId]
//       );

//       if (result.affectedRows === 0) {
//         throw new Error('Product not found');
//       }

//       return {
//         success: true,
//         message: 'Product updated successfully'
//       };
//     } catch (error) {
//       throw new Error(`Failed to update product: ${error.message}`);
//     }
//   }

//   // Delete product (admin only)
//   async deleteProduct(productId) {
//     try {
//       // Soft delete by setting is_active to 0
//       const [result] = await pool.execute(
//         'UPDATE products SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE product_id = ?',
//         [productId]
//       );

//       if (result.affectedRows === 0) {
//         throw new Error('Product not found');
//       }

//       return {
//         success: true,
//         message: 'Product deleted successfully'
//       };
//     } catch (error) {
//       throw new Error(`Failed to delete product: ${error.message}`);
//     }
//   }

//   // Update stock quantity
//   async updateStock(productId, quantity, reason = 'adjustment') {
//     try {
//       // Update product stock
//       await pool.execute(
//         'UPDATE products SET stock_quantity = stock_quantity + ?, updated_at = CURRENT_TIMESTAMP WHERE product_id = ?',
//         [quantity, productId]
//       );

//       // Record inventory movement
//       await pool.execute(
//         'INSERT INTO inventory_movements (product_id, delta_quantity, reason) VALUES (?, ?, ?)',
//         [productId, quantity, reason]
//       );

//       return {
//         success: true,
//         message: 'Stock updated successfully'
//       };
//     } catch (error) {
//       throw new Error(`Failed to update stock: ${error.message}`);
//     }
//   }

//   // // Search products
//   // async searchProducts(searchTerm, filters = {}) {
//   //   const searchFilters = {
//   //     ...filters,
//   //     search: searchTerm
//   //   };
//   //   return this.getProducts(searchFilters);
//   // }

//   // Get featured products
//   async getFeaturedProducts(limit = 8) {
//     try {
//       const [products] = await pool.execute(
//         `SELECT 
//           p.product_id,
//           p.name,
//           p.price,
//           p.image_url,
//           p.sku,
//           COALESCE(AVG(r.rating), 0) as average_rating,
//           COUNT(r.review_id) as review_count
//         FROM products p
//         LEFT JOIN reviews r ON p.product_id = r.product_id
//         WHERE p.is_active = 1 AND p.stock_quantity > 0
//         GROUP BY p.product_id, p.name, p.price, p.image_url, p.sku
//         ORDER BY average_rating DESC, p.created_at DESC
//         LIMIT ?`,
//         [limit]
//       );

//       return {
//         success: true,
//         data: products
//       };
//     } catch (error) {
//       throw new Error(`Failed to get featured products: ${error.message}`);
//     }
//   }
// }



// module.exports = new ProductService();



// ----------------- new  -------------------

const { pool } = require('../config/database');
const { getPagination } = require('../utils/helpers');

class ProductService {


  async getProducts({ page = 1, limit = 20, sort_by = "created_at", sort_order = "DESC" }) {
    const offset = (page - 1) * limit;
    const queryParams = [];

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
      WHERE p.is_active = 1
      GROUP BY p.product_id, p.name, p.description, p.price, p.stock_quantity, p.sku,
               p.image_url, p.brand, p.created_at, c.name, c.category_id
      ORDER BY p.${sort_by} ${sort_order}
      LIMIT ${Number(limit)} OFFSET ${Number(offset)}
    `;

    const productParams = [...queryParams, Number(limit), Number(offset)];
    console.log("👉 Final Params:", productParams);

    const [products] = await pool.execute(productsQuery, productParams);

    // Count query for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM products p
      WHERE p.is_active = 1
    `;
    const [countResult] = await pool.execute(countQuery, queryParams || []);
    const total = countResult[0].total;

    return {
      success: true,
      data: {
        products,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }









  // async getProducts(filters = {}) {
  //   const {
  //     page = 1,
  //     limit = 10,
  //     category_id,
  //     search,
  //     min_price,
  //     max_price,
  //     in_stock,
  //     sort_by = 'created_at',
  //     sort_order = 'DESC'
  //   } = filters;

  //   const { offset, limit: queryLimit } = getPagination(page, limit);

  //   try {
  //     let whereConditions = ['p.is_active = 1'];
  //     let queryParams = [];   // ✅ always an array

  //     // --- Filters ---
  //     if (category_id) {
  //       whereConditions.push('p.category_id = ?');
  //       queryParams.push(category_id);
  //     }

  //     if (search) {
  //       const term = String(search).trim();
  //       whereConditions.push('(p.name LIKE ? OR p.description LIKE ? OR p.sku LIKE ?)');
  //       const likeTerm = `%${term}%`;
  //       queryParams.push(likeTerm, likeTerm, likeTerm);
  //     }

  //     if (min_price) {
  //       whereConditions.push('p.price >= ?');
  //       queryParams.push(min_price);
  //     }

  //     if (max_price) {
  //       whereConditions.push('p.price <= ?');
  //       queryParams.push(max_price);
  //     }

  //     if (in_stock) {
  //       whereConditions.push('p.stock_quantity > 0');
  //     }

  //     const whereClause =
  //       whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  //     // --- Sorting (whitelisted) ---
  //     const allowedSortBy = ['created_at', 'price', 'name', 'stock_quantity'];
  //     const allowedSortOrder = ['ASC', 'DESC'];

  //     const sortBy = allowedSortBy.includes(sort_by) ? sort_by : 'created_at';
  //     const sortOrder = allowedSortOrder.includes(sort_order.toUpperCase())
  //       ? sort_order.toUpperCase()
  //       : 'DESC';

  //     // --- Count query ---
  //     const countQuery = `
  //       SELECT COUNT(*) as total 
  //       FROM products p 
  //       ${whereClause}
  //     `;
  //     const [countResult] = await pool.execute(countQuery, queryParams || []); // ✅ safe
  //     const total = countResult[0].total;

  //     // --- Products query ---
  //     const productsQuery = `
  //     SELECT 
  //       p.product_id, p.name, p.description, p.price, p.stock_quantity, p.sku,
  //       p.image_url, p.brand, p.created_at,
  //       c.name as category_name, c.category_id,
  //       COALESCE(AVG(r.rating), 0) as average_rating,
  //       COUNT(r.review_id) as review_count
  //     FROM products p
  //     LEFT JOIN categories c ON p.category_id = c.category_id
  //     LEFT JOIN reviews r ON p.product_id = r.product_id
  //     ${whereClause}
  //     GROUP BY p.product_id, p.name, p.description, p.price, p.stock_quantity, p.sku,
  //              p.image_url, p.brand, p.created_at, c.name, c.category_id
  //     ORDER BY p.${sortBy} ${sortOrder}
  //     LIMIT ? OFFSET ?
  //   `;

  //     const productParams = [...queryParams, queryLimit, offset];

  //     // const productParams = [...queryParams, Number(queryLimit), Number(offset)];
  //     console.log('Executing SQL:', productsQuery, productParams);

  //     const [products] = await pool.execute(productsQuery, productParams);

  //     // --- Attach product images ---
  //     for (let product of products) {
  //       const [images] = await pool.execute(
  //         'SELECT url, alt_text, display_order FROM product_images WHERE product_id = ? ORDER BY display_order',
  //         [product.product_id]
  //       );
  //       product.images = images;
  //     }

  //     return {
  //       success: true,
  //       data: {
  //         products,
  //         pagination: {
  //           page: parseInt(page),
  //           limit: parseInt(limit),
  //           total,
  //           pages: Math.ceil(total / limit)
  //         }
  //       }
  //     };
  //   } catch (error) {
  //     console.error('❌ SQL ERROR in getProducts:', error.message, {
  //       sql: error.sql,
  //       params: error.parameters || error.values
  //     });
  //     throw new Error(`Failed to get products: ${error.message}`);
  //   }
  // }

  // ✅ Search products
  async searchProducts(searchTerm, filters = {}) {
    try {
      return await this.getProducts({
        ...filters,
        search: String(searchTerm)
      });
    } catch (error) {
      console.error('❌ SQL ERROR in searchProducts:', error.message, {
        sql: error.sql,
        params: error.parameters || error.values
      });
      throw new Error(`Failed to search products: ${error.message}`);
    }
  }

  // Get product by ID
  async getProductById(productId) {
    try {
      const [products] = await pool.execute(
        `SELECT 
          p.product_id,
          p.name,
          p.description,
          p.price,
          p.stock_quantity,
          p.sku,
          p.image_url,
          p.brand,
          p.created_at,
          c.name as category_name,
          c.category_id,
          COALESCE(AVG(r.rating), 0) as average_rating,
          COUNT(r.review_id) as review_count
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.category_id
        LEFT JOIN reviews r ON p.product_id = r.product_id
        WHERE p.product_id = ? AND p.is_active = 1
        GROUP BY p.product_id, p.name, p.description, p.price, p.stock_quantity, p.sku, p.image_url, p.brand, p.created_at, c.name, c.category_id`,
        [productId]
      );

      if (products.length === 0) {
        throw new Error('Product not found');
      }

      const product = products[0];

      // Get product images
      const [images] = await pool.execute(
        'SELECT url, alt_text, display_order FROM product_images WHERE product_id = ? ORDER BY display_order',
        [productId]
      );
      product.images = images;

      // Get related products
      const [relatedProducts] = await pool.execute(
        `SELECT 
          product_id,
          name,
          price,
          image_url,
          sku
        FROM products 
        WHERE category_id = ? AND product_id != ? AND is_active = 1 
        LIMIT 4`,
        [product.category_id, productId]
      );
      product.related_products = relatedProducts;

      return {
        success: true,
        data: product
      };
    } catch (error) {
      throw new Error(`Failed to get product: ${error.message}`);
    }
  }

  // Get categories
  async getCategories() {
    try {
      const [categories] = await pool.execute(
        `SELECT 
          c.category_id,
          c.name,
          c.parent_id,
          COUNT(p.product_id) as product_count
        FROM categories c
        LEFT JOIN products p ON c.category_id = p.category_id AND p.is_active = 1
        GROUP BY c.category_id, c.name, c.parent_id
        ORDER BY c.name`
      );

      return {
        success: true,
        data: categories
      };
    } catch (error) {
      throw new Error(`Failed to get categories: ${error.message}`);
    }
  }

  // Create product (admin only)
  async createProduct(productData) {
    const { name, description, category_id, price, stock_quantity, sku, brand = 'HP', image_url } = productData;

    try {
      const [existingProducts] = await pool.execute(
        'SELECT product_id FROM products WHERE sku = ?',
        [sku]
      );

      if (existingProducts.length > 0) {
        throw new Error('Product with this SKU already exists');
      }

      const [result] = await pool.execute(
        `INSERT INTO products (name, description, category_id, price, stock_quantity, sku, brand, image_url, is_active) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [name, description, category_id, price, stock_quantity, sku, brand, image_url]
      );

      return {
        success: true,
        message: 'Product created successfully',
        data: { product_id: result.insertId }
      };
    } catch (error) {
      throw new Error(`Failed to create product: ${error.message}`);
    }
  }

  // Update product (admin only)
  async updateProduct(productId, productData) {
    const { name, description, category_id, price, stock_quantity, sku, brand, image_url } = productData;

    try {
      const [result] = await pool.execute(
        `UPDATE products 
         SET name = ?, description = ?, category_id = ?, price = ?, stock_quantity = ?, sku = ?, brand = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE product_id = ?`,
        [name, description, category_id, price, stock_quantity, sku, brand, image_url, productId]
      );

      if (result.affectedRows === 0) {
        throw new Error('Product not found');
      }

      return {
        success: true,
        message: 'Product updated successfully'
      };
    } catch (error) {
      throw new Error(`Failed to update product: ${error.message}`);
    }
  }

  // Delete product (admin only)
  async deleteProduct(productId) {
    try {
      const [result] = await pool.execute(
        'UPDATE products SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE product_id = ?',
        [productId]
      );

      if (result.affectedRows === 0) {
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

  // Update stock
  async updateStock(productId, quantity, reason = 'adjustment') {
    try {
      await pool.execute(
        'UPDATE products SET stock_quantity = stock_quantity + ?, updated_at = CURRENT_TIMESTAMP WHERE product_id = ?',
        [quantity, productId]
      );

      await pool.execute(
        'INSERT INTO inventory_movements (product_id, delta_quantity, reason) VALUES (?, ?, ?)',
        [productId, quantity, reason]
      );

      return {
        success: true,
        message: 'Stock updated successfully'
      };
    } catch (error) {
      throw new Error(`Failed to update stock: ${error.message}`);
    }
  }

  // Featured products
  async getFeaturedProducts(limit = 8) {
    try {
      const [products] = await pool.execute(
        `SELECT 
          p.product_id,
          p.name,
          p.price,
          p.image_url,
          p.sku,
          COALESCE(AVG(r.rating), 0) as average_rating,
          COUNT(r.review_id) as review_count
        FROM products p
        LEFT JOIN reviews r ON p.product_id = r.product_id
        WHERE p.is_active = 1 AND p.stock_quantity > 0
        GROUP BY p.product_id, p.name, p.price, p.image_url, p.sku
        ORDER BY average_rating DESC, p.created_at DESC
        LIMIT ?`,
        [limit]
      );

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
