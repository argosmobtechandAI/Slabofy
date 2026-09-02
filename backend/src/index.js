import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import sellerRoutes from './routes/seller.js';
import adminRoutes from './routes/admin.js';
import groupRoutes from './routes/groups.js';
import paymentRoutes from './routes/payments.js';
import couponRoutes from './routes/coupons.js';
import uploadRoutes from './routes/upload.js';
import shiprocketRoutes from './routes/shiprocket.js';
import ticketRoutes from './routes/tickets.js';
import { getCategories } from './controllers/admin.js';
import path from 'path';
import { initExpiryCron } from './cron/expiry.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend connection (typically running on Vite port 5173)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static uploaded files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Public health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Public categories endpoint (for listing forms)
app.get('/api/categories', getCategories);

// Bind Route Subsystems
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/shiprocket', shiprocketRoutes);
app.use('/api/tickets', ticketRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]:', err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// 404 Route handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize Group Expiry Cron Job Scheduler
initExpiryCron();

// Start Server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`Slabofy Backend running on Port: ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`====================================================`);
});
