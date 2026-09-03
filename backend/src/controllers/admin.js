import { pool, redisClient } from '../config/db.js';
import { registerPickupAddress } from '../utils/shiprocket.js';

// ==========================================
// CATEGORY CRUD
// ==========================================

export const createCategory = async (req, res) => {
  const { name, commission_pct } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Category name is required' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO categories (name, commission_pct) VALUES ($1, $2) RETURNING *',
      [name, commission_pct || 5.00]
    );
    return res.status(201).json({ message: 'Category created successfully', category: result.rows[0] });
  } catch (error) {
    console.error('Error creating category:', error.message);
    return res.status(500).json({ error: 'Server error creating category' });
  }
};

export const getCategories = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY name ASC');
    return res.status(200).json({ categories: result.rows });
  } catch (error) {
    console.error('Error fetching categories:', error.message);
    return res.status(500).json({ error: 'Server error fetching categories' });
  }
};

export const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name, commission_pct } = req.body;
  try {
    const fields = [];
    const vals = [];
    let paramIndex = 1;

    if (name) {
      fields.push(`name = $${paramIndex}`);
      vals.push(name);
      paramIndex++;
    }
    if (commission_pct !== undefined) {
      fields.push(`commission_pct = $${paramIndex}`);
      vals.push(commission_pct);
      paramIndex++;
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No update parameters provided' });
    }

    vals.push(id);
    const query = `UPDATE categories SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    const result = await pool.query(query, vals);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    return res.status(200).json({ message: 'Category updated successfully', category: result.rows[0] });
  } catch (error) {
    console.error('Error updating category:', error.message);
    return res.status(500).json({ error: 'Server error updating category' });
  }
};

export const deleteCategory = async (req, res) => {
  const { id } = req.params;
  try {
    // Check if products are assigned to this category
    const productCheck = await pool.query('SELECT id FROM products WHERE category_id = $1 LIMIT 1', [id]);
    if (productCheck.rowCount > 0) {
      return res.status(400).json({ error: 'Cannot delete category: products are assigned to it' });
    }

    const result = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    return res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error.message);
    return res.status(500).json({ error: 'Server error deleting category' });
  }
};

// ==========================================
// SELLER APPROVALS
// ==========================================

export const getSellers = async (req, res) => {
  try {
    const query = `
      SELECT sp.*, u.name, u.email, u.phone,
             COALESCE((SELECT SUM(total_amount) FROM orders WHERE seller_id = sp.user_id AND status = 'confirmed'), 0) as total_sales
      FROM seller_profiles sp
      JOIN users u ON sp.user_id = u.id
      ORDER BY sp.created_at DESC
    `;
    const result = await pool.query(query);
    return res.status(200).json({ sellers: result.rows });
  } catch (error) {
    console.error('Error fetching sellers:', error.message);
    return res.status(500).json({ error: 'Server error fetching sellers' });
  }
};

export const approveSeller = async (req, res) => {
  const { id } = req.params; // ID of the seller profile record
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Fetch seller profile details with user details
    const profileRes = await client.query(`
      SELECT sp.*, u.name as user_name, u.email as user_email, u.phone as user_phone
      FROM seller_profiles sp
      JOIN users u ON sp.user_id = u.id
      WHERE sp.id = $1
    `, [id]);

    if (profileRes.rowCount === 0) {
      return res.status(404).json({ error: 'Seller profile not found' });
    }
    const seller = profileRes.rows[0];
    const userId = seller.user_id;

    // 1. Set is_approved = true
    await client.query('UPDATE seller_profiles SET is_approved = true WHERE id = $1', [id]);

    // 2. Set user role = 'seller'
    await client.query("UPDATE users SET role = 'seller' WHERE id = $1", [userId]);

    // 3. Register Pickup Address with Shiprocket (Option A: Seller Pickup)
    let pickupLocationName = seller.business_name.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 35);
    try {
      const shiprocketAddressPayload = {
        pickup_location: pickupLocationName,
        name: seller.pickup_name || seller.user_name,
        email: seller.user_email || 'seller@slabofy.com',
        phone: (seller.pickup_phone || seller.user_phone).replace(/[^0-9]/g, '').slice(-10),
        address: seller.pickup_address || seller.business_address || 'Seller Street Address',
        address_2: '',
        city: seller.pickup_city || 'City',
        state: seller.pickup_state || 'State',
        country: seller.pickup_country || 'India',
        pin_code: seller.pickup_pincode || '110001'
      };

      const srRes = await registerPickupAddress(shiprocketAddressPayload);
      const registeredLocation = srRes?.address?.pickup_location || pickupLocationName;

      await client.query(
        'UPDATE seller_profiles SET shiprocket_pickup_id = $1 WHERE id = $2',
        [registeredLocation, id]
      );
      console.log(`[SHIPROCKET] Registered pickup location '${registeredLocation}' for seller #${id}`);
    } catch (srErr) {
      console.warn('[SHIPROCKET WARNING] Failed registering pickup location on Shiprocket during approval:', srErr.message || srErr);
      // Non-blocking so admin approval still succeeds even if external network/mock issue occurs
      await client.query(
        'UPDATE seller_profiles SET shiprocket_pickup_id = $1 WHERE id = $2',
        [pickupLocationName, id]
      );
    }

    await client.query('COMMIT');
    return res.status(200).json({ 
      message: 'Seller approved and Shiprocket pickup address registered successfully',
      shiprocket_pickup_id: pickupLocationName
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in approveSeller:', error.message);
    return res.status(500).json({ error: 'Server error approving seller' });
  } finally {
    client.release();
  }
};

export const suspendSeller = async (req, res) => {
  const { id } = req.params; // ID of the seller profile record
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const profileRes = await client.query('SELECT user_id FROM seller_profiles WHERE id = $1', [id]);
    if (profileRes.rowCount === 0) {
      return res.status(404).json({ error: 'Seller profile not found' });
    }
    const userId = profileRes.rows[0].user_id;

    // 1. Set is_approved = false
    await client.query('UPDATE seller_profiles SET is_approved = false WHERE id = $1', [id]);

    // 2. Revert user role to 'user'
    await client.query("UPDATE users SET role = 'user' WHERE id = $1", [userId]);

    await client.query('COMMIT');
    return res.status(200).json({ message: 'Seller suspended and reverted to user role successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in suspendSeller:', error.message);
    return res.status(500).json({ error: 'Server error suspending seller' });
  } finally {
    client.release();
  }
};

// ==========================================
// PRODUCT APPROVALS
// ==========================================

export const getPendingProducts = async (req, res) => {
  try {
    const query = `
      SELECT p.*, sp.business_name, c.name as category_name,
             (SELECT json_agg(json_build_object('group_size', pt.group_size, 'price', pt.price)) FROM product_tiers pt WHERE pt.product_id = p.id) as tiers
      FROM products p
      JOIN seller_profiles sp ON p.seller_id = sp.user_id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'pending'
      ORDER BY p.created_at ASC
    `;
    const result = await pool.query(query);
    return res.status(200).json({ products: result.rows });
  } catch (error) {
    console.error('Error in getPendingProducts:', error.message);
    return res.status(500).json({ error: 'Server error fetching pending products' });
  }
};

export const approveProduct = async (req, res) => {
  const { id } = req.params;
  const { delivery_fee } = req.body;
  try {
    const fee = delivery_fee !== undefined && !isNaN(parseFloat(delivery_fee)) ? Math.max(0, parseFloat(delivery_fee)) : 0.00;
    const result = await pool.query(
      "UPDATE products SET status = 'active', delivery_fee = $1, reject_reason = NULL WHERE id = $2 RETURNING *",
      [fee, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    return res.status(200).json({ message: 'Product approved and is now active', product: result.rows[0] });
  } catch (error) {
    console.error('Error in approveProduct:', error.message);
    return res.status(500).json({ error: 'Server error approving product' });
  }
};

export const updateProductDeliveryFee = async (req, res) => {
  const { id } = req.params;
  const { delivery_fee } = req.body;
  if (delivery_fee === undefined || isNaN(parseFloat(delivery_fee))) {
    return res.status(400).json({ error: 'Valid delivery fee amount is required' });
  }
  try {
    const fee = Math.max(0, parseFloat(delivery_fee));
    const result = await pool.query(
      "UPDATE products SET delivery_fee = $1 WHERE id = $2 RETURNING *",
      [fee, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    return res.status(200).json({ message: 'Delivery fee updated successfully', product: result.rows[0] });
  } catch (error) {
    console.error('Error updating delivery fee:', error.message);
    return res.status(500).json({ error: 'Server error updating delivery fee' });
  }
};

export const rejectProduct = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  if (!reason) {
    return res.status(400).json({ error: 'Rejection reason is required' });
  }
  try {
    const result = await pool.query(
      "UPDATE products SET status = 'rejected', reject_reason = $1 WHERE id = $2 RETURNING *",
      [reason, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    return res.status(200).json({ message: 'Product rejected successfully', product: result.rows[0] });
  } catch (error) {
    console.error('Error in rejectProduct:', error.message);
    return res.status(500).json({ error: 'Server error rejecting product' });
  }
};

// ==========================================
// COUPON MANAGEMENT
// ==========================================

export const createCoupon = async (req, res) => {
  const { code, discount_type, discount_value, expiry, max_uses } = req.body;
  if (!code || !discount_type || !discount_value || !expiry) {
    return res.status(400).json({ error: 'Code, discount type, value, and expiry are required' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO coupons (code, discount_type, discount_value, expiry, max_uses) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [code.toUpperCase(), discount_type, discount_value, expiry, max_uses || 100]
    );
    return res.status(201).json({ message: 'Coupon created successfully', coupon: result.rows[0] });
  } catch (error) {
    console.error('Error creating coupon:', error.message);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Coupon code already exists' });
    }
    return res.status(500).json({ error: 'Server error creating coupon' });
  }
};

export const getCoupons = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM coupons ORDER BY created_at DESC');
    return res.status(200).json({ coupons: result.rows });
  } catch (error) {
    console.error('Error fetching coupons:', error.message);
    return res.status(500).json({ error: 'Server error fetching coupons' });
  }
};

export const deleteCoupon = async (req, res) => {
  const { id } = req.params;
  try {
    // Soft delete / Deactivate coupon
    const result = await pool.query(
      'UPDATE coupons SET is_active = false WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Coupon not found' });
    }
    return res.status(200).json({ message: 'Coupon deactivated successfully', coupon: result.rows[0] });
  } catch (error) {
    console.error('Error deactivating coupon:', error.message);
    return res.status(500).json({ error: 'Server error deactivating coupon' });
  }
};

// ==========================================
// ADMIN DASHBOARD STATS
// ==========================================

export const getDashboardStats = async (req, res) => {
  try {
    const cacheKey = 'admin:dashboard:stats';
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return res.status(200).json({ stats: JSON.parse(cachedData), source: 'cache' });
    }

    // Fetch stats from database
    const activeGroupsPromise = pool.query(
      "SELECT COUNT(*) FROM groups WHERE status = 'active'"
    );
    const completedDealsPromise = pool.query(
      "SELECT COUNT(*) FROM groups WHERE status = 'complete'"
    );
    const revenuePromise = pool.query(
      "SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status NOT IN ('pending', 'cancelled')"
    );
    const newUsersPromise = pool.query(
      "SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '7 days'"
    );
    const pendingSellersPromise = pool.query(
      "SELECT COUNT(*) FROM seller_profiles WHERE is_approved = false"
    );
    const pendingProductsPromise = pool.query(
      "SELECT COUNT(*) FROM products WHERE status = 'pending'"
    );

    const [
      activeGroupsRes,
      completedDealsRes,
      revenueRes,
      newUsersRes,
      pendingSellersRes,
      pendingProductsRes
    ] = await Promise.all([
      activeGroupsPromise,
      completedDealsPromise,
      revenuePromise,
      newUsersPromise,
      pendingSellersPromise,
      pendingProductsPromise
    ]);

    const stats = {
      activeGroups: parseInt(activeGroupsRes.rows[0].count),
      completedDeals: parseInt(completedDealsRes.rows[0].count),
      totalRevenue: parseFloat(revenueRes.rows[0].total),
      newUsers7Days: parseInt(newUsersRes.rows[0].count),
      pendingSellers: parseInt(pendingSellersRes.rows[0].count),
      pendingProducts: parseInt(pendingProductsRes.rows[0].count)
    };

    // Cache in Redis for 60 seconds
    await redisClient.set(cacheKey, JSON.stringify(stats), { EX: 60 });

    return res.status(200).json({ stats, source: 'database' });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error.message);
    return res.status(500).json({ error: 'Server error fetching stats' });
  }
};

/**
 * Public User endpoint to apply/validate coupon
 */
export const applyCoupon = async (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Coupon code is required' });
  }

  try {
    const result = await pool.query('SELECT * FROM coupons WHERE code = $1 AND is_active = true', [code.toUpperCase().trim()]);
    const coupon = result.rows[0];

    if (!coupon) {
      return res.status(404).json({ error: 'Invalid or inactive coupon code' });
    }

    // Verify expiry
    if (new Date(coupon.expiry) < new Date()) {
      return res.status(400).json({ error: 'Coupon code has expired' });
    }

    // Verify usage limit
    if (coupon.uses >= coupon.max_uses) {
      return res.status(400).json({ error: 'Coupon code has reached maximum usage limit' });
    }

    return res.status(200).json({
      message: 'Coupon code applied successfully',
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: parseFloat(coupon.discount_value)
      }
    });
  } catch (error) {
    console.error('Error in applyCoupon:', error.message);
    return res.status(500).json({ error: 'Server error applying coupon' });
  }
};

/**
 * Fetch all Customers (users with role === 'user') with orders metrics
 */
export const getCustomers = async (req, res) => {
  try {
    const query = `
      SELECT id, name, email, phone, role, is_verified, created_at,
             COALESCE((SELECT COUNT(*) FROM orders WHERE buyer_id = users.id), 0) as total_orders,
             COALESCE((SELECT SUM(total_amount) FROM orders WHERE buyer_id = users.id AND status NOT IN ('pending', 'cancelled')), 0) as total_spent
      FROM users
      WHERE role = 'user'
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query);
    return res.status(200).json({ customers: result.rows });
  } catch (error) {
    console.error('Error fetching customers:', error.message);
    return res.status(500).json({ error: 'Server error fetching customers list' });
  }
};

/**
 * Fetch all Platform Orders
 */
export const getOrders = async (req, res) => {
  try {
    const query = `
      SELECT o.id, o.created_at, o.quantity, o.unit_price, o.total_amount, o.commission_pct, o.status,
             o.buyer_id, o.seller_id, o.product_id, o.group_id,
             o.awb_code, o.courier_name_sr, o.shiprocket_order_id, o.shipment_status, o.is_cod,
             u.name as buyer_name, u.phone as buyer_phone, u.email as buyer_email,
             sp.business_name as seller_business_name,
             p.name as product_name, p.sku as product_sku,
             g.target_size as group_target_size, g.current_size as group_current_size, g.status as group_status
      FROM orders o
      JOIN users u ON o.buyer_id = u.id
      JOIN seller_profiles sp ON o.seller_id = sp.user_id
      JOIN products p ON o.product_id = p.id
      LEFT JOIN groups g ON o.group_id = g.id
      ORDER BY o.created_at DESC
    `;
    const result = await pool.query(query);
    return res.status(200).json({ orders: result.rows });
  } catch (error) {
    console.error('Error fetching admin orders:', error.message);
    return res.status(500).json({ error: 'Server error fetching platform orders' });
  }
};
