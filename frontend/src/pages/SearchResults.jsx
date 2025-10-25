import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './SearchResults.css';
import printerImage from '../components/Assets/printer_icon.jpg';
import { productsAPI } from '../services/api';
import { useCart } from '../context/CartContext.jsx';

function SearchResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const { addItem } = useCart();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [selectedRating, setSelectedRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);

  // Get search query from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const query = urlParams.get('q') || '';
    setSearchQuery(query);
    if (query) {
      performSearch(query);
    }
  }, [location.search]);

  const performSearch = async (query) => {
    try {
      setLoading(true);
      const response = await productsAPI.searchProducts(query, {
        page: 1,
        limit: 50,
        sort_by: 'created_at',
        sort_order: 'DESC'
      });
      
      if (response.success) {
        const searchResults = response.data.products.map(p => ({
          id: p.product_id,
          name: p.name,
          category: p.category_name || 'Printers',
          price: Number(p.price),
          originalPrice: Number(p.price) * 1.2,
          discount: Math.round(((Number(p.price) * 1.2 - Number(p.price)) / (Number(p.price) * 1.2)) * 100),
          image: p.image_url || printerImage,
          rating: p.average_rating || 4.5,
          reviews: p.review_count || 0,
          stock_quantity: p.stock_quantity,
          raw: p,
          tags: ['HP', 'Printer', 'Wireless', 'All-in-One']
        }));
        setProducts(searchResults);
        setFilteredProducts(searchResults);
      }
    } catch (err) {
      setError('Failed to search products');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...products];

    // Price filter
    filtered = filtered.filter(product => 
      product.price >= priceRange[0] && product.price <= priceRange[1]
    );

    // Rating filter
    if (selectedRating > 0) {
      filtered = filtered.filter(product => product.rating >= selectedRating);
    }

    // Tags filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(product => 
        selectedTags.some(tag => product.tags.includes(tag))
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price_low':
          return a.price - b.price;
        case 'price_high':
          return b.price - a.price;
        case 'rating':
          return b.rating - a.rating;
        case 'newest':
          return b.id - a.id;
        case 'relevance':
        default:
          return 0;
      }
    });

    setFilteredProducts(filtered);
  }, [products, priceRange, selectedRating, selectedTags, sortBy]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleAddToCart = (product) => {
    if (product.stock_quantity > 0) {
      addItem(product.raw, 1);
    }
  };

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  const handleTagToggle = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setPriceRange([0, 1000]);
    setSelectedRating(0);
    setSelectedTags([]);
    setSortBy('relevance');
  };

  const availableTags = [...new Set(products.flatMap(p => p.tags))];

  if (loading) {
    return (
      <div className="search-results-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Searching products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="search-results-page">
      {/* Header */}
      <div className="search-header">
        <div className="container">
          <h1>Search Results</h1>
          <p>You searched for "{searchQuery}"</p>
        </div>
      </div>

      <div className="search-content">
        <div className="container">
          <div className="search-layout">
            {/* Sidebar Filters */}
            <div className="filters-sidebar">
              <div className="filter-section">
                <h3>Search</h3>
                <form onSubmit={handleSearch} className="search-form">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                  />
                  <button type="submit">🔍</button>
                </form>
              </div>

              <div className="filter-section">
                <h3>Filter by price</h3>
                <div className="price-filter">
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                    className="price-slider"
                  />
                  <div className="price-display">
                    Price: ${priceRange[0]} - ${priceRange[1]}
                  </div>
                  <button className="filter-btn">Filter</button>
                </div>
              </div>

              <div className="filter-section">
                <h3>Average rating</h3>
                <div className="rating-filter">
                  <div className="stars">
                    {[5, 4, 3, 2, 1].map(rating => (
                      <label key={rating} className="rating-option">
                        <input
                          type="radio"
                          name="rating"
                          checked={selectedRating === rating}
                          onChange={() => setSelectedRating(selectedRating === rating ? 0 : rating)}
                        />
                        <div className="star-display">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={i < rating ? 'star filled' : 'star'}>★</span>
                          ))}
                          <span className="rating-text">& up</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="filter-section">
                <h3>Product tags</h3>
                <div className="tags-filter">
                  {availableTags.map(tag => (
                    <button
                      key={tag}
                      className={`tag-btn ${selectedTags.includes(tag) ? 'active' : ''}`}
                      onClick={() => handleTagToggle(tag)}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>

              <button className="clear-filters-btn" onClick={clearFilters}>
                Clear all filters
              </button>
            </div>

            {/* Main Content */}
            <div className="main-content">
              <div className="results-header">
                <div className="results-count">
                  Showing all {filteredProducts.length} results
                </div>
                <div className="sort-controls">
                  <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                    className="sort-select"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="price_low">Price: Low to High</option>
                    <option value="price_high">Price: High to Low</option>
                    <option value="rating">Customer Rating</option>
                    <option value="newest">Newest</option>
                  </select>
                </div>
              </div>

              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}

              {filteredProducts.length === 0 ? (
                <div className="no-results">
                  <h3>No products found</h3>
                  <p>Try adjusting your search or filter criteria</p>
                </div>
              ) : (
                <div className="products-grid">
                  {filteredProducts.map(product => (
                    <div 
                      key={product.id} 
                      className="product-card"
                      onClick={() => handleProductClick(product.id)}
                    >
                      <div className="product-image">
                        <div className="discount-badge">-{product.discount}%</div>
                        <img src={product.image} alt={product.name} />
                      </div>
                      
                      <div className="product-info">
                        <h3 className="product-name">{product.name}</h3>
                        
                        <div className="product-rating">
                          <div className="stars">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className={i < Math.floor(product.rating) ? 'star filled' : 'star'}>
                                ★
                              </span>
                            ))}
                          </div>
                          <span className="rating-text">({product.reviews})</span>
                        </div>
                        
                        <div className="product-price">
                          <span className="original-price">${product.originalPrice.toFixed(2)}</span>
                          <span className="current-price">${product.price.toFixed(2)}</span>
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
        </div>
      </div>
    </div>
  );
}

export default SearchResults;
