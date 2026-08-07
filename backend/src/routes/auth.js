import express from 'express';
import { 
  sendOtp, 
  verifyOtp, 
  googleSso, 
  register, 
  loginWithPassword, 
  forgotPassword, 
  resetPassword, 
  getProfile, 
  updateProfile, 
  getBuyerOrders 
} from '../controllers/auth.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Public auth endpoints
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/google-sso', googleSso);
router.post('/register', register);
router.post('/login', loginWithPassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected profile endpoints
router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken, updateProfile);
router.get('/orders', verifyToken, getBuyerOrders);

export default router;
