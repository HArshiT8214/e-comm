import React, { useState, useEffect } from 'react';
import { ordersAPI } from '../../services/api';
import './ProfileComponents.css';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    fetchOrders();
  }, [pagination.page]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await ordersAPI.getUserOrders({
        page: pagination.page,
        limit: pagination.limit
      });

      if (response.success) {
        setOrders(response.data.orders || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination?.total || 0,
          totalPages: response.data.pagination?.totalPages || 0
        }));
      } else {
        setError(response.message || 'Failed to fetch orders');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOrderClick = async (orderId) => {
    try {
      const response = await ordersAPI.getOrderById(orderId);
      if (response.success) {
        setSelectedOrder(response.data);
        setShowModal(true);
      }
    } catch (error) {
      setError('Failed to load order details');
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    try {
      const response = await ordersAPI.cancelOrder(orderId);
      if (response.success) {
        fetchOrders(); // Refresh the list
        setShowModal(false); // Close modal if open
        setSelectedOrder(null);
      } else {
        setError(response.message || 'Failed to cancel order');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#ffc107';
      case 'paid':
        return '#17a2b8';
      case 'shipped':
        return '#007bff';
      case 'delivered':
        return '#28a745';
      case 'cancelled':
        return '#dc3545';
      case 'refunded':
        return '#6c757d';
      default:
        return '#6c757d';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'paid':
        return '💳';
      case 'shipped':
        return '🚚';
      case 'delivered':
        return '✅';
      case 'cancelled':
        return '❌';
      case 'refunded':
        return '↩️';
      default:
        return '📦';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const canCancelOrder = (order) => {
    return order.status === 'pending' || order.status === 'paid';
  };

  if (loading && orders.length === 0) {
    return (
      <div className="loading-state">
        <p>Loading order history...</p>
      </div>
    );
  }

  return (
    <div className="order-history">
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError('')} className="close-error">×</button>
        </div>
      )}

      <div className="orders-header">
        <h3>Order History</h3>
        <p className="orders-count">
          {pagination.total} order{pagination.total !== 1 ? 's' : ''} found
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h4>No orders found</h4>
          <p>You haven't placed any orders yet.</p>
          <a href="/" className="btn btn-primary">
            Start Shopping
          </a>
        </div>
      ) : (
        <>
          <div className="orders-list">
            {orders.map((order) => (
              <div key={order.order_id} className="order-card">
                <div className="order-header">
                  <div className="order-info">
                    <h4 className="order-number">Order #{order.order_id}</h4>
                    <p className="order-date">Placed on {formatDate(order.created_at)}</p>
                  </div>
                  <div className="order-status">
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(order.status) }}
                    >
                      {getStatusIcon(order.status)} {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="order-summary">
                  <div className="order-items">
                    <span className="items-count">
                      {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="order-total">
                    <strong>${parseFloat(order.total_amount || 0).toFixed(2)}</strong>
                  </div>
                </div>

                <div className="order-actions">
                  <button 
                    className="btn btn-secondary"
                    onClick={() => handleOrderClick(order.order_id)}
                  >
                    View Details
                  </button>
                  {canCancelOrder(order) && (
                    <button 
                      className="btn btn-danger"
                      onClick={() => handleCancelOrder(order.order_id)}
                    >
                      Cancel Order
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button 
                className="btn btn-secondary"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
              >
                Previous
              </button>
              <span className="pagination-info">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button 
                className="btn btn-secondary"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Order Details Modal */}
      {showModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal large-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Order #{selectedOrder.order_id}</h3>
              <button className="close-modal" onClick={() => setShowModal(false)}>×</button>
            </div>
            
            <div className="order-details">
              <div className="order-detail-section">
                <h4>Order Status</h4>
                <div className="status-info">
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(selectedOrder.status) }}
                  >
                    {getStatusIcon(selectedOrder.status)} {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                  </span>
                  <p className="order-date">Ordered on {formatDate(selectedOrder.created_at)}</p>
                </div>
              </div>

              <div className="order-detail-section">
                <h4>Order Items</h4>
                <div className="order-items-list">
                  {selectedOrder.items?.map((item, index) => (
                    <div key={index} className="order-item">
                      <div className="item-info">
                        <h5>{item.product_name}</h5>
                        <p>SKU: {item.sku}</p>
                        <p>Quantity: {item.quantity}</p>
                      </div>
                      <div className="item-price">
                        ${parseFloat(item.unit_price).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="order-detail-section">
                <h4>Order Summary</h4>
                <div className="order-summary-details">
                  <div className="summary-row">
                    <span>Subtotal:</span>
                    <span>${parseFloat(selectedOrder.subtotal_amount || 0).toFixed(2)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Shipping:</span>
                    <span>${parseFloat(selectedOrder.shipping_amount || 0).toFixed(2)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Tax:</span>
                    <span>${parseFloat(selectedOrder.tax_amount || 0).toFixed(2)}</span>
                  </div>
                  {selectedOrder.discount_amount > 0 && (
                    <div className="summary-row discount">
                      <span>Discount:</span>
                      <span>-${parseFloat(selectedOrder.discount_amount).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="summary-row total">
                    <span><strong>Total:</strong></span>
                    <span><strong>${parseFloat(selectedOrder.total_amount || 0).toFixed(2)}</strong></span>
                  </div>
                </div>
              </div>

              {selectedOrder.shipping_address && (
                <div className="order-detail-section">
                  <h4>Shipping Address</h4>
                  <div className="address-info">
                    <p>{selectedOrder.shipping_address.line1}</p>
                    {selectedOrder.shipping_address.line2 && (
                      <p>{selectedOrder.shipping_address.line2}</p>
                    )}
                    <p>
                      {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state} {selectedOrder.shipping_address.zipcode}
                    </p>
                    <p>{selectedOrder.shipping_address.country}</p>
                  </div>
                </div>
              )}

              {selectedOrder.tracking_number && (
                <div className="order-detail-section">
                  <h4>Tracking Information</h4>
                  <div className="tracking-info">
                    <p><strong>Tracking Number:</strong> {selectedOrder.tracking_number}</p>
                    <p><strong>Carrier:</strong> {selectedOrder.carrier}</p>
                    {selectedOrder.shipped_at && (
                      <p><strong>Shipped:</strong> {formatDate(selectedOrder.shipped_at)}</p>
                    )}
                    {selectedOrder.delivered_at && (
                      <p><strong>Delivered:</strong> {formatDate(selectedOrder.delivered_at)}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowModal(false)}
              >
                Close
              </button>
              {canCancelOrder(selectedOrder) && (
                <button 
                  className="btn btn-danger"
                  onClick={() => handleCancelOrder(selectedOrder.order_id)}
                >
                  Cancel Order
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
