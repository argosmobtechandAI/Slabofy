import express from 'express';
import { 
  requestReturn, 
  cancelOrder, 
  getBuyerReturns, 
  getSellerReturns, 
  sellerActOnReturn, 
  markPickupDone,
  getAdminReturns, 
  adminActOnReturn, 
  processRazorpayRefund 
} from '../controllers/returns.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// 1. Customer Endpoints
router.post('/', verifyToken, requestReturn);
router.post('/cancel/:orderId', verifyToken, cancelOrder);
router.get('/my', verifyToken, getBuyerReturns);

// 2. Seller Endpoints (strictly isolated from delivery fees)
router.get('/seller', verifyToken, requireRole('seller'), getSellerReturns);
router.put('/seller/:id', verifyToken, requireRole('seller'), sellerActOnReturn);
router.put('/seller/:id/pickup', verifyToken, requireRole('seller'), markPickupDone);

// 3. Admin Endpoints
router.get('/admin', verifyToken, requireRole('admin'), getAdminReturns);
router.put('/admin/:id', verifyToken, requireRole('admin'), adminActOnReturn);
router.post('/admin/:id/refund', verifyToken, requireRole('admin'), processRazorpayRefund);

export default router;
