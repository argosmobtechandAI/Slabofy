import crypto from 'crypto';
import Razorpay from 'razorpay';
import { pool, redisClient } from '../config/db.js';
import { sendWhatsApp } from '../utils/whatsapp.js';
import { sendPush } from '../utils/push.js';
import dotenv from 'dotenv';

dotenv.config();

// Self-healing migration to add coupon_code to orders
pool.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50)')
  .catch(err => console.error('Migration error adding coupon_code to orders:', err.message));

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_mockkey',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'mocksecret'
});

const isRazorpayMock = !process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID.includes('YOURKEY');

// List of allowed COD pincodes for testing
const ALLOWED_COD_PINCODES = ['110001', '400001', '560001', '700001', '600001', '500001', '122001', '122018', '201301', '302001'];

/**
 * BE-20: Create Razorpay Pre-Auth Order
 */
export const createPaymentOrder = async (req, res) => {
  const { group_id, product_id, target_size, shipping_address, coupon_code, variant_id, color, size } = req.body;
  const buyerId = req.user.id;

  if (!shipping_address) {
    return res.status(400).json({ error: 'Shipping address is required' });
  }

  let finalProductId = product_id;
  let finalTargetSize = parseInt(target_size);

  try {
    // 1. If group_id is provided, fetch product & target size from the group
    if (group_id) {
      const groupRes = await pool.query('SELECT product_id, target_size, status, timer_end FROM groups WHERE id = $1', [group_id]);
      const group = groupRes.rows[0];
      if (!group) {
        return res.status(404).json({ error: 'Group buy deal not found' });
      }
      if (group.status !== 'active') {
        return res.status(400).json({ error: `Cannot pay. Group is ${group.status}.` });
      }
      if (new Date(group.timer_end) < new Date()) {
        return res.status(400).json({ error: 'Cannot pay. Group buy timer has expired.' });
      }
      finalProductId = group.product_id;
      finalTargetSize = group.target_size;
    }

    // 2. Fetch the corresponding tier price
    const tierRes = await pool.query(
      'SELECT price FROM product_tiers WHERE product_id = $1 AND group_size = $2',
      [finalProductId, finalTargetSize]
    );
    const tier = tierRes.rows[0];
    if (!tier) {
      return res.status(400).json({ error: `Pricing tier for group size ${finalTargetSize} not found` });
    }
    const unitPrice = parseFloat(tier.price);
    const totalAmount = unitPrice; // quantity is 1 for group buys

    // Fetch product details for seller mapping
    const productRes = await pool.query('SELECT seller_id, category_id FROM products WHERE id = $1', [finalProductId]);
    const product = productRes.rows[0];
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Fetch commission rate snapshotted from category
    const catRes = await pool.query('SELECT commission_pct FROM categories WHERE id = $1', [product.category_id]);
    const commissionPct = catRes.rows[0]?.commission_pct || 5.00;

    // Apply Coupon if applicable
    let finalAmount = totalAmount;
    let appliedCouponCode = null;
    if (coupon_code) {
      const couponRes = await pool.query('SELECT * FROM coupons WHERE code = $1 AND is_active = true', [coupon_code.toUpperCase().trim()]);
      const coupon = couponRes.rows[0];
      if (coupon) {
        if (new Date(coupon.expiry) >= new Date() && coupon.uses < coupon.max_uses) {
          appliedCouponCode = coupon.code;
          let discount = 0;
          if (coupon.discount_type === 'flat') {
            discount = parseFloat(coupon.discount_value);
          } else if (coupon.discount_type === 'pct') {
            discount = (totalAmount * parseFloat(coupon.discount_value)) / 100;
          }
          finalAmount = Math.max(1.00, totalAmount - discount); // Razorpay requires at least 1 Paise/INR
        }
      }
    }

    // 3. Call Razorpay API to create order (Pre-Auth hold mode: payment_capture = 0)
    let razorpayOrder;
    if (isRazorpayMock) {
      razorpayOrder = {
        id: `order_mock_${Math.random().toString(36).substring(2, 15)}`,
        amount: Math.round(finalAmount * 100),
        currency: 'INR'
      };
      console.log(`[MOCK RAZORPAY ORDER] Created: ${razorpayOrder.id} | Amount: ${finalAmount}`);
    } else {
      razorpayOrder = await razorpay.orders.create({
        amount: Math.round(finalAmount * 100), // in Paise
        currency: 'INR',
        receipt: `receipt_group_${Date.now()}`,
        payment_capture: 0 // CRITICAL: 0 disables auto-capture, enabling pre-auth hold
      });
    }

    // 4. Create pending order in PostgreSQL database
    const insertOrderQuery = `
      INSERT INTO orders (group_id, buyer_id, seller_id, product_id, quantity, unit_price, total_amount, commission_pct, status, razorpay_order_id, is_cod, shipping_address, coupon_code, variant_id, color, size)
      VALUES ($1, $2, $3, $4, 1, $5, $6, $7, 'pending', $8, false, $9, $10, $11, $12, $13)
      RETURNING *
    `;
    const orderResult = await pool.query(insertOrderQuery, [
      group_id || null, // null means starting a new group
      buyerId,
      product.seller_id,
      finalProductId,
      unitPrice,
      finalAmount,
      commissionPct,
      razorpayOrder.id,
      shipping_address,
      appliedCouponCode,
      variant_id || null,
      color || null,
      size || null
    ]);

    return res.status(201).json({
      message: 'Pre-auth payment order generated successfully',
      razorpay_order_id: razorpayOrder.id,
      amount: finalAmount,
      key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_mockkey',
      order_id: orderResult.rows[0].id
    });
  } catch (error) {
    console.error('Error in createPaymentOrder:', error.message);
    return res.status(500).json({ error: 'Server error generating payment checkout' });
  }
};

/**
 * Verify Razorpay payment signature
 * Activates group creation / joining post-payment authorization
 */
export const verifyPaymentSignature = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const buyerId = req.user.id;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Razorpay order ID, payment ID, and signature are required' });
  }

  // 1. Verify Signature
  if (!isRazorpayMock) {
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'mocksecret')
      .update(text)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ error: 'Payment verification failed: Signature mismatch' });
    }
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 2. Fetch pending order
    const orderRes = await client.query(
      'SELECT * FROM orders WHERE razorpay_order_id = $1 AND buyer_id = $2 AND status = $3 FOR UPDATE',
      [razorpay_order_id, buyerId, 'pending']
    );
    const order = orderRes.rows[0];
    if (!order) {
      await client.query('COMMIT');
      return res.status(404).json({ error: 'Pending order session not found or already verified' });
    }

    // Increment coupon uses if applied
    if (order.coupon_code) {
      await client.query('UPDATE coupons SET uses = uses + 1 WHERE code = $1', [order.coupon_code]);
    }

    // Decrement stock upon pre-authorization
    if (order.variant_id) {
      await client.query('UPDATE product_variants SET stock = GREATEST(0, stock - 1) WHERE id = $1', [order.variant_id]);
    } else {
      await client.query('UPDATE products SET stock = GREATEST(0, stock - 1) WHERE id = $1', [order.product_id]);
    }

    // 3. Register payment in preauth table
    const preauthQuery = `
      INSERT INTO payment_preauth (order_id, razorpay_order_id, status)
      VALUES ($1, $2, 'authorized')
      RETURNING *
    `;
    await client.query(preauthQuery, [order.id, razorpay_order_id]);

    // Update order with payment ID
    await client.query(
      'UPDATE orders SET razorpay_payment_id = $1 WHERE id = $2',
      [razorpay_payment_id, order.id]
    );

    // 4. Handle Group Activation
    if (!order.group_id) {
      // This is a NEW group being started!
      // Generate group buying details
      const groupRes = await client.query('SELECT target_size FROM product_tiers WHERE product_id = $1 ORDER BY group_size DESC LIMIT 1');
      // For testing, default target size to 2 if not passed, or find target_size from product tiers
      // We can query target_size based on order.total_amount
      const sizeQuery = 'SELECT group_size FROM product_tiers WHERE product_id = $1 AND price = $2 LIMIT 1';
      const sizeRes = await client.query(sizeQuery, [order.product_id, order.unit_price]);
      const targetSize = sizeRes.rows[0]?.group_size || 2;

      const timerEnd = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Create Group
      const insertGroupRes = await client.query(
        "INSERT INTO groups (product_id, creator_id, target_size, current_size, status, timer_end) VALUES ($1, $2, $3, 1, 'active', $4) RETURNING *",
        [order.product_id, buyerId, targetSize, timerEnd]
      );
      const group = insertGroupRes.rows[0];

      // Add member
      await client.query(
        'INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)',
        [group.id, buyerId]
      );

      // Link order to group
      await client.query('UPDATE orders SET group_id = $1 WHERE id = $2', [group.id, order.id]);

      // Redis timer
      const redisKey = `group:${group.id}:timer`;
      const unixTimestamp = Math.floor(timerEnd.getTime() / 1000);
      await redisClient.set(redisKey, unixTimestamp.toString(), { EX: 86400 });

      await client.query('COMMIT');
      return res.status(200).json({
        message: 'Payment authorized and group started successfully!',
        group_id: group.id,
        order_id: order.id
      });
    } else {
      // Joining an EXISTING group!
      // Add member to group and handle size increment
      const groupCheck = await client.query('SELECT * FROM groups WHERE id = $1 FOR UPDATE', [order.group_id]);
      const group = groupCheck.rows[0];

      if (!group || group.status !== 'active') {
        throw new Error('Group is no longer active for joining');
      }

      await client.query(
        'INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)',
        [group.id, buyerId]
      );

      const updatedSize = group.current_size + 1;
      await client.query('UPDATE groups SET current_size = $1 WHERE id = $2', [updatedSize, group.id]);

      // Trigger completion if full
      if (updatedSize === group.target_size) {
        // Run group completion helper (importing internally from groups file / duplicate code avoided by writing utility or calling it)
        // Set group status to complete
        await client.query("UPDATE groups SET status = 'complete' WHERE id = $1", [group.id]);
        
        // Confirm all orders and capture holds
        const ordersQuery = `
          SELECT o.id as o_id, o.buyer_id, o.total_amount, u.phone, pa.id as pa_id, pa.razorpay_order_id, o.is_cod
          FROM orders o
          JOIN users u ON o.buyer_id = u.id
          LEFT JOIN payment_preauth pa ON pa.order_id = o.id
          WHERE o.group_id = $1
        `;
        const ordersRes = await client.query(ordersQuery, [group.id]);
        
        await redisClient.del(`group:${group.id}:timer`);

        for (const ord of ordersRes.rows) {
          if (ord.is_cod) {
            await client.query("UPDATE orders SET status = 'confirmed' WHERE id = $1", [ord.o_id]);
            continue;
          }
          try {
            if (isRazorpayMock) {
              console.log(`[MOCK PAYMENT CAPTURE] Capturing Order: ${ord.razorpay_order_id}`);
            } else {
              const paymentsRes = await razorpay.orders.fetchPayments(ord.razorpay_order_id);
              const authPayment = paymentsRes.items.find(p => p.status === 'authorized');
              if (authPayment) {
                const amountInPaise = Math.round(parseFloat(ord.total_amount) * 100);
                await razorpay.payments.capture(authPayment.id, amountInPaise, 'INR');
                await client.query("UPDATE payment_preauth SET status = 'captured', captured_at = NOW() WHERE id = $1", [ord.pa_id]);
              }
            }
            await client.query("UPDATE orders SET status = 'confirmed' WHERE id = $1", [ord.o_id]);
            await sendWhatsApp(ord.phone, 'group_complete', [ord.o_id], ord.buyer_id);
            await sendPush(ord.buyer_id, 'Deal Confirmed!', `Group completed! Order #${ord.o_id} is confirmed.`);
          } catch (payErr) {
            console.error(`Capture failed for order ${ord.o_id}:`, payErr.message);
          }
        }
      } else {
        // Send notification to creator
        const creatorRes = await client.query('SELECT phone FROM users WHERE id = $1', [group.creator_id]);
        if (creatorRes.rows[0]?.phone) {
          await sendWhatsApp(creatorRes.rows[0].phone, 'member_joined', [updatedSize, group.target_size], group.creator_id);
        }
      }

      await client.query('COMMIT');
      return res.status(200).json({
        message: 'Payment authorized and joined group successfully!',
        group_id: group.id,
        order_id: order.id
      });
    }
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in verifyPaymentSignature:', error.message);
    return res.status(500).json({ error: error.message || 'Server error verifying payment signature' });
  } finally {
    client.release();
  }
};

/**
 * BE-23: Razorpay Webhook Handler
 */
export const handleRazorpayWebhook = async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'webhook_secret';

  // Verify signature
  if (!isRazorpayMock && signature) {
    const shasum = crypto.createHmac('sha256', webhookSecret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest('hex');

    if (digest !== signature) {
      return res.status(400).json({ error: 'Webhook signature validation failed' });
    }
  }

  const event = req.body.event;
  const payload = req.body.payload;

  console.log(`[RAZORPAY WEBHOOK RECEIVE] Event: ${event}`);

  try {
    if (event === 'payment.authorized') {
      const razorpayOrderId = payload.payment.entity.order_id;
      const razorpayPaymentId = payload.payment.entity.id;
      
      // Mark as preauthorized in DB
      await pool.query(
        `UPDATE payment_preauth SET status = 'authorized' WHERE razorpay_order_id = $1`,
        [razorpayOrderId]
      );
      await pool.query(
        `UPDATE orders SET razorpay_payment_id = $1 WHERE razorpay_order_id = $2`,
        [razorpayPaymentId, razorpayOrderId]
      );
    } else if (event === 'payment.failed') {
      const razorpayOrderId = payload.payment.entity.order_id;
      await pool.query(
        `UPDATE orders SET status = 'cancelled' WHERE razorpay_order_id = $1`,
        [razorpayOrderId]
      );
    }
    
    return res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook processing error:', error.message);
    return res.status(500).json({ error: 'Webhook handler error' });
  }
};

/**
 * BE-24: Cash on Delivery (COD) Flow
 */
export const createCodOrder = async (req, res) => {
  const { group_id, product_id, target_size, shipping_address, pincode, coupon_code, variant_id, color, size } = req.body;
  const buyerId = req.user.id;

  if (!shipping_address || !pincode) {
    return res.status(400).json({ error: 'Shipping address and pincode are required' });
  }

  // Validate pincode against allowed list
  if (!ALLOWED_COD_PINCODES.includes(pincode.trim())) {
    return res.status(400).json({ error: 'Cash on Delivery (COD) is not available for this pincode' });
  }

  let finalProductId = product_id;
  let finalTargetSize = parseInt(target_size);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Resolve product and pricing
    if (group_id) {
      const groupRes = await client.query('SELECT product_id, target_size, status, timer_end FROM groups WHERE id = $1 FOR UPDATE', [group_id]);
      const group = groupRes.rows[0];
      if (!group) {
        return res.status(404).json({ error: 'Group buy deal not found' });
      }
      if (group.status !== 'active') {
        return res.status(400).json({ error: `Cannot join. Group is ${group.status}.` });
      }
      if (new Date(group.timer_end) < new Date()) {
        return res.status(400).json({ error: 'Cannot join. Group buy timer has expired.' });
      }
      finalProductId = group.product_id;
      finalTargetSize = group.target_size;
    }

    const tierRes = await client.query(
      'SELECT price FROM product_tiers WHERE product_id = $1 AND group_size = $2',
      [finalProductId, finalTargetSize]
    );
    const tier = tierRes.rows[0];
    if (!tier) {
      return res.status(400).json({ error: 'Pricing tier not found' });
    }
    const unitPrice = parseFloat(tier.price);

    const productRes = await client.query('SELECT seller_id, category_id FROM products WHERE id = $1', [finalProductId]);
    const product = productRes.rows[0];
    const catRes = await client.query('SELECT commission_pct FROM categories WHERE id = $1', [product.category_id]);
    const commissionPct = catRes.rows[0]?.commission_pct || 5.00;

    // Apply Coupon if applicable
    let finalAmount = unitPrice;
    let appliedCouponCode = null;
    if (coupon_code) {
      const couponRes = await client.query('SELECT * FROM coupons WHERE code = $1 AND is_active = true', [coupon_code.toUpperCase().trim()]);
      const coupon = couponRes.rows[0];
      if (coupon) {
        if (new Date(coupon.expiry) >= new Date() && coupon.uses < coupon.max_uses) {
          appliedCouponCode = coupon.code;
          let discount = 0;
          if (coupon.discount_type === 'flat') {
            discount = parseFloat(coupon.discount_value);
          } else if (coupon.discount_type === 'pct') {
            discount = (unitPrice * parseFloat(coupon.discount_value)) / 100;
          }
          finalAmount = Math.max(0.00, unitPrice - discount);
          
          // Increment uses immediately for COD
          await client.query('UPDATE coupons SET uses = uses + 1 WHERE code = $1', [coupon.code]);
        }
      }
    }

    // 2. COD Order creation (Status set to 'confirmed' directly because it skips pre-auth)
    // 3. Update Group Buying State
    if (!group_id) {
      // Starting a new group
      const timerEnd = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const insertGroupRes = await client.query(
        "INSERT INTO groups (product_id, creator_id, target_size, current_size, status, timer_end) VALUES ($1, $2, $3, 1, 'active', $4) RETURNING *",
        [finalProductId, buyerId, finalTargetSize, timerEnd]
      );
      const newGroup = insertGroupRes.rows[0];

      await client.query(
        'INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)',
        [newGroup.id, buyerId]
      );

      // Create confirmed order
      const insertOrderQuery = `
        INSERT INTO orders (group_id, buyer_id, seller_id, product_id, quantity, unit_price, total_amount, commission_pct, status, is_cod, shipping_address, coupon_code, variant_id, color, size)
        VALUES ($1, $2, $3, $4, 1, $5, $6, $7, 'confirmed', true, $8, $9, $10, $11, $12)
        RETURNING *
      `;
      const orderRes = await client.query(insertOrderQuery, [
        newGroup.id,
        buyerId,
        product.seller_id,
        finalProductId,
        unitPrice,
        finalAmount,
        commissionPct,
        `${shipping_address} (Pincode: ${pincode})`,
        appliedCouponCode,
        variant_id || null,
        color || null,
        size || null
      ]);

      // Decrement stock for COD
      if (variant_id) {
        await client.query('UPDATE product_variants SET stock = GREATEST(0, stock - 1) WHERE id = $1', [variant_id]);
      } else {
        await client.query('UPDATE products SET stock = GREATEST(0, stock - 1) WHERE id = $1', [finalProductId]);
      }

      const redisKey = `group:${newGroup.id}:timer`;
      await redisClient.set(redisKey, Math.floor(timerEnd.getTime() / 1000).toString(), { EX: 86400 });

      await client.query('COMMIT');
      return res.status(201).json({
        message: 'COD Order created and group buying started successfully!',
        group_id: newGroup.id,
        order: orderRes.rows[0]
      });
    } else {
      // Joining existing group
      const groupCheck = await client.query('SELECT * FROM groups WHERE id = $1 FOR UPDATE', [group_id]);
      const group = groupCheck.rows[0];

      if (group.current_size >= group.target_size) {
        return res.status(400).json({ error: 'Group is already full' });
      }

      // Check if user is already a member
      const memberCheck = await client.query(
        'SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2',
        [group_id, buyerId]
      );
      if (memberCheck.rowCount > 0) {
        return res.status(400).json({ error: 'You are already a member of this group' });
      }

      await client.query(
        'INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)',
        [group_id, buyerId]
      );

      const updatedSize = group.current_size + 1;
      await client.query('UPDATE groups SET current_size = $1 WHERE id = $2', [updatedSize, group_id]);

      const insertOrderQuery = `
        INSERT INTO orders (group_id, buyer_id, seller_id, product_id, quantity, unit_price, total_amount, commission_pct, status, is_cod, shipping_address, coupon_code, variant_id, color, size)
        VALUES ($1, $2, $3, $4, 1, $5, $6, $7, 'confirmed', true, $8, $9, $10, $11, $12)
        RETURNING *
      `;
      const orderRes = await client.query(insertOrderQuery, [
        group_id,
        buyerId,
        product.seller_id,
        finalProductId,
        unitPrice,
        finalAmount,
        commissionPct,
        `${shipping_address} (Pincode: ${pincode})`,
        appliedCouponCode,
        variant_id || null,
        color || null,
        size || null
      ]);

      // Decrement stock for COD
      if (variant_id) {
        await client.query('UPDATE product_variants SET stock = GREATEST(0, stock - 1) WHERE id = $1', [variant_id]);
      } else {
        await client.query('UPDATE products SET stock = GREATEST(0, stock - 1) WHERE id = $1', [finalProductId]);
      }

      if (updatedSize === group.target_size) {
        // Group Complete Flow (Trigger capture on other holds)
        await client.query("UPDATE groups SET status = 'complete' WHERE id = $1", [group_id]);
        await redisClient.del(`group:${group_id}:timer`);

        // Capture non-COD holds
        const holdsRes = await client.query(
          `SELECT o.id, o.buyer_id, o.total_amount, u.phone, pa.id as pa_id, pa.razorpay_order_id
           FROM orders o
           JOIN users u ON o.buyer_id = u.id
           JOIN payment_preauth pa ON pa.order_id = o.id
           WHERE o.group_id = $1 AND o.is_cod = false`,
          [group_id]
        );

        for (const ord of holdsRes.rows) {
          try {
            if (isRazorpayMock) {
              console.log(`[MOCK PAYMENT CAPTURE] Capturing Hold: ${ord.razorpay_order_id}`);
            } else {
              const paymentsRes = await razorpay.orders.fetchPayments(ord.razorpay_order_id);
              const authPayment = paymentsRes.items.find(p => p.status === 'authorized');
              if (authPayment) {
                const amountInPaise = Math.round(parseFloat(ord.total_amount) * 100);
                await razorpay.payments.capture(authPayment.id, amountInPaise, 'INR');
                await client.query("UPDATE payment_preauth SET status = 'captured', captured_at = NOW() WHERE id = $1", [ord.pa_id]);
              }
            }
            await client.query("UPDATE orders SET status = 'confirmed' WHERE id = $1", [ord.id]);
            await sendWhatsApp(ord.phone, 'group_complete', [ord.id], ord.buyer_id);
            await sendPush(ord.buyer_id, 'Deal Confirmed!', `Group completed! Order #${ord.id} is confirmed.`);
          } catch (payErr) {
            console.error(`COD Flow: Capture failed for order ${ord.id}:`, payErr.message);
          }
        }

        // Send notifications for all COD members as well
        const allMembersRes = await client.query(
          'SELECT gm.user_id, u.phone, o.id as ord_id FROM group_members gm JOIN users u ON gm.user_id = u.id JOIN orders o ON o.group_id = gm.group_id AND o.buyer_id = gm.user_id WHERE gm.group_id = $1',
          [group_id]
        );
        for (const mem of allMembersRes.rows) {
          await sendWhatsApp(mem.phone, 'group_complete', [mem.ord_id], mem.user_id);
          await sendPush(mem.user_id, 'Deal Confirmed!', `Group completed! Your order #${mem.ord_id} is confirmed.`);
        }
      } else {
        // Send notification to creator
        const creatorRes = await client.query('SELECT phone FROM users WHERE id = $1', [group.creator_id]);
        if (creatorRes.rows[0]?.phone) {
          await sendWhatsApp(creatorRes.rows[0].phone, 'member_joined', [updatedSize, group.target_size], group.creator_id);
        }
      }

      await client.query('COMMIT');
      return res.status(201).json({
        message: 'Successfully joined group buying team via COD!',
        group_id: group.id,
        order: orderRes.rows[0]
      });
    }
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in createCodOrder:', error.message);
    return res.status(500).json({ error: error.message || 'Server error processing COD order' });
  } finally {
    client.release();
  }
};
