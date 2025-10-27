const { verifyToken } = require('../config/jwt');
const { pool } = require('../config/database');

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
    const [users] = await pool.execute(
      'SELECT user_id, email, role, is_active FROM users WHERE user_id = ? AND is_active = 1',
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
      const [users] = await pool.execute(
        'SELECT user_id, email, role, is_active FROM users WHERE user_id = ? AND is_active = 1',
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
