import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { pool, redisClient } from '../config/db.js';
import { sendWhatsApp } from '../utils/whatsapp.js';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeychangeinprod';

/**
 * BE-01: Send OTP to User Phone
 */
export const sendOtp = async (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  // Format validation for Indian phone numbers (+91 prefix)
  const phoneRegex = /^\+91[6-9]\d{9}$/;
  if (!phoneRegex.test(phone)) {
    return res.status(400).json({ error: 'Invalid phone number format. Must start with +91' });
  }

  try {
    const rateLimitKey = `rate:${phone}`;
    const otpKey = `otp:${phone}`;

    // Rate limiting: Max 3 requests per phone per 10 mins
    const count = await redisClient.get(rateLimitKey);
    if (count && parseInt(count) >= 3) {
      return res.status(429).json({ error: 'Too many OTP requests. Try again after 10 minutes.' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store in Redis (10 minutes expiry)
    await redisClient.set(otpKey, otp, { EX: 600 });

    // Increment rate limit counter
    if (!count) {
      await redisClient.set(rateLimitKey, '1', { EX: 600 });
    } else {
      const ttl = await redisClient.expire(rateLimitKey, 600); // refresh TTL or keep original? Keeping original is standard
      await redisClient.set(rateLimitKey, (parseInt(count) + 1).toString(), { EX: 600 });
    }

    // Send SMS via Twilio/Meta (represented as WhatsApp/SMS)
    console.log(`[OTP GENERATED] Phone: ${phone} | OTP: ${otp}`);
    await sendWhatsApp(phone, 'otp_template', [otp]);

    const response = { message: 'OTP sent' };
    if (process.env.NODE_ENV !== 'production') {
      response.otp = otp; // Expose OTP for frontend testing convenience in development
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error in sendOtp:', error.message);
    return res.status(500).json({ error: 'Server error sending OTP' });
  }
};

/**
 * BE-02: Verify OTP and Issue JWT
 */
export const verifyOtp = async (req, res) => {
  const { phone, otp, name } = req.body;
  if (!phone || !otp) {
    return res.status(400).json({ error: 'Phone and OTP are required' });
  }

  try {
    const otpKey = `otp:${phone}`;
    const storedOtp = await redisClient.get(otpKey);

    if (!storedOtp) {
      return res.status(400).json({ error: 'OTP expired or not requested' });
    }

    if (storedOtp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // OTP Verified! Remove from Redis
    await redisClient.del(otpKey);

    // Check if user exists in database
    let userResult = await pool.query('SELECT * FROM users WHERE phone = $1', [phone]);
    let user = userResult.rows[0];

    // If user does not exist, create a new record (Auto-Register)
    if (!user) {
      const defaultName = (name && name.trim() !== '') ? name.trim() : `User_${phone.slice(-4)}`;
      const newUserResult = await pool.query(
        'INSERT INTO users (name, phone, role, is_verified) VALUES ($1, $2, $3, $4) RETURNING *',
        [defaultName, phone, 'user', true]
      );
      user = newUserResult.rows[0];
      console.log(`[AUTO-REGISTERED] New User: ${user.name} | Phone: ${user.phone}`);
    } else {
      let shouldUpdate = false;
      let newName = user.name;
      
      if (!user.is_verified) shouldUpdate = true;
      if (name && name.trim() !== '' && user.name.startsWith('User_')) {
        newName = name.trim();
        shouldUpdate = true;
      }

      if (shouldUpdate) {
        const updatedUser = await pool.query(
          'UPDATE users SET is_verified = true, name = $1 WHERE id = $2 RETURNING *',
          [newName, user.id]
        );
        user = updatedUser.rows[0];
      }
    }

    // Issue JWT token (7 days expiry)
    const token = jwt.sign(
      { id: user.id, role: user.role, phone: user.phone },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error in verifyOtp:', error.message);
    return res.status(500).json({ error: 'Server error verifying OTP' });
  }
};

/**
 * BE-04: Get Profile (Protected)
 */
export const getProfile = async (req, res) => {
  try {
    const userResult = await pool.query(
      'SELECT id, name, email, phone, role, is_verified, fcm_token, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    const user = userResult.rows[0];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.status(200).json({ user });
  } catch (error) {
    console.error('Error in getProfile:', error.message);
    return res.status(500).json({ error: 'Server error fetching profile' });
  }
};

/**
 * BE-04: Update Profile (Protected)
 */
export const updateProfile = async (req, res) => {
  const { name, email, fcm_token } = req.body;

  try {
    let updateFields = [];
    let queryParams = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updateFields.push(`name = $${paramIndex}`);
      queryParams.push(name);
      paramIndex++;
    }

    if (email !== undefined) {
      updateFields.push(`email = $${paramIndex}`);
      queryParams.push(email);
      paramIndex++;
    }

    if (fcm_token !== undefined) {
      updateFields.push(`fcm_token = $${paramIndex}`);
      queryParams.push(fcm_token);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    queryParams.push(req.user.id);
    const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING id, name, email, phone, role, fcm_token`;
    
    const result = await pool.query(query, queryParams);
    return res.status(200).json({
      message: 'Profile updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error in updateProfile:', error.message);
    // Handle uniqueness constraint violations for email
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    return res.status(500).json({ error: 'Server error updating profile' });
  }
};

/**
 * BE-05: Fetch Buyer Order History
 */
export const getBuyerOrders = async (req, res) => {
  const buyerId = req.user.id;
  try {
    const query = `
      SELECT o.*, p.name as product_name, p.sku as product_sku, p.images as product_images,
             g.status as group_status, g.target_size, g.current_size
      FROM orders o
      JOIN products p ON o.product_id = p.id
      LEFT JOIN groups g ON o.group_id = g.id
      WHERE o.buyer_id = $1
      ORDER BY o.created_at DESC
    `;
    const result = await pool.query(query, [buyerId]);
    return res.status(200).json({ orders: result.rows });
  } catch (error) {
    console.error('Error fetching buyer orders:', error.message);
    return res.status(500).json({ error: 'Server error fetching orders' });
  }
};

/**
 * Simulated/Mock Google SSO Authentication
 */
export const googleSso = async (req, res) => {
  const { email, name, google_id } = req.body;
  if (!email || !name) {
    return res.status(400).json({ error: 'Email and Name are required for Google SSO' });
  }

  try {
    // 1. Check if user already exists with this email
    let userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    let user = userResult.rows[0];

    if (!user) {
      // 2. If user doesn't exist, create a new record.
      // Since phone is UNIQUE NOT NULL, generate a unique 10-digit placeholder suffix
      const timestampPart = Date.now().toString().slice(-9); // last 9 digits
      const placeholderPhone = `+919${timestampPart}`;
      
      const insertQuery = `
        INSERT INTO users (name, email, phone, role, is_verified)
        VALUES ($1, $2, $3, 'user', true)
        RETURNING *
      `;
      const newUserResult = await pool.query(insertQuery, [name, email, placeholderPhone]);
      user = newUserResult.rows[0];
      console.log(`[GOOGLE-SSO REGISTERED] New User: ${user.name} | Email: ${user.email} | Phone Placeholder: ${user.phone}`);
    }

    // 3. Issue JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role, phone: user.phone },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error in googleSso:', error.message);
    return res.status(500).json({ error: 'Server error processing Google SSO' });
  }
};

/**
 * Register User with Email and Password
 */
export const register = async (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !phone || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Format validation for Indian phone numbers (+91 prefix)
  const phoneRegex = /^\+91[6-9]\d{9}$/;
  let formattedPhone = phone.trim();
  if (!phoneRegex.test(formattedPhone)) {
    if (formattedPhone.length === 10 && !formattedPhone.startsWith('+91')) {
      formattedPhone = `+91${formattedPhone}`;
    } else {
      return res.status(400).json({ error: 'Invalid phone format. Must be a valid 10-digit number' });
    }
  }

  try {
    // Check if email already exists
    const emailCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email.trim().toLowerCase()]);
    if (emailCheck.rowCount > 0) {
      return res.status(400).json({ error: 'Email address is already registered' });
    }

    // Check if phone already exists
    const phoneCheck = await pool.query('SELECT id FROM users WHERE phone = $1', [formattedPhone]);
    if (phoneCheck.rowCount > 0) {
      return res.status(400).json({ error: 'Phone number is already registered' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user
    const insertQuery = `
      INSERT INTO users (name, email, phone, password_hash, role, is_verified)
      VALUES ($1, $2, $3, $4, 'user', true)
      RETURNING id, name, email, phone, role
    `;
    const result = await pool.query(insertQuery, [
      name.trim(),
      email.trim().toLowerCase(),
      formattedPhone,
      passwordHash
    ]);
    const user = result.rows[0];

    // Issue JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role, phone: user.phone },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      token,
      user
    });
  } catch (error) {
    console.error('Error in register:', error.message);
    return res.status(500).json({ error: 'Server error registering account' });
  }
};

/**
 * Login User with Email and Password
 */
export const loginWithPassword = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email.trim().toLowerCase()]);
    const user = userResult.rows[0];

    if (!user || !user.password_hash) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Issue JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role, phone: user.phone },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error in loginWithPassword:', error.message);
    return res.status(500).json({ error: 'Server error signing in' });
  }
};

/**
 * Forgot Password - Send Code
 */
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email address is required' });
  }

  try {
    const userResult = await pool.query('SELECT id, name FROM users WHERE email = $1', [email.trim().toLowerCase()]);
    if (userResult.rowCount === 0) {
      return res.status(404).json({ error: 'Account not found with this email' });
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const redisKey = `reset:${email.trim().toLowerCase()}`;

    // Store reset code in Redis for 10 minutes
    await redisClient.set(redisKey, resetCode, { EX: 600 });

    console.log(`[PASSWORD RESET CODE] Email: ${email} | Code: ${resetCode}`);

    const response = { message: 'Password reset code has been sent' };
    if (process.env.NODE_ENV !== 'production') {
      response.code = resetCode; // Expose code in dev mode for toast/logs testing convenience
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error in forgotPassword:', error.message);
    return res.status(500).json({ error: 'Server error requesting password reset' });
  }
};

/**
 * Reset Password - Verify Code and Save New Password
 */
export const resetPassword = async (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) {
    return res.status(400).json({ error: 'Email, code, and new password are required' });
  }

  try {
    const redisKey = `reset:${email.trim().toLowerCase()}`;
    const storedCode = await redisClient.get(redisKey);

    if (!storedCode || storedCode !== code.trim()) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update password_hash in DB
    await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2', [passwordHash, email.trim().toLowerCase()]);

    // Delete reset code from Redis
    await redisClient.del(redisKey);

    return res.status(200).json({ message: 'Password reset successfully. You can now login.' });
  } catch (error) {
    console.error('Error in resetPassword:', error.message);
    return res.status(500).json({ error: 'Server error resetting password' });
  }
};


/**
 * Register Seller (Combined User & Seller Profile)
 */
export const sellerSignup = async (req, res) => {
  const { 
    name, email, phone, password, 
    business_name, business_type, gstin, pan_number, aadhar_number, business_address, bank_account, ifsc, kyc_document_url,
    pickup_name, pickup_phone, pickup_address, pickup_city, pickup_state, pickup_pincode, pickup_country
  } = req.body;

  if (!name || !email || !phone || !password || !business_name || !pan_number || !aadhar_number) {
    return res.status(400).json({ error: 'Required fields missing for seller signup' });
  }

  // Fallback pickup values to user/business values if not explicitly separated
  const finalPickupName = pickup_name || name;
  const finalPickupPhone = (pickup_phone || phone).replace(/[^0-9]/g, '').slice(-10);
  const finalPickupAddress = pickup_address || business_address;
  const finalPickupCity = pickup_city || 'City';
  const finalPickupState = pickup_state || 'State';
  const finalPickupPincode = pickup_pincode || '110001';
  const finalPickupCountry = pickup_country || 'India';

  // Format validation for Indian phone numbers (+91 prefix)
  const phoneRegex = /^\+91[6-9]\d{9}$/;
  let formattedPhone = phone.trim();
  if (!phoneRegex.test(formattedPhone)) {
    if (formattedPhone.length === 10 && !formattedPhone.startsWith('+91')) {
      formattedPhone = `+91${formattedPhone}`;
    } else {
      return res.status(400).json({ error: 'Invalid phone format. Must be a valid 10-digit number' });
    }
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Check if email already exists
    const emailCheck = await client.query('SELECT id FROM users WHERE email = $1', [email.trim().toLowerCase()]);
    if (emailCheck.rowCount > 0) {
      throw new Error('Email address is already registered');
    }

    // Check if phone already exists
    const phoneCheck = await client.query('SELECT id FROM users WHERE phone = $1', [formattedPhone]);
    if (phoneCheck.rowCount > 0) {
      throw new Error('Phone number is already registered');
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user (they start as 'user', become 'seller' when admin approves, or we can make them 'user' and use the seller_profiles table to know they are a seller applicant)
    const insertUserQuery = `
      INSERT INTO users (name, email, phone, password_hash, role, is_verified)
      VALUES ($1, $2, $3, $4, 'user', true)
      RETURNING id, name, email, phone, role
    `;
    const userResult = await client.query(insertUserQuery, [
      name.trim(),
      email.trim().toLowerCase(),
      formattedPhone,
      passwordHash
    ]);
    const user = userResult.rows[0];

    // Insert seller profile with pickup address
    const insertSellerQuery = `
      INSERT INTO seller_profiles 
      (user_id, business_name, business_type, business_address, gstin, pan_number, aadhar_number, kyc_document_url, bank_account, ifsc, 
       pickup_name, pickup_phone, pickup_address, pickup_city, pickup_state, pickup_pincode, pickup_country, is_approved)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, false)
    `;
    await client.query(insertSellerQuery, [
      user.id, business_name, business_type, business_address, gstin, pan_number, aadhar_number, kyc_document_url, bank_account, ifsc,
      finalPickupName, finalPickupPhone, finalPickupAddress, finalPickupCity, finalPickupState, finalPickupPincode, finalPickupCountry
    ]);

    await client.query('COMMIT');

    // Issue JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role, phone: user.phone },
      process.env.JWT_SECRET || 'supersecretjwtkeychangeinprod',
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      token,
      user
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in sellerSignup:', error.message);
    if (error.message === 'Email address is already registered' || error.message === 'Phone number is already registered') {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Server error registering seller account' });
  } finally {
    client.release();
  }
};

/**
 * Change Password (Protected)
 */
export const changePassword = async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new passwords are required' });
  }

  try {
    const userRes = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    const user = userRes.rows[0];

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.password_hash) {
      return res.status(400).json({ error: 'Password not set. Cannot change.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect current password' });
    }

    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newPasswordHash, userId]);

    return res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error in changePassword:', error.message);
    return res.status(500).json({ error: 'Server error updating password' });
  }
};

/**
 * Delete Account (Protected - Only Seller/Customer)
 * Soft-delete implementation for referential integrity.
 */
export const deleteAccount = async (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;

  if (role === 'admin') {
    return res.status(403).json({ error: 'Admin accounts cannot be deleted to prevent system lockout.' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    
    // Anonymize user logic (Soft delete)
    const deletedEmail = `deleted_${userId}@slabofy.com`;
    const deletedPhone = `+91000${userId.toString().padStart(7, '0')}`;
    
    const updateUserQuery = `
      UPDATE users 
      SET name = 'Deleted User', email = $1, phone = $2, password_hash = NULL, is_verified = false, fcm_token = NULL 
      WHERE id = $3
    `;
    await client.query(updateUserQuery, [deletedEmail, deletedPhone, userId]);

    if (role === 'seller') {
      // Mark seller profile as inactive/unapproved and anonymize if needed
      await client.query('UPDATE seller_profiles SET is_approved = false, business_name = $1, gstin = NULL, pan_number = NULL, aadhar_number = NULL, bank_account = NULL WHERE user_id = $2', [`Deleted Business ${userId}`, userId]);
      // Deactivate all products belonging to this seller
      await client.query("UPDATE products SET status = 'rejected' WHERE seller_id = $1", [userId]);
    }

    await client.query('COMMIT');
    return res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in deleteAccount:', error.message);
    return res.status(500).json({ error: 'Server error deleting account' });
  } finally {
    client.release();
  }
};
