import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);

function readStorage() {
  try {
    const raw = localStorage.getItem('cart:v1');
    return raw ? JSON.parse(raw) : { items: [] };
  } catch {
    return { items: [] };
  }
}

function writeStorage(state) {
  try {
    localStorage.setItem('cart:v1', JSON.stringify(state));
  } catch {}
}

export function CartProvider({ children }) {
  const [state, setState] = useState(() => readStorage());

  useEffect(() => {
    writeStorage(state);
  }, [state]);

  const addItem = (product, quantity = 1) => {
    setState(prev => {
      const existing = prev.items.find(i => i.product_id === product.product_id);
      if (existing) {
        return {
          ...prev,
          items: prev.items.map(i => i.product_id === product.product_id ? { ...i, quantity: i.quantity + quantity } : i)
        };
      }
      return {
        ...prev,
        items: [...prev.items, { product_id: product.product_id, name: product.name, price: product.price, image_url: product.image_url, quantity }]
      };
    });
  };

  const updateQuantity = (productId, quantity) => {
    setState(prev => ({
      ...prev,
      items: prev.items.map(i => i.product_id === productId ? { ...i, quantity: Math.max(1, quantity) } : i)
    }));
  };

  const removeItem = (productId) => {
    setState(prev => ({
      ...prev,
      items: prev.items.filter(i => i.product_id !== productId)
    }));
  };

  const clear = () => setState({ items: [] });

  const totals = useMemo(() => {
    const subtotal = state.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const tax = subtotal * 0.08;
    const total = subtotal + tax;
    return { subtotal, tax, total };
  }, [state.items]);

  const value = useMemo(() => ({ ...state, addItem, updateQuantity, removeItem, clear, totals }), [state, totals]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
} 