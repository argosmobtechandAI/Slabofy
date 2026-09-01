import express from 'express';
import { registerSeller, getSellerStats, getSellerOrders, getSellerProfile } from '../controllers/seller.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Onboarding is open to all logged in users (role sets to 'seller' after admin approval)
router.post('/register', verifyToken, registerSeller);
router.get('/profile', verifyToken, getSellerProfile);

// Merchant specific routes (accessible only to users with role='seller')
router.get('/stats', verifyToken, requireRole('seller'), getSellerStats);
router.get('/orders', verifyToken, requireRole('seller'), getSellerOrders);
// NOTE: Manual ship route retired — use POST /api/shiprocket/orders/:id/create-shipment (Step 1) + /assign-courier (Step 2)

export default router;
