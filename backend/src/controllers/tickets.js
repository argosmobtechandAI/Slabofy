import { pool } from '../config/db.js';

/**
 * Seller: Create Support Ticket
 */
export const createTicket = async (req, res) => {
  const sellerId = req.user.id;
  const { category, subject, description } = req.body;

  const validCategories = [
    'payments_payouts', 
    'order_issue', 
    'product_listing', 
    'account_kyc', 
    'technical_bug', 
    'shiprocket_delivery', 
    'other'
  ];

  if (!category || !validCategories.includes(category)) {
    return res.status(400).json({ error: 'Valid ticket category is required' });
  }

  if (!subject || !subject.trim()) {
    return res.status(400).json({ error: 'Subject is required' });
  }

  if (!description || !description.trim()) {
    return res.status(400).json({ error: 'Description is required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO support_tickets (seller_id, category, subject, description, status)
       VALUES ($1, $2, $3, $4, 'open')
       RETURNING *`,
      [sellerId, category, subject.trim(), description.trim()]
    );

    return res.status(201).json({
      message: 'Support ticket submitted successfully. Our operations team will review it shortly.',
      ticket: result.rows[0]
    });
  } catch (error) {
    console.error('Error in createTicket:', error.message);
    return res.status(500).json({ error: 'Server error creating support ticket' });
  }
};

/**
 * Seller: Get My Tickets
 */
export const getMyTickets = async (req, res) => {
  const sellerId = req.user.id;
  try {
    const result = await pool.query(
      `SELECT st.*, u.name as seller_name, u.phone as seller_phone, u.email as seller_email,
              sp.business_name
       FROM support_tickets st
       JOIN users u ON st.seller_id = u.id
       LEFT JOIN seller_profiles sp ON u.id = sp.user_id
       WHERE st.seller_id = $1
       ORDER BY st.created_at DESC`,
      [sellerId]
    );

    return res.status(200).json({ tickets: result.rows });
  } catch (error) {
    console.error('Error in getMyTickets:', error.message);
    return res.status(500).json({ error: 'Server error fetching your support tickets' });
  }
};

/**
 * Admin: Get All Tickets (with filtering)
 */
export const getAllTickets = async (req, res) => {
  const { status, category } = req.query;

  try {
    let query = `
      SELECT st.*, u.name as seller_name, u.phone as seller_phone, u.email as seller_email,
             sp.business_name
      FROM support_tickets st
      JOIN users u ON st.seller_id = u.id
      LEFT JOIN seller_profiles sp ON u.id = sp.user_id
    `;
    const params = [];
    const whereClauses = [];

    if (status) {
      params.push(status);
      whereClauses.push(`st.status = $${params.length}`);
    }

    if (category) {
      params.push(category);
      whereClauses.push(`st.category = $${params.length}`);
    }

    if (whereClauses.length > 0) {
      query += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    query += ' ORDER BY st.created_at DESC';

    const result = await pool.query(query, params);
    return res.status(200).json({ tickets: result.rows });
  } catch (error) {
    console.error('Error in getAllTickets:', error.message);
    return res.status(500).json({ error: 'Server error fetching tickets for administrator' });
  }
};

/**
 * Admin: Update Ticket Status and Note
 */
export const updateTicket = async (req, res) => {
  const { id } = req.params;
  const { status, admin_note } = req.body;

  const validStatuses = ['open', 'in_progress', 'closed'];

  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: "Status must be 'open', 'in_progress', or 'closed'" });
  }

  try {
    const fields = ['updated_at = NOW()'];
    const params = [id];
    let pIdx = 2;

    if (status) {
      fields.push(`status = $${pIdx}`);
      params.push(status);
      pIdx++;
    }

    if (admin_note !== undefined) {
      fields.push(`admin_note = $${pIdx}`);
      params.push(admin_note);
      pIdx++;
    }

    const query = `UPDATE support_tickets SET ${fields.join(', ')} WHERE id = $1 RETURNING *`;
    const result = await pool.query(query, params);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Support ticket not found' });
    }

    return res.status(200).json({
      message: 'Support ticket updated successfully',
      ticket: result.rows[0]
    });
  } catch (error) {
    console.error('Error in updateTicket:', error.message);
    return res.status(500).json({ error: 'Server error updating support ticket' });
  }
};
