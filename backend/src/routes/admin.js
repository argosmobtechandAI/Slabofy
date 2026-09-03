import express from 'express';
import { 
  createCategory, 
  getCategories, 
  updateCategory, 
  deleteCategory,
  getSellers,
  approveSeller,
  suspendSeller,
  getPendingProducts,
  approveProduct,
  rejectProduct,
  updateProductDeliveryFee,
  createCoupon,
  getCoupons,
  deleteCoupon,
  getDashboardStats,
  getCustomers,
  getOrders
} from '../controllers/admin.js';
import { forceCompleteGroup } from '../controllers/groups.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Apply auth protection & role check for ALL admin routes (except public get categories if loaded here, but public lists are registered in products/public routes)
router.use(verifyToken, requireRole('admin'));

// Categories CRUD
router.post('/categories', createCategory);
router.get('/categories', getCategories); // Admin categories view
router.put('/categories/:id', updateCategory);
router.put('/categories/:id/commission', updateCategory);
router.delete('/categories/:id', deleteCategory);

// Seller Queue approvals
router.get('/sellers', getSellers);
router.put('/sellers/:id/approve', approveSeller);
router.put('/sellers/:id/suspend', suspendSeller);

// Product Queue approvals & delivery fee management
router.get('/products', getPendingProducts);
router.put('/products/:id/approve', approveProduct);
router.put('/products/:id/reject', rejectProduct);
router.put('/products/:id/delivery-fee', updateProductDeliveryFee);

// Coupons management
router.post('/coupons', createCoupon);
router.get('/coupons', getCoupons);
router.delete('/coupons/:id', deleteCoupon);

// Force complete groups manual override
router.post('/groups/:id/force-complete', forceCompleteGroup);

// Stats dashboard
router.get('/dashboard', getDashboardStats);

// Customers list database view
router.get('/customers', getCustomers);

// Orders list database view
router.get('/orders', getOrders);

export default router;
