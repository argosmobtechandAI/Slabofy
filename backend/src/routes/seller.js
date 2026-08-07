import express from 'express';
import { registerSeller, getSellerStats, getSellerOrders, shipOrder, getSellerProfile } from '../controllers/seller.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Onboarding is open to all logged in users (role sets to 'seller' after admin approval)
router.post('/register', verifyToken, registerSeller);
router.get('/profile', verifyToken, getSellerProfile);

// Merchant specific routes (accessible only to users with role='seller')
router.get('/stats', verifyToken, requireRole('seller'), getSellerStats);
router.get('/orders', verifyToken, requireRole('seller'), getSellerOrders);
router.put('/orders/:id/ship', verifyToken, requireRole('seller'), shipOrder);

export default router;
