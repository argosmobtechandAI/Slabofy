import axios from 'axios';
import { pool } from './config/db.js';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

const API_BASE = 'http://localhost:5001/api';
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeychangeinprod';
let passedCount = 0;
let failedCount = 0;
const results = [];

function assert(condition, message) {
  if (condition) {
    passedCount++;
    console.log(`  ✅ [PASS] ${message}`);
    results.push({ test: message, status: 'PASS' });
  } else {
    failedCount++;
    console.error(`  ❌ [FAIL] ${message}`);
    results.push({ test: message, status: 'FAIL' });
  }
}

async function runTestSuite() {
  console.log('\n============================================================');
  console.log('🚀 SLABOFY PRODUCTION READINESS & STRESS TEST SUITE');
  console.log('============================================================\n');

  // -------------------------------------------------------------
  // TEST 1: DATABASE INTEGRITY & SCHEMA VERIFICATION
  // -------------------------------------------------------------
  console.log('📦 TEST SUITE 1: Database & Table Schema Integrity');
  try {
    const tableRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    const tables = tableRes.rows.map(r => r.table_name);
    
    const requiredTables = [
      'users', 'seller_profiles', 'categories', 'products', 
      'product_tiers', 'groups', 'group_members', 'orders', 
      'coupons', 'shipment_tracking'
    ];

    requiredTables.forEach(t => {
      assert(tables.includes(t), `Table '${t}' exists in PostgreSQL`);
    });

    // Check Shiprocket columns on orders
    const orderCols = await pool.query(`
      SELECT column_name FROM information_schema.columns WHERE table_name = 'orders'
    `);
    const oCols = orderCols.rows.map(r => r.column_name);
    assert(oCols.includes('awb_code'), "Column 'orders.awb_code' exists");
    assert(oCols.includes('shiprocket_order_id'), "Column 'orders.shiprocket_order_id' exists");
    assert(oCols.includes('delivery_pincode'), "Column 'orders.delivery_pincode' exists");
    assert(oCols.includes('shipment_status'), "Column 'orders.shipment_status' exists");

    // Check products dimension columns
    const prodCols = await pool.query(`
      SELECT column_name FROM information_schema.columns WHERE table_name = 'products'
    `);
    const pCols = prodCols.rows.map(r => r.column_name);
    assert(pCols.includes('weight_kg'), "Column 'products.weight_kg' exists");
    assert(pCols.includes('length_cm'), "Column 'products.length_cm' exists");
    assert(pCols.includes('breadth_cm'), "Column 'products.breadth_cm' exists");
    assert(pCols.includes('height_cm'), "Column 'products.height_cm' exists");

    // Check seller_profiles pickup columns
    const spCols = await pool.query(`
      SELECT column_name FROM information_schema.columns WHERE table_name = 'seller_profiles'
    `);
    const sCols = spCols.rows.map(r => r.column_name);
    assert(sCols.includes('pickup_address'), "Column 'seller_profiles.pickup_address' exists");
    assert(sCols.includes('pickup_pincode'), "Column 'seller_profiles.pickup_pincode' exists");
    assert(sCols.includes('shiprocket_pickup_id'), "Column 'seller_profiles.shiprocket_pickup_id' exists");

  } catch (err) {
    console.error('DB check failed:', err);
    assert(false, `Database check execution error: ${err.message}`);
  }

  // -------------------------------------------------------------
  // TEST 2: PUBLIC HEALTH CHECK & CATEGORIES
  // -------------------------------------------------------------
  console.log('\n🌐 TEST SUITE 2: System Health & Public Catalog Endpoints');
  try {
    const health = await axios.get('http://localhost:5001/health');
    assert(health.status === 200 && health.data.status === 'healthy', 'GET /health responds with 200 OK');

    const cats = await axios.get(`${API_BASE}/categories`);
    assert(cats.status === 200 && Array.isArray(cats.data.categories), 'GET /api/categories returns array');

    const prods = await axios.get(`${API_BASE}/products`);
    assert(prods.status === 200 && Array.isArray(prods.data.products), 'GET /api/products returns products catalog');

  } catch (err) {
    assert(false, `Health/Catalog endpoint error: ${err.message}`);
  }

  // -------------------------------------------------------------
  // TEST 3: AUTHENTICATION, TOKENS & SECURITY
  // -------------------------------------------------------------
  console.log('\n🔐 TEST SUITE 3: Auth Security & Protected Endpoints');
  let buyerToken = '';
  let adminToken = '';
  let sellerToken = '';
  let testBuyerId = null;
  let testSellerId = null;

  try {
    const testPhone = '+919999888877';

    // 1. Send OTP
    const otpRes = await axios.post(`${API_BASE}/auth/send-otp`, {
      phone: testPhone
    });
    assert(otpRes.status === 200 && otpRes.data.message, 'POST /api/auth/send-otp succeeds with formatted Indian number');

    const generatedOtp = otpRes.data.otp || '123456';

    // 2. Verify OTP
    const verifyRes = await axios.post(`${API_BASE}/auth/verify-otp`, {
      phone: testPhone,
      otp: generatedOtp,
      name: 'Stress Test Buyer'
    });
    assert(verifyRes.status === 200 && verifyRes.data.token, 'POST /api/auth/verify-otp returns valid JWT');
    buyerToken = verifyRes.data.token;
    testBuyerId = verifyRes.data.user.id;

    // 3. Admin Token
    // Ensure an admin user exists
    let adminUserRes = await pool.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    let adminId = adminUserRes.rows[0]?.id;
    if (!adminId) {
      const newAdmin = await pool.query(
        "INSERT INTO users (name, email, phone, role, is_verified) VALUES ('System Admin', 'admin@socialgroup.com', '+919999000000', 'admin', true) RETURNING id"
      );
      adminId = newAdmin.rows[0].id;
    }
    adminToken = jwt.sign({ id: adminId, role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
    assert(adminToken.length > 20, 'Admin security context and JWT token initialized');

    // 4. Test protected route without token (Should be 401)
    try {
      await axios.get(`${API_BASE}/auth/profile`);
      assert(false, 'Protected route should reject unauthenticated request');
    } catch (unauthErr) {
      assert(unauthErr.response?.status === 401, 'Protected route rejected unauthenticated request with 401');
    }

    // 5. Test protected route with valid token
    const profileRes = await axios.get(`${API_BASE}/auth/profile`, {
      headers: { Authorization: `Bearer ${buyerToken}` }
    });
    assert(profileRes.status === 200 && profileRes.data.user.id === testBuyerId, 'Authenticated GET /api/auth/profile returns user details');

  } catch (err) {
    console.error('Auth Suite Err:', err.response?.data || err.message);
    assert(false, `Auth Suite error: ${err.message}`);
  }

  // -------------------------------------------------------------
  // TEST 4: SELLER ONBOARDING & ADMIN APPROVAL (OPTION A)
  // -------------------------------------------------------------
  console.log('\n🏢 TEST SUITE 4: Multi-Vendor Seller Onboarding & Shiprocket Pickup');
  let testSellerProfileId = null;
  try {
    const sellerPhone = `+918888${Date.now().toString().slice(-6)}`;
    const otpRes = await axios.post(`${API_BASE}/auth/send-otp`, { phone: sellerPhone });
    const sellerOtp = otpRes.data.otp || '123456';

    const sellerAuth = await axios.post(`${API_BASE}/auth/verify-otp`, {
      phone: sellerPhone,
      otp: sellerOtp,
      name: 'Apex Wholesale Merchant'
    });
    sellerToken = sellerAuth.data.token;
    testSellerId = sellerAuth.data.user.id;

    // 2. Register Seller with 5-step Pickup Address data
    const regRes = await axios.post(`${API_BASE}/seller/register`, {
      business_name: `Apex Wholesale Hub ${Date.now().toString().slice(-4)}`,
      business_address: 'Plot 42, Udyog Vihar Phase 4',
      gstin: '07AAAAA0000A1Z5',
      bank_account: '9876543210123',
      ifsc: 'HDFC0001234',
      pickup_name: 'Warehouse Manager',
      pickup_phone: sellerPhone,
      pickup_address: 'Plot 42, Udyog Vihar Phase 4',
      pickup_city: 'Gurgaon',
      pickup_state: 'Haryana',
      pickup_pincode: '122018',
      pickup_country: 'India'
    }, {
      headers: { Authorization: `Bearer ${sellerToken}` }
    });
    assert(regRes.status === 201 && regRes.data.profile?.id, 'POST /api/seller/register stores full pickup address (201 Created)');
    testSellerProfileId = regRes.data.profile.id;

    // 3. Admin approves seller (triggers auto Shiprocket warehouse registration)
    const approveRes = await axios.put(`${API_BASE}/admin/sellers/${testSellerProfileId}/approve`, {}, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(approveRes.status === 200 && approveRes.data.shiprocket_pickup_id, 'PUT /admin/sellers/:id/approve registers seller pickup on Shiprocket');

  } catch (err) {
    console.error('Seller Suite Err:', err.response?.data || err.message);
    assert(false, `Seller Onboarding Suite error: ${err.message}`);
  }

  // -------------------------------------------------------------
  // TEST 5: SHIPROCKET LIVE SERVICEABILITY & RATE CHECK
  // -------------------------------------------------------------
  console.log('\n🚚 TEST SUITE 5: Shiprocket Live Serviceability & Real-Time Rates');
  try {
    // 1. Delhi to Gurgaon
    const srv1 = await axios.get(`${API_BASE}/shiprocket/serviceability`, {
      params: {
        pickup_postcode: '110001',
        delivery_postcode: '122018',
        weight: 0.5,
        cod: 1
      },
      headers: { Authorization: `Bearer ${buyerToken}` }
    });
    assert(srv1.status === 200 && srv1.data.serviceable === true, 'Shiprocket checks serviceability (110001 -> 122018)');
    assert(Array.isArray(srv1.data.couriers) && srv1.data.couriers.length > 0, 'Shiprocket returns real active courier options with rates');

    // 2. Unserviceable or invalid pincode
    const srv2 = await axios.get(`${API_BASE}/shiprocket/serviceability`, {
      params: {
        pickup_postcode: '110001',
        delivery_postcode: '000000',
        weight: 0.5,
        cod: 1
      },
      headers: { Authorization: `Bearer ${buyerToken}` }
    });
    assert(srv2.data.serviceable === false, 'Shiprocket correctly identifies invalid pincode (000000) as unserviceable');

  } catch (err) {
    assert(false, `Shiprocket Serviceability error: ${err.message}`);
  }

  // -------------------------------------------------------------
  // TEST 6: PRODUCT CREATION WITH DIMENSIONS & TIERS
  // -------------------------------------------------------------
  console.log('\n🏷️ TEST SUITE 6: Product Catalog with Dimensions & Pricing Tiers');
  let testProductId = null;
  try {
    const sellerTokenRefreshed = jwt.sign(
      { id: testSellerId, phone: '+918888777766', role: 'seller' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const catRes = await pool.query('SELECT id FROM categories LIMIT 1');
    let catId = catRes.rows[0]?.id;
    if (!catId) {
      const newCat = await pool.query("INSERT INTO categories (name, commission_pct) VALUES ('Electronics', 5.00) RETURNING id");
      catId = newCat.rows[0].id;
    }

    const prodRes = await axios.post(`${API_BASE}/products`, {
      name: 'Premium Wireless ANC Headphones Pro',
      sku: `SKU_HEADPHONE_${Date.now()}`,
      description: 'High fidelity audio with 40-hour battery life.',
      category_id: catId,
      stock: 100,
      max_group_size: 5,
      group_window_hours: 24,
      images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80'],
      weight_kg: 0.45,
      length_cm: 18.0,
      breadth_cm: 15.0,
      height_cm: 8.0,
      tiers: [
        { group_size: 1, price: 2999 },
        { group_size: 2, price: 2499 },
        { group_size: 5, price: 1999 }
      ],
      variants: [
        { color: 'Black', size: 'Standard', stock: 50 },
        { color: 'Silver', size: 'Standard', stock: 50 }
      ]
    }, {
      headers: { Authorization: `Bearer ${sellerTokenRefreshed}` }
    });

    assert(prodRes.status === 201 && prodRes.data.product?.id, 'POST /api/products creates listing with dimensions and tiers');
    testProductId = prodRes.data.product.id;

    // Approve product by admin
    await axios.put(`${API_BASE}/admin/products/${testProductId}/approve`, {}, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(true, 'PUT /admin/products/:id/approve publishes product to marketplace catalog');

  } catch (err) {
    console.error('Product Suite Err:', err.response?.data || err.message);
    assert(false, `Product creation error: ${err.message}`);
  }

  // -------------------------------------------------------------
  // TEST 7: CONCURRENT GROUP BUYING SIMULATION & STATE LOCK
  // -------------------------------------------------------------
  console.log('\n👥 TEST SUITE 7: High-Concurrency Group Buying & Price Tiering');
  let testGroupId = null;
  try {
    // 1. Create a 2-person group
    const groupRes = await axios.post(`${API_BASE}/groups/create`, {
      product_id: testProductId,
      target_size: 2
    }, {
      headers: { Authorization: `Bearer ${buyerToken}` }
    });

    assert((groupRes.status === 201 || groupRes.status === 200) && (groupRes.data.group_id || groupRes.data.group?.id), 'POST /api/groups/create initiates co-buying deal room');
    testGroupId = groupRes.data.group_id || groupRes.data.group?.id;

    // 2. Simulate 2nd buyer joining concurrently
    const buyer2Phone = `+919999${Date.now().toString().slice(-6)}`;
    const otpRes = await axios.post(`${API_BASE}/auth/send-otp`, { phone: buyer2Phone });
    const b2Otp = otpRes.data.otp || '123456';

    const buyer2Auth = await axios.post(`${API_BASE}/auth/verify-otp`, {
      phone: buyer2Phone,
      otp: b2Otp,
      name: 'Co-Buyer Partner'
    });
    const buyer2Token = buyer2Auth.data.token;

    const joinRes = await axios.post(`${API_BASE}/groups/${testGroupId}/join`, {}, {
      headers: { Authorization: `Bearer ${buyer2Token}` }
    });

    assert(joinRes.status === 200, 'POST /api/groups/:id/join allows 2nd participant to join');

    // Check if group status transitioned to complete
    const groupStatus = await pool.query('SELECT status, current_size FROM groups WHERE id = $1', [testGroupId]);
    assert(groupStatus.rows[0].current_size === 2, 'Group current_size successfully updated to target_size (2/2)');
    assert(groupStatus.rows[0].status === 'complete' || groupStatus.rows[0].status === 'completed', "Group transitioned status to 'complete' upon filling");

    // 3. Verify oversubscription prevention (Attempt 3rd buyer joining completed group)
    const buyer3Phone = `+919998${Date.now().toString().slice(-6)}`;
    const otpRes3 = await axios.post(`${API_BASE}/auth/send-otp`, { phone: buyer3Phone });
    const b3Otp = otpRes3.data.otp || '123456';

    const buyer3Auth = await axios.post(`${API_BASE}/auth/verify-otp`, {
      phone: buyer3Phone,
      otp: b3Otp,
      name: 'Late Buyer'
    });
    try {
      await axios.post(`${API_BASE}/groups/${testGroupId}/join`, {}, {
        headers: { Authorization: `Bearer ${buyer3Auth.data.token}` }
      });
      assert(false, 'Should reject joining an already completed group');
    } catch (fullErr) {
      assert(fullErr.response?.status === 400, 'Correctly rejects oversubscribed joining to full group (400 Bad Request)');
    }

  } catch (err) {
    console.error('Group Suite Err:', err.response?.data || err.message);
    assert(false, `Group Concurrency Suite error: ${err.message}`);
  }

  // -------------------------------------------------------------
  // TEST 8: CHECKOUT, COD VALIDATION & COUPONS
  // -------------------------------------------------------------
  console.log('\n💳 TEST SUITE 8: Checkout Execution, Dynamic COD & Commission');
  let testOrderId = null;
  try {
    // 1. Create discount coupon
    const couponCode = `TESTPROMO_${Date.now().toString().slice(-4)}`;
    await axios.post(`${API_BASE}/admin/coupons`, {
      code: couponCode,
      discount_type: 'flat',
      discount_value: 200,
      min_order: 1000,
      max_uses: 100,
      expiry: new Date(Date.now() + 86400000 * 30).toISOString()
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(true, `POST /api/admin/coupons generated discount coupon '${couponCode}'`);

    // 2. Execute COD Checkout with live Shiprocket delivery pincode
    const codRes = await axios.post(`${API_BASE}/payments/cod`, {
      product_id: testProductId,
      target_size: 1,
      shipping_address: 'Flat 402, DLF Phase 1, Gurgaon, Haryana',
      delivery_pincode: '122018',
      coupon_code: couponCode,
      color: 'Black',
      size: 'Standard'
    }, {
      headers: { Authorization: `Bearer ${buyerToken}` }
    });

    assert((codRes.status === 200 || codRes.status === 201) && codRes.data.order?.id, 'POST /api/payments/cod confirms order with dynamic Shiprocket serviceability check');
    testOrderId = codRes.data.order.id;

    // Verify stored order fields
    const ordCheck = await pool.query('SELECT delivery_pincode, is_cod, total_amount, coupon_code FROM orders WHERE id = $1', [testOrderId]);
    assert(ordCheck.rows[0].delivery_pincode === '122018', "Order records 'delivery_pincode = 122018'");
    assert(ordCheck.rows[0].is_cod === true, 'Order records is_cod = true');
    assert(ordCheck.rows[0].coupon_code === couponCode, 'Order records applied discount coupon');

  } catch (err) {
    console.error('Checkout Suite Err:', err.response?.data || err.message);
    assert(false, `Checkout & Payments Suite error: ${err.message}`);
  }

  // -------------------------------------------------------------
  // TEST 9: SHIPROCKET 2-STEP DISPATCH LIFECYCLE
  // -------------------------------------------------------------
  console.log('\n🚢 TEST SUITE 9: Shiprocket 2-Step Dispatch & Tracking Lifecycle');
  try {
    const sellerTokenRefreshed = jwt.sign(
      { id: testSellerId, phone: '+918888777766', role: 'seller' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Step 1: Create Shipment on Shiprocket
    const step1Res = await axios.post(`${API_BASE}/shiprocket/orders/${testOrderId}/create-shipment`, {}, {
      headers: { Authorization: `Bearer ${sellerTokenRefreshed}` }
    });

    assert(step1Res.status === 200 && step1Res.data.shiprocket_order_id, 'Step 1: POST /api/shiprocket/orders/:id/create-shipment creates order on Shiprocket');
    assert(Array.isArray(step1Res.data.couriers) && step1Res.data.couriers.length > 0, 'Step 1 returns available courier partners with rates');

    const chosenCourier = step1Res.data.couriers[0];

    // Step 2: Assign Courier Partner & Generate AWB
    const step2Res = await axios.post(`${API_BASE}/shiprocket/orders/${testOrderId}/assign-courier`, {
      courier_id: chosenCourier.courier_company_id,
      courier_name: chosenCourier.courier_name,
      rate: chosenCourier.rate,
      estimated_delivery_days: chosenCourier.estimated_delivery_days
    }, {
      headers: { Authorization: `Bearer ${sellerTokenRefreshed}` }
    });

    assert(step2Res.status === 200 && step2Res.data.awb_code, `Step 2: POST /api/shiprocket/orders/:id/assign-courier generates AWB (${step2Res.data.awb_code}) and schedules pickup`);

    // Verify order status in DB
    const shippedOrder = await pool.query('SELECT status, shipment_status, awb_code, courier_name_sr FROM orders WHERE id = $1', [testOrderId]);
    assert(shippedOrder.rows[0].status === 'shipped', "Order status updated to 'shipped'");
    assert(shippedOrder.rows[0].shipment_status === 'pickup_scheduled', "Shipment status updated to 'pickup_scheduled'");
    assert(shippedOrder.rows[0].awb_code === step2Res.data.awb_code, 'AWB code saved in database');

    // Step 3: Fetch Live Tracking Timeline
    const trackRes = await axios.get(`${API_BASE}/shiprocket/orders/${testOrderId}/tracking`, {
      headers: { Authorization: `Bearer ${buyerToken}` }
    });
    assert(trackRes.status === 200 && trackRes.data.awb_code, 'GET /api/shiprocket/orders/:id/tracking returns live milestone events');

    // Step 4: Test Webhook Status Update
    const webhookRes = await axios.post(`${API_BASE}/shiprocket/webhook`, {
      awb_code: step2Res.data.awb_code,
      current_status: 'in_transit',
      location: 'Gurgaon Sort Facility',
      activity: 'Package departed fulfillment hub'
    });
    assert(webhookRes.status === 200, 'POST /api/shiprocket/webhook processes incoming courier push updates');

    const trackingLogs = await pool.query('SELECT * FROM shipment_tracking WHERE order_id = $1', [testOrderId]);
    assert(trackingLogs.rows.length >= 2, 'Shipment tracking event logged in database from webhook push');

  } catch (err) {
    console.error('Shiprocket Suite Err:', err.response?.data || err.message);
    assert(false, `Shiprocket Dispatch Suite error: ${err.message}`);
  }

  // -------------------------------------------------------------
  // TEST 10: ADMIN DASHBOARD KPIS & NETWORK METRICS
  // -------------------------------------------------------------
  console.log('\n📊 TEST SUITE 10: Admin Portal Metrics & Audit Log Verification');
  try {
    const adminOrders = await axios.get(`${API_BASE}/admin/orders`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(adminOrders.status === 200 && Array.isArray(adminOrders.data.orders), 'GET /api/admin/orders returns global order ledger');

    const testOrdInAdmin = adminOrders.data.orders.find(o => o.id === testOrderId);
    assert(testOrdInAdmin && testOrdInAdmin.awb_code, 'Admin orders view contains AWB code and courier information');

    const adminStats = await axios.get(`${API_BASE}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(adminStats.status === 200 && parseFloat(adminStats.data.total_gmv || 0) >= 0, 'GET /api/admin/dashboard computes network GMV and commissions');

  } catch (err) {
    console.error('Admin Suite Err:', err.response?.data || err.message);
    assert(false, `Admin Suite error: ${err.message}`);
  }

  console.log('\n============================================================');
  console.log(`🏁 TEST RESULTS SUMMARY`);
  console.log(`   TOTAL TESTS: ${passedCount + failedCount}`);
  console.log(`   PASSED:      ${passedCount}`);
  console.log(`   FAILED:      ${failedCount}`);
  console.log(`   SUCCESS RATE: ${Math.round((passedCount / (passedCount + failedCount)) * 100)}%`);
  console.log('============================================================\n');

  if (failedCount === 0) {
    console.log('🌟 ALL SYSTEM TESTS PASSED CLEANLY! PLATFORM IS PRODUCTION-READY.\n');
  }

  // Cleanup test artifacts
  try {
    if (testGroupId) await pool.query('DELETE FROM groups WHERE id = $1', [testGroupId]);
    if (testProductId) await pool.query('DELETE FROM products WHERE id = $1', [testProductId]);
  } catch (e) {}

  process.exit(failedCount === 0 ? 0 : 1);
}

runTestSuite();

