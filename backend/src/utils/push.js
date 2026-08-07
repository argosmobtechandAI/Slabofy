import axios from 'axios';
import { pool } from '../config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const FCM_SERVER_KEY = process.env.FCM_SERVER_KEY;

/**
 * Sends a Firebase FCM push notification to a specific user
 * Logs status in notification_log table
 */
export const sendPush = async (userId, title, body, data = {}) => {
  let status = 'sent';
  let token = null;

  // 1. Fetch user FCM token from DB
  try {
    const res = await pool.query('SELECT fcm_token FROM users WHERE id = $1', [userId]);
    token = res.rows[0]?.fcm_token;
  } catch (error) {
    console.error('Error fetching user token from DB:', error.message);
  }

  if (!token) {
    console.log(`[PUSH MOCK SEND] User ID: ${userId} (No FCM Token registered) | Title: "${title}" | Body: "${body}"`);
    status = 'failed';
  } else if (!FCM_SERVER_KEY || FCM_SERVER_KEY.includes('YOUR') || FCM_SERVER_KEY.includes('key')) {
    console.log(`[PUSH MOCK SEND] To Token: ${token} | Title: "${title}" | Body: "${body}"`);
  } else {
    try {
      const url = 'https://fcm.googleapis.com/fcm/send';
      await axios.post(
        url,
        {
          to: token,
          notification: { title, body },
          data
        },
        {
          headers: {
            Authorization: `key=${FCM_SERVER_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log(`[PUSH FCM API] Push notification sent to User ${userId}`);
    } catch (error) {
      console.error(`[PUSH FCM API Error] Failed for User ${userId}:`, error.message);
      status = 'failed';
    }
  }

  // 2. Log notification in DB
  try {
    await pool.query(
      'INSERT INTO notification_log (user_id, type, channel, payload, status) VALUES ($1, $2, $3, $4, $5)',
      [userId, 'push_notification', 'push', JSON.stringify({ token, title, body, data }), status]
    );
  } catch (dbErr) {
    console.error('Failed to log Push notification in DB:', dbErr.message);
  }

  return status === 'sent';
};
