import React, { useState, useEffect, useCallback } from 'react';
import './InventoryManagement.css';

const InventoryManagement = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stockFormData, setStockFormData] = useState({
    quantity: '',
    reason: 'restock'
  });
  const [movements, setMovements] = useState([]);
  const [showMovementsModal, setShowMovementsModal] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    lowStock: false
  });
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    fetchInventory();
  }, [pagination.page, filters, fetchInventory]);

  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const queryParams = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.search && { search: filters.search }),
        ...(filters.lowStock && { lowStock: 'true' })
      });

      const response = await fetch(`http://localhost:3001/api/admin/inventory?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setInventory(data.data.inventory);
          setSummary(data.data.summary);
          setPagination(prev => ({
            ...prev,
            total: data.data.pagination.total,
            totalPages: data.data.pagination.totalPages
          }));
        } else {
          setError(data.message || 'Failed to fetch inventory');
        }
      } else {
        throw new Error('Failed to fetch inventory');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, filters]);

  const fetchMovements = async (productId) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:3001/api/admin/inventory/${productId}/movements`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMovements(data.data.movements);
          setShowMovementsModal(true);
        }
      }
    } catch (error) {
      console.error('Failed to fetch movements:', error);
    }
  };

  const handleStockUpdate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:3001/api/admin/inventory/${selectedProduct.product_id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(stockFormData),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setShowStockModal(false);
          setSelectedProduct(null);
          setStockFormData({ quantity: '', reason: 'restock' });
          fetchInventory();
        } else {
          setError(data.message || 'Failed to update stock');
        }
      } else {
        throw new Error('Failed to update stock');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    }
  };

  const openStockModal = (product) => {
    setSelectedProduct(product);
    setStockFormData({
      quantity: product.stock_quantity.toString(),
      reason: 'restock'
    });
    setShowStockModal(true);
  };

  const closeStockModal = () => {
    setShowStockModal(false);
    setSelectedProduct(null);
    setStockFormData({ quantity: '', reason: 'restock' });
  };

  const openMovementsModal = (product) => {
    setSelectedProduct(product);
    fetchMovements(product.product_id);
  };

  const closeMovementsModal = () => {
    setShowMovementsModal(false);
    setSelectedProduct(null);
    setMovements([]);
  };

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getStockStatus = (quantity) => {
    if (quantity === 0) return { status: 'out-of-stock', label: 'Out of Stock' };
    if (quantity < 10) return { status: 'low-stock', label: 'Low Stock' };
    return { status: 'in-stock', label: 'In Stock' };
  };

  const getMovementIcon = (deltaQuantity) => {
    return deltaQuantity > 0 ? '↗️' : '↘️';
  };

  const getMovementColor = (deltaQuantity) => {
    return deltaQuantity > 0 ? '#28a745' : '#dc3545';
  };

  if (loading && inventory.length === 0) {
    return (
      <div className="admin-loading">
        <p>Loading inventory...</p>
      </div>
    );
  }

  return (
    <div className="inventory-management">
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError('')} className="close-error">×</button>
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <div className="admin-stat-header">
              <h3 className="admin-stat-title">Total Products</h3>
              <span className="admin-stat-icon">📦</span>
            </div>
            <p className="admin-stat-value">{summary.total_products}</p>
          </div>

          <div className="admin-stat-card success">
            <div className="admin-stat-header">
              <h3 className="admin-stat-title">In Stock</h3>
              <span className="admin-stat-icon">✅</span>
            </div>
            <p className="admin-stat-value">{summary.in_stock}</p>
          </div>

          <div className="admin-stat-card warning">
            <div className="admin-stat-header">
              <h3 className="admin-stat-title">Low Stock</h3>
              <span className="admin-stat-icon">⚠️</span>
            </div>
            <p className="admin-stat-value">{summary.low_stock}</p>
          </div>

          <div className="admin-stat-card danger">
            <div className="admin-stat-header">
              <h3 className="admin-stat-title">Out of Stock</h3>
              <span className="admin-stat-icon">🚫</span>
            </div>
            <p className="admin-stat-value">{summary.out_of_stock}</p>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-header">
              <h3 className="admin-stat-title">Total Value</h3>
              <span className="admin-stat-icon">💰</span>
            </div>
            <p className="admin-stat-value">${summary.total_inventory_value?.toFixed(2) || '0.00'}</p>
          </div>
        </div>
      )}

      <div className="admin-table-container">
        <div className="admin-table-header">
          <h3 className="admin-table-title">Inventory Management</h3>
        </div>

        {/* Filters */}
        <div className="admin-filters">
          <div className="filter-group">
            <input
              type="text"
              placeholder="Search products..."
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              className="filter-input"
            />
          </div>
          <div className="filter-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="lowStock"
                checked={filters.lowStock}
                onChange={handleFilterChange}
              />
              Show only low stock items
            </label>
          </div>
        </div>

        <table className="admin-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Category</th>
              <th>Current Stock</th>
              <th>Price</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map(product => {
              const stockInfo = getStockStatus(product.stock_quantity);
              return (
                <tr key={product.product_id}>
                  <td>
                    <div className="product-info">
                      <div className="product-name">{product.name}</div>
                    </div>
                  </td>
                  <td>{product.sku}</td>
                  <td>{product.category_name}</td>
                  <td>
                    <span className={`stock-quantity ${stockInfo.status}`}>
                      {product.stock_quantity}
                    </span>
                  </td>
                  <td>${product.price}</td>
                  <td>
                    <span className={`admin-status-badge ${stockInfo.status}`}>
                      {stockInfo.label}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="admin-btn admin-btn-primary"
                        onClick={() => openStockModal(product)}
                      >
                        Update Stock
                      </button>
                      <button 
                        className="admin-btn admin-btn-secondary"
                        onClick={() => openMovementsModal(product)}
                      >
                        View History
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="admin-pagination">
            <button 
              className="admin-btn admin-btn-secondary"
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
            >
              Previous
            </button>
            <span className="pagination-info">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button 
              className="admin-btn admin-btn-secondary"
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Stock Update Modal */}
      {showStockModal && selectedProduct && (
        <div className="admin-modal-overlay" onClick={closeStockModal}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Update Stock - {selectedProduct.name}</h3>
              <button className="close-modal" onClick={closeStockModal}>×</button>
            </div>
            
            <form onSubmit={handleStockUpdate} className="admin-form">
              <div className="admin-form-group">
                <label htmlFor="quantity">New Stock Quantity *</label>
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  value={stockFormData.quantity}
                  onChange={(e) => setStockFormData(prev => ({ ...prev, quantity: e.target.value }))}
                  min="0"
                  required
                />
                <small>Current stock: {selectedProduct.stock_quantity}</small>
              </div>

              <div className="admin-form-group">
                <label htmlFor="reason">Reason *</label>
                <select
                  id="reason"
                  name="reason"
                  value={stockFormData.reason}
                  onChange={(e) => setStockFormData(prev => ({ ...prev, reason: e.target.value }))}
                  required
                >
                  <option value="restock">Restock</option>
                  <option value="adjustment">Adjustment</option>
                  <option value="return">Return</option>
                  <option value="refund">Refund</option>
                </select>
              </div>

              <div className="admin-form-actions">
                <button type="button" className="admin-btn admin-btn-secondary" onClick={closeStockModal}>
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn-primary">
                  Update Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Movements History Modal */}
      {showMovementsModal && selectedProduct && (
        <div className="admin-modal-overlay" onClick={closeMovementsModal}>
          <div className="admin-modal large-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Stock History - {selectedProduct.name}</h3>
              <button className="close-modal" onClick={closeMovementsModal}>×</button>
            </div>
            
            <div className="movements-content">
              <div className="current-stock-info">
                <strong>Current Stock: {selectedProduct.stock_quantity}</strong>
              </div>
              
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Change</th>
                    <th>Reason</th>
                    <th>Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map(movement => (
                    <tr key={movement.movement_id}>
                      <td>{new Date(movement.created_at).toLocaleString()}</td>
                      <td>
                        <span 
                          style={{ color: getMovementColor(movement.delta_quantity) }}
                        >
                          {getMovementIcon(movement.delta_quantity)} {movement.delta_quantity}
                        </span>
                      </td>
                      <td>{movement.reason}</td>
                      <td>{movement.reference_type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="admin-form-actions">
              <button type="button" className="admin-btn admin-btn-secondary" onClick={closeMovementsModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManagement;
