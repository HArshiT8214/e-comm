// import React, { useState, useEffect, useContext } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { AuthContext } from '../context/AuthContext';
// import { ordersAPI } from '../services/api';
// import ProfileEdit from '../components/profile/ProfileEdit';
// import AddressManagement from '../components/profile/AddressManagement';
// import OrderHistory from '../components/profile/OrderHistory';
// import PasswordChange from '../components/profile/PasswordChange';
// import './UserProfile.css';

// const UserProfile = () => {
//   const [activeTab, setActiveTab] = useState('profile');
//   const [orders, setOrders] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const { user, logout } = useContext(AuthContext);
//   const navigate = useNavigate();

//   useEffect(() => {
//     if (!user) {
//       navigate('/login');
//       return;
//     }
//     fetchOrders();
//   }, [user, navigate]);

//   const fetchOrders = async () => {
//     try {
//       setLoading(true);
//       const response = await ordersAPI.getUserOrders({ limit: 10 });
//       if (response.success) {
//         setOrders(response.data.orders || []);
//       } else {
//         setError(response.message || 'Failed to fetch orders');
//       }
//     } catch (error) {
//       setError('Network error. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleLogout = () => {
//     logout();
//     navigate('/');
//   };

//   const renderContent = () => {
//     switch (activeTab) {
//       case 'profile':
//         return <ProfileEdit />;
//       case 'addresses':
//         return <AddressManagement />;
//       case 'orders':
//         return <OrderHistory />;
//       case 'password':
//         return <PasswordChange />;
//       default:
//         return <ProfileEdit />;
//     }
//   };

//   const getInitials = (firstName, lastName) => {
//     return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
//   };

//   if (!user) {
//     return (
//       <div className="profile-container">
//         <div className="profile-loading">
//           <p>Loading profile...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="profile-container">
//       <div className="profile-header">
//         <div className="profile-avatar">
//           <div className="avatar-circle">
//             {getInitials(user.first_name, user.last_name)}
//           </div>
//         </div>
//         <div className="profile-info">
//           <h1 className="profile-name">
//             {user.first_name} {user.last_name}
//           </h1>
//           <p className="profile-email">{user.email}</p>
//           <p className="profile-role">Customer since {new Date(user.created_at).getFullYear()}</p>
//         </div>
//         <button className="logout-btn" onClick={handleLogout}>
//           Logout
//         </button>
//       </div>

//       <div className="profile-content">
//         <aside className="profile-sidebar">
//           <nav className="profile-nav">
//             <ul className="profile-nav-list">
//               <li className="profile-nav-item">
//                 <button 
//                   className={`profile-nav-link ${activeTab === 'profile' ? 'active' : ''}`}
//                   onClick={() => setActiveTab('profile')}
//                 >
//                   <span className="nav-icon">👤</span>
//                   Personal Info
//                 </button>
//               </li>
//               <li className="profile-nav-item">
//                 <button 
//                   className={`profile-nav-link ${activeTab === 'addresses' ? 'active' : ''}`}
//                   onClick={() => setActiveTab('addresses')}
//                 >
//                   <span className="nav-icon">📍</span>
//                   Addresses
//                 </button>
//               </li>
//               <li className="profile-nav-item">
//                 <button 
//                   className={`profile-nav-link ${activeTab === 'orders' ? 'active' : ''}`}
//                   onClick={() => setActiveTab('orders')}
//                 >
//                   <span className="nav-icon">📋</span>
//                   Order History
//                   {orders.length > 0 && (
//                     <span className="nav-badge">{orders.length}</span>
//                   )}
//                 </button>
//               </li>
//               <li className="profile-nav-item">
//                 <button 
//                   className={`profile-nav-link ${activeTab === 'password' ? 'active' : ''}`}
//                   onClick={() => setActiveTab('password')}
//                 >
//                   <span className="nav-icon">🔒</span>
//                   Change Password
//                 </button>
//               </li>
//             </ul>
//           </nav>

//           {/* Quick Stats */}
//           <div className="profile-stats">
//             <h3>Quick Stats</h3>
//             <div className="stats-grid">
//               <div className="stat-item">
//                 <span className="stat-number">{orders.length}</span>
//                 <span className="stat-label">Orders</span>
//               </div>
//               <div className="stat-item">
//                 <span className="stat-number">
//                   ${orders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0).toFixed(2)}
//                 </span>
//                 <span className="stat-label">Total Spent</span>
//               </div>
//               <div className="stat-item">
//                 <span className="stat-number">
//                   {orders.filter(order => order.status === 'delivered').length}
//                 </span>
//                 <span className="stat-label">Delivered</span>
//               </div>
//             </div>
//           </div>
//         </aside>

//         <main className="profile-main">
//           <div className="profile-page-header">
//             <h2 className="page-title">
//               {activeTab === 'profile' && 'Personal Information'}
//               {activeTab === 'addresses' && 'Address Management'}
//               {activeTab === 'orders' && 'Order History'}
//               {activeTab === 'password' && 'Change Password'}
//             </h2>
//             <p className="page-subtitle">
//               {activeTab === 'profile' && 'Manage your personal information and preferences'}
//               {activeTab === 'addresses' && 'Add, edit, and manage your shipping addresses'}
//               {activeTab === 'orders' && 'View your order history and track current orders'}
//               {activeTab === 'password' && 'Update your account password for security'}
//             </p>
//           </div>

//           {error && (
//             <div className="error-message">
//               {error}
//               <button onClick={() => setError('')} className="close-error">×</button>
//             </div>
//           )}

//           <div className="profile-page-content">
//             {renderContent()}
//           </div>
//         </main>
//       </div>
//     </div>
//   );
// };

// export default UserProfile;




// ===============================
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ordersAPI } from '../services/api';
import ProfileEdit from '../components/profile/ProfileEdit';
import AddressManagement from '../components/profile/AddressManagement';
import OrderHistory from '../components/profile/OrderHistory';
import PasswordChange from '../components/profile/PasswordChange';
import './UserProfile.css';

const UserProfile = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [error, setError] = useState('');
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect to login if user not found after auth check
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  // Fetch user orders once user is available
  useEffect(() => {
    if (user && user.user_id) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      const response = await ordersAPI.getUserOrders({ limit: 10 });
      if (response.success) {
        setOrders(response.data.orders || []);
      } else {
        setError(response.message || 'Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Network or server error. Please try again later.');
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileEdit />;
      case 'addresses':
        return <AddressManagement />;
      case 'orders':
        return <OrderHistory />;
      case 'password':
        return <PasswordChange />;
      default:
        return <ProfileEdit />;
    }
  };

  const getInitials = (firstName, lastName) =>
    `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();

  // Still loading user data
  if (loading) {
    return (
      <div className="profile-container">
        <div className="profile-loading">
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  // User not found (after loading)
  if (!user) {
    return (
      <div className="profile-container">
        <div className="profile-loading">
          <p>No user found. Please log in again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-avatar">
          <div className="avatar-circle">
            {getInitials(user.first_name, user.last_name)}
          </div>
        </div>
        <div className="profile-info">
          <h1 className="profile-name">
            {user.first_name} {user.last_name}
          </h1>
          <p className="profile-email">{user.email}</p>
          <p className="profile-role">
            Customer since {new Date(user.created_at).getFullYear()}
          </p>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div className="profile-content">
        <aside className="profile-sidebar">
          <nav className="profile-nav">
            <ul className="profile-nav-list">
              <li className="profile-nav-item">
                <button
                  className={`profile-nav-link ${activeTab === 'profile' ? 'active' : ''}`}
                  onClick={() => setActiveTab('profile')}
                >
                  👤 Personal Info
                </button>
              </li>
              <li className="profile-nav-item">
                <button
                  className={`profile-nav-link ${activeTab === 'addresses' ? 'active' : ''}`}
                  onClick={() => setActiveTab('addresses')}
                >
                  📍 Addresses
                </button>
              </li>
              <li className="profile-nav-item">
                <button
                  className={`profile-nav-link ${activeTab === 'orders' ? 'active' : ''}`}
                  onClick={() => setActiveTab('orders')}
                >
                  📋 Order History
                  {orders.length > 0 && (
                    <span className="nav-badge">{orders.length}</span>
                  )}
                </button>
              </li>
              <li className="profile-nav-item">
                <button
                  className={`profile-nav-link ${activeTab === 'password' ? 'active' : ''}`}
                  onClick={() => setActiveTab('password')}
                >
                  🔒 Change Password
                </button>
              </li>
            </ul>
          </nav>

          <div className="profile-stats">
            <h3>Quick Stats</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-number">{orders.length}</span>
                <span className="stat-label">Orders</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">
                  $
                  {orders
                    .reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0)
                    .toFixed(2)}
                </span>
                <span className="stat-label">Total Spent</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">
                  {orders.filter((o) => o.status === 'delivered').length}
                </span>
                <span className="stat-label">Delivered</span>
              </div>
            </div>
          </div>
        </aside>

        <main className="profile-main">
          <div className="profile-page-header">
            <h2 className="page-title">
              {activeTab === 'profile' && 'Personal Information'}
              {activeTab === 'addresses' && 'Address Management'}
              {activeTab === 'orders' && 'Order History'}
              {activeTab === 'password' && 'Change Password'}
            </h2>
          </div>

          {error && (
            <div className="error-message">
              {error}
              <button onClick={() => setError('')} className="close-error">
                ×
              </button>
            </div>
          )}

          {loadingOrders ? (
            <div className="profile-loading">
              <p>Loading orders...</p>
            </div>
          ) : (
            <div className="profile-page-content">{renderContent()}</div>
          )}
        </main>
      </div>
    </div>
  );
};

export default UserProfile;
