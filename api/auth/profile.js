const userService = require('../../backend/src/services/userService');
const { authenticateToken } = require('../../backend/src/middleware/auth');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  try {
    // Authenticate token
    const authResult = await authenticateToken(req);
    if (!authResult.success) {
      return res.status(401).json(authResult);
    }

    const result = await userService.getUserProfile(authResult.user.user_id);
    res.json(result);
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
};
