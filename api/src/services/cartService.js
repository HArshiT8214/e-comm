const { pool } = require('../config/database');
const { calculateOrderTotals } = require('../utils/helpers'); // Assuming this helper exists

class CartService {

  /**
   * Helper functions for PostgreSQL execution
   */
  static buildPostgresQuery(sql, params) {
    if (!params) return [sql, []];
    let index = 1;
    const newSql = sql.replace(/\?/g, () => `$${index++}`);
    return [newSql, params];
  }

  async executeQuery(sql, params = []) {
    const [query, pgParams] = CartService.buildPostgresQuery(sql, params);
    const result = await pool.query(query, pgParams);
    return result.rows;
  }

  // Get or create cart for user
  async getOrCreateCart(userId) {
    try {
      // This query is fine (no schema mismatch)
      const carts = await this.executeQuery(
        'SELECT cart_id FROM carts WHERE user_id = ?',
        [userId]
      );

      let cartId;
      if (carts.length === 0) {
        const result = await this.executeQuery(
          'INSERT INTO carts (user_id) VALUES (?) RETURNING cart_id',
          [userId]
        );
        cartId = result[0].cart_id;
      } else {
        cartId = carts[0].cart_id;
      }

      return cartId;
    } catch (error) {
      throw new Error(`Failed to get/create cart: ${error.message}`);
    }
  }

  // Get cart items
  async getCartItems(userId) {
    try {
      const cartId = await this.getOrCreateCart(userId);

      // This query is fine (no schema mismatch)
      const items = await this.executeQuery(
        `SELECT 
          ci.cart_item_id, ci.product_id, ci.quantity, ci.unit_price, ci.added_at,
          p.name, p.image_url, p.sku, p.stock_quantity, p.brand
        FROM cart_items ci
        JOIN carts c ON ci.cart_id = c.cart_id
        JOIN products p ON ci.product_id = p.product_id
        WHERE ci.cart_id = ?
        ORDER BY ci.added_at DESC`,
        [cartId]
      );

      const totals = calculateOrderTotals(items);

      return {
        success: true,
        data: {
          cart_id: cartId,
          items,
          totals
        }
      };
    } catch (error) {
      throw new Error(`Failed to get cart items: ${error.message}`);
    }
  }

  // Add item to cart
  async addToCart(userId, productId, quantity = 1) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // ✅ FIX: Removed 'is_active = TRUE' from WHERE clause
      const productsResult = await client.query(
        'SELECT product_id, price, stock_quantity FROM products WHERE product_id = $1',
        [productId]
      );

      if (productsResult.rows.length === 0) {
        throw new Error('Product not found');
      }

      const product = productsResult.rows[0];
      if (product.stock_quantity < quantity) {
        throw new Error('Insufficient stock');
      }

      // This logic assumes your 'carts' table uses 'user_id' as the FK
      // and 'cart_items' table uses 'cart_id'.
      // Based on your schema, this is correct.
      
      // Get or create cart ID using the non-transactional helper
      const cartId = await this.getOrCreateCart(userId); 

      // Check if item already in cart
      const existingItemsResult = await client.query(
        'SELECT cart_item_id, quantity FROM cart_items WHERE cart_id = $1 AND product_id = $2',
        [cartId, productId]
      );

      if (existingItemsResult.rows.length > 0) {
        // Update existing item
        const existingItem = existingItemsResult.rows[0];
        const newQuantity = existingItem.quantity + quantity;

        if (newQuantity > product.stock_quantity) {
          throw new Error('Insufficient stock for requested quantity');
        }

        await client.query(
          'UPDATE cart_items SET quantity = $1, unit_price = $2, updated_at = CURRENT_TIMESTAMP WHERE cart_item_id = $3',
          [newQuantity, product.price, existingItem.cart_item_id]
        );
      } else {
        // Add new item
        await client.query(
          'INSERT INTO cart_items (cart_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)',
          [cartId, productId, quantity, product.price]
        );
      }

      await client.query('COMMIT');
      return { success: true, message: 'Item added to cart successfully' };
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`Failed to add to cart: ${error.message}`);
    } finally {
      client.release();
    }
  }

  // Update cart item quantity
  async updateCartItem(userId, cartItemId, quantity) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      if (quantity < 1) {
        throw new Error('Quantity must be at least 1');
      }

      // Verify cart item belongs to user and get stock
      const cartItemsResult = await client.query(
        `SELECT ci.cart_item_id, ci.product_id, p.stock_quantity, p.price
         FROM cart_items ci
         JOIN carts c ON ci.cart_id = c.cart_id
         JOIN products p ON ci.product_id = p.product_id
         WHERE ci.cart_item_id = $1 AND c.user_id = $2`,
        [cartItemId, userId]
      );

      if (cartItemsResult.rows.length === 0) {
        throw new Error('Cart item not found');
      }

      const cartItem = cartItemsResult.rows[0];
      if (quantity > cartItem.stock_quantity) {
        throw new Error('Insufficient stock');
      }

      await client.query(
        'UPDATE cart_items SET quantity = $1, unit_price = $2, updated_at = CURRENT_TIMESTAMP WHERE cart_item_id = $3',
        [quantity, cartItem.price, cartItemId]
      );

      await client.query('COMMIT');
      return { success: true, message: 'Cart item updated successfully' };
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`Failed to update cart item: ${error.message}`);
    } finally {
      client.release();
    }
  }

  // Remove item from cart
  async removeFromCart(userId, cartItemId) {
    try {
      // Verify cart item belongs to user and delete
      const result = await pool.query(
        `DELETE FROM cart_items ci
         USING carts c
         WHERE ci.cart_id = c.cart_id
         AND ci.cart_item_id = $1 AND c.user_id = $2`,
        [cartItemId, userId]
      );
      
      if (result.rowCount === 0) {
        throw new Error('Cart item not found');
      }

      return { success: true, message: 'Item removed from cart successfully' };
    } catch (error) {
      throw new Error(`Failed to remove from cart: ${error.message}`);
    }
  }

  // Clear cart
  async clearCart(userId) {
    try {
      const cartId = await this.getOrCreateCart(userId);

      await pool.query(
        'DELETE FROM cart_items WHERE cart_id = $1',
        [cartId]
      );

      return { success: true, message: 'Cart cleared successfully' };
    } catch (error) {
      throw new Error(`Failed to clear cart: ${error.message}`);
    }
  }

  // Get cart count
  async getCartCount(userId) {
    try {
      const cartId = await this.getOrCreateCart(userId);

      const result = await pool.query(
        'SELECT COALESCE(SUM(quantity), 0) as total_items FROM cart_items WHERE cart_id = $1',
        [cartId]
      );

      return { success: true, data: { count: parseInt(result.rows[0].total_items) } };
    } catch (error) {
      throw new Error(`Failed to get cart count: ${error.message}`);
    }
  }

  // Validate cart before checkout
  async validateCart(userId) {
    try {
      const cartData = await this.getCartItems(userId);
      const { items } = cartData.data;

      const validationErrors = [];

      for (const item of items) {
        // ✅ FIX: Removed 'is_active = TRUE'
        const productsResult = await this.executeQuery(
          'SELECT product_id, name, stock_quantity, price FROM products WHERE product_id = ?',
          [item.product_id]
        );

        if (productsResult.length === 0) {
          validationErrors.push({ product_id: item.product_id, error: 'Product no longer available' });
          continue;
        }

        const product = productsResult[0];

        // Check stock availability
        if (product.stock_quantity < item.quantity) {
          validationErrors.push({
            product_id: item.product_id,
            error: `Only ${product.stock_quantity} items available`
          });
        }

        // Check price changes
        if (parseFloat(product.price) !== parseFloat(item.unit_price)) { // Compare as floats/numbers
          validationErrors.push({
            product_id: item.product_id,
            error: `Price changed from $${item.unit_price} to $${product.price}`
          });
        }
      }

      return {
        success: true,
        data: {
          is_valid: validationErrors.length === 0,
          errors: validationErrors
        }
      };
    } catch (error) {
      throw new Error(`Failed to validate cart: ${error.message}`);
    }
  }
}

module.exports = new CartService();