const { pool } = require('../config/database');

class SupportService {
  // Create support ticket
  async createTicket(userId, ticketData) {
    const { subject, description } = ticketData;
    
    try {
      const [result] = await pool.execute(
        'INSERT INTO support_tickets (user_id, subject, description, status) VALUES (?, ?, ?, ?)',
        [userId, subject, description, 'open']
      );

      return {
        success: true,
        message: 'Support ticket created successfully',
        data: { ticket_id: result.insertId }
      };
    } catch (error) {
      throw new Error(`Failed to create support ticket: ${error.message}`);
    }
  }

  // Get user tickets
  async getUserTickets(userId, filters = {}) {
    const { page = 1, limit = 10, status } = filters;
    const offset = (page - 1) * limit;

    try {
      let whereClause = 'WHERE user_id = ?';
      let queryParams = [userId];

      if (status) {
        whereClause += ' AND status = ?';
        queryParams.push(status);
      }

      // Get total count
      const [countResult] = await pool.execute(
        `SELECT COUNT(*) as total FROM support_tickets ${whereClause}`,
        queryParams
      );
      const total = countResult[0].total;

      // Get tickets
      const [tickets] = await pool.execute(
        `SELECT 
          ticket_id,
          subject,
          description,
          status,
          created_at,
          updated_at
        FROM support_tickets
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?`,
        [...queryParams, limit, offset]
      );

      return {
        success: true,
        data: {
          tickets,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      };
    } catch (error) {
      throw new Error(`Failed to get user tickets: ${error.message}`);
    }
  }

  // Get ticket by ID
  async getTicketById(ticketId, userId) {
    try {
      const [tickets] = await pool.execute(
        `SELECT 
          t.ticket_id,
          t.subject,
          t.description,
          t.status,
          t.created_at,
          t.updated_at,
          u.first_name,
          u.last_name,
          u.email
        FROM support_tickets t
        JOIN users u ON t.user_id = u.user_id
        WHERE t.ticket_id = ? AND t.user_id = ?`,
        [ticketId, userId]
      );

      if (tickets.length === 0) {
        throw new Error('Ticket not found');
      }

      return {
        success: true,
        data: tickets[0]
      };
    } catch (error) {
      throw new Error(`Failed to get ticket: ${error.message}`);
    }
  }

  // Update ticket status (admin only)
  async updateTicketStatus(ticketId, status, adminId) {
    try {
      const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
      if (!validStatuses.includes(status)) {
        throw new Error('Invalid ticket status');
      }

      const [result] = await pool.execute(
        'UPDATE support_tickets SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE ticket_id = ?',
        [status, ticketId]
      );

      if (result.affectedRows === 0) {
        throw new Error('Ticket not found');
      }

      return {
        success: true,
        message: 'Ticket status updated successfully'
      };
    } catch (error) {
      throw new Error(`Failed to update ticket status: ${error.message}`);
    }
  }

  // Get all tickets (admin only)
  async getAllTickets(filters = {}) {
    const { page = 1, limit = 10, status, search } = filters;
    const offset = (page - 1) * limit;

    try {
      let whereClause = 'WHERE 1=1';
      let queryParams = [];

      if (status) {
        whereClause += ' AND t.status = ?';
        queryParams.push(status);
      }

      if (search) {
        whereClause += ' AND (t.subject LIKE ? OR t.description LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)';
        const searchTerm = `%${search}%`;
        queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }

      // Get total count
      const [countResult] = await pool.execute(
        `SELECT COUNT(*) as total 
         FROM support_tickets t
         JOIN users u ON t.user_id = u.user_id
         ${whereClause}`,
        queryParams
      );
      const total = countResult[0].total;

      // Get tickets
      const [tickets] = await pool.execute(
        `SELECT 
          t.ticket_id,
          t.subject,
          t.description,
          t.status,
          t.created_at,
          t.updated_at,
          u.first_name,
          u.last_name,
          u.email
        FROM support_tickets t
        JOIN users u ON t.user_id = u.user_id
        ${whereClause}
        ORDER BY t.created_at DESC
        LIMIT ? OFFSET ?`,
        [...queryParams, limit, offset]
      );

      return {
        success: true,
        data: {
          tickets,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      };
    } catch (error) {
      throw new Error(`Failed to get all tickets: ${error.message}`);
    }
  }

  // Get ticket statistics (admin only)
  async getTicketStatistics() {
    try {
      const [stats] = await pool.execute(
        `SELECT 
          COUNT(*) as total_tickets,
          SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_tickets,
          SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_tickets,
          SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_tickets,
          SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed_tickets
        FROM support_tickets`
      );

      return {
        success: true,
        data: stats[0]
      };
    } catch (error) {
      throw new Error(`Failed to get ticket statistics: ${error.message}`);
    }
  }

  // Search knowledge base (placeholder for future implementation)
  async searchKnowledgeBase(query) {
    // This would integrate with a knowledge base system
    // For now, return a placeholder response
    return {
      success: true,
      data: {
        articles: [
          {
            id: 1,
            title: 'How to set up your HP printer',
            content: 'Step-by-step guide to setting up your HP printer...',
            category: 'Setup'
          },
          {
            id: 2,
            title: 'Troubleshooting common printing issues',
            content: 'Common printing problems and their solutions...',
            category: 'Troubleshooting'
          }
        ]
      }
    };
  }
}

module.exports = new SupportService();
