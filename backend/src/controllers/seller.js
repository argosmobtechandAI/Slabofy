import { pool } from '../config/db.js';
import { sendEmail } from '../utils/email.js';

/**
 * BE-06: Seller Registration Onboarding
 */
export const registerSeller = async (req, res) => {
  const { 
    business_name, business_type, business_address, gstin, bank_account, ifsc,
    pickup_name, pickup_phone, pickup_address, pickup_city, pickup_state, pickup_pincode, pickup_country
  } = req.body;
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

    // Insert new profile with pickup address
    const insertQuery = `
      INSERT INTO seller_profiles 
      (user_id, business_name, business_type, business_address, gstin, bank_account, ifsc, 
       pickup_name, pickup_phone, pickup_address, pickup_city, pickup_state, pickup_pincode, pickup_country, is_approved)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, false)
      RETURNING *
    `;
    const result = await pool.query(insertQuery, [
      userId, 
      business_name, 
      business_type || 'Proprietorship', 
      business_address || null, 
      gstin || null, 
      bank_account || null, 
      ifsc || null,
      pickup_name || null,
      pickup_phone || null,
      pickup_address || business_address || null,
      pickup_city || null,
      pickup_state || null,
      pickup_pincode || null,
      pickup_country || 'India'
    ]);
    
    // Notify Admin via email (Mock)
    await sendEmail(
      'admin@slabofy.com',
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
 * BE-11: Seller Order Management (Fetch with Shiprocket Details)
 */
export const getSellerOrders = async (req, res) => {
  const sellerId = req.user.id;
  const { status } = req.query;

  try {
    let query = `
      SELECT o.*, p.name as product_name, p.sku as product_sku,
             COALESCE(p.weight_kg, 0.50) as product_weight_kg,
             COALESCE(p.length_cm, 10.00) as product_length_cm,
             COALESCE(p.breadth_cm, 10.00) as product_breadth_cm,
             COALESCE(p.height_cm, 5.00) as product_height_cm,
             u.name as buyer_name, u.phone as buyer_phone, u.email as buyer_email,
             g.target_size as group_target_size, g.current_size as group_current_size, g.status as group_status
      FROM orders o
      JOIN products p ON o.product_id = p.id
      JOIN users u ON o.buyer_id = u.id
      LEFT JOIN groups g ON o.group_id = g.id
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
 * BE-11: Seller Order Ship (Legacy fallback handler)
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
      SET status = 'shipped', courier_name = $1, tracking_number = $2,
          courier_name_sr = $1, awb_code = $2, shipment_status = 'pickup_scheduled'
      WHERE id = $3 
      RETURNING *
    `;
    const result = await pool.query(updateQuery, [courier_name, tracking_number, id]);

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
    const query = `
      SELECT u.name, u.email, u.phone, u.role, u.is_verified, u.created_at,
             sp.business_name, sp.business_type, sp.business_address,
             sp.pickup_name, sp.pickup_phone, sp.pickup_address, sp.pickup_city,
             sp.pickup_state, sp.pickup_pincode, sp.pickup_country, sp.shiprocket_pickup_id,
             sp.gstin, sp.pan_number, sp.aadhar_number, sp.bank_account, sp.ifsc,
             sp.kyc_document_url, sp.is_approved
      FROM users u
      LEFT JOIN seller_profiles sp ON u.id = sp.user_id
      WHERE u.id = $1
    `;
    const result = await pool.query(query, [userId]);
    return res.status(200).json({ profile: result.rows[0] || null });
  } catch (error) {
    console.error('Error in getSellerProfile:', error.message);
    return res.status(500).json({ error: 'Server error fetching seller profile' });
  }
};
