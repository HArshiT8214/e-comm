import React, { useEffect, useState } from 'react';
import './shop.css';
import printerImage from '../components/Assets/printer_icon.jpg';
import { productsAPI } from '../services/api';
import { useCart } from '../context/CartContext.jsx';
import { useNavigate } from 'react-router-dom';

function Shop() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy] = useState('created_at');
  const [sortOrder] = useState('DESC');
  const { addItem } = useCart();
  const navigate = useNavigate();

  // Load products and categories
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [productsResponse, categoriesResponse] = await Promise.all([
          productsAPI.getProducts({
            page: 1,
            limit: 20,
            sort_by: sortBy,
            sort_order: sortOrder
          }),
          productsAPI.getCategories()
        ]);

        if (productsResponse.success) {
          setProducts(productsResponse.data.products.map(p => ({
            id: p.product_id,
            name: p.name,
            // This now correctly uses the category_name from the (fixed) backend
            category: p.category_name || 'Printers', 
            price: `$${Number(p.price).toFixed(2)}`,
            originalPrice: p.originalPrice ? `$${Number(p.originalPrice).toFixed(2)}` : `$${(Number(p.price) * 1.2).toFixed(2)}`,
            image: p.image_url || printerImage,
            rating: p.average_rating || 4,
            reviews: p.review_count || 0,
            features: ['Wireless Printing', 'Duplex Printing', 'High Speed'],
            badge: p.stock_quantity > 10 ? 'In Stock' : p.stock_quantity > 0 ? 'Low Stock' : 'Out of Stock',
            stock_quantity: p.stock_quantity,
            raw: p
          })));
        }

        if (categoriesResponse.success) {
          setCategories([
            { id: 'all', name: 'All Products', icon: '🛍️' },
            // ✅ FINAL FIX: Use cat.name as the ID, not cat.category_id
            ...categoriesResponse.data.map(cat => ({
              id: cat.name, 
              name: cat.name,
              icon: '🖨️'
            }))
          ]);
        }
      } catch (err) {
        setError('Failed to load products');
        console.error('Error loading products:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [sortBy, sortOrder]);

  // Search products - redirect to search results page
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // This filter logic is now correct because both 'product.category' and 'selectedCategory'
  // will use the category name (e.g., "Laser Printers").
  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(product => product.category === selectedCategory);

  const handleAddToCart = (product) => {
    if (product.stock_quantity > 0) {
      addItem(product.raw, 1);
    }
  };

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  // Derive featured and new-arrival groups
  const featuredProducts = filteredProducts.slice(0, 8);
  const newArrivalProducts = filteredProducts.slice(8, 16);

  if (loading) {
    return (
      <div className="shop-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="shop-container">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1>Smarter Living Starts Here</h1>
            <p>Innovative gadgets, premium brands, unbeatable prices.</p>
            <form onSubmit={handleSearch} className="hero-search">
              <input
                type="text"
                placeholder="Search for printers, accessories, and more..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit">Search</button>
            </form>
            <div className="hero-stats">
              <div className="stat">
                <span className="stat-number">$10 OFF</span>
                <span className="stat-label">Welcome Coupon</span>
              </div>
              <div className="stat">
                <span className="stat-number">Free</span>
                <span className="stat-label">Shipping over $200</span>
              </div>
              <div className="stat">
                <span className="stat-number">24/7</span>
                <span className="stat-label">Customer Support</span>
              </div>
            </div>
            <button className="cta-button">Shop Now</button>
          </div>
          <div className="hero-image">
            <img src={printerImage} alt="Featured products" />
          </div>
        </div>
      </div>

      {/* Shop by Categories */}
      <section className="category-section">
        <div className="container">
          <h2>Shop By Categories</h2>
          <div className="category-grid">
            {categories.slice(0, 12).map(category => (
              <div
                key={category.id}
                className={`category-card ${selectedCategory === category.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category.id)}
              >
                <div className="category-icon">{category.icon}</div>
                <div className="category-name">{category.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <div className="products-section">
        <div className="container">
          <div className="section-header">
            <h2>Featured Products</h2>
            <p>Top picks across printers, ink & accessories</p>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {featuredProducts.length === 0 ? (
            <div className="no-products">
              <h3>No products found</h3>
              <p>Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            <div className="products-grid">
              {featuredProducts.map(product => (
                <div key={product.id} className="product-card" onClick={() => handleProductClick(product.id)}>
                  <div className="product-image">
                    <img src={product.image} alt={product.name} />
                    <div className="product-badge">{product.badge}</div>
                  </div>
                  
                  <div className="product-info">
                    <h3 className="product-name">{product.name}</h3>
                    <p className="product-category">{product.category}</p>
                    
                    <div className="product-rating">
                      <div className="stars">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={i < Math.floor(product.rating) ? 'star filled' : 'star'}>
                            ★
                          </span>
                        ))}
                      </div>
                      <span className="rating-text">({product.reviews} reviews)</span>
                    </div>
                    
                    <div className="product-price">
                      <span className="current-price">{product.price}</span>
                      {product.originalPrice && (
                        <span className="original-price">{product.originalPrice}</span>
                      )}
                    </div>
                    
                    <div className="product-features">
                      {product.features.map((feature, index) => (
                        <span key={index} className="feature-tag">{feature}</span>
                      ))}
                    </div>
                    
                    <button 
                      className={`add-to-cart-btn ${product.stock_quantity === 0 ? 'out-of-stock' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(product);
                      }}
                      disabled={product.stock_qantity === 0}
                    >
                      {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* New Arrivals */}
      <div className="products-section">
        <div className="container">
          <div className="section-header">
            <h2>New Arrivals</h2>
            <p>Discover the latest additions</p>
          </div>

          {newArrivalProducts.length === 0 ? (
            <div className="no-products">
              <h3>No products found</h3>
              <p>Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            <div className="products-grid">
              {newArrivalProducts.map(product => (
                <div key={product.id} className="product-card" onClick={() => handleProductClick(product.id)}>
                  <div className="product-image">
                    <img src={product.image} alt={product.name} />
                    <div className="product-badge">{product.badge}</div>
                  </div>
                  
                  <div className="product-info">
                    <h3 className="product-name">{product.name}</h3>
                    <p className="product-category">{product.category}</p>
                    
                    <div className="product-rating">
                      <div className="stars">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={i < Math.floor(product.rating) ? 'star filled' : 'star'}>
                            ★
                          </span>
                        ))}
                      </div>
                      <span className="rating-text">({product.reviews} reviews)</span>
                    </div>
                    
                    <div className="product-price">
                      <span className="current-price">{product.price}</span>
                      {product.originalPrice && (
                        <span className="original-price">{product.originalPrice}</span>
                      )}
                    </div>
                    
                    <div className="product-features">
                      {product.features.map((feature, index) => (
                        <span key={index} className="feature-tag">{feature}</span>
                      ))}
                    </div>
                    
                    <button 
                      className={`add-to-cart-btn ${product.stock_quantity === 0 ? 'out-of-stock' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(product);
                      }}
                      disabled={product.stock_quantity === 0}
                    >
                      {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Benefits band */}
      <section className="features-section">
        <div className="container">
          <h2>Why Shop With Us</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🚚</div>
              <h3>Free Shipping</h3>
              <p>On all orders over $200</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💳</div>
              <h3>Secure Payment</h3>
              <p>Pay confidently with us</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💬</div>
              <h3>Dedicated Support</h3>
              <p>We're here to help 24/7</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">↩️</div>
              <h3>Money-Back Guarantee</h3>
              <p>Worry-free shopping</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Discover Our Exclusive Product Collections</h2>
          <p>From innovative gadgets to everyday essentials — explore premium selections tailored just for you.</p>
          <div className="cta-buttons">
            <button className="primary-btn">Shop Now</button>
            <button className="secondary-btn">Contact Us</button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Shop;