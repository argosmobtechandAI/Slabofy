import express from 'express';
import {
  checkServiceabilityHandler,
  createShipmentHandler,
  getAvailableCouriersHandler,
  assignCourierHandler,
  getOrderTrackingHandler,
  handleShiprocketWebhook,
  cancelShipmentHandler
} from '../controllers/shiprocket.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// 1. Webhook (Public - called by Shiprocket)
router.post('/webhook', handleShiprocketWebhook);

// 2. Serviceability Check (Open to authenticated buyers & sellers)
router.get('/serviceability', verifyToken, checkServiceabilityHandler);

// 3. Order Tracking (Open to authenticated buyers, sellers, admin)
router.get('/orders/:orderId/tracking', verifyToken, getOrderTrackingHandler);

// 4. Seller Operations: Step 1 (Create shipment + list couriers)
router.post('/orders/:orderId/create-shipment', verifyToken, requireRole('seller'), createShipmentHandler);

// 5. Seller Operations: List Couriers
router.get('/orders/:orderId/couriers', verifyToken, requireRole('seller'), getAvailableCouriersHandler);

// 6. Seller Operations: Step 2 (Assign chosen courier + schedule pickup)
router.post('/orders/:orderId/assign-courier', verifyToken, requireRole('seller'), assignCourierHandler);

// 7. Cancel Shipment
router.post('/orders/:orderId/cancel', verifyToken, requireRole('seller'), cancelShipmentHandler);

export default router;
