import React from 'react';
import './cart.css';
import cartIcon from '../components/Assets/cart-icon.jpg';
import { useCart } from '../context/CartContext.jsx';

function Cart() {
  const { items, updateQuantity, removeItem, totals } = useCart();

  return (
    <div className="cart-page">
      <h2 className="cart-title">Your Shopping Cart</h2>
      <div className="cart-content">
        <div className="cart-items-section">
          {items.length === 0 ? (
            <div className="cart-empty">Your cart is empty.</div>
          ) : (
            <table className="cart-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Name</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Subtotal</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.product_id}>
                    <td><img src={item.image_url || cartIcon} alt={item.name} className="cart-item-img" /></td>
                    <td>{item.name}</td>
                    <td>${Number(item.price).toFixed(2)}</td>
                    <td>
                      <div className="cart-qty-control">
                        <button
                          className="cart-qty-btn"
                          onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                          aria-label="Decrease quantity"
                        >
                          -
                        </button>
                        <input type="number" min="1" value={item.quantity} readOnly className="cart-qty-input" />
                        <button
                          className="cart-qty-btn"
                          onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td>${(item.price * item.quantity).toFixed(2)}</td>
                    <td><button className="cart-remove-btn" onClick={() => removeItem(item.product_id)}>Remove</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="cart-summary-section">
          <div className="cart-summary-box">
            <h3>Order Summary</h3>
            <div className="cart-summary-row">
              <span>Subtotal</span>
              <span>${totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="cart-summary-row">
              <span>Tax (8%)</span>
              <span>${totals.tax.toFixed(2)}</span>
            </div>
            <div className="cart-summary-row cart-summary-total">
              <span>Total</span>
              <span>${totals.total.toFixed(2)}</span>
            </div>
            <button className="cart-checkout-btn">Proceed to Checkout</button>
            <button className="cart-continue-btn">Continue Shopping</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Cart; 