const { pool } = require('../config/database');

class ReviewService {
  // Add review
  async addReview(userId, productId, reviewData) {
    const { rating, comment } = reviewData;
    
    try {
      // Check if user has purchased this product
      const [purchases] = await pool.execute(
        `SELECT 1 FROM order_items oi
         JOIN orders o ON oi.order_id = o.order_id
         WHERE o.user_id = ? AND oi.product_id = ? AND o.status = 'delivered'`,
        [userId, productId]
      );

      if (purchases.length === 0) {
        throw new Error('You must purchase this product before reviewing it');
      }

      // Check if user already reviewed this product
      const [existingReviews] = await pool.execute(
        'SELECT review_id FROM reviews WHERE user_id = ? AND product_id = ?',
        [userId, productId]
      );

      if (existingReviews.length > 0) {
        throw new Error('You have already reviewed this product');
      }

      // Add review
      const [result] = await pool.execute(
        'INSERT INTO reviews (user_id, product_id, rating, comment) VALUES (?, ?, ?, ?)',
        [userId, productId, rating, comment || null]
      );

      return {
        success: true,
        message: 'Review added successfully',
        data: { review_id: result.insertId }
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
      const [countResult] = await pool.execute(
        `SELECT COUNT(*) as total FROM reviews r ${whereClause}`,
        queryParams
      );
      const total = countResult[0].total;

      // Get reviews
      const [reviews] = await pool.execute(
        `SELECT 
          r.review_id,
          r.rating,
          r.comment,
          r.created_at,
          u.first_name,
          u.last_name
        FROM reviews r
        JOIN users u ON r.user_id = u.user_id
        ${whereClause}
        ORDER BY r.created_at DESC
        LIMIT ? OFFSET ?`,
        [...queryParams, limit, offset]
      );

      // Get rating summary
      const [ratingSummary] = await pool.execute(
        `SELECT 
          AVG(rating) as average_rating,
          COUNT(*) as total_reviews,
          SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
          SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
          SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
          SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
          SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
        FROM reviews WHERE product_id = ?`,
        [productId]
      );

      return {
        success: true,
        data: {
          reviews,
          rating_summary: ratingSummary[0],
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
      const [countResult] = await pool.execute(
        'SELECT COUNT(*) as total FROM reviews WHERE user_id = ?',
        [userId]
      );
      const total = countResult[0].total;

      // Get reviews
      const [reviews] = await pool.execute(
        `SELECT 
          r.review_id,
          r.rating,
          r.comment,
          r.created_at,
          p.name as product_name,
          p.image_url,
          p.sku
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
          reviews,
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
      const [reviews] = await pool.execute(
        'SELECT review_id FROM reviews WHERE review_id = ? AND user_id = ?',
        [reviewId, userId]
      );

      if (reviews.length === 0) {
        throw new Error('Review not found');
      }

      await pool.execute(
        'UPDATE reviews SET rating = ?, comment = ?, created_at = CURRENT_TIMESTAMP WHERE review_id = ?',
        [rating, comment, reviewId]
      );

      return {
        success: true,
        message: 'Review updated successfully'
      };
    } catch (error) {
      throw new Error(`Failed to update review: ${error.message}`);
    }
  }

  // Delete review
  async deleteReview(userId, reviewId) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM reviews WHERE review_id = ? AND user_id = ?',
        [reviewId, userId]
      );

      if (result.affectedRows === 0) {
        throw new Error('Review not found');
      }

      return {
        success: true,
        message: 'Review deleted successfully'
      };
    } catch (error) {
      throw new Error(`Failed to delete review: ${error.message}`);
    }
  }

  // Get review statistics for product
  async getProductReviewStats(productId) {
    try {
      const [stats] = await pool.execute(
        `SELECT 
          AVG(rating) as average_rating,
          COUNT(*) as total_reviews,
          SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
          SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
          SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
          SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
          SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
        FROM reviews WHERE product_id = ?`,
        [productId]
      );

      return {
        success: true,
        data: stats[0]
      };
    } catch (error) {
      throw new Error(`Failed to get review statistics: ${error.message}`);
    }
  }

  // Get recent reviews (admin)
  async getRecentReviews(limit = 10) {
    try {
      const [reviews] = await pool.execute(
        `SELECT 
          r.review_id,
          r.rating,
          r.comment,
          r.created_at,
          u.first_name,
          u.last_name,
          p.name as product_name
        FROM reviews r
        JOIN users u ON r.user_id = u.user_id
        JOIN products p ON r.product_id = p.product_id
        ORDER BY r.created_at DESC
        LIMIT ?`,
        [limit]
      );

      return {
        success: true,
        data: reviews
      };
    } catch (error) {
      throw new Error(`Failed to get recent reviews: ${error.message}`);
    }
  }
}

module.exports = new ReviewService();
