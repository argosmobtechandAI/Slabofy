import express from 'express';
import { createProduct, editProduct, getProducts, getProductDetail } from '../controllers/products.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getProducts);
router.get('/:id', getProductDetail);

// Seller/Admin protected routes
router.post('/', verifyToken, createProduct); // Verified seller only (checked inside controller)
router.put('/:id', verifyToken, editProduct);   // Verified seller only (checked inside controller)

export default router;
