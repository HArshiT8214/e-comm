const express = require('express');
const router = express.Router();
const supportService = require('../services/supportService');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validateSupportTicket, validatePagination } = require('../middleware/validation');

// Create support ticket
router.post('/tickets', authenticateToken, validateSupportTicket, async (req, res) => {
  try {
    const result = await supportService.createTicket(req.user.user_id, req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get user tickets
router.get('/tickets', authenticateToken, validatePagination, async (req, res) => {
  try {
    const result = await supportService.getUserTickets(req.user.user_id, req.query);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get ticket by ID
router.get('/tickets/:ticketId', authenticateToken, async (req, res) => {
  try {
    const result = await supportService.getTicketById(req.params.ticketId, req.user.user_id);
    res.json(result);
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
});

// Search knowledge base
router.get('/knowledge-base/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const result = await supportService.searchKnowledgeBase(q);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Admin routes
// Get all tickets
router.get('/admin/tickets', authenticateToken, requireRole(['admin', 'support']), validatePagination, async (req, res) => {
  try {
    const result = await supportService.getAllTickets(req.query);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update ticket status
router.put('/admin/tickets/:ticketId/status', authenticateToken, requireRole(['admin', 'support']), async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const result = await supportService.updateTicketStatus(req.params.ticketId, status, req.user.user_id);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get ticket statistics
router.get('/admin/statistics', authenticateToken, requireRole(['admin', 'support']), async (req, res) => {
  try {
    const result = await supportService.getTicketStatistics();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
