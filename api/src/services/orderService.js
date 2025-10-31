const { pool } = require('../config/database');
const { calculateOrderTotals, generateOrderNumber, generateTrackingNumber } = require('../utils/helpers');
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
  // Create order from cart
  async createOrder(userId, orderData) {
    const { shippingAddressId, billingAddressId, paymentMethod, couponCode } = orderData;
    
    const client = await pool.connect(); // Get client for transaction
    
    try {
      await client.query('BEGIN'); // START TRANSACTION

      try {
        // Validate addresses
        // NOTE: Using client.query directly in transactions
        const shippingAddress = await client.query(
          'SELECT * FROM addresses WHERE address_id = $1 AND user_id = $2',
          [shippingAddressId, userId]
        );

        const billingAddress = await client.query(
          'SELECT * FROM addresses WHERE address_id = $1 AND user_id = $2',
          [billingAddressId, userId]
        );

        if (shippingAddress.rows.length === 0 || billingAddress.rows.length === 0) {
          throw new Error('Invalid shipping or billing address');
        }

        // Get cart items
        const cartItemsResult = await client.query(
          `SELECT ci.product_id, ci.quantity, ci.unit_price, p.name, p.stock_quantity
           FROM cart_items ci
           JOIN carts c ON ci.cart_id = c.cart_id
           JOIN products p ON ci.product_id = p.product_id
           WHERE c.user_id = $1`,
          [userId]
        );
        const cartItems = cartItemsResult.rows;

        if (cartItems.length === 0) {
          throw new Error('Cart is empty');
        }

        // Validate coupon and calculate totals
        let discountAmount = 0;
        let coupon;
        if (couponCode) {
          const couponResult = await client.query(
            `SELECT * FROM coupons WHERE code = $1 AND is_active = TRUE 
             AND (valid_from IS NULL OR valid_from <= CURRENT_TIMESTAMP) 
             AND (valid_to IS NULL OR valid_to >= CURRENT_TIMESTAMP)`, // Use CURRENT_TIMESTAMP
            [couponCode]
          );
          coupon = couponResult.rows[0];

          if (coupon) {
            if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
              throw new Error('Coupon has reached maximum usage limit');
            }
            // Apply discount logic here
            discountAmount = coupon.discount_type === 'percent' 
              ? (calculateOrderTotals(cartItems).subtotal * coupon.discount_value / 100)
              : coupon.discount_value;
          }
        }

        const totals = calculateOrderTotals(cartItems, discountAmount, 0);

        // Check stock availability
        for (const item of cartItems) {
          if (item.stock_quantity < item.quantity) {
            throw new Error(`Insufficient stock for ${item.name}`);
          }
        }

        // Create order
        const orderNumber = generateOrderNumber();
        const orderInsertResult = await client.query(
          `INSERT INTO orders (user_id, status, total_amount, subtotal_amount, discount_amount, shipping_amount, tax_amount, shipping_address_id, billing_address_id) 
           VALUES ($1, 'pending', $2, $3, $4, $5, $6, $7, $8) RETURNING order_id`, // Use RETURNING
          [userId, totals.total, totals.subtotal, totals.discount, totals.shipping, totals.tax, shippingAddressId, billingAddressId]
        );

        const orderId = orderInsertResult.rows[0].order_id;

        // Create order items and update stock
        for (const item of cartItems) {
          await client.query(
            'INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal) VALUES ($1, $2, $3, $4, $5)',
            [orderId, item.product_id, item.quantity, item.unit_price, item.quantity * item.unit_price]
          );

          // Update stock
          await client.query(
            'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE product_id = $2',
            [item.quantity, item.product_id]
          );

          // Record inventory movement
          await client.query(
            'INSERT INTO inventory_movements (product_id, delta_quantity, reason, reference_type, reference_id) VALUES ($1, $2, $3, $4, $5)',
            [item.product_id, -item.quantity, 'order', 'order', orderId]
          );
        }

        // Apply coupon if provided
        if (coupon && discountAmount > 0) {
          await client.query(
            'INSERT INTO order_coupons (order_id, coupon_id, discount_applied) VALUES ($1, $2, $3)',
            [orderId, coupon.coupon_id, discountAmount]
          );

          // Update coupon usage count
          await client.query(
            'UPDATE coupons SET used_count = used_count + 1 WHERE coupon_id = $1',
            [coupon.coupon_id]
          );
        }

        // Create payment record
        await client.query(
          'INSERT INTO payments (order_id, method, status, amount) VALUES ($1, $2, $3, $4) RETURNING payment_id', // Use RETURNING
          [orderId, paymentMethod, 'pending', totals.total]
        );

        // Clear cart (uses pg's standard DELETE/USING syntax for join)
        await client.query(
          `DELETE FROM cart_items ci
           USING carts c
           WHERE ci.cart_id = c.cart_id
           AND c.user_id = $1`,
          [userId]
        );

        await client.query('COMMIT'); // Commit transaction

        // Get order details for response (using the non-transactional pool)
        const orderDetails = await this.getOrderById(orderId, userId);

        // Send confirmation email (using the non-transactional pool)
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
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      throw new Error(`Failed to create order: ${error.message}`);
    }
  }

  // Get order by ID
  async getOrderById(orderId, userId) {
    try {
      const orders = await executeQuery(
        `SELECT 
          o.order_id, o.status, o.total_amount, o.subtotal_amount, o.discount_amount, 
          o.shipping_amount, o.tax_amount, o.created_at, o.updated_at,
          sa.line1 as shipping_line1, sa.line2 as shipping_line2, sa.city as shipping_city,
          sa.state as shipping_state, sa.zipcode as shipping_zipcode, sa.country as shipping_country,
          ba.line1 as billing_line1, ba.line2 as billing_line2, ba.city as billing_city,
          ba.state as billing_state, ba.zipcode as billing_zipcode, ba.country as billing_country
        FROM orders o
        LEFT JOIN addresses sa ON o.shipping_address_id = sa.address_id
        LEFT JOIN addresses ba ON o.billing_address_id = ba.address_id
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
          oi.order_item_id, oi.product_id, oi.quantity, oi.unit_price, oi.subtotal,
          p.name, p.image_url, p.sku
        FROM order_items oi
        JOIN products p ON oi.product_id = p.product_id
        WHERE oi.order_id = ?
        ORDER BY oi.order_item_id`,
        [orderId]
      );

      order.items = items;

      // Get payment info
      const payments = await executeQuery(
        'SELECT * FROM payments WHERE order_id = ? ORDER BY created_at DESC',
        [orderId]
      );
      order.payments = payments;

      // Get shipping info
      const shipping = await executeQuery(
        'SELECT * FROM shipping WHERE order_id = ?',
        [orderId]
      );
      order.shipping = shipping[0] || null;

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
  
      // IMPORTANT: safely insert limit/offset using executeQuery helper
      const query = `
        SELECT 
          o.order_id, o.status, o.total_amount, o.created_at, o.updated_at
        FROM orders o
        ${whereClause}
        ORDER BY o.created_at DESC
        LIMIT ? OFFSET ?
      `;
  
      // Execute with user-related params + limit/offset
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

      const validStatuses = ['pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded'];
      if (!validStatuses.includes(status)) {
        throw new Error('Invalid order status');
      }

      // Update order status
      const updateResult = await client.query(
        'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE order_id = $2 RETURNING user_id', // Use RETURNING
        [status, orderId]
      );

      if (updateResult.rowCount === 0) {
        throw new Error('Order not found');
      }

      // If status is shipped, create shipping record
      if (status === 'shipped') {
        const trackingNumber = generateTrackingNumber();
        await client.query(
          'INSERT INTO shipping (order_id, carrier, tracking_number, status, shipped_at) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)', // Use CURRENT_TIMESTAMP
          [orderId, 'HP Logistics', trackingNumber, 'in_transit']
        );
      }

      // If status is delivered, update shipping record
      if (status === 'delivered') {
        await client.query(
          'UPDATE shipping SET status = $1, delivered_at = CURRENT_TIMESTAMP WHERE order_id = $2', // Use CURRENT_TIMESTAMP
          ['delivered', orderId]
        );
      }

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

      if (!['pending', 'paid'].includes(orders.rows[0].status)) {
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

          // Record inventory movement
          await client.query(
            'INSERT INTO inventory_movements (product_id, delta_quantity, reason, reference_type, reference_id) VALUES ($1, $2, $3, $4, $5)',
            [item.product_id, item.quantity, 'return', 'order', orderId]
          );
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
      const stats = await executeQuery(
        `SELECT 
          COUNT(*)::INT as total_orders,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END)::INT as pending_orders,
          SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END)::INT as paid_orders,
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