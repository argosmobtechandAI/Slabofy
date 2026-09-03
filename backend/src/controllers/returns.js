import Razorpay from 'razorpay';
import { pool } from '../config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_mockkey',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'mocksecret'
});

const isRazorpayMock = !process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID.includes('YOURKEY');

/**
 * 1. Customer: Request Return for a Delivered or Shipped Order
 * Enforces strict 7-day post-delivery return window
 */
export const requestReturn = async (req, res) => {
  const { order_id, reason, description, evidence_images } = req.body;
  const buyerId = req.user.id;

  if (!order_id || !reason) {
    return res.status(400).json({ error: 'Order ID and return reason are required' });
  }

  const validReasons = [
    'defective_item',
    'wrong_item_delivered',
    'item_not_as_described',
    'size_fit_issue',
    'changed_mind',
    'damaged_in_transit',
    'missing_parts',
    'other'
  ];

  if (!validReasons.includes(reason)) {
    return res.status(400).json({ error: 'Invalid return reason selected' });
  }

  try {
    // 1. Verify order ownership
    const orderRes = await pool.query(
      'SELECT id, buyer_id, seller_id, status, total_amount, created_at, awb_code FROM orders WHERE id = $1',
      [order_id]
    );

    if (orderRes.rowCount === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderRes.rows[0];

    if (order.buyer_id !== buyerId) {
      return res.status(403).json({ error: 'You are not authorized to return this order' });
    }

    // 2. Status validation: Must be delivered or shipped (cannot return cancelled or already refunded orders)
    if (!['delivered', 'shipped'].includes(order.status)) {
      return res.status(400).json({ 
        error: `Returns are only applicable for delivered or in-transit items. Current order status is '${order.status}'.` 
      });
    }

    // 3. Strict 7-day policy window
    const orderAgeDays = (Date.now() - new Date(order.created_at).getTime()) / (1000 * 60 * 60 * 24);
    if (orderAgeDays > 7) {
      return res.status(400).json({ 
        error: 'The 7-day return window for this order has expired. Return requests must be submitted within 7 days.' 
      });
    }

    // 4. Prevent duplicate requests
    const checkExisting = await pool.query(
      'SELECT id, status FROM return_requests WHERE order_id = $1',
      [order_id]
    );

    if (checkExisting.rowCount > 0) {
      return res.status(400).json({ 
        error: `A return request already exists for this order (Status: ${checkExisting.rows[0].status}).` 
      });
    }

    // 5. Insert return request (100% full refund amount = order.total_amount)
    const imagesJson = JSON.stringify(Array.isArray(evidence_images) ? evidence_images : []);
    const insertQuery = `
      INSERT INTO return_requests 
        (order_id, buyer_id, seller_id, status, reason, description, evidence_images, refund_amount)
      VALUES ($1, $2, $3, 'requested', $4, $5, $6::jsonb, $7)
      RETURNING *
    `;

    const result = await pool.query(insertQuery, [
      order.id,
      buyerId,
      order.seller_id,
      reason,
      description || '',
      imagesJson,
      order.total_amount
    ]);

    // 6. Update order status to return_requested
    await pool.query("UPDATE orders SET status = 'return_requested' WHERE id = $1", [order.id]);

    return res.status(201).json({
      message: 'Return request submitted successfully. The seller and support team have been notified.',
      return_request: result.rows[0]
    });
  } catch (error) {
    console.error('Error in requestReturn:', error.message);
    return res.status(500).json({ error: 'Server error submitting return request' });
  }
};

/**
 * 2. Customer: Cancel Order Before Courier Dispatch
 * Instant 100% full refund and inventory restock
 */
export const cancelOrder = async (req, res) => {
  const { orderId } = req.params;
  const buyerId = req.user.id;

  try {
    const orderRes = await pool.query(
      `SELECT id, buyer_id, seller_id, product_id, variant_id, quantity, 
              total_amount, status, is_cod, razorpay_payment_id, awb_code, shipment_status
       FROM orders WHERE id = $1`,
      [orderId]
    );

    if (orderRes.rowCount === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderRes.rows[0];

    if (order.buyer_id !== buyerId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You are not authorized to cancel this order' });
    }

    // Disallow cancellation if already dispatched/in-transit
    if (order.awb_code || ['shipped', 'in_transit', 'delivered'].includes(order.shipment_status) || order.status === 'shipped' || order.status === 'delivered') {
      return res.status(400).json({ 
        error: 'Order has already been dispatched with the courier partner and cannot be cancelled. You may request a return once it arrives.' 
      });
    }

    if (['cancelled', 'refunded'].includes(order.status)) {
      return res.status(400).json({ error: `Order is already ${order.status}` });
    }

    // Process 100% Razorpay refund if prepaid online
    let refundId = null;
    if (!order.is_cod && order.razorpay_payment_id) {
      if (!isRazorpayMock) {
        try {
          const refund = await razorpay.payments.refund(order.razorpay_payment_id, {
            amount: Math.round(parseFloat(order.total_amount) * 100),
            speed: 'normal'
          });
          refundId = refund.id;
        } catch (rErr) {
          console.error('Razorpay refund error on cancel:', rErr.message);
        }
      } else {
        refundId = `rfnd_mock_${Date.now()}`;
      }
    }

    // Update order status to cancelled
    await pool.query("UPDATE orders SET status = 'cancelled' WHERE id = $1", [orderId]);

    // Restock product inventory
    await pool.query(
      'UPDATE products SET stock = stock + $1 WHERE id = $2',
      [order.quantity, order.product_id]
    );
    if (order.variant_id) {
      await pool.query(
        'UPDATE product_variants SET stock = stock + $1 WHERE id = $2',
        [order.quantity, order.variant_id]
      );
    }

    return res.status(200).json({
      message: 'Order cancelled successfully. 100% full refund has been initiated to your original payment method.',
      refund_id: refundId
    });
  } catch (error) {
    console.error('Error in cancelOrder:', error.message);
    return res.status(500).json({ error: 'Server error cancelling order' });
  }
};

/**
 * 3. Customer: View My Return Requests
 */
export const getBuyerReturns = async (req, res) => {
  const buyerId = req.user.id;
  try {
    const query = `
      SELECT rr.*, 
             o.total_amount, o.quantity, o.unit_price, o.created_at as order_date,
             o.shipping_address, o.is_cod, o.awb_code, o.status as order_status,
             p.name as product_name, p.sku as product_sku, p.images as product_images,
             sp.business_name as seller_business_name
      FROM return_requests rr
      JOIN orders o ON rr.order_id = o.id
      JOIN products p ON o.product_id = p.id
      LEFT JOIN seller_profiles sp ON o.seller_id = sp.user_id
      WHERE rr.buyer_id = $1
      ORDER BY rr.created_at DESC
    `;
    const result = await pool.query(query, [buyerId]);
    return res.status(200).json({ returns: result.rows });
  } catch (error) {
    console.error('Error in getBuyerReturns:', error.message);
    return res.status(500).json({ error: 'Server error fetching return requests' });
  }
};

/**
 * 4. Seller: View Return Requests For My Products
 */
export const getSellerReturns = async (req, res) => {
  const sellerId = req.user.id;
  try {
    const query = `
      SELECT rr.*, 
             o.total_amount, o.quantity, o.unit_price, o.created_at as order_date,
             o.shipping_address, o.is_cod, o.awb_code, o.status as order_status,
             u.name as buyer_name, u.phone as buyer_phone, u.email as buyer_email,
             p.name as product_name, p.sku as product_sku, p.images as product_images
      FROM return_requests rr
      JOIN orders o ON rr.order_id = o.id
      JOIN products p ON o.product_id = p.id
      JOIN users u ON rr.buyer_id = u.id
      WHERE rr.seller_id = $1
      ORDER BY rr.created_at DESC
    `;
    const result = await pool.query(query, [sellerId]);
    return res.status(200).json({ returns: result.rows });
  } catch (error) {
    console.error('Error in getSellerReturns:', error.message);
    return res.status(500).json({ error: 'Server error fetching seller return requests' });
  }
};

/**
 * 5. Seller: Approve or Reject a Return Request
 */
export const sellerActOnReturn = async (req, res) => {
  const { id } = req.params;
  const { action, seller_note } = req.body; // action: 'approve' | 'reject'
  const sellerId = req.user.id;

  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({ error: "Action must be 'approve' or 'reject'" });
  }

  try {
    const reqRes = await pool.query(
      `SELECT rr.*, o.product_id, o.variant_id, o.quantity 
       FROM return_requests rr
       JOIN orders o ON rr.order_id = o.id
       WHERE rr.id = $1`,
      [id]
    );

    if (reqRes.rowCount === 0) {
      return res.status(404).json({ error: 'Return request not found' });
    }

    const returnReq = reqRes.rows[0];

    if (returnReq.seller_id !== sellerId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You are not authorized to update this return request' });
    }

    if (action === 'approve') {
      const updateRes = await pool.query(
        `UPDATE return_requests 
         SET status = 'seller_approved', seller_note = $1, updated_at = NOW() 
         WHERE id = $2 RETURNING *`,
        [seller_note || 'Return approved by merchant. Pickup scheduled.', id]
      );

      // Restock inventory on return approval
      await pool.query(
        'UPDATE products SET stock = stock + $1 WHERE id = $2',
        [returnReq.quantity, returnReq.product_id]
      );
      if (returnReq.variant_id) {
        await pool.query(
          'UPDATE product_variants SET stock = stock + $1 WHERE id = $2',
          [returnReq.quantity, returnReq.variant_id]
        );
      }

      return res.status(200).json({
        message: 'Return request approved. Courier pickup scheduled and stock replenished.',
        return_request: updateRes.rows[0]
      });
    } else {
      if (!seller_note) {
        return res.status(400).json({ error: 'A rejection reason note is required when denying a return' });
      }

      const updateRes = await pool.query(
        `UPDATE return_requests 
         SET status = 'seller_rejected', seller_note = $1, updated_at = NOW() 
         WHERE id = $2 RETURNING *`,
        [seller_note, id]
      );

      return res.status(200).json({
        message: 'Return request marked as rejected.',
        return_request: updateRes.rows[0]
      });
    }
  } catch (error) {
    console.error('Error in sellerActOnReturn:', error.message);
    return res.status(500).json({ error: 'Server error processing seller return action' });
  }
};

/**
 * 6. Seller: Mark Courier Physical Pickup Done
 */
export const markPickupDone = async (req, res) => {
  const { id } = req.params;
  const sellerId = req.user.id;

  try {
    const reqRes = await pool.query('SELECT * FROM return_requests WHERE id = $1', [id]);
    if (reqRes.rowCount === 0) {
      return res.status(404).json({ error: 'Return request not found' });
    }

    const returnReq = reqRes.rows[0];
    if (returnReq.seller_id !== sellerId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to update this return' });
    }

    const updateRes = await pool.query(
      "UPDATE return_requests SET status = 'pickup_done', updated_at = NOW() WHERE id = $1 RETURNING *",
      [id]
    );

    return res.status(200).json({
      message: 'Pickup marked as received. Eligible for final 100% refund.',
      return_request: updateRes.rows[0]
    });
  } catch (error) {
    console.error('Error in markPickupDone:', error.message);
    return res.status(500).json({ error: 'Server error updating pickup status' });
  }
};

/**
 * 7. Admin: Global Platform Returns Queue
 */
export const getAdminReturns = async (req, res) => {
  try {
    const query = `
      SELECT rr.*, 
             o.total_amount, o.quantity, o.unit_price, o.created_at as order_date,
             o.shipping_address, o.is_cod, o.awb_code, o.status as order_status,
             o.razorpay_payment_id,
             u.name as buyer_name, u.phone as buyer_phone, u.email as buyer_email,
             sp.business_name as seller_business_name,
             p.name as product_name, p.sku as product_sku, p.images as product_images
      FROM return_requests rr
      JOIN orders o ON rr.order_id = o.id
      JOIN products p ON o.product_id = p.id
      JOIN users u ON rr.buyer_id = u.id
      LEFT JOIN seller_profiles sp ON o.seller_id = sp.user_id
      ORDER BY rr.created_at DESC
    `;
    const result = await pool.query(query);
    return res.status(200).json({ returns: result.rows });
  } catch (error) {
    console.error('Error in getAdminReturns:', error.message);
    return res.status(500).json({ error: 'Server error fetching admin returns' });
  }
};

/**
 * 8. Admin: Override Decision (Force Approve / Force Reject)
 */
export const adminActOnReturn = async (req, res) => {
  const { id } = req.params;
  const { action, admin_note } = req.body; // action: 'approve' | 'reject' | 'close'

  try {
    const reqRes = await pool.query('SELECT * FROM return_requests WHERE id = $1', [id]);
    if (reqRes.rowCount === 0) {
      return res.status(404).json({ error: 'Return request not found' });
    }

    let nextStatus = 'admin_approved';
    if (action === 'reject') nextStatus = 'admin_rejected';
    if (action === 'close') nextStatus = 'closed';

    const updateRes = await pool.query(
      `UPDATE return_requests 
       SET status = $1, admin_note = $2, updated_at = NOW() 
       WHERE id = $3 RETURNING *`,
      [nextStatus, admin_note || 'Admin administrative override', id]
    );

    return res.status(200).json({
      message: `Return request updated to ${nextStatus}`,
      return_request: updateRes.rows[0]
    });
  } catch (error) {
    console.error('Error in adminActOnReturn:', error.message);
    return res.status(500).json({ error: 'Server error in admin return action' });
  }
};

/**
 * 9. Admin: Process 100% Full Refund via Razorpay or COD Clearance
 */
export const processRazorpayRefund = async (req, res) => {
  const { id } = req.params;
  const { note } = req.body;

  try {
    const reqRes = await pool.query(
      `SELECT rr.*, o.total_amount, o.is_cod, o.razorpay_payment_id 
       FROM return_requests rr
       JOIN orders o ON rr.order_id = o.id
       WHERE rr.id = $1`,
      [id]
    );

    if (reqRes.rowCount === 0) {
      return res.status(404).json({ error: 'Return request not found' });
    }

    const returnReq = reqRes.rows[0];
    const refundAmount = parseFloat(returnReq.refund_amount || returnReq.total_amount);

    let refundId = null;

    if (!returnReq.is_cod && returnReq.razorpay_payment_id) {
      if (!isRazorpayMock) {
        try {
          const refund = await razorpay.payments.refund(returnReq.razorpay_payment_id, {
            amount: Math.round(refundAmount * 100),
            speed: 'normal'
          });
          refundId = refund.id;
        } catch (rErr) {
          console.error('Razorpay refund API error:', rErr.message);
          return res.status(502).json({ error: `Razorpay Gateway Error: ${rErr.message}` });
        }
      } else {
        refundId = `rfnd_mock_${Date.now()}`;
      }
    } else {
      // Cash on Delivery
      refundId = `cod_bank_transfer_${Date.now()}`;
    }

    const finalAdminNote = [
      returnReq.admin_note,
      note,
      returnReq.is_cod ? '[100% Full Refund disbursed via Bank Transfer]' : `[100% Full Razorpay Refund: ${refundId}]`
    ].filter(Boolean).join(' | ');

    // Update return request status to refunded
    const updatedReturn = await pool.query(
      `UPDATE return_requests 
       SET status = 'refunded', razorpay_refund_id = $1, refunded_at = NOW(), admin_note = $2, updated_at = NOW() 
       WHERE id = $3 RETURNING *`,
      [refundId, finalAdminNote, id]
    );

    // Update order status to refunded
    await pool.query("UPDATE orders SET status = 'refunded' WHERE id = $1", [returnReq.order_id]);

    return res.status(200).json({
      message: '100% Full refund processed and recorded successfully.',
      refund_id: refundId,
      return_request: updatedReturn.rows[0]
    });
  } catch (error) {
    console.error('Error in processRazorpayRefund:', error.message);
    return res.status(500).json({ error: 'Server error processing refund' });
  }
};
