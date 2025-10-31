const { pool } = require('../config/database');
const { calculateOrderTotals, generateOrderNumber } = require('../utils/helpers');
const { sendOrderConfirmationEmail } = require('../utils/email');

// NOTE: Ensure the executeQuery helper is defined globally or imported correctly
const executeQuery = async (sql, params = []) => {
    // This helper must convert '?' to '$1, $2, ...' and use pool.query
    const buildPostgresQuery = (s, p) => {
        let index = 1;
        const pgSql = s.replace(/\?/g, () => `$${index++}`);
        return [pgSql, p];
    };
    
    const [query, pgParams] = buildPostgresQuery(sql, params);
    const result = await pool.query(query, pgParams);
    return result.rows;
};


class OrderService {
  
  /**
   * Helper function to get cart items directly from the database
   * This is used within the transaction
   */
  async getCartItemsForUser(client, userId) {
    // Your schema has cart_items.user_id, not cart_id
    const cartItemsResult = await client.query(
      `SELECT 
        ci.product_id, ci.quantity, ci.unit_price, 
        p.name, p.stock_quantity
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.product_id
       WHERE ci.user_id = $1`,
      [userId]
    );
    return cartItemsResult.rows;
  }

  // Create order from cart
  async createOrder(userId, orderData) {
    const { shipping_address, payment_method } = orderData;
    
    const client = await pool.connect(); // Get client for transaction
    
    try {
      await client.query('BEGIN'); // START TRANSACTION

      try {
        // 1. Get cart items (using the transaction client)
        const cartItems = await this.getCartItemsForUser(client, userId);

        if (cartItems.length === 0) {
          throw new Error('Cart is empty');
        }
        
        // 2. Calculate totals (assuming helper exists)
        // Note: Your schema doesn't show coupons, so discount is 0
        const totals = calculateOrderTotals(cartItems, 0, 0); // (items, discount, shipping)

        // 3. Check stock availability
        for (const item of cartItems) {
          if (item.stock_quantity < item.quantity) {
            throw new Error(`Insufficient stock for ${item.name}`);
          }
        }

        // 4. Create order
        // ✅ FIX: Schema uses 'shipping_address' (text), 'payment_method', 'payment_status'
        const orderInsertResult = await client.query(
          `INSERT INTO orders (user_id, status, total_amount, shipping_address, payment_method, payment_status) 
           VALUES ($1, 'pending', $2, $3, $4, 'pending') RETURNING order_id`, // Use RETURNING
          [userId, totals.total, shipping_address, payment_method]
        );

        const orderId = orderInsertResult.rows[0].order_id;

        // 5. Create order items and update stock
        for (const item of cartItems) {
          await client.query(
            'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
            [orderId, item.product_id, item.quantity, item.unit_price]
          );

          // Update stock
          await client.query(
            'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE product_id = $2',
            [item.quantity, item.product_id]
          );

          // Record inventory movement (assuming 'inventory_movements' table exists)
          // await client.query(
          //   'INSERT INTO inventory_movements (product_id, delta_quantity, reason, reference_type, reference_id) VALUES ($1, $2, $3, $4, $5)',
          //   [item.product_id, -item.quantity, 'order', 'order', orderId]
          // );
        }
        
        // 6. Clear cart (using user_id as per your schema)
        await client.query(
          `DELETE FROM cart_items WHERE user_id = $1`,
          [userId]
        );

        await client.query('COMMIT'); // Commit transaction

        // 7. Get order details for response (using the non-transactional pool)
        const orderDetails = await this.getOrderById(orderId, userId);

        // 8. Send confirmation email (optional)
        try {
          const userResult = await pool.query(
            'SELECT email, first_name FROM users WHERE user_id = $1',
            [userId]
          );
          
          if (userResult.rows.length > 0) {
            await sendOrderConfirmationEmail(userResult.rows[0].email, {
              order_id: orderId,
              total_amount: totals.total,
              status: 'pending'
            });
          }
        } catch (emailError) {
          console.error('Failed to send confirmation email:', emailError);
        }

        return {
          success: true,
          message: 'Order created successfully',
          data: orderDetails.data
        };
      } catch (error) {
        await client.query('ROLLBACK'); // Rollback transaction
        throw error; // Re-throw the error to be caught by the outer block
      } finally {
        client.release(); // Release client back to pool
      }
    } catch (error) {
      throw new Error(`Failed to create order: ${error.message}`);
    }
  }

  // Get order by ID
  async getOrderById(orderId, userId) {
    try {
      // ✅ FIX: Matched columns to your schema (removed billing/shipping IDs)
      const orders = await executeQuery(
        `SELECT 
          o.order_id, o.status, o.total_amount, o.created_at, o.updated_at,
          o.shipping_address, o.payment_method, o.payment_status
        FROM orders o
        WHERE o.order_id = ? AND o.user_id = ?`,
        [orderId, userId]
      );

      if (orders.length === 0) {
        throw new Error('Order not found');
      }

      const order = orders[0];

      // Get order items
      const items = await executeQuery(
        `SELECT 
          oi.order_item_id, oi.product_id, oi.quantity, oi.price,
          p.name, p.image_url, p.sku
        FROM order_items oi
        JOIN products p ON oi.product_id = p.product_id
        WHERE oi.order_id = ?
        ORDER BY oi.order_item_id`,
        [orderId]
      );

      order.items = items;

      // ✅ FIX: Removed queries for non-existent 'payments' and 'shipping' tables
      // order.payments = ...
      // order.shipping = ...

      return { success: true, data: order };
    } catch (error) {
      throw new Error(`Failed to get order: ${error.message}`);
    }
  }

  // Get user orders
  async getUserOrders(userId, filters = {}) {
    const { page = 1, limit = 10, status } = filters;
    const offset = (page - 1) * limit;
  
    try {
      let whereClause = 'WHERE o.user_id = ?';
      let queryParams = [userId];
  
      if (status) {
        whereClause += ' AND o.status = ?';
        queryParams.push(status);
      }
  
      // Get total count
      const countResult = await executeQuery(
        `SELECT COUNT(*) as total FROM orders o ${whereClause}`,
        queryParams
      );
      const total = parseInt(countResult[0].total);
  
      const query = `
        SELECT 
          o.order_id, o.status, o.total_amount, o.created_at, o.updated_at
        FROM orders o
        ${whereClause}
        ORDER BY o.created_at DESC
        LIMIT ? OFFSET ?
      `;
  
      const orders = await executeQuery(query, [...queryParams, limit, offset]);
  
      return {
        success: true,
        data: {
          orders,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      };
    } catch (error) {
      throw new Error(`Failed to get user orders: ${error.message}`);
    }
  }
  
  // Update order status (admin only)
  async updateOrderStatus(orderId, status, adminId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status)) {
        throw new Error('Invalid order status');
      }

      // Update order status
      const updateResult = await client.query(
        'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE order_id = $2 RETURNING user_id',
        [status, orderId]
      );

      if (updateResult.rowCount === 0) {
        throw new Error('Order not found');
      }

      // ✅ FIX: Removed logic for non-existent 'shipping' table
      
      await client.query('COMMIT');
      return { success: true, message: 'Order status updated successfully' };
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`Failed to update order status: ${error.message}`);
    } finally {
      client.release();
    }
  }

  // Cancel order
  async cancelOrder(orderId, userId) {
    const client = await pool.connect();
    try {
      // Check if order can be cancelled
      const orders = await client.query(
        'SELECT status FROM orders WHERE order_id = $1 AND user_id = $2',
        [orderId, userId]
      );

      if (orders.rows.length === 0) {
        throw new Error('Order not found');
      }

      // ✅ FIX: Adjusted valid statuses to match schema
      if (!['pending', 'processing'].includes(orders.rows[0].status)) {
        throw new Error('Order cannot be cancelled');
      }

      await client.query('BEGIN'); // Start transaction

      try {
        // Update order status
        await client.query(
          'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE order_id = $2',
          ['cancelled', orderId]
        );

        // Restore stock
        const orderItems = await client.query(
          'SELECT product_id, quantity FROM order_items WHERE order_id = $1',
          [orderId]
        );

        for (const item of orderItems.rows) {
          await client.query(
            'UPDATE products SET stock_quantity = stock_quantity + $1 WHERE product_id = $2',
            [item.quantity, item.product_id]
          );

          // Record inventory movement (assuming 'inventory_movements' table exists)
          // await client.query(
          //   'INSERT INTO inventory_movements (product_id, delta_quantity, reason, reference_type, reference_id) VALUES ($1, $2, $3, $4, $5)',
          //   [item.product_id, item.quantity, 'return', 'order', orderId]
          // );
        }

        await client.query('COMMIT');

        return { success: true, message: 'Order cancelled successfully' };
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    } catch (error) {
      throw new Error(`Failed to cancel order: ${error.message}`);
    } finally {
      client.release();
    }
  }

  // Get order statistics (admin only)
  async getOrderStatistics() {
    try {
      // ✅ FIX: Adjusted statuses to match schema
      const stats = await executeQuery(
        `SELECT 
          COUNT(*)::INT as total_orders,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END)::INT as pending_orders,
          SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END)::INT as processing_orders,
          SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END)::INT as shipped_orders,
          SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END)::INT as delivered_orders,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END)::INT as cancelled_orders,
          COALESCE(SUM(total_amount), 0.00) as total_revenue
        FROM orders`
      );

      return { success: true, data: stats[0] };
    } catch (error) {
      throw new Error(`Failed to get order statistics: ${error.message}`);
    }
  }
}

module.exports = new OrderService();