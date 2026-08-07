import express from 'express';
import { applyCoupon } from '../controllers/admin.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Validate and apply promo code (for logged in users at checkout)
router.post('/apply', verifyToken, applyCoupon);

export default router;
