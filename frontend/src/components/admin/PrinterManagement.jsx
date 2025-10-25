import React, { useState, useEffect } from 'react';
import './PrinterManagement.css';

const PrinterManagement = () => {
  const [printers, setPrinters] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    price: '',
    stock_quantity: '',
    sku: '',
    image_url: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    category: ''
  });

  useEffect(() => {
    fetchPrinters();
    fetchCategories();
  }, [pagination.page, filters]);

  const fetchPrinters = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const queryParams = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.search && { search: filters.search }),
        ...(filters.category && { category: filters.category })
      });

      const response = await fetch(`http://localhost:3001/api/admin/printers?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPrinters(data.data.products);
          setPagination(prev => ({
            ...prev,
            total: data.data.pagination.total,
            totalPages: data.data.pagination.totalPages
          }));
        } else {
          setError(data.message || 'Failed to fetch printers');
        }
      } else {
        throw new Error('Failed to fetch printers');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:3001/api/admin/categories', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCategories(data.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('authToken');
      const url = editingPrinter 
        ? `http://localhost:3001/api/admin/printers/${editingPrinter.product_id}`
        : 'http://localhost:3001/api/admin/printers';
      
      const method = editingPrinter ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setShowModal(false);
          setEditingPrinter(null);
          resetForm();
          fetchPrinters();
        } else {
          setError(data.message || 'Operation failed');
        }
      } else {
        throw new Error('Operation failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    }
  };

  const handleEdit = (printer) => {
    setEditingPrinter(printer);
    setFormData({
      name: printer.name,
      description: printer.description,
      category_id: printer.category_id,
      price: printer.price,
      stock_quantity: printer.stock_quantity,
      sku: printer.sku,
      image_url: printer.image_url || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (printerId) => {
    if (!window.confirm('Are you sure you want to delete this printer?')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:3001/api/admin/printers/${printerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          fetchPrinters();
        } else {
          setError(data.message || 'Failed to delete printer');
        }
      } else {
        throw new Error('Failed to delete printer');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category_id: '',
      price: '',
      stock_quantity: '',
      sku: '',
      image_url: ''
    });
  };

  const openModal = () => {
    setEditingPrinter(null);
    resetForm();
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPrinter(null);
    resetForm();
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getStockStatus = (quantity) => {
    if (quantity === 0) return { status: 'out-of-stock', label: 'Out of Stock' };
    if (quantity < 10) return { status: 'low-stock', label: 'Low Stock' };
    return { status: 'in-stock', label: 'In Stock' };
  };

  if (loading && printers.length === 0) {
    return (
      <div className="admin-loading">
        <p>Loading printers...</p>
      </div>
    );
  }

  return (
    <div className="printer-management">
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError('')} className="close-error">×</button>
        </div>
      )}

      <div className="admin-table-container">
        <div className="admin-table-header">
          <h3 className="admin-table-title">Printer Management</h3>
          <div className="admin-table-actions">
            <button className="admin-btn admin-btn-primary" onClick={openModal}>
              + Add New Printer
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="admin-filters">
          <div className="filter-group">
            <input
              type="text"
              placeholder="Search printers..."
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              className="filter-input"
            />
          </div>
          <div className="filter-group">
            <select
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.category_id} value={category.category_id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <table className="admin-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>SKU</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {printers.map(printer => {
              const stockInfo = getStockStatus(printer.stock_quantity);
              return (
                <tr key={printer.product_id}>
                  <td>
                    {printer.image_url ? (
                      <img 
                        src={printer.image_url} 
                        alt={printer.name}
                        className="printer-thumbnail"
                      />
                    ) : (
                      <div className="printer-thumbnail-placeholder">
                        🖨️
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="printer-name">
                      {printer.name}
                    </div>
                    <div className="printer-description">
                      {printer.description.substring(0, 50)}...
                    </div>
                  </td>
                  <td>{printer.sku}</td>
                  <td>{printer.category_name}</td>
                  <td>${printer.price}</td>
                  <td>{printer.stock_quantity}</td>
                  <td>
                    <span className={`admin-status-badge ${stockInfo.status}`}>
                      {stockInfo.label}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="admin-btn admin-btn-secondary"
                        onClick={() => handleEdit(printer)}
                      >
                        Edit
                      </button>
                      <button 
                        className="admin-btn admin-btn-danger"
                        onClick={() => handleDelete(printer.product_id)}
                      >
                        Delete
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

      {/* Modal */}
      {showModal && (
        <div className="admin-modal-overlay" onClick={closeModal}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>{editingPrinter ? 'Edit Printer' : 'Add New Printer'}</h3>
              <button className="close-modal" onClick={closeModal}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="admin-form">
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label htmlFor="name">Printer Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="admin-form-group">
                  <label htmlFor="sku">SKU *</label>
                  <input
                    type="text"
                    id="sku"
                    name="sku"
                    value={formData.sku}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="admin-form-group">
                <label htmlFor="description">Description *</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label htmlFor="category_id">Category *</label>
                  <select
                    id="category_id"
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(category => (
                      <option key={category.category_id} value={category.category_id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="admin-form-group">
                  <label htmlFor="price">Price *</label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label htmlFor="stock_quantity">Stock Quantity *</label>
                  <input
                    type="number"
                    id="stock_quantity"
                    name="stock_quantity"
                    value={formData.stock_quantity}
                    onChange={handleInputChange}
                    min="0"
                    required
                  />
                </div>
                <div className="admin-form-group">
                  <label htmlFor="image_url">Image URL</label>
                  <input
                    type="url"
                    id="image_url"
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleInputChange}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>

              <div className="admin-form-actions">
                <button type="button" className="admin-btn admin-btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn-primary">
                  {editingPrinter ? 'Update Printer' : 'Add Printer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrinterManagement;
