// API client for HP Printer E-commerce
const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// Helper function to set auth token
const setAuthToken = (token) => {
  localStorage.setItem('authToken', token);
};

// Helper function to remove auth token
const removeAuthToken = () => {
  localStorage.removeItem('authToken');
};

// Generic API request function
async function apiRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const token = getAuthToken();
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      // Handle authentication errors
      if (response.status === 401) {
        removeAuthToken();
        window.location.href = '/login';
      }
      throw new Error(data.message || `HTTP ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API request failed: ${endpoint}`, error);
    throw error;
  }
}

// Auth API
export const authAPI = {
  register: (userData) => apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),

  login: (credentials) => apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),

  getProfile: () => apiRequest('/auth/profile'),

  updateProfile: (userData) => apiRequest('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(userData),
  }),

  changePassword: (passwordData) => apiRequest('/auth/change-password', {
    method: 'PUT',
    body: JSON.stringify(passwordData),
  }),

  forgotPassword: (email) => apiRequest('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  }),

  addAddress: (addressData) => apiRequest('/auth/addresses', {
    method: 'POST',
    body: JSON.stringify(addressData),
  }),

  updateAddress: (addressId, addressData) => apiRequest(`/auth/addresses/${addressId}`, {
    method: 'PUT',
    body: JSON.stringify(addressData),
  }),

  deleteAddress: (addressId) => apiRequest(`/auth/addresses/${addressId}`, {
    method: 'DELETE',
  }),
};

// Products API
export const productsAPI = {
  getProducts: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/products?${queryString}`);
  },

  getProductById: (id) => apiRequest(`/products/${id}`),

  searchProducts: (query, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/products/search/${encodeURIComponent(query)}?${queryString}`);
  },

  getFeaturedProducts: (limit = 8) => apiRequest(`/products/featured/list?limit=${limit}`),

  getCategories: () => apiRequest('/products/categories/list'),
};

// Cart API
export const cartAPI = {
  getCart: () => apiRequest('/cart'),

  getCartCount: () => apiRequest('/cart/count'),

  addToCart: (productId, quantity = 1) => apiRequest('/cart/add', {
    method: 'POST',
    body: JSON.stringify({ productId, quantity }),
  }),

  updateCartItem: (cartItemId, quantity) => apiRequest(`/cart/items/${cartItemId}`, {
    method: 'PUT',
    body: JSON.stringify({ quantity }),
  }),

  removeFromCart: (cartItemId) => apiRequest(`/cart/items/${cartItemId}`, {
    method: 'DELETE',
  }),

  clearCart: () => apiRequest('/cart/clear', {
    method: 'DELETE',
  }),

  validateCart: () => apiRequest('/cart/validate'),
};

// Orders API
export const ordersAPI = {
  createOrder: (orderData) => apiRequest('/orders', {
    method: 'POST',
    body: JSON.stringify(orderData),
  }),

  getUserOrders: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/orders?${queryString}`);
  },

  getOrderById: (orderId) => apiRequest(`/orders/${orderId}`),

  cancelOrder: (orderId) => apiRequest(`/orders/${orderId}/cancel`, {
    method: 'PUT',
  }),
};

// Reviews API
export const reviewsAPI = {
  addReview: (productId, reviewData) => apiRequest(`/reviews/${productId}`, {
    method: 'POST',
    body: JSON.stringify(reviewData),
  }),

  getProductReviews: (productId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/reviews/product/${productId}?${queryString}`);
  },

  getProductReviewStats: (productId) => apiRequest(`/reviews/product/${productId}/stats`),

  getUserReviews: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/reviews/user/my-reviews?${queryString}`);
  },

  updateReview: (reviewId, reviewData) => apiRequest(`/reviews/${reviewId}`, {
    method: 'PUT',
    body: JSON.stringify(reviewData),
  }),

  deleteReview: (reviewId) => apiRequest(`/reviews/${reviewId}`, {
    method: 'DELETE',
  }),
};

// Support API
export const supportAPI = {
  createTicket: (ticketData) => apiRequest('/support/tickets', {
    method: 'POST',
    body: JSON.stringify(ticketData),
  }),

  getUserTickets: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/support/tickets?${queryString}`);
  },

  getTicketById: (ticketId) => apiRequest(`/support/tickets/${ticketId}`),

  searchKnowledgeBase: (query) => apiRequest(`/support/knowledge-base/search?q=${encodeURIComponent(query)}`),
};

// Utility functions
// Utility functions
export { setAuthToken as setToken, removeAuthToken as removeToken, getAuthToken as getToken };

// Legacy functions for backward compatibility
export async function getProducts() {
  try {
    const data = await productsAPI.getProducts();
    return data.data?.products || [];
  } catch (error) {
    console.warn('Failed to fetch products from API, using fallback data');
    // Fallback to mock data
    return [
      {
        product_id: 1,
        name: 'HP LaserJet Pro M404n',
        price: 299.99,
        originalPrice: 399.99,
        image_url: '/logo192.png',
        sku: 'HP-LASER-404N',
        rating: 5,
        stock_quantity: 15,
        category_id: 1
      },
      {
        product_id: 2,
        name: 'HP OfficeJet Pro 9015',
        price: 399.99,
        originalPrice: 499.99,
        image_url: '/logo192.png',
        sku: 'HP-OFFICE-9015',
        rating: 4,
        stock_quantity: 8,
        category_id: 1
      }
    ];
  }
}

export async function getProductById(id) {
  try {
    const data = await productsAPI.getProductById(id);
    return data.data;
  } catch (error) {
    console.warn('Failed to fetch product from API, using fallback data');
    // Fallback to mock data
    const mockProducts = await getProducts();
    return mockProducts.find(p => String(p.product_id) === String(id)) || mockProducts[0];
  }
}
