import { pool } from '../config/db.js';
import {
  checkServiceability,
  createShiprocketOrder,
  assignCourierPartner,
  requestPickup,
  trackShipment,
  registerPickupAddress,
  cancelShipment
} from '../utils/shiprocket.js';
import { sendWhatsApp } from '../utils/whatsapp.js';
import { sendPush } from '../utils/push.js';

/**
 * 1. Check Courier Serviceability & Live COD Verification
 * GET /api/shiprocket/serviceability
 */
export const checkServiceabilityHandler = async (req, res) => {
  const { pickup_postcode, delivery_postcode, weight, cod } = req.query;

  if (!delivery_postcode) {
    return res.status(400).json({ error: 'Delivery pincode is required' });
  }

  try {
    const pickup = pickup_postcode || '110001'; // Default fallback if not provided
    const weightVal = parseFloat(weight) || 0.5;
    const isCod = cod === '1' || cod === 'true' || cod === 1 ? 1 : 0;

    const result = await checkServiceability({
      pickup_postcode: pickup,
      delivery_postcode: delivery_postcode.trim(),
      weight: weightVal,
      cod: isCod
    });

    const couriers = result?.data?.available_courier_companies || [];
    const isServiceable = couriers.length > 0;
    const codAvailable = couriers.some(c => c.cod === 1);

    // Find estimated delivery
    const fastestDays = couriers.length > 0 ? couriers[0].estimated_delivery_days || couriers[0].etd : null;
    const lowestRate = couriers.length > 0 ? Math.min(...couriers.map(c => parseFloat(c.rate || 999))) : null;

    return res.status(200).json({
      serviceable: isServiceable,
      cod_available: codAvailable,
      couriers_count: couriers.length,
      estimated_delivery_days: fastestDays,
      starting_rate: lowestRate,
      couriers: couriers.slice(0, 10) // Top 10 options
    });
  } catch (error) {
    console.error('Error in checkServiceabilityHandler:', error.message || error);
    return res.status(500).json({
      serviceable: false,
      cod_available: false,
      error: 'Unable to check courier serviceability with shipping provider'
    });
  }
};

/**
 * 2. Step 1 of Manual Dispatch: Create Shiprocket Order & Fetch Courier Options
 * POST /api/shiprocket/orders/:orderId/create-shipment
 */
export const createShipmentHandler = async (req, res) => {
  const { orderId } = req.params;
  const sellerId = req.user.id;

  try {
    // 1. Fetch Order, Product, Seller Profile, and Buyer
    const orderQuery = `
      SELECT o.*, 
             p.name as product_name, p.sku as product_sku, 
             COALESCE(p.weight_kg, 0.50) as weight_kg,
             COALESCE(p.length_cm, 10.00) as length_cm,
             COALESCE(p.breadth_cm, 10.00) as breadth_cm,
             COALESCE(p.height_cm, 5.00) as height_cm,
             u.name as buyer_name, u.email as buyer_email, u.phone as buyer_phone,
             sp.pickup_name, sp.pickup_phone, sp.pickup_address, sp.pickup_city,
             sp.pickup_state, sp.pickup_pincode, sp.shiprocket_pickup_id, sp.business_name
      FROM orders o
      JOIN products p ON o.product_id = p.id
      JOIN users u ON o.buyer_id = u.id
      LEFT JOIN seller_profiles sp ON o.seller_id = sp.user_id
      WHERE o.id = $1
    `;
    const orderRes = await pool.query(orderQuery, [orderId]);
    const order = orderRes.rows[0];

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.seller_id !== sellerId) {
      return res.status(403).json({ error: 'Access Denied: Order does not belong to this seller' });
    }

    if (order.status !== 'confirmed') {
      return res.status(400).json({ error: `Cannot create shipment. Order status is '${order.status}'. Must be 'confirmed'.` });
    }

    // 2. Resolve Pickup Location Name
    const pickupLocation = order.shiprocket_pickup_id || order.business_name?.replace(/[^a-zA-Z0-9_-]/g, '_') || 'Primary_Warehouse';
    const deliveryPincode = order.delivery_pincode || (order.shipping_address?.match(/\b\d{6}\b/) ? order.shipping_address.match(/\b\d{6}\b/)[0] : '110001');

    // Parse shipping address components (split if available or provide fallback)
    const addressParts = (order.shipping_address || 'Address').split(',');
    const city = addressParts.length > 2 ? addressParts[addressParts.length - 2].trim() : 'New Delhi';
    const state = addressParts.length > 3 ? addressParts[addressParts.length - 3].trim() : 'Delhi';

    // 3. Build Shiprocket Adhoc Order Payload
    const shiprocketPayload = {
      order_id: `SLABOFY_${order.id}_${Date.now().toString().slice(-6)}`,
      order_date: new Date(order.created_at || Date.now()).toISOString().replace('T', ' ').slice(0, 19),
      pickup_location: pickupLocation,
      channel_id: '',
      comment: `Slabofy Group Buy Order #${order.id}`,
      billing_customer_name: order.buyer_name || 'Customer',
      billing_last_name: '',
      billing_address: order.shipping_address || 'Address Details',
      billing_address_2: '',
      billing_city: city,
      billing_pincode: deliveryPincode,
      billing_state: state,
      billing_country: 'India',
      billing_email: order.buyer_email || 'buyer@slabofy.com',
      billing_phone: (order.buyer_phone || '9999999999').replace(/[^0-9]/g, '').slice(-10),
      shipping_is_billing: true,
      order_items: [
        {
          name: order.product_name,
          sku: order.product_sku || `SKU_${order.product_id}`,
          units: order.quantity || 1,
          selling_price: parseFloat(order.unit_price),
          discount: 0,
          tax: 0,
          hsn: 0
        }
      ],
      payment_method: order.is_cod ? 'COD' : 'Prepaid',
      shipping_charges: 0,
      giftwrap_charges: 0,
      transaction_charges: 0,
      total_discount: 0,
      sub_total: parseFloat(order.total_amount),
      length: parseFloat(order.length_cm),
      breadth: parseFloat(order.breadth_cm),
      height: parseFloat(order.height_cm),
      weight: parseFloat(order.weight_kg)
    };

    // 4. Create Order on Shiprocket
    const srOrderResponse = await createShiprocketOrder(shiprocketPayload);
    const srOrderId = srOrderResponse.order_id?.toString() || srOrderResponse.id?.toString();
    const srShipmentId = srOrderResponse.shipment_id?.toString() || srOrderId;

    // 5. Update Order with Shiprocket IDs & status = 'courier_pending'
    await pool.query(
      `UPDATE orders 
       SET shiprocket_order_id = $1, 
           shiprocket_shipment_id = $2, 
           shipment_status = 'courier_pending'
       WHERE id = $3`,
      [srOrderId, srShipmentId, orderId]
    );

    // 6. Fetch Available Couriers for this Shipment
    const pickupPincode = order.pickup_pincode || '110001';
    const serviceabilityRes = await checkServiceability({
      pickup_postcode: pickupPincode,
      delivery_postcode: deliveryPincode,
      weight: parseFloat(order.weight_kg),
      cod: order.is_cod ? 1 : 0
    });

    const couriers = serviceabilityRes?.data?.available_courier_companies || [];

    return res.status(200).json({
      message: 'Shipment created on Shiprocket. Please choose a courier partner to dispatch.',
      order_id: order.id,
      shiprocket_order_id: srOrderId,
      shiprocket_shipment_id: srShipmentId,
      couriers: couriers.map(c => ({
        courier_company_id: c.courier_company_id,
        courier_name: c.courier_name,
        rate: parseFloat(c.rate || 0),
        estimated_delivery_days: c.estimated_delivery_days || c.etd,
        cod_available: c.cod === 1,
        rating: c.rating || '4.5'
      }))
    });
  } catch (error) {
    console.error('Error in createShipmentHandler:', error);
    return res.status(500).json({ error: error.message || 'Server error creating shipment with Shiprocket' });
  }
};

/**
 * 3. Fetch Couriers for Pending Shipment
 * GET /api/shiprocket/orders/:orderId/couriers
 */
export const getAvailableCouriersHandler = async (req, res) => {
  const { orderId } = req.params;
  const sellerId = req.user.id;

  try {
    const orderRes = await pool.query(
      `SELECT o.*, p.weight_kg, sp.pickup_pincode 
       FROM orders o
       JOIN products p ON o.product_id = p.id
       LEFT JOIN seller_profiles sp ON o.seller_id = sp.user_id
       WHERE o.id = $1 AND o.seller_id = $2`,
      [orderId, sellerId]
    );
    const order = orderRes.rows[0];

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const pickupPincode = order.pickup_pincode || '110001';
    const deliveryPincode = order.delivery_pincode || '110001';

    const serviceabilityRes = await checkServiceability({
      pickup_postcode: pickupPincode,
      delivery_postcode: deliveryPincode,
      weight: parseFloat(order.weight_kg || 0.5),
      cod: order.is_cod ? 1 : 0
    });

    const couriers = serviceabilityRes?.data?.available_courier_companies || [];
    return res.status(200).json({
      couriers: couriers.map(c => ({
        courier_company_id: c.courier_company_id,
        courier_name: c.courier_name,
        rate: parseFloat(c.rate || 0),
        estimated_delivery_days: c.estimated_delivery_days || c.etd,
        cod_available: c.cod === 1,
        rating: c.rating || '4.5'
      }))
    });
  } catch (error) {
    console.error('Error in getAvailableCouriersHandler:', error);
    return res.status(500).json({ error: 'Server error loading courier options' });
  }
};

/**
 * 4. Step 2 of Manual Dispatch: Seller Assigns Selected Courier & Generates AWB
 * POST /api/shiprocket/orders/:orderId/assign-courier
 */
export const assignCourierHandler = async (req, res) => {
  const { orderId } = req.params;
  const { courier_id, courier_name, rate, estimated_delivery_days } = req.body;
  const sellerId = req.user.id;

  if (!courier_id) {
    return res.status(400).json({ error: 'Courier partner selection is required' });
  }

  try {
    // 1. Fetch order
    const orderRes = await pool.query(
      `SELECT o.*, u.phone as buyer_phone, u.name as buyer_name, p.name as product_name
       FROM orders o
       JOIN users u ON o.buyer_id = u.id
       JOIN products p ON o.product_id = p.id
       WHERE o.id = $1 AND o.seller_id = $2`,
      [orderId, sellerId]
    );
    const order = orderRes.rows[0];

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (!order.shiprocket_shipment_id && !order.shiprocket_order_id) {
      return res.status(400).json({ error: 'Please create the shipment first before assigning courier' });
    }

    const shipmentId = order.shiprocket_shipment_id || order.shiprocket_order_id;

    // 2. Call Shiprocket Assign Courier & AWB
    const assignRes = await assignCourierPartner({
      shipment_id: shipmentId,
      courier_id: parseInt(courier_id)
    });

    const awbData = assignRes?.response?.data;
    const awbCode = awbData?.awb_code || `SR${Date.now()}`;
    const chosenCourierName = courier_name || awbData?.courier_name || 'Shiprocket Courier Partner';

    // 3. Request Pickup
    try {
      await requestPickup({ shipment_id: shipmentId });
    } catch (pickupErr) {
      console.warn('[SHIPROCKET PICKUP WARNING] Pickup request note:', pickupErr.message || pickupErr);
    }

    // 4. Update Order
    const updateQuery = `
      UPDATE orders 
      SET awb_code = $1,
          courier_id = $2,
          courier_name_sr = $3,
          courier_name = $3,
          tracking_number = $1,
          shipping_charges = $4,
          status = 'shipped',
          shipment_status = 'pickup_scheduled'
      WHERE id = $5
      RETURNING *
    `;
    const updatedOrderRes = await pool.query(updateQuery, [
      awbCode,
      courier_id,
      chosenCourierName,
      parseFloat(rate || 0),
      orderId
    ]);

    // 5. Insert initial tracking log
    await pool.query(
      `INSERT INTO shipment_tracking (order_id, awb_code, status, location, remark, activity_at)
       VALUES ($1, $2, 'pickup_scheduled', 'Seller Warehouse', 'Courier partner assigned and pickup scheduled', NOW())`,
      [orderId, awbCode]
    );

    // 6. Notify Buyer
    try {
      if (order.buyer_phone) {
        await sendWhatsApp(
          order.buyer_phone,
          'order_shipped',
          [order.id, chosenCourierName, awbCode],
          order.buyer_id
        );
      }
      await sendPush(
        order.buyer_id,
        'Order Dispatched! 🚚',
        `Your order #${order.id} has been dispatched via ${chosenCourierName}. AWB: ${awbCode}`
      );
    } catch (notifyErr) {
      console.warn('Buyer dispatch notification failed:', notifyErr.message);
    }

    return res.status(200).json({
      message: 'Courier assigned and shipment dispatched successfully!',
      awb_code: awbCode,
      courier_name: chosenCourierName,
      order: updatedOrderRes.rows[0]
    });
  } catch (error) {
    console.error('Error in assignCourierHandler:', error);
    return res.status(500).json({ error: error.message || 'Server error assigning courier partner' });
  }
};

/**
 * 5. Track Order Shipment
 * GET /api/shiprocket/orders/:orderId/tracking
 */
export const getOrderTrackingHandler = async (req, res) => {
  const { orderId } = req.params;

  try {
    const orderRes = await pool.query(
      `SELECT o.id, o.awb_code, o.courier_name_sr, o.shipment_status, o.status,
              p.name as product_name, p.images as product_images
       FROM orders o
       JOIN products p ON o.product_id = p.id
       WHERE o.id = $1`,
      [orderId]
    );
    const order = orderRes.rows[0];

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // 1. Fetch DB logs
    const trackingRes = await pool.query(
      `SELECT * FROM shipment_tracking WHERE order_id = $1 ORDER BY created_at ASC`,
      [orderId]
    );
    let events = trackingRes.rows;

    // 2. If AWB exists and we have live Shiprocket token, fetch live updates
    if (order.awb_code) {
      try {
        const liveTrack = await trackShipment(order.awb_code);
        const liveActivities = liveTrack?.tracking_data?.shipment_track || [];
        if (liveActivities.length > 0) {
          // Format live activities
          events = liveActivities.map(act => ({
            status: act.current_status || 'IN TRANSIT',
            location: act.location || 'Hub',
            remark: act.activity || 'Package movement',
            activity_at: act.date || new Date().toISOString()
          }));
        }
      } catch (trackErr) {
        // Fallback to internal events
      }
    }

    return res.status(200).json({
      order_id: order.id,
      awb_code: order.awb_code,
      courier_name: order.courier_name_sr,
      shipment_status: order.shipment_status,
      events
    });
  } catch (error) {
    console.error('Error in getOrderTrackingHandler:', error);
    return res.status(500).json({ error: 'Server error retrieving shipment tracking' });
  }
};

/**
 * 6. Shiprocket Webhook Receiver (Public / Webhook)
 * POST /api/shiprocket/webhook
 */
export const handleShiprocketWebhook = async (req, res) => {
  const payload = req.body;
  console.log('[SHIPROCKET WEBHOOK RECEIVED]', JSON.stringify(payload));

  try {
    const awb = payload.awb || payload.awb_code;
    const currentStatus = (payload.current_status || payload.status || '').toLowerCase();
    const location = payload.location || payload.current_city || 'In Transit';
    const activity = payload.activity || payload.scan_detail || `Status update: ${currentStatus}`;

    if (awb) {
      // Find matching order
      const orderRes = await pool.query('SELECT id, buyer_id FROM orders WHERE awb_code = $1', [awb]);
      const order = orderRes.rows[0];

      if (order) {
        // Map status to our enum
        let dbShipmentStatus = 'in_transit';
        if (currentStatus.includes('delivered')) {
          dbShipmentStatus = 'delivered';
          await pool.query("UPDATE orders SET status = 'delivered', shipment_status = 'delivered' WHERE id = $1", [order.id]);
          await sendPush(order.buyer_id, 'Delivered! 🎉', `Your order #${order.id} has been delivered successfully.`);
        } else if (currentStatus.includes('pickup') || currentStatus.includes('picked')) {
          dbShipmentStatus = 'pickup_scheduled';
        } else if (currentStatus.includes('rto')) {
          dbShipmentStatus = 'rto';
        } else if (currentStatus.includes('cancel')) {
          dbShipmentStatus = 'cancelled';
        }

        // Insert tracking event
        await pool.query(
          `INSERT INTO shipment_tracking (order_id, awb_code, status, location, remark, activity_at, raw_payload)
           VALUES ($1, $2, $3, $4, $5, NOW(), $6)`,
          [order.id, awb, dbShipmentStatus, location, activity, JSON.stringify(payload)]
        );

        await pool.query('UPDATE orders SET shipment_status = $1 WHERE id = $2', [dbShipmentStatus, order.id]);
      }
    }

    return res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Error handling Shiprocket webhook:', error);
    return res.status(500).json({ error: 'Webhook processing error' });
  }
};

/**
 * 7. Cancel Shipment
 * POST /api/shiprocket/orders/:orderId/cancel
 */
export const cancelShipmentHandler = async (req, res) => {
  const { orderId } = req.params;
  const sellerId = req.user.id;

  try {
    const orderRes = await pool.query('SELECT * FROM orders WHERE id = $1', [orderId]);
    const order = orderRes.rows[0];

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.seller_id !== sellerId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access Denied' });
    }

    if (order.shiprocket_order_id) {
      await cancelShipment(order.shiprocket_order_id);
    }

    await pool.query(
      "UPDATE orders SET shipment_status = 'cancelled' WHERE id = $1",
      [orderId]
    );

    return res.status(200).json({ message: 'Shipment cancelled on Shiprocket successfully' });
  } catch (error) {
    console.error('Error in cancelShipmentHandler:', error);
    return res.status(500).json({ error: error.message || 'Server error cancelling shipment' });
  }
};
