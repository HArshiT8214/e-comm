const { verifyToken } = require('../config/jwt');
const { pool } = require('../config/database');

// Helper function to query the pool and return the results array (copied from product service)
const executeQuery = async (sql, params = []) => {
    // Converts MySQL '?' to PostgreSQL '$1, $2, ...'
    let index = 1;
    const pgSql = sql.replace(/\?/g, () => `$${index++}`);
    
    // Execute query using pg pool
    const result = await pool.query(pgSql, params);
    return result.rows;
};

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token required' 
      });
    }

    const decoded = verifyToken(token);
    
    // Verify user still exists and is active
    // POSTGRESQL CHANGE: Use executeQuery and TRUE for boolean
    const users = await executeQuery(
      'SELECT user_id, email, role, is_active FROM users WHERE user_id = ? AND is_active = TRUE',
      [decoded.user_id]
    );

    if (users.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found or inactive' 
      });
    }

    req.user = users[0];
    next();
  } catch (error) {
    return res.status(403).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions' 
      });
    }

    next();
  };
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = verifyToken(token);
      
      // POSTGRESQL CHANGE: Use executeQuery and TRUE for boolean
      const users = await executeQuery(
        'SELECT user_id, email, role, is_active FROM users WHERE user_id = ? AND is_active = TRUE',
        [decoded.user_id]
      );

      if (users.length > 0) {
        req.user = users[0];
      }
    }
  } catch (error) {
    // Ignore token errors for optional auth
  }
  
  next();
};

module.exports = {
  authenticateToken,
  requireRole,
  optionalAuth
};