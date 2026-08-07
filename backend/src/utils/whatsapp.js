import axios from 'axios';
import { pool } from '../config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

/**
 * Sends a WhatsApp notification using Meta's Cloud API
 * Falls back to console logger if credentials are not provided
 * Logs status in notification_log table
 */
export const sendWhatsApp = async (phone, templateName, params = [], userId = null) => {
  const payload = {
    messaging_product: 'whatsapp',
    to: phone,
    type: 'template',
    template: {
      name: templateName,
      language: { code: 'en_US' },
      components: [
        {
          type: 'body',
          parameters: params.map((param) => ({ type: 'text', text: String(param) }))
        }
      ]
    }
  };

  let status = 'sent';
  
  if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID || WHATSAPP_TOKEN.includes('YOUR') || WHATSAPP_TOKEN.includes('token')) {
    console.log(`[WHATSAPP MOCK SEND] To: ${phone} | Template: ${templateName} | Params: [${params.join(', ')}]`);
  } else {
    try {
      const url = `https://graph.facebook.com/v17.0/${PHONE_NUMBER_ID}/messages`;
      await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      console.log(`[WHATSAPP Meta API] Sent successfully to ${phone}`);
    } catch (error) {
      console.error(`[WHATSAPP Meta API Error] failed for ${phone}:`, error.response?.data || error.message);
      status = 'failed';
    }
  }

  // Log in PostgreSQL
  try {
    await pool.query(
      'INSERT INTO notification_log (user_id, type, channel, payload, status) VALUES ($1, $2, $3, $4, $5)',
      [userId, templateName, 'whatsapp', JSON.stringify({ phone, params }), status]
    );
  } catch (dbErr) {
    console.error('Failed to log WhatsApp notification in DB:', dbErr.message);
  }

  return status === 'sent';
};
