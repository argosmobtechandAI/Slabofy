import { pool, redisClient } from '../config/db.js';
import { sendWhatsApp } from '../utils/whatsapp.js';
import { sendPush } from '../utils/push.js';
import Razorpay from 'razorpay';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Razorpay client with fallback keys for mock testing
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_mockkey',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'mocksecret'
});

// Helper to check if Razorpay is running on mock keys
const isRazorpayMock = !process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID.includes('YOURKEY');

/**
 * BE-12: Create Group (and creator's initial transaction)
 */
export const createGroup = async (req, res) => {
  const { product_id, target_size } = req.body;
  const creatorId = req.user.id;

  if (!product_id || !target_size) {
    return res.status(400).json({ error: 'Product ID and target group size are required' });
  }

  const parsedTargetSize = parseInt(target_size);
  if (![2, 3, 5, 10].includes(parsedTargetSize)) {
    return res.status(400).json({ error: 'Target size must be 2, 3, 5, or 10' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Verify product status and stock
    const productCheck = await client.query(
      'SELECT id, status, stock FROM products WHERE id = $1',
      [product_id]
    );
    const product = productCheck.rows[0];
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    if (product.status !== 'active') {
      return res.status(400).json({ error: 'Product is not currently active for purchase' });
    }
    if (product.stock <= 0) {
      return res.status(400).json({ error: 'Product is out of stock' });
    }

    // 2. Verify target size has a tier price
    const tierCheck = await client.query(
      'SELECT price FROM product_tiers WHERE product_id = $1 AND group_size = $2',
      [product_id, parsedTargetSize]
    );
    if (tierCheck.rowCount === 0) {
      return res.status(400).json({ error: `Pricing tier for group size ${parsedTargetSize} is not defined` });
    }

    // 3. Create Group in active status with 24-hour expiration
    const timerEnd = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
    const insertGroupQuery = `
      INSERT INTO groups (product_id, creator_id, target_size, current_size, status, timer_end)
      VALUES ($1, $2, $3, 1, 'active', $4)
      RETURNING *
    `;
    const groupResult = await client.query(insertGroupQuery, [product_id, creatorId, parsedTargetSize, timerEnd]);
    const group = groupResult.rows[0];

    // 4. Add creator to group_members
    await client.query(
      'INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)',
      [group.id, creatorId]
    );

    // 5. Store timer end Unix timestamp in Redis with 24h TTL
    const redisKey = `group:${group.id}:timer`;
    const unixTimestamp = Math.floor(timerEnd.getTime() / 1000);
    await redisClient.set(redisKey, unixTimestamp.toString(), { EX: 86400 });

    await client.query('COMMIT');

    const inviteUrl = `/join/${group.id}`;
    return res.status(201).json({
      message: 'Group created successfully',
      group_id: group.id,
      invite_url: inviteUrl,
      timer_end: timerEnd,
      current_size: 1,
      target_size: parsedTargetSize
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in createGroup:', error.message);
    return res.status(500).json({ error: 'Server error starting group buying team' });
  } finally {
    client.release();
  }
};

/**
 * BE-13: Join Group
 */
export const joinGroup = async (req, res) => {
  const { id } = req.params; // Group ID
  const userId = req.user.id;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Lock group row for update to prevent concurrent join race conditions
    const groupCheck = await client.query(
      'SELECT * FROM groups WHERE id = $1 FOR UPDATE',
      [id]
    );
    const group = groupCheck.rows[0];

    if (!group) {
      return res.status(404).json({ error: 'Group buy deal not found' });
    }
    if (group.status !== 'active') {
      return res.status(400).json({ error: `Cannot join. Group status is ${group.status}.` });
    }

    // Verify timer not expired
    if (new Date(group.timer_end) < new Date()) {
      return res.status(400).json({ error: 'Cannot join. Group buying timer has expired.' });
    }

    if (group.current_size >= group.target_size) {
      return res.status(400).json({ error: 'Cannot join. Group is already full.' });
    }

    // Check if user is already a member
    const memberCheck = await client.query(
      'SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2',
      [id, userId]
    );
    if (memberCheck.rowCount > 0) {
      return res.status(400).json({ error: 'You are already a member of this group buying team' });
    }

    // 2. Insert user into group_members
    await client.query(
      'INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)',
      [id, userId]
    );

    // 3. Atomically increment current size
    const updatedSize = group.current_size + 1;
    await client.query(
      'UPDATE groups SET current_size = $1 WHERE id = $2',
      [updatedSize, id]
    );

    // 4. Trigger Group Completion Flow if full
    if (updatedSize === group.target_size) {
      await completeGroupInternal(id, client);
      await client.query('COMMIT');
      return res.status(200).json({
        message: 'Successfully joined! The group is now complete and orders are confirmed.',
        status: 'complete',
        current_size: updatedSize
      });
    } else {
      // Send notification to creator
      const creatorRes = await client.query('SELECT phone FROM users WHERE id = $1', [group.creator_id]);
      const creatorPhone = creatorRes.rows[0]?.phone;
      if (creatorPhone) {
        await sendWhatsApp(creatorPhone, 'member_joined', [updatedSize, group.target_size], group.creator_id);
      }
      
      await client.query('COMMIT');
      return res.status(200).json({
        message: 'Successfully joined the group buying team!',
        status: 'active',
        current_size: updatedSize
      });
    }
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in joinGroup:', error.message);
    return res.status(500).json({ error: 'Server error joining group' });
  } finally {
    client.release();
  }
};

/**
 * BE-14: Internal Group Completion Flow
 * Captured in active client transaction. Runs payments and creates confirmed orders.
 */
const completeGroupInternal = async (groupId, client) => {
  console.log(`[GROUP COMPLETE TRIGGER] Group ID: ${groupId}. Capturing payments and confirming orders.`);

  // 1. Update group status to complete
  await client.query(
    "UPDATE groups SET status = 'complete' WHERE id = $1",
    [groupId]
  );

  // 2. Fetch all members and their pre-auth payments
  const membersQuery = `
    SELECT gm.user_id, u.phone, u.name, o.id as order_id, o.total_amount, o.seller_id,
           pa.id as preauth_id, pa.razorpay_order_id, o.is_cod
    FROM group_members gm
    JOIN users u ON gm.user_id = u.id
    LEFT JOIN orders o ON o.group_id = gm.group_id AND o.buyer_id = gm.user_id
    LEFT JOIN payment_preauth pa ON pa.order_id = o.id
    WHERE gm.group_id = $1
  `;
  const membersRes = await client.query(membersQuery, [groupId]);
  const members = membersRes.rows;

  // Delete timer countdown key from Redis
  await redisClient.del(`group:${groupId}:timer`);

  // 3. Process each member's payment and order
  for (const member of members) {
    // If COD, skip pre-auth capture
    if (member.is_cod) {
      await client.query(
        "UPDATE orders SET status = 'confirmed' WHERE id = $1",
        [member.order_id]
      );
      continue;
    }

    if (!member.razorpay_order_id) {
      console.warn(`Member ${member.name} has no preauth order ID! Flagging for manual admin review.`);
      await client.query(
        "UPDATE orders SET status = 'pending' WHERE id = $1",
        [member.order_id]
      );
      continue;
    }

    // Capture payment preauth
    try {
      if (isRazorpayMock) {
        console.log(`[MOCK PAYMENT CAPTURE] Capturing hold for Order: ${member.razorpay_order_id} | Amount: ${member.total_amount}`);
      } else {
        // Razorpay capture payments require the specific payment_id.
        // We'll query payment records of this order to get payment_id, or capture via orders webhook
        // For standard flow, we call Capture via Razorpay Payments API
        // Under test mode we can mock this, in production we capture the authorized payment:
        const paymentsRes = await razorpay.orders.fetchPayments(member.razorpay_order_id);
        const authPayment = paymentsRes.items.find(p => p.status === 'authorized');
        if (authPayment) {
          const amountInPaise = Math.round(parseFloat(member.total_amount) * 100);
          await razorpay.payments.capture(authPayment.id, amountInPaise, 'INR');
          await client.query(
            "UPDATE payment_preauth SET status = 'captured', captured_at = NOW() WHERE id = $1",
            [member.preauth_id]
          );
        } else {
          console.warn(`No authorized payment found for Razorpay Order ${member.razorpay_order_id}`);
        }
      }

      // Mark order as confirmed
      await client.query(
        "UPDATE orders SET status = 'confirmed' WHERE id = $1",
        [member.order_id]
      );

      // Log success notification
      await sendWhatsApp(member.phone, 'group_complete', [member.order_id], member.user_id);
      await sendPush(member.user_id, 'Deal Confirmed!', `Your team is complete! Order #${member.order_id} is confirmed.`);
    } catch (payErr) {
      console.error(`[PAYMENT CAPTURE FAILED] For Order ${member.order_id}:`, payErr.message);
      // Keep order in pending or flag as manual payment review
      await client.query(
        "UPDATE orders SET status = 'pending' WHERE id = $1",
        [member.order_id]
      );
    }
  }
};

/**
 * BE-15: Group Status / Real-Time Poll
 */
export const getGroupStatus = async (req, res) => {
  const { id } = req.params;

  try {
    const groupQuery = `
      SELECT g.*, p.name as product_name, p.images->>0 as product_image,
             u_creator.name as creator_name,
             (SELECT price FROM product_tiers WHERE product_id = g.product_id AND group_size = g.target_size) as tier_price,
             (SELECT price FROM product_tiers WHERE product_id = g.product_id AND group_size = 1) as original_price,
             json_agg(json_build_object('id', u.id, 'name', u.name, 'joined_at', gm.joined_at)) as members
      FROM groups g
      JOIN products p ON g.product_id = p.id
      JOIN users u_creator ON g.creator_id = u_creator.id
      JOIN group_members gm ON gm.group_id = g.id
      JOIN users u ON gm.user_id = u.id
      WHERE g.id = $1
      GROUP BY g.id, p.name, p.images, u_creator.name
    `;
    const result = await pool.query(groupQuery, [id]);
    const group = result.rows[0];

    if (!group) {
      return res.status(404).json({ error: 'Group buy deal not found' });
    }

    // Timer calculation: fetch from Redis, fall back to DB
    let remainingSeconds = 0;
    const redisKey = `group:${id}:timer`;
    const cachedTime = await redisClient.get(redisKey);

    if (cachedTime) {
      const expirationTime = parseInt(cachedTime) * 1000;
      remainingSeconds = Math.max(0, Math.floor((expirationTime - Date.now()) / 1000));
    } else if (group.status === 'active') {
      const expirationTime = new Date(group.timer_end).getTime();
      remainingSeconds = Math.max(0, Math.floor((expirationTime - Date.now()) / 1000));
      // Re-populate Redis key
      await redisClient.set(redisKey, Math.floor(expirationTime / 1000).toString(), { EX: remainingSeconds });
    }

    return res.status(200).json({
      group_id: group.id,
      product_id: group.product_id,
      product_name: group.product_name,
      product_image: group.product_image,
      creator_id: group.creator_id,
      creator_name: group.creator_name,
      target_size: group.target_size,
      current_size: group.current_size,
      status: group.status,
      timer_remaining_seconds: remainingSeconds,
      extension_used: group.extension_used,
      tier_price: group.tier_price,
      original_price: group.original_price,
      members: group.members
    });
  } catch (error) {
    console.error('Error in getGroupStatus:', error.message);
    return res.status(500).json({ error: 'Server error loading group status' });
  }
};

/**
 * BE-16: Extend Timer
 */
export const extendTimer = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const groupRes = await client.query('SELECT * FROM groups WHERE id = $1 FOR UPDATE', [id]);
    const group = groupRes.rows[0];

    if (!group) {
      return res.status(404).json({ error: 'Group buy deal not found' });
    }
    if (group.creator_id !== userId) {
      return res.status(403).json({ error: 'Only the team creator can extend the timer' });
    }
    if (group.status !== 'active') {
      return res.status(400).json({ error: `Cannot extend. Group is ${group.status}.` });
    }
    if (group.extension_used) {
      return res.status(400).json({ error: 'Extension limit reached. You can only extend the timer once.' });
    }

    // Extend timer by 12 hours
    const extendedTime = new Date(new Date(group.timer_end).getTime() + 12 * 60 * 60 * 1000);
    await client.query(
      'UPDATE groups SET timer_end = $1, extension_used = true WHERE id = $2',
      [extendedTime, id]
    );

    // Update Redis
    const remainingSeconds = Math.max(0, Math.floor((extendedTime.getTime() - Date.now()) / 1000));
    const redisKey = `group:${id}:timer`;
    const unixTimestamp = Math.floor(extendedTime.getTime() / 1000);
    await redisClient.set(redisKey, unixTimestamp.toString(), { EX: remainingSeconds });

    // Notify all members
    const membersRes = await client.query(
      'SELECT gm.user_id, u.phone FROM group_members gm JOIN users u ON gm.user_id = u.id WHERE gm.group_id = $1',
      [id]
    );
    for (const member of membersRes.rows) {
      await sendWhatsApp(member.phone, 'timer_extended', ['12 hours'], member.user_id);
    }

    await client.query('COMMIT');
    return res.status(200).json({
      message: 'Timer extended by 12 hours successfully',
      timer_end: extendedTime
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in extendTimer:', error.message);
    return res.status(500).json({ error: 'Server error extending timer' });
  } finally {
    client.release();
  }
};

/**
 * BE-17: Cancel Group
 */
export const cancelGroup = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const groupRes = await client.query('SELECT * FROM groups WHERE id = $1 FOR UPDATE', [id]);
    const group = groupRes.rows[0];

    if (!group) {
      return res.status(404).json({ error: 'Group buy deal not found' });
    }
    if (group.creator_id !== userId) {
      return res.status(403).json({ error: 'Only the team creator can cancel the group' });
    }
    if (group.status !== 'active') {
      return res.status(400).json({ error: 'Only active groups can be cancelled' });
    }

    // Void all payment pre-authorizations
    const ordersRes = await client.query(
      'SELECT o.id as order_id, pa.id as preauth_id, pa.razorpay_order_id, u.phone, u.id as user_id FROM orders o JOIN payment_preauth pa ON pa.order_id = o.id JOIN users u ON o.buyer_id = u.id WHERE o.group_id = $1',
      [id]
    );

    // Perform cancellations and refunds
    for (const row of ordersRes.rows) {
      try {
        if (isRazorpayMock) {
          console.log(`[MOCK PAYMENT VOID] Voiding authorization for Order: ${row.razorpay_order_id}`);
        } else {
          // Razorpay void authorization is performed by refunding the payment before capture,
          // or cancellation. If the payment is not captured, we call Razorpay Refund or let it auto-void
          // Typically we create a refund:
          const paymentsRes = await razorpay.orders.fetchPayments(row.razorpay_order_id);
          const authorizedPayment = paymentsRes.items.find(p => p.status === 'authorized');
          if (authorizedPayment) {
            // Refund/Void authorized payment
            await razorpay.payments.refund(authorizedPayment.id, { speed: 'normal' });
          }
        }
        await client.query(
          "UPDATE payment_preauth SET status = 'voided', voided_at = NOW() WHERE id = $1",
          [row.preauth_id]
        );
        await client.query(
          "UPDATE orders SET status = 'cancelled' WHERE id = $1",
          [row.order_id]
        );
      } catch (payErr) {
        console.error(`Failed to void payment hold for order ${row.order_id}:`, payErr.message);
        // Do not rollback; flag for admin manual review, proceed with canceling others
      }
      
      // Notify member of cancellation
      await sendWhatsApp(row.phone, 'group_cancelled', [], row.user_id);
    }

    // Set group status to cancelled
    await client.query(
      "UPDATE groups SET status = 'cancelled' WHERE id = $1",
      [id]
    );

    // Delete Redis timer
    await redisClient.del(`group:${id}:timer`);

    await client.query('COMMIT');
    return res.status(200).json({ message: 'Group cancelled and payment holds released successfully.' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in cancelGroup:', error.message);
    return res.status(500).json({ error: 'Server error cancelling group' });
  } finally {
    client.release();
  }
};

/**
 * BE-19: Admin Force Complete Group
 */
export const forceCompleteGroup = async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.id;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const groupRes = await client.query('SELECT * FROM groups WHERE id = $1 FOR UPDATE', [id]);
    const group = groupRes.rows[0];

    if (!group) {
      return res.status(404).json({ error: 'Group buy deal not found' });
    }
    if (group.status !== 'active') {
      return res.status(400).json({ error: `Cannot force complete. Group status is ${group.status}.` });
    }

    // Capture payment and confirm orders regardless of size
    await completeGroupInternal(id, client);

    // Audit log admin action
    console.log(`[AUDIT TRAIL] Admin ID: ${adminId} force completed Group ID: ${id} at ${new Date().toISOString()}`);

    await client.query('COMMIT');
    return res.status(200).json({ message: 'Group manually forced to complete successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error force completing group:', error.message);
    return res.status(500).json({ error: 'Server error force completing group' });
  } finally {
    client.release();
  }
};

/**
 * Public: Query active groups for a product
 */
export const getActiveGroups = async (req, res) => {
  const { product_id } = req.query;
  if (!product_id) {
    return res.status(400).json({ error: 'Product ID query parameter is required' });
  }
  try {
    const query = `
      SELECT g.*, u.name as creator_name,
             (g.target_size - g.current_size) as slots_remaining
      FROM groups g
      JOIN users u ON g.creator_id = u.id
      WHERE g.product_id = $1 AND g.status = 'active' AND g.timer_end > NOW()
      ORDER BY g.created_at DESC
    `;
    const result = await pool.query(query, [product_id]);
    return res.status(200).json({ groups: result.rows });
  } catch (error) {
    console.error('Error fetching active groups:', error.message);
    return res.status(500).json({ error: 'Server error fetching active groups' });
  }
};

