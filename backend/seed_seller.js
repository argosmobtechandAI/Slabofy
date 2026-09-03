import bcrypt from 'bcryptjs';
import { pool } from './src/config/db.js';

async function seedTestSeller() {
  console.log('🔧 Creating dedicated test seller account...\n');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const email = 'seller@slabofy.com';
    const password = 'Seller@12345';
    const phone = '+919811223344';
    const name = 'Slabofy Demo Merchant';

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 1. Check or Insert User
    let userRes = await client.query('SELECT * FROM users WHERE email = $1', [email]);
    let userId;

    if (userRes.rowCount > 0) {
      userId = userRes.rows[0].id;
      await client.query(`
        UPDATE users 
        SET name = $1, phone = $2, password_hash = $3, role = 'seller', is_verified = true
        WHERE id = $4
      `, [name, phone, passwordHash, userId]);
      console.log(`✅ Updated existing user record (ID: ${userId}) to role='seller' with new password.`);
    } else {
      // Also ensure phone doesn't conflict
      await client.query('DELETE FROM users WHERE phone = $1', [phone]);

      const newUserRes = await client.query(`
        INSERT INTO users (name, email, phone, password_hash, role, is_verified)
        VALUES ($1, $2, $3, $4, 'seller', true)
        RETURNING id
      `, [name, email, phone, passwordHash]);
      userId = newUserRes.rows[0].id;
      console.log(`✅ Created new user record (ID: ${userId}) with role='seller'.`);
    }

    // 2. Check or Insert Seller Profile
    const profileRes = await client.query('SELECT * FROM seller_profiles WHERE user_id = $1', [userId]);

    if (profileRes.rowCount > 0) {
      await client.query(`
        UPDATE seller_profiles
        SET business_name = $1, business_type = $2, business_address = $3, gstin = $4,
            bank_account = $5, ifsc = $6, pickup_name = $7, pickup_phone = $8,
            pickup_address = $9, pickup_city = $10, pickup_state = $11, pickup_pincode = $12,
            is_approved = true
        WHERE user_id = $13
      `, [
        'Slabofy Official Store',
        'Private Limited',
        'DLF Cyber City, Tower B, 5th Floor, Gurugram, Haryana',
        '06AAACS1234A1Z1',
        '50200012345678',
        'HDFC0000240',
        'Slabofy Central Hub',
        phone,
        'DLF Cyber City, Tower B, 5th Floor',
        'Gurugram',
        'Haryana',
        '122002',
        userId
      ]);
      console.log('✅ Updated and approved seller profile.');
    } else {
      await client.query(`
        INSERT INTO seller_profiles (
          user_id, business_name, business_type, business_address, gstin,
          bank_account, ifsc, pickup_name, pickup_phone, pickup_address,
          pickup_city, pickup_state, pickup_pincode, is_approved
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true)
      `, [
        userId,
        'Slabofy Official Store',
        'Private Limited',
        'DLF Cyber City, Tower B, 5th Floor, Gurugram, Haryana',
        '06AAACS1234A1Z1',
        '50200012345678',
        'HDFC0000240',
        'Slabofy Central Hub',
        phone,
        'DLF Cyber City, Tower B, 5th Floor',
        'Gurugram',
        'Haryana',
        '122002'
      ]);
      console.log('✅ Created and approved new seller profile.');
    }

    // 3. Ensure category exists
    let catRes = await client.query('SELECT id FROM categories LIMIT 1');
    let categoryId = catRes.rows[0]?.id || 1;

    // 4. Create sample products with flexible variants for this seller if none exist
    const prodRes = await client.query('SELECT id FROM products WHERE seller_id = $1', [userId]);
    if (prodRes.rowCount === 0) {
      // Product 1: Clothing with waist and size variants
      const p1Res = await client.query(`
        INSERT INTO products (
          seller_id, category_id, name, sku, description, images, stock, status,
          weight_kg, length_cm, breadth_cm, height_cm, max_group_size, group_window_hours
        ) VALUES (
          $1, $2,
          'Classic Slim Denim Jeans',
          'SLAB-DENIM-01',
          'Premium stretch denim jeans with modern fit and breathable fabric.',
          '["https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&auto=format&fit=crop&q=80"]'::json,
          120, 'active', 0.6, 30, 20, 5, 5, 24
        ) RETURNING id
      `, [userId, categoryId]);
      const p1Id = p1Res.rows[0].id;

      // Tiers
      await client.query(`
        INSERT INTO product_tiers (product_id, group_size, price) VALUES
        ($1, 1, 1499.00),
        ($1, 3, 1199.00),
        ($1, 5, 999.00)
      `, [p1Id]);

      // Waist variants
      await client.query(`
        INSERT INTO product_variants (product_id, color, size, stock) VALUES
        ($1, 'Deep Indigo', '30in', 30),
        ($1, 'Deep Indigo', '32in', 40),
        ($1, 'Deep Indigo', '34in', 30),
        ($1, 'Washed Black', '32in', 20)
      `, [p1Id]);

      // Product 2: Liquid Volume (Coconut Oil / Skincare)
      const p2Res = await client.query(`
        INSERT INTO products (
          seller_id, category_id, name, sku, description, images, stock, status,
          weight_kg, length_cm, breadth_cm, height_cm, max_group_size, group_window_hours
        ) VALUES (
          $1, $2,
          'Pure Organic Cold-Pressed Almond Oil',
          'SLAB-ALMOND-02',
          '100% natural, sweet almond oil for skin nourishing, hair wellness and body massage.',
          '["https://images.unsplash.com/photo-1608248597359-38317769941a?w=600&auto=format&fit=crop&q=80"]'::json,
          85, 'active', 0.5, 15, 10, 10, 4, 24
        ) RETURNING id
      `, [userId, categoryId]);
      const p2Id = p2Res.rows[0].id;

      await client.query(`
        INSERT INTO product_tiers (product_id, group_size, price) VALUES
        ($1, 1, 699.00),
        ($1, 2, 549.00),
        ($1, 4, 449.00)
      `, [p2Id]);

      await client.query(`
        INSERT INTO product_variants (product_id, color, size, stock) VALUES
        ($1, 'Amber Bottle', '100mL', 30),
        ($1, 'Amber Bottle', '250mL', 35),
        ($1, 'Amber Bottle', '500mL', 20)
      `, [p2Id]);

      console.log('✅ Created 2 demo products with waist sizes and liquid volume variants.');
    }

    // 5. Create a sample support ticket if none exist
    const ticketRes = await client.query('SELECT id FROM support_tickets WHERE seller_id = $1', [userId]);
    if (ticketRes.rowCount === 0) {
      await client.query(`
        INSERT INTO support_tickets (
          seller_id, category, subject, description, status, admin_note
        ) VALUES (
          $1, 'shiprocket_delivery',
          'Pickup timing coordination for evening slots',
          'Hello team, can our scheduled courier pickup window be moved to 4 PM - 7 PM?',
          'in_progress',
          'Hi Slabofy Official Store! We have coordinated with our Shiprocket account manager. Evening slots are active.'
        )
      `, [userId]);
      console.log('✅ Created sample support ticket.');
    }

    await client.query('COMMIT');

    console.log('\n=============================================');
    console.log('🎉 SELLER TEST ACCOUNT CREATED & VERIFIED!');
    console.log('=============================================');
    console.log(`👤 Name:     ${name}`);
    console.log(`📧 Email:    ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`📱 Phone:    ${phone}`);
    console.log(`🏢 Store:    Slabofy Official Store`);
    console.log(`🌐 Login URL: http://localhost:5173/seller/login`);
    console.log(`📊 Panel URL: http://localhost:5173/seller`);
    console.log('=============================================\n');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating seller account:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

seedTestSeller();
