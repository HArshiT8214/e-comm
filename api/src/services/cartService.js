const { pool } = require('../config/database');
const { calculateOrderTotals } = require('../utils/helpers');

class CartService {
  // Get or create cart for user
  async getOrCreateCart(userId) {
    try {
      // Check if cart exists
      let [carts] = await pool.execute(
        'SELECT cart_id FROM carts WHERE user_id = ?',
        [userId]
      );

      let cartId;
      if (carts.length === 0) {
        // Create new cart
        const [result] = await pool.execute(
          'INSERT INTO carts (user_id) VALUES (?)',
          [userId]
        );
        cartId = result.insertId;
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

      const [items] = await pool.execute(
        `SELECT 
          ci.cart_item_id,
          ci.product_id,
          ci.quantity,
          ci.unit_price,
          ci.added_at,
          p.name,
          p.image_url,
          p.sku,
          p.stock_quantity,
          p.brand
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.product_id
        WHERE ci.cart_id = ?
        ORDER BY ci.added_at DESC`,
        [cartId]
      );

      // Calculate totals
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
    try {
      // Verify product exists and is in stock
      const [products] = await pool.execute(
        'SELECT product_id, price, stock_quantity FROM products WHERE product_id = ? AND is_active = 1',
        [productId]
      );

      if (products.length === 0) {
        throw new Error('Product not found');
      }

      const product = products[0];
      if (product.stock_quantity < quantity) {
        throw new Error('Insufficient stock');
      }

      const cartId = await this.getOrCreateCart(userId);

      // Check if item already in cart
      const [existingItems] = await pool.execute(
        'SELECT cart_item_id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ?',
        [cartId, productId]
      );

      if (existingItems.length > 0) {
        // Update existing item
        const newQuantity = existingItems[0].quantity + quantity;
        if (newQuantity > product.stock_quantity) {
          throw new Error('Insufficient stock for requested quantity');
        }

        await pool.execute(
          'UPDATE cart_items SET quantity = ?, unit_price = ? WHERE cart_item_id = ?',
          [newQuantity, product.price, existingItems[0].cart_item_id]
        );
      } else {
        // Add new item
        await pool.execute(
          'INSERT INTO cart_items (cart_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
          [cartId, productId, quantity, product.price]
        );
      }

      return {
        success: true,
        message: 'Item added to cart successfully'
      };
    } catch (error) {
      throw new Error(`Failed to add to cart: ${error.message}`);
    }
  }

  // Update cart item quantity
  async updateCartItem(userId, cartItemId, quantity) {
    try {
      if (quantity < 1) {
        throw new Error('Quantity must be at least 1');
      }

      // Verify cart item belongs to user
      const [cartItems] = await pool.execute(
        `SELECT ci.cart_item_id, ci.product_id, p.stock_quantity, p.price
         FROM cart_items ci
         JOIN carts c ON ci.cart_id = c.cart_id
         JOIN products p ON ci.product_id = p.product_id
         WHERE ci.cart_item_id = ? AND c.user_id = ?`,
        [cartItemId, userId]
      );

      if (cartItems.length === 0) {
        throw new Error('Cart item not found');
      }

      const cartItem = cartItems[0];
      if (quantity > cartItem.stock_quantity) {
        throw new Error('Insufficient stock');
      }

      await pool.execute(
        'UPDATE cart_items SET quantity = ?, unit_price = ? WHERE cart_item_id = ?',
        [quantity, cartItem.price, cartItemId]
      );

      return {
        success: true,
        message: 'Cart item updated successfully'
      };
    } catch (error) {
      throw new Error(`Failed to update cart item: ${error.message}`);
    }
  }

  // Remove item from cart
  async removeFromCart(userId, cartItemId) {
    try {
      // Verify cart item belongs to user
      const [result] = await pool.execute(
        `DELETE ci FROM cart_items ci
         JOIN carts c ON ci.cart_id = c.cart_id
         WHERE ci.cart_item_id = ? AND c.user_id = ?`,
        [cartItemId, userId]
      );

      if (result.affectedRows === 0) {
        throw new Error('Cart item not found');
      }

      return {
        success: true,
        message: 'Item removed from cart successfully'
      };
    } catch (error) {
      throw new Error(`Failed to remove from cart: ${error.message}`);
    }
  }

  // Clear cart
  async clearCart(userId) {
    try {
      const cartId = await this.getOrCreateCart(userId);

      await pool.execute(
        'DELETE FROM cart_items WHERE cart_id = ?',
        [cartId]
      );

      return {
        success: true,
        message: 'Cart cleared successfully'
      };
    } catch (error) {
      throw new Error(`Failed to clear cart: ${error.message}`);
    }
  }

  // Get cart count
  async getCartCount(userId) {
    try {
      const cartId = await this.getOrCreateCart(userId);

      const [result] = await pool.execute(
        'SELECT SUM(quantity) as total_items FROM cart_items WHERE cart_id = ?',
        [cartId]
      );

      return {
        success: true,
        data: {
          count: result[0].total_items || 0
        }
      };
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
        // Check if product still exists and is active
        const [products] = await pool.execute(
          'SELECT product_id, name, stock_quantity, price FROM products WHERE product_id = ? AND is_active = 1',
          [item.product_id]
        );

        if (products.length === 0) {
          validationErrors.push({
            product_id: item.product_id,
            error: 'Product no longer available'
          });
          continue;
        }

        const product = products[0];

        // Check stock availability
        if (product.stock_quantity < item.quantity) {
          validationErrors.push({
            product_id: item.product_id,
            error: `Only ${product.stock_quantity} items available`
          });
        }

        // Check price changes
        if (product.price !== item.unit_price) {
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
