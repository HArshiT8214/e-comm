import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import './ProfileComponents.css';

const AddressManagement = () => {
  const { user, addAddress, updateAddress, deleteAddress } = useContext(AuthContext);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [formData, setFormData] = useState({
    line1: '',
    line2: '',
    city: '',
    state: '',
    zipcode: '',
    country: 'USA',
    is_default: false
  });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      // In a real app, you'd fetch addresses from an API
      // For now, we'll simulate with user data
      setAddresses(user?.addresses || []);
    } catch (error) {
      setError('Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setError('');
    setSuccess('');

    try {
      let result;
      if (editingAddress) {
        result = await updateAddress(editingAddress.address_id, formData);
      } else {
        result = await addAddress(formData);
      }

      if (result.success) {
        setSuccess(editingAddress ? 'Address updated successfully!' : 'Address added successfully!');
        setShowModal(false);
        setEditingAddress(null);
        resetForm();
        fetchAddresses();
      } else {
        setError(result.message || 'Operation failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (address) => {
    setEditingAddress(address);
    setFormData({
      line1: address.line1 || '',
      line2: address.line2 || '',
      city: address.city || '',
      state: address.state || '',
      zipcode: address.zipcode || '',
      country: address.country || 'USA',
      is_default: address.is_default || false
    });
    setShowModal(true);
  };

  const handleDelete = async (addressId) => {
    if (!window.confirm('Are you sure you want to delete this address?')) {
      return;
    }

    try {
      const result = await deleteAddress(addressId);
      if (result.success) {
        setSuccess('Address deleted successfully!');
        fetchAddresses();
      } else {
        setError(result.message || 'Failed to delete address');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      line1: '',
      line2: '',
      city: '',
      state: '',
      zipcode: '',
      country: 'USA',
      is_default: false
    });
  };

  const openModal = () => {
    setEditingAddress(null);
    resetForm();
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAddress(null);
    resetForm();
    setError('');
    setSuccess('');
  };

  const usStates = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];

  if (loading) {
    return (
      <div className="loading-state">
        <p>Loading addresses...</p>
      </div>
    );
  }

  return (
    <div className="address-management">
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError('')} className="close-error">×</button>
        </div>
      )}

      {success && (
        <div className="success-message">
          {success}
          <button onClick={() => setSuccess('')} className="close-error">×</button>
        </div>
      )}

      <div className="address-header">
        <h3>Your Addresses</h3>
        <button className="btn btn-primary" onClick={openModal}>
          + Add New Address
        </button>
      </div>

      <div className="addresses-grid">
        {addresses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📍</div>
            <h4>No addresses found</h4>
            <p>Add your first address to get started with shipping.</p>
            <button className="btn btn-primary" onClick={openModal}>
              Add Address
            </button>
          </div>
        ) : (
          addresses.map((address) => (
            <div key={address.address_id} className="address-card">
              <div className="address-header">
                <div className="address-info">
                  {address.is_default && (
                    <span className="default-badge">Default</span>
                  )}
                </div>
                <div className="address-actions">
                  <button 
                    className="btn btn-sm btn-secondary"
                    onClick={() => handleEdit(address)}
                  >
                    Edit
                  </button>
                  <button 
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDelete(address.address_id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
              
              <div className="address-details">
                <p className="address-line">{address.line1}</p>
                {address.line2 && (
                  <p className="address-line">{address.line2}</p>
                )}
                <p className="address-line">
                  {address.city}, {address.state} {address.zipcode}
                </p>
                <p className="address-line">{address.country}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingAddress ? 'Edit Address' : 'Add New Address'}</h3>
              <button className="close-modal" onClick={closeModal}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="address-form">
              <div className="form-group">
                <label htmlFor="line1">Street Address *</label>
                <input
                  type="text"
                  id="line1"
                  name="line1"
                  value={formData.line1}
                  onChange={handleInputChange}
                  required
                  disabled={formLoading}
                  placeholder="123 Main Street"
                />
              </div>

              <div className="form-group">
                <label htmlFor="line2">Apartment, Suite, etc.</label>
                <input
                  type="text"
                  id="line2"
                  name="line2"
                  value={formData.line2}
                  onChange={handleInputChange}
                  disabled={formLoading}
                  placeholder="Apt 4B"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="city">City *</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                    disabled={formLoading}
                    placeholder="New York"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="state">State *</label>
                  <select
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    required
                    disabled={formLoading}
                  >
                    <option value="">Select State</option>
                    {usStates.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="zipcode">ZIP Code *</label>
                  <input
                    type="text"
                    id="zipcode"
                    name="zipcode"
                    value={formData.zipcode}
                    onChange={handleInputChange}
                    required
                    disabled={formLoading}
                    placeholder="10001"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="country">Country *</label>
                  <input
                    type="text"
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    required
                    disabled={formLoading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="is_default"
                    checked={formData.is_default}
                    onChange={handleInputChange}
                    disabled={formLoading}
                  />
                  Set as default shipping address
                </label>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={closeModal}
                  disabled={formLoading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={formLoading}
                >
                  {formLoading ? 'Saving...' : (editingAddress ? 'Update Address' : 'Add Address')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddressManagement;
