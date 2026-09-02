import express from 'express';
import { createTicket, getMyTickets, getAllTickets, updateTicket } from '../controllers/tickets.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Seller Endpoints
router.post('/', verifyToken, requireRole('seller'), createTicket);
router.get('/my', verifyToken, requireRole('seller'), getMyTickets);

// Admin Endpoints
router.get('/all', verifyToken, requireRole('admin'), getAllTickets);
router.put('/:id', verifyToken, requireRole('admin'), updateTicket);

export default router;
