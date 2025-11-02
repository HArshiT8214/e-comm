const express = require('express');
const router = express.Router();
const userService = require('../services/userService');
const { authenticateToken } = require('../middleware/auth');
const { 
  validateUserRegistration, 
  validateUserLogin, 
  validatePasswordReset,
  validatePasswordUpdate 
} = require('../middleware/validation');

// Register new user
router.post('/register', validateUserRegistration, async (req, res) => {
  try {
    const result = await userService.registerUser(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Login user
router.post('/login', validateUserLogin, async (req, res) => {
  try {
    const result = await userService.loginUser(req.body);
    res.json(result);
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message
    });
  }
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const result = await userService.getUserProfile(req.user.user_id);
    res.json(result);
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const result = await userService.updateUserProfile(req.user.user_id, req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Change password
router.put('/change-password', authenticateToken, validatePasswordUpdate, async (req, res) => {
  try {
    const result = await userService.changePassword(req.user.user_id, req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Request password reset
router.post('/forgot-password', validatePasswordReset, async (req, res) => {
  try {
    const result = await userService.requestPasswordReset(req.body.email);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Add address
router.post('/addresses', authenticateToken, async (req, res) => {
  try {
    const result = await userService.addAddress(req.user.user_id, req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Update address
router.put('/addresses/:addressId', authenticateToken, async (req, res) => {
  try {
    const result = await userService.updateAddress(req.user.user_id, req.params.addressId, req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Delete address
router.delete('/addresses/:addressId', authenticateToken, async (req, res) => {
  try {
    const result = await userService.deleteAddress(req.user.user_id, req.params.addressId);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
