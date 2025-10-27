const { pool } = require('../config/database');
const { calculateOrderTotals, generateOrderNumber, generateTrackingNumber } = require('../utils/helpers');
const { sendOrderConfirmationEmail } = require('../utils/email');

class OrderService {
  // Create order from cart
  async createOrder(userId, orderData) {
    const { shippingAddressId, billingAddressId, paymentMethod, couponCode } = orderData;
    
    try {
      // Start transaction
      await pool.execute('START TRANSACTION');

      try {
        // Validate addresses
        const [shippingAddress] = await pool.execute(
          'SELECT * FROM addresses WHERE address_id = ? AND user_id = ?',
          [shippingAddressId, userId]
        );

        const [billingAddress] = await pool.execute(
          'SELECT * FROM addresses WHERE address_id = ? AND user_id = ?',
          [billingAddressId, userId]
        );

        if (shippingAddress.length === 0 || billingAddress.length === 0) {
          throw new Error('Invalid shipping or billing address');
        }

        // Get cart items
        const [cartItems] = await pool.execute(
          `SELECT ci.product_id, ci.quantity, ci.unit_price, p.name, p.stock_quantity
           FROM cart_items ci
           JOIN carts c ON ci.cart_id = c.cart_id
           JOIN products p ON ci.product_id = p.product_id
           WHERE c.user_id = ?`,
          [userId]
        );

        if (cartItems.length === 0) {
          throw new Error('Cart is empty');
        }

        // Validate stock and calculate totals
        let discountAmount = 0;
        if (couponCode) {
          const [coupons] = await pool.execute(
            'SELECT * FROM coupons WHERE code = ? AND is_active = 1 AND (valid_from IS NULL OR valid_from <= NOW()) AND (valid_to IS NULL OR valid_to >= NOW())',
            [couponCode]
          );

          if (coupons.length > 0) {
            const coupon = coupons[0];
            if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
              throw new Error('Coupon has reached maximum usage limit');
            }
            // Apply discount logic here
            discountAmount = coupon.discount_type === 'percent' 
              ? (calculateOrderTotals(cartItems).subtotal * coupon.discount_value / 100)
              : coupon.discount_value;
          }
        }

        const totals = calculateOrderTotals(cartItems, discountAmount, 0); // No shipping for now

        // Check stock availability
        for (const item of cartItems) {
          if (item.stock_quantity < item.quantity) {
            throw new Error(`Insufficient stock for ${item.name}`);
          }
        }

        // Create order
        const orderNumber = generateOrderNumber();
        const [orderResult] = await pool.execute(
          `INSERT INTO orders (user_id, status, total_amount, subtotal_amount, discount_amount, shipping_amount, tax_amount, shipping_address_id, billing_address_id) 
           VALUES (?, 'pending', ?, ?, ?, ?, ?, ?, ?)`,
          [userId, totals.total, totals.subtotal, totals.discount, totals.shipping, totals.tax, shippingAddressId, billingAddressId]
        );

        const orderId = orderResult.insertId;

        // Create order items and update stock
        for (const item of cartItems) {
          await pool.execute(
            'INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)',
            [orderId, item.product_id, item.quantity, item.unit_price, item.quantity * item.unit_price]
          );

          // Update stock
          await pool.execute(
            'UPDATE products SET stock_quantity = stock_quantity - ? WHERE product_id = ?',
            [item.quantity, item.product_id]
          );

          // Record inventory movement
          await pool.execute(
            'INSERT INTO inventory_movements (product_id, delta_quantity, reason, reference_type, reference_id) VALUES (?, ?, ?, ?, ?)',
            [item.product_id, -item.quantity, 'order', 'order', orderId]
          );
        }

        // Apply coupon if provided
        if (couponCode && discountAmount > 0) {
          const [coupons] = await pool.execute(
            'SELECT coupon_id FROM coupons WHERE code = ?',
            [couponCode]
          );

          if (coupons.length > 0) {
            await pool.execute(
              'INSERT INTO order_coupons (order_id, coupon_id, discount_applied) VALUES (?, ?, ?)',
              [orderId, coupons[0].coupon_id, discountAmount]
            );

            // Update coupon usage count
            await pool.execute(
              'UPDATE coupons SET used_count = used_count + 1 WHERE coupon_id = ?',
              [coupons[0].coupon_id]
            );
          }
        }

        // Create payment record
        const [paymentResult] = await pool.execute(
          'INSERT INTO payments (order_id, method, status, amount) VALUES (?, ?, ?, ?)',
          [orderId, paymentMethod, 'pending', totals.total]
        );

        // Clear cart
        await pool.execute(
          `DELETE ci FROM cart_items ci
           JOIN carts c ON ci.cart_id = c.cart_id
           WHERE c.user_id = ?`,
          [userId]
        );

        // Commit transaction
        await pool.execute('COMMIT');

        // Get order details for response
        const orderDetails = await this.getOrderById(orderId, userId);

        // Send confirmation email
        try {
          const [user] = await pool.execute(
            'SELECT email, first_name FROM users WHERE user_id = ?',
            [userId]
          );
          
          if (user.length > 0) {
            await sendOrderConfirmationEmail(user[0].email, {
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
        // Rollback transaction
        await pool.execute('ROLLBACK');
        throw error;
      }
    } catch (error) {
      throw new Error(`Failed to create order: ${error.message}`);
    }
  }

  // Get order by ID
  async getOrderById(orderId, userId) {
    try {
      const [orders] = await pool.execute(
        `SELECT 
          o.order_id,
          o.status,
          o.total_amount,
          o.subtotal_amount,
          o.discount_amount,
          o.shipping_amount,
          o.tax_amount,
          o.created_at,
          o.updated_at,
          sa.line1 as shipping_line1,
          sa.line2 as shipping_line2,
          sa.city as shipping_city,
          sa.state as shipping_state,
          sa.zipcode as shipping_zipcode,
          sa.country as shipping_country,
          ba.line1 as billing_line1,
          ba.line2 as billing_line2,
          ba.city as billing_city,
          ba.state as billing_state,
          ba.zipcode as billing_zipcode,
          ba.country as billing_country
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
      const [items] = await pool.execute(
        `SELECT 
          oi.order_item_id,
          oi.product_id,
          oi.quantity,
          oi.unit_price,
          oi.subtotal,
          p.name,
          p.image_url,
          p.sku
        FROM order_items oi
        JOIN products p ON oi.product_id = p.product_id
        WHERE oi.order_id = ?
        ORDER BY oi.order_item_id`,
        [orderId]
      );

      order.items = items;

      // Get payment info
      const [payments] = await pool.execute(
        'SELECT * FROM payments WHERE order_id = ? ORDER BY created_at DESC',
        [orderId]
      );
      order.payments = payments;

      // Get shipping info
      const [shipping] = await pool.execute(
        'SELECT * FROM shipping WHERE order_id = ?',
        [orderId]
      );
      order.shipping = shipping[0] || null;

      return {
        success: true,
        data: order
      };
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
      const [countResult] = await pool.execute(
        `SELECT COUNT(*) as total FROM orders o ${whereClause}`,
        queryParams
      );
      const total = countResult[0].total;
  
      // ✅ IMPORTANT: safely insert limit/offset using template literals
      const safeLimit = Number(limit) || 10;
      const safeOffset = Number(offset) || 0;
  
      const query = `
        SELECT 
          o.order_id,
          o.status,
          o.total_amount,
          o.created_at,
          o.updated_at
        FROM orders o
        ${whereClause}
        ORDER BY o.created_at DESC
        LIMIT ${safeLimit} OFFSET ${safeOffset}
      `;
  
      // Execute with only user-related params
      const [orders] = await pool.execute(query, queryParams);
  
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
    try {
      const validStatuses = ['pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded'];
      if (!validStatuses.includes(status)) {
        throw new Error('Invalid order status');
      }

      const [result] = await pool.execute(
        'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE order_id = ?',
        [status, orderId]
      );

      if (result.affectedRows === 0) {
        throw new Error('Order not found');
      }

      // If status is shipped, create shipping record
      if (status === 'shipped') {
        const trackingNumber = generateTrackingNumber();
        await pool.execute(
          'INSERT INTO shipping (order_id, carrier, tracking_number, status, shipped_at) VALUES (?, ?, ?, ?, NOW())',
          [orderId, 'HP Logistics', trackingNumber, 'in_transit']
        );
      }

      // If status is delivered, update shipping record
      if (status === 'delivered') {
        await pool.execute(
          'UPDATE shipping SET status = ?, delivered_at = NOW() WHERE order_id = ?',
          ['delivered', orderId]
        );
      }

      return {
        success: true,
        message: 'Order status updated successfully'
      };
    } catch (error) {
      throw new Error(`Failed to update order status: ${error.message}`);
    }
  }

  // Cancel order
  async cancelOrder(orderId, userId) {
    try {
      // Check if order can be cancelled
      const [orders] = await pool.execute(
        'SELECT status FROM orders WHERE order_id = ? AND user_id = ?',
        [orderId, userId]
      );

      if (orders.length === 0) {
        throw new Error('Order not found');
      }

      if (!['pending', 'paid'].includes(orders[0].status)) {
        throw new Error('Order cannot be cancelled');
      }

      // Start transaction
      await pool.execute('START TRANSACTION');

      try {
        // Update order status
        await pool.execute(
          'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE order_id = ?',
          ['cancelled', orderId]
        );

        // Restore stock
        const [orderItems] = await pool.execute(
          'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
          [orderId]
        );

        for (const item of orderItems) {
          await pool.execute(
            'UPDATE products SET stock_quantity = stock_quantity + ? WHERE product_id = ?',
            [item.quantity, item.product_id]
          );

          // Record inventory movement
          await pool.execute(
            'INSERT INTO inventory_movements (product_id, delta_quantity, reason, reference_type, reference_id) VALUES (?, ?, ?, ?, ?)',
            [item.product_id, item.quantity, 'return', 'order', orderId]
          );
        }

        await pool.execute('COMMIT');

        return {
          success: true,
          message: 'Order cancelled successfully'
        };
      } catch (error) {
        await pool.execute('ROLLBACK');
        throw error;
      }
    } catch (error) {
      throw new Error(`Failed to cancel order: ${error.message}`);
    }
  }

  // Get order statistics (admin only)
  async getOrderStatistics() {
    try {
      const [stats] = await pool.execute(
        `SELECT 
          COUNT(*) as total_orders,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
          SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_orders,
          SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) as shipped_orders,
          SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered_orders,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders,
          SUM(total_amount) as total_revenue
        FROM orders`
      );

      return {
        success: true,
        data: stats[0]
      };
    } catch (error) {
      throw new Error(`Failed to get order statistics: ${error.message}`);
    }
  }
}

module.exports = new OrderService();
