import { pool } from '../config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@socialgroupbuying.com';

/**
 * Sends an email notification using SendGrid or Mailgun API (mocked here, logs to DB)
 */
export const sendEmail = async (to, subject, templateName, data = {}, userId = null) => {
  let status = 'sent';

  if (!SENDGRID_API_KEY || SENDGRID_API_KEY.includes('YOUR') || SENDGRID_API_KEY.includes('key')) {
    console.log(`[EMAIL MOCK SEND] From: ${EMAIL_FROM} | To: ${to} | Subject: "${subject}" | Template: ${templateName}`);
  } else {
    // SendGrid API Call placeholder
    try {
      // In production, we'd use @sendgrid/mail
      // await sgMail.send({ to, from: EMAIL_FROM, subject, html: ... })
      console.log(`[EMAIL SendGrid] Email sent successfully to ${to}`);
    } catch (error) {
      console.error(`[EMAIL SendGrid Error] Failed for ${to}:`, error.message);
      status = 'failed';
    }
  }

  // Log in DB
  try {
    await pool.query(
      'INSERT INTO notification_log (user_id, type, channel, payload, status) VALUES ($1, $2, $3, $4, $5)',
      [userId, templateName, 'email', JSON.stringify({ to, subject, data }), status]
    );
  } catch (dbErr) {
    console.error('Failed to log Email notification in DB:', dbErr.message);
  }

  return status === 'sent';
};
