import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './db.js';
import orderRoutes from './routes/orderRoutes.js';
import productRoutes from './routes/productRoutes.js';
import markRoutes from './routes/markRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { authMiddleware } from './middleware/authMiddleware.js';
import { adminMiddleware } from './middleware/adminMiddleware.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());

// Public routes (no auth needed)
app.use('/api/auth', authRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Admin routes (require JWT + admin role)
app.use('/api/admin', authMiddleware, adminMiddleware, adminRoutes);

// Protected API Routes (require JWT)
app.use('/api/orders', authMiddleware, orderRoutes);
app.use('/api/products', authMiddleware, productRoutes);
app.use('/api/marks', authMiddleware, markRoutes);
app.use('/api/categories', authMiddleware, categoryRoutes);

// One-time admin setup via env var (safe: only runs on server startup)
async function setupAdminIfNeeded() {
  const email = process.env.SETUP_ADMIN_EMAIL;
  if (!email) return;
  try {
    const { default: User } = await import('./models/userModel.js');
    const result = await User.updateOne({ email }, { $set: { role: 'admin' } });
    console.log(`✓ Admin setup: modified ${result.modifiedCount} user(s) for ${email}`);
  } catch (e) {
    console.error('✗ Admin setup failed:', e.message);
  }
}

// Start server
app.listen(PORT, async () => {
  console.log(`✓ EZOrder running on http://localhost:${PORT}`);
  await setupAdminIfNeeded();
});