import cron from 'node-cron';
import { pool, redisClient } from '../config/db.js';
import { sendWhatsApp } from '../utils/whatsapp.js';
import { sendPush } from '../utils/push.js';
import Razorpay from 'razorpay';
import dotenv from 'dotenv';

dotenv.config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_mockkey',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'mocksecret'
});

const isRazorpayMock = !process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID.includes('YOURKEY');

/**
 * BE-18: Group Expiry Cron Job
 * Runs every 5 minutes to scan and invalidate expired groups
 */
export const initExpiryCron = () => {
  // '*/5 * * * *' = Every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    console.log('[CRON EXPIRE CHECK] Checking for expired groups at:', new Date().toISOString());

    const client = await pool.connect();
    try {
      // 1. Fetch all expired active groups
      const expiredRes = await client.query(
        "SELECT id, product_id, creator_id FROM groups WHERE status = 'active' AND timer_end < NOW()"
      );
      const expiredGroups = expiredRes.rows;

      if (expiredGroups.length === 0) {
        return;
      }

      console.log(`[CRON EXPIRE CHECK] Found ${expiredGroups.length} expired groups to process.`);

      for (const group of expiredGroups) {
        await client.query('BEGIN');

        // Update group status to expired
        await client.query(
          "UPDATE groups SET status = 'expired' WHERE id = $1",
          [group.id]
        );

        // Delete Redis timer countdown key
        await redisClient.del(`group:${group.id}:timer`);

        // Fetch members of this expired group who have pre-auth orders
        const membersQuery = `
          SELECT o.id as order_id, o.buyer_id, o.total_amount, u.phone, u.name,
                 pa.id as preauth_id, pa.razorpay_order_id, o.is_cod
          FROM orders o
          JOIN users u ON o.buyer_id = u.id
          LEFT JOIN payment_preauth pa ON pa.order_id = o.id
          WHERE o.group_id = $1 AND o.status = 'pending'
        `;
        const membersRes = await client.query(membersQuery, [group.id]);

        for (const member of membersRes.rows) {
          // Void payment holds
          if (!member.is_cod && member.razorpay_order_id) {
            try {
              if (isRazorpayMock) {
                console.log(`[CRON MOCK VOID] Voided pre-auth hold for Order: ${member.razorpay_order_id}`);
              } else {
                const paymentsRes = await razorpay.orders.fetchPayments(member.razorpay_order_id);
                const authPayment = paymentsRes.items.find(p => p.status === 'authorized');
                if (authPayment) {
                  await razorpay.payments.refund(authPayment.id, { speed: 'normal' });
                }
              }
              await client.query(
                "UPDATE payment_preauth SET status = 'voided', voided_at = NOW() WHERE id = $1",
                [member.preauth_id]
              );
            } catch (payErr) {
              console.error(`[CRON VOID FAIL] Failed to void payment for Order ${member.order_id}:`, payErr.message);
              // Log warning but continue processing other members and cancel order
            }
          }

          // Cancel order record
          await client.query(
            "UPDATE orders SET status = 'cancelled' WHERE id = $1",
            [member.order_id]
          );

          // Send push & SMS/WhatsApp notification
          try {
            await sendPush(member.buyer_id, 'Deal Expired', 'The group buying deal did not complete. Payment holds released.');
            await sendWhatsApp(member.phone, 'group_expired', [], member.buyer_id);
          } catch (notifErr) {
            console.error('Failed sending notifications for group expiry:', notifErr.message);
          }
        }

        await client.query('COMMIT');
        console.log(`[CRON EXPIRE SUCCESS] Expired and voided holds for Group ID: ${group.id}`);
      }
    } catch (error) {
      console.error('[CRON EXPIRE CHECK ERROR]:', error.message);
    } finally {
      client.release();
    }
  });
};
