import express from 'express';
import { createGroup, joinGroup, getGroupStatus, extendTimer, cancelGroup, getActiveGroups } from '../controllers/groups.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Public endpoints
router.get('/', getActiveGroups);
router.get('/:id/status', getGroupStatus);

// Auth protected actions
router.post('/create', verifyToken, createGroup);
router.post('/:id/join', verifyToken, joinGroup);
router.post('/:id/extend-timer', verifyToken, extendTimer);
router.post('/:id/cancel', verifyToken, cancelGroup);

export default router;
