const { pool } = require('../config/database');

// NOTE: Ensure the executeQuery helper is defined globally or imported correctly
const executeQuery = async (sql, params = []) => {
    // This helper must convert '?' to '$1, $2, ...' and use pool.query
    const buildPostgresQuery = (s, p) => {
        let index = 1;
        const pgSql = s.replace(/\?/g, () => `$${index++}`);
        return [pgSql, p];
    };
    
    const [query, pgParams] = buildPostgresQuery(sql, params);

    // ✅ FIX: Return the *entire* result object, not just result.rows
    const result = await pool.query(query, pgParams);
    return result;
};

class ReviewService {
  // Add review
  async addReview(userId, productId, reviewData) {
    const { rating, comment } = reviewData;
    
    try {
      // 1. Check if user has purchased this product
      // ✅ FIX: Read from result.rows
      const purchases = await executeQuery(
        `SELECT 1 FROM order_items oi
         JOIN orders o ON oi.order_id = o.order_id
         WHERE o.user_id = ? AND oi.product_id = ? AND o.status = 'delivered'`,
        [userId, productId]
      );

      if (purchases.rows.length === 0) {
        throw new Error('You must purchase this product before reviewing it');
      }

      // 2. Check if user already reviewed this product
      // ✅ FIX: Read from result.rows
      const existingReviews = await executeQuery(
        'SELECT review_id FROM reviews WHERE user_id = ? AND product_id = ?',
        [userId, productId]
      );

      if (existingReviews.rows.length > 0) {
        throw new Error('You have already reviewed this product');
      }

      // 3. Add review
      // ✅ FIX: Read from result.rows
      const result = await executeQuery(
        'INSERT INTO reviews (user_id, product_id, rating, comment) VALUES (?, ?, ?, ?) RETURNING review_id',
        [userId, productId, rating, comment || null]
      );

      return {
        success: true,
        message: 'Review added successfully',
        data: { review_id: result.rows[0].review_id }
      };
    } catch (error) {
      throw new Error(`Failed to add review: ${error.message}`);
    }
  }

  // Get product reviews
  async getProductReviews(productId, filters = {}) {
    const { page = 1, limit = 10, rating } = filters;
    const offset = (page - 1) * limit;

    try {
      let whereClause = 'WHERE r.product_id = ?';
      let queryParams = [productId];

      if (rating) {
        whereClause += ' AND r.rating = ?';
        queryParams.push(rating);
      }

      // Get total count
      // ✅ FIX: Read from result.rows
      const countResult = await executeQuery(
        `SELECT COUNT(*) as total FROM reviews r ${whereClause}`,
        queryParams
      );
      const total = parseInt(countResult.rows[0].total);

      // Get reviews
      // ✅ FIX: Read from result.rows
      const reviewsResult = await executeQuery(
        `SELECT 
          r.review_id, r.rating, r.comment, r.created_at, u.first_name, u.last_name
        FROM reviews r
        JOIN users u ON r.user_id = u.user_id
        ${whereClause}
        ORDER BY r.created_at DESC
        LIMIT ? OFFSET ?`,
        [...queryParams, limit, offset]
      );

      // Get rating summary
      // ✅ FIX: Read from result.rows
      const ratingSummaryResult = await executeQuery(
        `SELECT 
          AVG(rating)::NUMERIC(10,2) as average_rating,
          COUNT(*)::INT as total_reviews,
          SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END)::INT as five_star,
          SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END)::INT as four_star,
          SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END)::INT as three_star,
          SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END)::INT as two_star,
          SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END)::INT as one_star
        FROM reviews WHERE product_id = ?`,
        [productId]
      );

      return {
        success: true,
        data: {
          reviews: reviewsResult.rows,
          rating_summary: ratingSummaryResult.rows[0],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      };
    } catch (error) {
      throw new Error(`Failed to get product reviews: ${error.message}`);
    }
  }

  // Get user reviews
  async getUserReviews(userId, filters = {}) {
    const { page = 1, limit = 10 } = filters;
    const offset = (page - 1) * limit;

    try {
      // Get total count
      // ✅ FIX: Read from result.rows
      const countResult = await executeQuery(
        'SELECT COUNT(*) as total FROM reviews WHERE user_id = ?',
        [userId]
      );
      const total = parseInt(countResult.rows[0].total);

      // Get reviews
      // ✅ FIX: Read from result.rows
      const reviewsResult = await executeQuery(
        `SELECT 
          r.review_id, r.rating, r.comment, r.created_at,
          p.name as product_name, p.image_url, p.sku
        FROM reviews r
        JOIN products p ON r.product_id = p.product_id
        WHERE r.user_id = ?
        ORDER BY r.created_at DESC
        LIMIT ? OFFSET ?`,
        [userId, limit, offset]
      );

      return {
        success: true,
        data: {
          reviews: reviewsResult.rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      };
    } catch (error) {
      throw new Error(`Failed to get user reviews: ${error.message}`);
    }
  }

  // Update review
  async updateReview(userId, reviewId, reviewData) {
    const { rating, comment } = reviewData;
    
    try {
      // Verify review belongs to user
      // ✅ FIX: Read from result.rows
      const reviews = await executeQuery(
        'SELECT review_id FROM reviews WHERE review_id = ? AND user_id = ?',
        [reviewId, userId]
      );

      if (reviews.rows.length === 0) {
        throw new Error('Review not found');
      }

      // ✅ FIX: Check result.rowCount
      const result = await executeQuery(
        'UPDATE reviews SET rating = ?, comment = ?, created_at = CURRENT_TIMESTAMP WHERE review_id = ?',
        [rating, comment, reviewId]
      );

      if (result.rowCount === 0) {
        throw new Error('Review not found');
      }

      return { success: true, message: 'Review updated successfully' };
    } catch (error) {
      throw new Error(`Failed to update review: ${error.message}`);
    }
  }

  // Delete review
  async deleteReview(userId, reviewId) {
    try {
      // ✅ FIX: Check result.rowCount
      const result = await executeQuery(
        'DELETE FROM reviews WHERE review_id = ? AND user_id = ?',
        [reviewId, userId]
      );

      if (result.rowCount === 0) {
        throw new Error('Review not found');
      }

      return { success: true, message: 'Review deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete review: ${error.message}`);
    }
  }

  // Get review statistics for product
  async getProductReviewStats(productId) {
    try {
      // ✅ FIX: Read from result.rows
      const statsResult = await executeQuery(
        `SELECT 
          AVG(rating)::NUMERIC(10,2) as average_rating,
          COUNT(*)::INT as total_reviews,
          SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END)::INT as five_star,
          SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END)::INT as four_star,
          SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END)::INT as three_star,
          SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END)::INT as two_star,
          SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END)::INT as one_star
        FROM reviews WHERE product_id = ?`,
        [productId]
      );

      return { success: true, data: statsResult.rows[0] };
    } catch (error) {
      throw new Error(`Failed to get review statistics: ${error.message}`);
    }
  }

  // Get recent reviews (admin)
  async getRecentReviews(limit = 10) {
    try {
      // ✅ FIX: Read from result.rows
      const reviewsResult = await executeQuery(
        `SELECT 
          r.review_id, r.rating, r.comment, r.created_at,
          u.first_name, u.last_name,
          p.name as product_name
        FROM reviews r
        JOIN users u ON r.user_id = u.user_id
        JOIN products p ON r.product_id = p.product_id
        ORDER BY r.created_at DESC
        LIMIT ?`,
        [limit]
      );

      return { success: true, data: reviewsResult.rows };
    } catch (error) {
      throw new Error(`Failed to get recent reviews: ${error.message}`);
    }
  }
}

module.exports = new ReviewService();