const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const { generateToken } = require('../config/jwt');
const { generateResetToken } = require('../utils/helpers');
const { sendPasswordResetEmail } = require('../utils/email');

// NOTE: You must include these helpers in your database/utility file OR
// copy them into this file from the productService.js conversion.
const executeQuery = async (sql, params = []) => {
    // Helper must convert '?' to '$1, $2, ...' and use pool.query
    const buildPostgresQuery = (s, p) => {
        let index = 1;
        const pgSql = s.replace(/\?/g, () => `$${index++}`);
        return [pgSql, p];
    };
    
    const [query, pgParams] = buildPostgresQuery(sql, params);
    
    // ✅ FIX: Return the *entire* result object, not just result.rows
    const result = await pool.query(query, pgParams);
    return result; 
};

class UserService {
  // Register new user
  async registerUser(userData) {
    const { firstName, lastName, email, password, phone } = userData;
    
    try {
      // Check if user already exists
      // ✅ FIX: Read from result.rows
      const existingUsers = await executeQuery(
        'SELECT user_id FROM users WHERE email = ?',
        [email]
      );

      if (existingUsers.rows.length > 0) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Insert user and use RETURNING to get ID
      // ✅ FIX: Read from result.rows
      const result = await executeQuery(
        `INSERT INTO users (first_name, last_name, email, password_hash, phone, role, is_active) 
         VALUES (?, ?, ?, ?, ?, 'customer', TRUE) RETURNING user_id`,
        [firstName, lastName, email, passwordHash, phone || null]
      );

      const userId = result.rows[0].user_id;

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
      // Check for PostgreSQL unique constraint error code (23505)
      if (error.code === '23505') {
          throw new Error('User with this email already exists');
      }
      throw new Error(`Registration failed: ${error.message}`);
    }
  }

  // Login user
  async loginUser(credentials) {
    const { email, password } = credentials;
    
    try {
      // Find user by email
      // ✅ FIX: Read from result.rows
      const usersResult = await executeQuery(
        'SELECT user_id, first_name, last_name, email, password_hash, role, is_active FROM users WHERE email = ?',
        [email]
      );

      if (usersResult.rows.length === 0) {
        throw new Error('Invalid email or password');
      }

      const user = usersResult.rows[0];

      // ✅ FIX: Check boolean 'is_active'
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
      // ✅ FIX: Read from result.rows
      const usersResult = await executeQuery(
        `SELECT user_id, first_name, last_name, email, phone, role, created_at 
         FROM users WHERE user_id = ? AND is_active = TRUE`,
        [userId]
      );

      if (usersResult.rows.length === 0) {
        throw new Error('User not found');
      }

      // Get user addresses
      // ✅ FIX: Read from result.rows
      const addressesResult = await executeQuery(
        'SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
        [userId]
      );

      return {
        success: true,
        data: {
          ...usersResult.rows[0],
          addresses: addressesResult.rows
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
      // ✅ FIX: Check result.rowCount
      const result = await executeQuery(
        'UPDATE users SET first_name = ?, last_name = ?, phone = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
        [first_name, last_name, phone, userId]
      );

      if (result.rowCount === 0) {
         throw new Error('User not found');
      }

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
      // ✅ FIX: Read from result.rows
      const usersResult = await executeQuery(
        'SELECT password_hash FROM users WHERE user_id = ?',
        [userId]
      );

      if (usersResult.rows.length === 0) {
        throw new Error('User not found');
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, usersResult.rows[0].password_hash);
      if (!isValidPassword) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const saltRounds = 12;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      // ✅ FIX: Check result.rowCount
      const result = await executeQuery(
        'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
        [newPasswordHash, userId]
      );
      
      if (result.rowCount === 0) {
         throw new Error('User not found after check');
      }

      return {
        success: true,
        message: 'Password changed successfully'
      };
    } catch (error) {
      throw new Error(`Failed to change password: ${error.message}`);
    }
  }

  // Request password reset (Simplified: No custom reset table used)
  async requestPasswordReset(email) {
    try {
      // ✅ FIX: Read from result.rows
      const usersResult = await executeQuery(
        'SELECT user_id, email FROM users WHERE email = ? AND is_active = TRUE',
        [email]
      );

      if (usersResult.rows.length === 0) {
        return {
          success: true,
          message: 'If the email exists, a reset link has been sent'
        };
      }
      
      const resetToken = generateResetToken();
      
      // Store reset token temporarily
      // ✅ FIX: Check result.rowCount
      await executeQuery(
        'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
        [resetToken, usersResult.rows[0].user_id]
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
        // ✅ FIX: Check result.rowCount (though not strictly necessary here)
        await executeQuery(
          'UPDATE addresses SET is_default = FALSE WHERE user_id = ?',
          [userId]
        );
      }

      // ✅ FIX: Read from result.rows
      const result = await executeQuery(
        `INSERT INTO addresses (user_id, line1, line2, city, state, zipcode, country, is_default) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING address_id`,
        [userId, line1, line2, city, state, zipcode, country, is_default || false] // Pass boolean
      );

      return {
        success: true,
        message: 'Address added successfully',
        data: { address_id: result.rows[0].address_id }
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
      // ✅ FIX: Read from result.rows
      const addresses = await executeQuery(
        'SELECT address_id FROM addresses WHERE address_id = ? AND user_id = ?',
        [addressId, userId]
      );

      if (addresses.rows.length === 0) {
        throw new Error('Address not found');
      }

      // If this is set as default, unset other defaults
      if (is_default) {
        await executeQuery(
          'UPDATE addresses SET is_default = FALSE WHERE user_id = ? AND address_id != ?',
          [userId, addressId]
        );
      }

      // ✅ FIX: Check result.rowCount
      const result = await executeQuery(
        `UPDATE addresses SET line1 = ?, line2 = ?, city = ?, state = ?, zipcode = ?, country = ?, is_default = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE address_id = ? AND user_id = ?`,
        [line1, line2, city, state, zipcode, country, is_default || false, addressId, userId]
      );

      if (result.rowCount === 0) {
         throw new Error('Address not found');
      }

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
      // ✅ FIX: Check result.rowCount
      const result = await executeQuery(
        'DELETE FROM addresses WHERE address_id = ? AND user_id = ?',
        [addressId, userId]
      );

      if (result.rowCount === 0) {
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