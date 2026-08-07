import express from 'express';
import { createPaymentOrder, verifyPaymentSignature, handleRazorpayWebhook, createCodOrder } from '../controllers/payments.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Razorpay Webhook is a public callback endpoint called directly by Razorpay servers
router.post('/webhooks/razorpay', handleRazorpayWebhook);

// User authenticated checkout actions
router.post('/create-order', verifyToken, createPaymentOrder);
router.post('/verify', verifyToken, verifyPaymentSignature);
router.post('/cod', verifyToken, createCodOrder);

export default router;
