import { pool } from '../config/db.js';
import { sendEmail } from '../utils/email.js';

/**
 * BE-06: Seller Registration Onboarding
 */
export const registerSeller = async (req, res) => {
  const { business_name, gstin, bank_account, ifsc } = req.body;
  const userId = req.user.id;

  if (!business_name) {
    return res.status(400).json({ error: 'Business name is required' });
  }

  try {
    // Check if user already registered as seller
    const checkRes = await pool.query('SELECT id FROM seller_profiles WHERE user_id = $1', [userId]);
    if (checkRes.rowCount > 0) {
      return res.status(400).json({ error: 'Seller profile already exists for this account' });
    }

    // Insert new profile
    const insertQuery = `
      INSERT INTO seller_profiles (user_id, business_name, gstin, bank_account, ifsc, is_approved)
      VALUES ($1, $2, $3, $4, $5, false)
      RETURNING *
    `;
    const result = await pool.query(insertQuery, [userId, business_name, gstin || null, bank_account || null, ifsc || null]);
    
    // Notify Admin via email (Mock)
    await sendEmail(
      'admin@socialgroupbuying.com',
      'New Seller Registration Pending Approval',
      'new_seller_registration',
      { userId, business_name }
    );

    return res.status(201).json({
      message: 'Seller registration submitted successfully. Awaiting administrator approval.',
      profile: result.rows[0]
    });
  } catch (error) {
    console.error('Error in registerSeller:', error.message);
    return res.status(500).json({ error: 'Server error registering seller profile' });
  }
};

/**
 * FE-09: Seller Stats Dashboard Card Data
 */
export const getSellerStats = async (req, res) => {
  const sellerId = req.user.id;

  try {
    // 1. Total revenue (completed deals)
    const revenueRes = await pool.query(
      "SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE seller_id = $1 AND status NOT IN ('pending', 'cancelled')",
      [sellerId]
    );

    // 2. Active groups running seller's products
    const activeGroupsRes = await pool.query(
      `SELECT COUNT(*)::int 
       FROM groups g 
       JOIN products p ON g.product_id = p.id 
       WHERE p.seller_id = $1 AND g.status = 'active'`,
      [sellerId]
    );

    // 3. Completed orders
    const completedOrdersRes = await pool.query(
      "SELECT COUNT(*)::int FROM orders WHERE seller_id = $1 AND status = 'confirmed'",
      [sellerId]
    );

    // 4. Pending approval products
    const pendingProductsRes = await pool.query(
      "SELECT COUNT(*)::int FROM products WHERE seller_id = $1 AND status = 'pending'",
      [sellerId]
    );

    return res.status(200).json({
      stats: {
        totalRevenue: parseFloat(revenueRes.rows[0].total),
        activeGroups: activeGroupsRes.rows[0].count,
        completedOrders: completedOrdersRes.rows[0].count,
        pendingProducts: pendingProductsRes.rows[0].count
      }
    });
  } catch (error) {
    console.error('Error in getSellerStats:', error.message);
    return res.status(500).json({ error: 'Server error loading seller dashboard stats' });
  }
};

/**
 * BE-11: Seller Order Management (Fetch)
 */
export const getSellerOrders = async (req, res) => {
  const sellerId = req.user.id;
  const { status } = req.query;

  try {
    let query = `
      SELECT o.*, p.name as product_name, p.sku as product_sku,
             u.name as buyer_name, u.phone as buyer_phone
      FROM orders o
      JOIN products p ON o.product_id = p.id
      JOIN users u ON o.buyer_id = u.id
      WHERE o.seller_id = $1
    `;
    const queryParams = [sellerId];

    if (status) {
      query += ' AND o.status = $2';
      queryParams.push(status);
    }

    query += ' ORDER BY o.created_at DESC';

    const result = await pool.query(query, queryParams);
    return res.status(200).json({ orders: result.rows });
  } catch (error) {
    console.error('Error in getSellerOrders:', error.message);
    return res.status(500).json({ error: 'Server error fetching seller orders' });
  }
};

/**
 * BE-11: Seller Order Ship (Shipment Dispatch Update)
 */
export const shipOrder = async (req, res) => {
  const { id } = req.params;
  const { courier_name, tracking_number } = req.body;
  const sellerId = req.user.id;

  if (!courier_name || !tracking_number) {
    return res.status(400).json({ error: 'Courier name and tracking number are required' });
  }

  try {
    // 1. Verify seller ownership of this order
    const orderCheck = await pool.query(
      'SELECT id, seller_id, buyer_id, status FROM orders WHERE id = $1',
      [id]
    );
    const order = orderCheck.rows[0];

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    if (order.seller_id !== sellerId) {
      return res.status(403).json({ error: 'Access Denied: Order does not belong to this seller' });
    }
    if (order.status !== 'confirmed') {
      return res.status(400).json({ error: `Cannot ship order in '${order.status}' status. Must be 'confirmed'.` });
    }

    // 2. Update order to shipped
    const updateQuery = `
      UPDATE orders 
      SET status = 'shipped', courier_name = $1, tracking_number = $2 
      WHERE id = $3 
      RETURNING *
    `;
    const result = await pool.query(updateQuery, [courier_name, tracking_number, id]);

    // Send shipment notification to buyer (email mock / push mock)
    // await sendEmail(buyer.email, 'Your order has been shipped!', 'order_shipped', { tracking_number })

    return res.status(200).json({
      message: 'Order shipped successfully',
      order: result.rows[0]
    });
  } catch (error) {
    console.error('Error in shipOrder:', error.message);
    return res.status(500).json({ error: 'Server error shipping order' });
  }
};

/**
 * Fetch currently logged in user's merchant profile
 */
export const getSellerProfile = async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await pool.query('SELECT * FROM seller_profiles WHERE user_id = $1', [userId]);
    return res.status(200).json({ profile: result.rows[0] || null });
  } catch (error) {
    console.error('Error in getSellerProfile:', error.message);
    return res.status(500).json({ error: 'Server error fetching seller profile' });
  }
};
