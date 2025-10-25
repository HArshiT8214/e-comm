import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import './ProfileComponents.css';

const PasswordChange = () => {
  const { changePassword } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
    setSuccess('');
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validatePassword = (password) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
      minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar,
      isValid: minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validation
    if (formData.new_password !== formData.confirm_password) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    const passwordValidation = validatePassword(formData.new_password);
    if (!passwordValidation.isValid) {
      setError('New password does not meet security requirements');
      setLoading(false);
      return;
    }

    try {
      const result = await changePassword({
        currentPassword: formData.current_password,
        newPassword: formData.new_password
      });

      if (result.success) {
        setSuccess('Password changed successfully!');
        setFormData({
          current_password: '',
          new_password: '',
          confirm_password: ''
        });
      } else {
        setError(result.message || 'Failed to change password');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const passwordValidation = validatePassword(formData.new_password);

  return (
    <div className="password-change">
      <div className="password-info">
        <h3>Password Security</h3>
        <p>
          For your security, please choose a strong password that you haven't used before.
          Your password should be at least 8 characters long and include a mix of uppercase letters, 
          lowercase letters, numbers, and special characters.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="password-form">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {success && (
          <div className="success-message">
            {success}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="current_password">Current Password *</label>
          <div className="password-input-wrapper">
            <input
              type={showPasswords.current ? 'text' : 'password'}
              id="current_password"
              name="current_password"
              value={formData.current_password}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="Enter your current password"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => togglePasswordVisibility('current')}
              disabled={loading}
            >
              {showPasswords.current ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="new_password">New Password *</label>
          <div className="password-input-wrapper">
            <input
              type={showPasswords.new ? 'text' : 'password'}
              id="new_password"
              name="new_password"
              value={formData.new_password}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="Enter your new password"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => togglePasswordVisibility('new')}
              disabled={loading}
            >
              {showPasswords.new ? '🙈' : '👁️'}
            </button>
          </div>

          {/* Password Strength Indicator */}
          {formData.new_password && (
            <div className="password-strength">
              <div className="strength-meter">
                <div 
                  className={`strength-bar ${passwordValidation.isValid ? 'strong' : 'weak'}`}
                  style={{ width: `${(Object.values(passwordValidation).filter(Boolean).length - 1) * 20}%` }}
                ></div>
              </div>
              <div className="strength-requirements">
                <div className={`requirement ${passwordValidation.minLength ? 'valid' : 'invalid'}`}>
                  {passwordValidation.minLength ? '✓' : '✗'} At least 8 characters
                </div>
                <div className={`requirement ${passwordValidation.hasUpperCase ? 'valid' : 'invalid'}`}>
                  {passwordValidation.hasUpperCase ? '✓' : '✗'} One uppercase letter
                </div>
                <div className={`requirement ${passwordValidation.hasLowerCase ? 'valid' : 'invalid'}`}>
                  {passwordValidation.hasLowerCase ? '✓' : '✗'} One lowercase letter
                </div>
                <div className={`requirement ${passwordValidation.hasNumbers ? 'valid' : 'invalid'}`}>
                  {passwordValidation.hasNumbers ? '✓' : '✗'} One number
                </div>
                <div className={`requirement ${passwordValidation.hasSpecialChar ? 'valid' : 'invalid'}`}>
                  {passwordValidation.hasSpecialChar ? '✓' : '✗'} One special character
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="confirm_password">Confirm New Password *</label>
          <div className="password-input-wrapper">
            <input
              type={showPasswords.confirm ? 'text' : 'password'}
              id="confirm_password"
              name="confirm_password"
              value={formData.confirm_password}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="Confirm your new password"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => togglePasswordVisibility('confirm')}
              disabled={loading}
            >
              {showPasswords.confirm ? '🙈' : '👁️'}
            </button>
          </div>
          
          {formData.confirm_password && formData.new_password !== formData.confirm_password && (
            <div className="validation-error">
              Passwords do not match
            </div>
          )}
          
          {formData.confirm_password && formData.new_password === formData.confirm_password && formData.new_password && (
            <div className="validation-success">
              Passwords match
            </div>
          )}
        </div>

        <div className="form-actions">
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading || !passwordValidation.isValid || formData.new_password !== formData.confirm_password}
          >
            {loading ? 'Changing Password...' : 'Change Password'}
          </button>
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={() => {
              setFormData({
                current_password: '',
                new_password: '',
                confirm_password: ''
              });
              setError('');
              setSuccess('');
            }}
            disabled={loading}
          >
            Reset
          </button>
        </div>
      </form>

      <div className="security-tips">
        <h4>Security Tips</h4>
        <ul>
          <li>Use a unique password that you don't use for other accounts</li>
          <li>Consider using a password manager to generate and store secure passwords</li>
          <li>Change your password regularly, especially if you suspect any security issues</li>
          <li>Never share your password with anyone</li>
          <li>Log out from all devices if you suspect unauthorized access</li>
        </ul>
      </div>
    </div>
  );
};

export default PasswordChange;
