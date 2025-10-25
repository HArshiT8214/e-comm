import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import PrinterManagement from '../components/admin/PrinterManagement';
import InventoryManagement from '../components/admin/InventoryManagement';
import './admin.css';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    fetchDashboardStats();
  }, [user, navigate]);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:3001/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setDashboardStats(data.data);
        } else {
          setError(data.message || 'Failed to fetch dashboard data');
        }
      } else {
        throw new Error('Failed to fetch dashboard data');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const renderDashboard = () => {
    if (loading) {
      return (
        <div className="admin-loading">
          <p>Loading dashboard...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="error-message">
          {error}
        </div>
      );
    }

    if (!dashboardStats) {
      return (
        <div className="admin-empty">
          <p>No dashboard data available</p>
        </div>
      );
    }

    const { overview, recentOrders, lowStockProducts } = dashboardStats;

    return (
      <div>
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <div className="admin-stat-header">
              <h3 className="admin-stat-title">Total Products</h3>
              <span className="admin-stat-icon">📦</span>
            </div>
            <p className="admin-stat-value">{overview.total_products}</p>
          </div>

          <div className="admin-stat-card warning">
            <div className="admin-stat-header">
              <h3 className="admin-stat-title">Low Stock</h3>
              <span className="admin-stat-icon">⚠️</span>
            </div>
            <p className="admin-stat-value">{overview.low_stock}</p>
          </div>

          <div className="admin-stat-card danger">
            <div className="admin-stat-header">
              <h3 className="admin-stat-title">Out of Stock</h3>
              <span className="admin-stat-icon">🚫</span>
            </div>
            <p className="admin-stat-value">{overview.out_of_stock}</p>
          </div>

          <div className="admin-stat-card success">
            <div className="admin-stat-header">
              <h3 className="admin-stat-title">Today's Orders</h3>
              <span className="admin-stat-icon">📋</span>
            </div>
            <p className="admin-stat-value">{overview.today_orders}</p>
            <p className="admin-stat-change">${overview.today_revenue || 0}</p>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-header">
              <h3 className="admin-stat-title">Total Customers</h3>
              <span className="admin-stat-icon">👥</span>
            </div>
            <p className="admin-stat-value">{overview.total_customers}</p>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-header">
              <h3 className="admin-stat-title">Open Tickets</h3>
              <span className="admin-stat-icon">🎫</span>
            </div>
            <p className="admin-stat-value">{overview.open_tickets}</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
          <div className="admin-table-container">
            <div className="admin-table-header">
              <h3 className="admin-table-title">Recent Orders</h3>
              <button 
                className="admin-btn admin-btn-primary"
                onClick={() => setActiveTab('orders')}
              >
                View All
              </button>
            </div>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(order => (
                  <tr key={order.order_id}>
                    <td>#{order.order_id}</td>
                    <td>{order.first_name} {order.last_name}</td>
                    <td>${order.total_amount}</td>
                    <td>
                      <span className={`admin-status-badge ${order.status}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>{new Date(order.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="admin-table-container">
            <div className="admin-table-header">
              <h3 className="admin-table-title">Low Stock Products</h3>
              <button 
                className="admin-btn admin-btn-primary"
                onClick={() => setActiveTab('inventory')}
              >
                Manage Inventory
              </button>
            </div>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Stock</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.map(product => (
                  <tr key={product.product_id}>
                    <td>{product.name}</td>
                    <td>{product.sku}</td>
                    <td>
                      <span className="admin-status-badge low-stock">
                        {product.stock_quantity}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="admin-btn admin-btn-success"
                        onClick={() => setActiveTab('inventory')}
                      >
                        Restock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'printers':
        return <PrinterManagement />;
      case 'inventory':
        return <InventoryManagement />;
      case 'orders':
        return <div>Orders management coming soon...</div>;
      case 'categories':
        return <div>Categories management coming soon...</div>;
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="admin-logo">HP Admin Panel</div>
        <div className="admin-user-menu">
          <div className="admin-user-info">
            <div className="admin-avatar">
              {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
            </div>
            <span>{user?.first_name} {user?.last_name}</span>
          </div>
          <button className="admin-logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <aside className="admin-sidebar">
        <nav>
          <ul className="admin-nav">
            <li className="admin-nav-item">
              <a 
                href="#dashboard" 
                className={`admin-nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); setActiveTab('dashboard'); }}
              >
                <span className="admin-nav-icon">📊</span>
                Dashboard
              </a>
            </li>
            <li className="admin-nav-item">
              <a 
                href="#printers" 
                className={`admin-nav-link ${activeTab === 'printers' ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); setActiveTab('printers'); }}
              >
                <span className="admin-nav-icon">🖨️</span>
                Printers
              </a>
            </li>
            <li className="admin-nav-item">
              <a 
                href="#inventory" 
                className={`admin-nav-link ${activeTab === 'inventory' ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); setActiveTab('inventory'); }}
              >
                <span className="admin-nav-icon">📦</span>
                Inventory
              </a>
            </li>
            <li className="admin-nav-item">
              <a 
                href="#orders" 
                className={`admin-nav-link ${activeTab === 'orders' ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); setActiveTab('orders'); }}
              >
                <span className="admin-nav-icon">📋</span>
                Orders
              </a>
            </li>
            <li className="admin-nav-item">
              <a 
                href="#categories" 
                className={`admin-nav-link ${activeTab === 'categories' ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); setActiveTab('categories'); }}
              >
                <span className="admin-nav-icon">🏷️</span>
                Categories
              </a>
            </li>
          </ul>
        </nav>
      </aside>

      <main className="admin-content">
        <div className="admin-page-header">
          <h1 className="admin-page-title">
            {activeTab === 'dashboard' && 'Dashboard'}
            {activeTab === 'printers' && 'Printer Management'}
            {activeTab === 'inventory' && 'Inventory Management'}
            {activeTab === 'orders' && 'Order Management'}
            {activeTab === 'categories' && 'Category Management'}
          </h1>
          <p className="admin-page-subtitle">
            {activeTab === 'dashboard' && 'Overview of your HP Printer Shop'}
            {activeTab === 'printers' && 'Manage printer products and details'}
            {activeTab === 'inventory' && 'Track and manage stock levels'}
            {activeTab === 'orders' && 'View and manage customer orders'}
            {activeTab === 'categories' && 'Organize products by categories'}
          </p>
        </div>

        {renderContent()}
      </main>
    </div>
  );
};


export default AdminDashboard;
