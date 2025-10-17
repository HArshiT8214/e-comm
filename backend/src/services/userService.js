const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const { generateToken } = require('../config/jwt');
const { generateResetToken } = require('../utils/helpers');
const { sendPasswordResetEmail } = require('../utils/email');

class UserService {
  // Register new user
  async registerUser(userData) {
    const { firstName, lastName, email, password, phone } = userData;
    
    try {
      // Check if user already exists
      const [existingUsers] = await pool.execute(
        'SELECT user_id FROM users WHERE email = ?',
        [email]
      );

      if (existingUsers.length > 0) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Insert user
      const [result] = await pool.execute(
        `INSERT INTO users (first_name, last_name, email, password_hash, phone, role, is_active) 
         VALUES (?, ?, ?, ?, ?, 'customer', 1)`,
        [firstName, lastName, email, passwordHash, phone || null]
      );

      const userId = result.insertId;

      // Generate JWT token
      const token = generateToken({ 
        user_id: userId, 
        email, 
        role: 'customer' 
      });

      return {
        success: true,
        message: 'User registered successfully',
        data: {
          user_id: userId,
          email,
          first_name: firstName,
          last_name: lastName,
          role: 'customer',
          token
        }
      };
    } catch (error) {
      throw new Error(`Registration failed: ${error.message}`);
    }
  }

  // Login user
  async loginUser(credentials) {
    const { email, password } = credentials;
    
    try {
      // Find user by email
      const [users] = await pool.execute(
        'SELECT user_id, first_name, last_name, email, password_hash, role, is_active FROM users WHERE email = ?',
        [email]
      );

      if (users.length === 0) {
        throw new Error('Invalid email or password');
      }

      const user = users[0];

      if (!user.is_active) {
        throw new Error('Account is deactivated');
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        throw new Error('Invalid email or password');
      }

      // Generate JWT token
      const token = generateToken({ 
        user_id: user.user_id, 
        email: user.email, 
        role: user.role 
      });

      return {
        success: true,
        message: 'Login successful',
        data: {
          user_id: user.user_id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          token
        }
      };
    } catch (error) {
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  // Get user profile
  async getUserProfile(userId) {
    try {
      const [users] = await pool.execute(
        `SELECT user_id, first_name, last_name, email, phone, role, created_at 
         FROM users WHERE user_id = ? AND is_active = 1`,
        [userId]
      );

      if (users.length === 0) {
        throw new Error('User not found');
      }

      // Get user addresses
      const [addresses] = await pool.execute(
        'SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
        [userId]
      );

      return {
        success: true,
        data: {
          ...users[0],
          addresses
        }
      };
    } catch (error) {
      throw new Error(`Failed to get user profile: ${error.message}`);
    }
  }

  // Update user profile
  async updateUserProfile(userId, updateData) {
    const { first_name, last_name, phone } = updateData;
    
    try {
      await pool.execute(
        'UPDATE users SET first_name = ?, last_name = ?, phone = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
        [first_name, last_name, phone, userId]
      );

      return {
        success: true,
        message: 'Profile updated successfully'
      };
    } catch (error) {
      throw new Error(`Failed to update profile: ${error.message}`);
    }
  }

  // Change password
  async changePassword(userId, passwordData) {
    const { currentPassword, newPassword } = passwordData;
    
    try {
      // Get current password hash
      const [users] = await pool.execute(
        'SELECT password_hash FROM users WHERE user_id = ?',
        [userId]
      );

      if (users.length === 0) {
        throw new Error('User not found');
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, users[0].password_hash);
      if (!isValidPassword) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const saltRounds = 12;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await pool.execute(
        'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
        [newPasswordHash, userId]
      );

      return {
        success: true,
        message: 'Password changed successfully'
      };
    } catch (error) {
      throw new Error(`Failed to change password: ${error.message}`);
    }
  }

  // Request password reset
  async requestPasswordReset(email) {
    try {
      const [users] = await pool.execute(
        'SELECT user_id, email FROM users WHERE email = ? AND is_active = 1',
        [email]
      );

      if (users.length === 0) {
        // Don't reveal if email exists or not
        return {
          success: true,
          message: 'If the email exists, a reset link has been sent'
        };
      }

      const resetToken = generateResetToken();
      const expiresAt = new Date(Date.now() + 3600000); // 1 hour

      // Store reset token (you might want to create a separate table for this)
      // For now, we'll use a simple approach
      await pool.execute(
        'UPDATE users SET password_hash = ? WHERE user_id = ?',
        [resetToken, users[0].user_id]
      );

      // Send reset email
      const emailSent = await sendPasswordResetEmail(email, resetToken);
      
      if (!emailSent) {
        throw new Error('Failed to send reset email');
      }

      return {
        success: true,
        message: 'If the email exists, a reset link has been sent'
      };
    } catch (error) {
      throw new Error(`Password reset failed: ${error.message}`);
    }
  }

  // Add address
  async addAddress(userId, addressData) {
    const { line1, line2, city, state, zipcode, country, is_default } = addressData;
    
    try {
      // If this is set as default, unset other defaults
      if (is_default) {
        await pool.execute(
          'UPDATE addresses SET is_default = 0 WHERE user_id = ?',
          [userId]
        );
      }

      const [result] = await pool.execute(
        `INSERT INTO addresses (user_id, line1, line2, city, state, zipcode, country, is_default) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, line1, line2, city, state, zipcode, country, is_default ? 1 : 0]
      );

      return {
        success: true,
        message: 'Address added successfully',
        data: { address_id: result.insertId }
      };
    } catch (error) {
      throw new Error(`Failed to add address: ${error.message}`);
    }
  }

  // Update address
  async updateAddress(userId, addressId, addressData) {
    const { line1, line2, city, state, zipcode, country, is_default } = addressData;
    
    try {
      // Verify address belongs to user
      const [addresses] = await pool.execute(
        'SELECT address_id FROM addresses WHERE address_id = ? AND user_id = ?',
        [addressId, userId]
      );

      if (addresses.length === 0) {
        throw new Error('Address not found');
      }

      // If this is set as default, unset other defaults
      if (is_default) {
        await pool.execute(
          'UPDATE addresses SET is_default = 0 WHERE user_id = ? AND address_id != ?',
          [userId, addressId]
        );
      }

      await pool.execute(
        `UPDATE addresses SET line1 = ?, line2 = ?, city = ?, state = ?, zipcode = ?, country = ?, is_default = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE address_id = ? AND user_id = ?`,
        [line1, line2, city, state, zipcode, country, is_default ? 1 : 0, addressId, userId]
      );

      return {
        success: true,
        message: 'Address updated successfully'
      };
    } catch (error) {
      throw new Error(`Failed to update address: ${error.message}`);
    }
  }

  // Delete address
  async deleteAddress(userId, addressId) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM addresses WHERE address_id = ? AND user_id = ?',
        [addressId, userId]
      );

      if (result.affectedRows === 0) {
        throw new Error('Address not found');
      }

      return {
        success: true,
        message: 'Address deleted successfully'
      };
    } catch (error) {
      throw new Error(`Failed to delete address: ${error.message}`);
    }
  }
}

module.exports = new UserService();
