import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './db.js';
import orderRoutes from './routes/orderRoutes.js';
import productRoutes from './routes/productRoutes.js';
import markRoutes from './routes/markRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { authMiddleware } from './middleware/authMiddleware.js';

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

// Protected API Routes (require JWT)
app.use('/api/orders', authMiddleware, orderRoutes);
app.use('/api/products', authMiddleware, productRoutes);
app.use('/api/marks', authMiddleware, markRoutes);
app.use('/api/categories', authMiddleware, categoryRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`✓ EZOrder running on http://localhost:${PORT}`);
});