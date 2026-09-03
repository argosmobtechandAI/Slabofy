import axios from 'axios';
import { redisClient } from '../config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = 'https://apiv2.shiprocket.in/v1/external';
const REDIS_TOKEN_KEY = 'shiprocket:jwt_token';

/**
 * Get cached or new JWT token from Shiprocket API
 */
export const getShiprocketToken = async () => {
  try {
    // 1. Check Redis cache
    if (redisClient) {
      try {
        const cachedToken = await redisClient.get(REDIS_TOKEN_KEY);
        if (cachedToken && cachedToken !== 'mock_shiprocket_token') {
          return cachedToken;
        }
      } catch (redisErr) {
        // Cache miss or Redis offline, proceed to fetch
      }
    }

    const email = (process.env.SHIPROCKET_EMAIL || '').trim();
    const password = (process.env.SHIPROCKET_PASSWORD || '').trim();

    if (!email || !password || email.includes('YOURKEY')) {
      console.warn('[SHIPROCKET] API credentials missing or placeholder. Running in fallback mode.');
      return 'mock_shiprocket_token';
    }

    // 2. Fetch new token from Shiprocket
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email,
      password
    });

    const token = response.data?.token;
    if (!token) {
      throw new Error('No token returned from Shiprocket authentication');
    }

    // 3. Cache token in Redis for 9 days (Shiprocket tokens expire in 10 days / 240 hours)
    if (redisClient) {
      try {
        await redisClient.set(REDIS_TOKEN_KEY, token, { EX: 9 * 24 * 60 * 60 });
      } catch (redisSetErr) {
        // Safe fallback
      }
    }

    console.log('[SHIPROCKET] Successfully authenticated with live credentials and cached JWT token');
    return token;
  } catch (error) {
    console.error('[SHIPROCKET AUTH ERROR]', error.response?.data || error.message);
    if (!process.env.SHIPROCKET_EMAIL) {
      return 'mock_shiprocket_token';
    }
    throw error;
  }
};

/**
 * Generic authenticated API client for Shiprocket
 */
const apiRequest = async (method, endpoint, data = null, params = null) => {
  const token = await getShiprocketToken();

  // If running in mock/demo fallback
  if (token === 'mock_shiprocket_token') {
    return handleMockRequest(method, endpoint, data, params);
  }

  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      data,
      params
    };

    const res = await axios(config);
    return res.data;
  } catch (error) {
    console.error(`[SHIPROCKET API ERROR] ${method} ${endpoint}:`, error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

/**
 * Mock Request Handler (for testing / development fallback)
 */
const handleMockRequest = async (method, endpoint, data, params) => {
  console.log(`[SHIPROCKET MOCK] ${method} ${endpoint}`, { data, params });

  if (endpoint.includes('/courier/serviceability')) {
    return {
      status: 200,
      data: {
        available_courier_companies: [
          {
            courier_company_id: 1,
            courier_name: 'Blue Dart Surface',
            rate: 65.0,
            estimated_delivery_days: '2-3 Days',
            etd: '3 Days',
            cod: 1
          },
          {
            courier_company_id: 2,
            courier_name: 'Delhivery Surface',
            rate: 52.0,
            estimated_delivery_days: '3-4 Days',
            etd: '4 Days',
            cod: 1
          },
          {
            courier_company_id: 3,
            courier_name: 'Xpressbees Surface',
            rate: 45.0,
            estimated_delivery_days: '4-5 Days',
            etd: '5 Days',
            cod: 0
          }
        ]
      }
    };
  }

  if (endpoint.includes('/orders/create/adhoc')) {
    const mockOrderId = Math.floor(10000000 + Math.random() * 90000000);
    const mockShipmentId = Math.floor(20000000 + Math.random() * 90000000);
    return {
      order_id: mockOrderId,
      shipment_id: mockShipmentId,
      status: 'NEW',
      status_code: 1
    };
  }

  if (endpoint.includes('/courier/assign/awb')) {
    const mockAwb = `SR${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    return {
      response: {
        data: {
          awb_code: mockAwb,
          courier_company_id: data?.courier_id || 1,
          courier_name: 'Delhivery Surface',
          assigned_date_time: new Date().toISOString()
        }
      }
    };
  }

  if (endpoint.includes('/courier/generate/pickup')) {
    return {
      pickup_status: 1,
      response: {
        pickup_scheduled_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        pickup_token_number: `PKP_${Math.floor(100000 + Math.random() * 900000)}`
      }
    };
  }

  if (endpoint.includes('/courier/track/awb')) {
    return {
      tracking_data: {
        track_status: 1,
        shipment_status: 6,
        shipment_track: [
          {
            id: 1,
            current_status: 'IN TRANSIT',
            activity: 'Package arrived at sorting facility',
            location: 'Gurgaon Hub',
            date: new Date().toISOString()
          },
          {
            id: 2,
            current_status: 'PICKED UP',
            activity: 'Picked up by courier partner',
            location: 'Seller Warehouse',
            date: new Date(Date.now() - 36000000).toISOString()
          }
        ]
      }
    };
  }

  if (endpoint.includes('/settings/company/addpickup')) {
    return {
      success: true,
      address: {
        pickup_location: data?.pickup_location || 'Seller_Warehouse_1',
        pickup_id: Math.floor(10000 + Math.random() * 90000)
      }
    };
  }

  return { success: true };
};

// ==============================================================================
// PUBLIC API METHODS
// ==============================================================================

/**
 * 1. Check Courier Serviceability & Rates
 */
export const checkServiceability = async ({ pickup_postcode, delivery_postcode, weight = 0.5, cod = 0 }) => {
  return await apiRequest('GET', '/courier/serviceability/', null, {
    pickup_postcode,
    delivery_postcode,
    weight,
    cod: cod ? 1 : 0
  });
};

/**
 * 2. Create Adhoc Custom Order on Shiprocket (Step 1)
 */
export const createShiprocketOrder = async (orderPayload) => {
  return await apiRequest('POST', '/orders/create/adhoc', orderPayload);
};

/**
 * 3. Assign Courier Partner & Generate AWB (Step 2)
 */
export const assignCourierPartner = async ({ shipment_id, courier_id }) => {
  return await apiRequest('POST', '/courier/assign/awb', {
    shipment_id,
    courier_id
  });
};

/**
 * 4. Generate Pickup Request for Assigned Shipment
 */
export const requestPickup = async ({ shipment_id }) => {
  return await apiRequest('POST', '/courier/generate/pickup', {
    shipment_id: [shipment_id]
  });
};

/**
 * 5. Track Shipment by AWB or Order ID
 */
export const trackShipment = async (awb_code) => {
  return await apiRequest('GET', `/courier/track/awb/${awb_code}`);
};

/**
 * 6. Register Seller Pickup Address
 */
export const registerPickupAddress = async (addressPayload) => {
  return await apiRequest('POST', '/settings/company/addpickup', addressPayload);
};

/**
 * 7. Cancel Shipment on Shiprocket
 */
export const cancelShipment = async (order_ids) => {
  return await apiRequest('POST', '/orders/cancel', {
    ids: Array.isArray(order_ids) ? order_ids : [order_ids]
  });
};
