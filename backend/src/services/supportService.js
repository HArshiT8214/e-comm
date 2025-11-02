const { pool } = require('../config/database');

// NOTE: Ensure the executeQuery helper is defined globally or imported correctly
const executeQuery = async (sql, params = []) => {
    // This helper must convert '?' to '$1, $2, ...' and use pool.query
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


class SupportService {
  // Create support ticket
  async createTicket(userId, ticketData) {
    const { subject, description } = ticketData;
    
    try {
      // ✅ FIX: Read from result.rows
      const result = await executeQuery(
        'INSERT INTO support_tickets (user_id, subject, description, status) VALUES (?, ?, ?, ?) RETURNING ticket_id',
        [userId, subject, description, 'open']
      );

      return {
        success: true,
        message: 'Support ticket created successfully',
        data: { ticket_id: result.rows[0].ticket_id }
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
      // ✅ FIX: Read from result.rows
      const countResult = await executeQuery(
        `SELECT COUNT(*) as total FROM support_tickets ${whereClause}`,
        queryParams
      );
      const total = parseInt(countResult.rows[0].total);

      // Get tickets
      // ✅ FIX: Read from result.rows
      const ticketsResult = await executeQuery(
        `SELECT 
          ticket_id, subject, description, status, created_at, updated_at
        FROM support_tickets
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?`,
        [...queryParams, limit, offset]
      );

      return {
        success: true,
        data: {
          tickets: ticketsResult.rows, // Use .rows
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
      // ✅ FIX: Read from result.rows
      const ticketsResult = await executeQuery(
        `SELECT 
          t.ticket_id, t.subject, t.description, t.status, t.created_at, t.updated_at,
          u.first_name, u.last_name, u.email
        FROM support_tickets t
        JOIN users u ON t.user_id = u.user_id
        WHERE t.ticket_id = ? AND t.user_id = ?`,
        [ticketId, userId]
      );

      if (ticketsResult.rows.length === 0) {
        throw new Error('Ticket not found');
      }

      return {
        success: true,
        data: ticketsResult.rows[0] // Use .rows
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

      // ✅ FIX: Check result.rowCount
      const result = await executeQuery(
        'UPDATE support_tickets SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE ticket_id = ?',
        [status, ticketId]
      );

      if (result.rowCount === 0) {
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
      let whereClause = 'WHERE TRUE'; // PostgreSQL boolean
      let queryParams = [];

      if (status) {
        whereClause += ' AND t.status = ?';
        queryParams.push(status);
      }

      if (search) {
        whereClause += ' AND (t.subject ILIKE ? OR t.description ILIKE ? OR u.first_name ILIKE ? OR u.last_name ILIKE ?)';
        const searchTerm = `%${search}%`;
        queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }
      
      // Get total count
      // ✅ FIX: Read from result.rows
      const countResult = await executeQuery(
        `SELECT COUNT(*) as total 
         FROM support_tickets t
         JOIN users u ON t.user_id = u.user_id
         ${whereClause}`,
        queryParams
      );
      const total = parseInt(countResult.rows[0].total);

      // Get tickets
      // ✅ FIX: Read from result.rows
      const ticketsResult = await executeQuery(
        `SELECT 
          t.ticket_id, t.subject, t.description, t.status, t.created_at, t.updated_at,
          u.first_name, u.last_name, u.email
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
          tickets: ticketsResult.rows, // Use .rows
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
      // ✅ FIX: Read from result.rows
      const statsResult = await executeQuery(
        `SELECT 
          COUNT(*)::INT as total_tickets,
          SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END)::INT as open_tickets,
          SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END)::INT as in_progress_tickets,
          SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END)::INT as resolved_tickets,
          SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END)::INT as closed_tickets
        FROM support_tickets`
      );

      return {
        success: true,
        data: statsResult.rows[0] // Use .rows
      };
    } catch (error) {
      throw new Error(`Failed to get ticket statistics: ${error.message}`);
    }
  }

  // Search knowledge base (placeholder for future implementation)
  async searchKnowledgeBase(query) {
    // This function is database-agnostic
    return {
      success: true,
      data: {
        articles: [
          // ... (placeholder data) ...
        ]
      }
    };
  }
}

module.exports = new SupportService();