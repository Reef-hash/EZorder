import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import dotenv from 'dotenv';
import { connectDB } from './db.js';
import orderRoutes from './routes/orderRoutes.js';
import productRoutes from './routes/productRoutes.js';
import markRoutes from './routes/markRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import tableRoutes from './routes/tableRoutes.js';
import printerRoutes from './routes/printerRoutes.js';
import { authMiddleware } from './middleware/authMiddleware.js';
import { adminMiddleware } from './middleware/adminMiddleware.js';
import { startExpiryReminderCron } from './cron/expiryReminder.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security headers
app.use(helmet());

// CORS — restrict to known origins only
const allowedOrigins = [
  'https://e-zorder.vercel.app',
  process.env.FRONTEND_URL,
  'http://localhost:3001',
  'http://localhost:3000',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow no-origin requests (Render health checks, mobile apps)
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Rate limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20,
  message: { message: 'Too many attempts, please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 200,
  message: { message: 'Too many requests, slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(express.json());
// Strip MongoDB operators from user input ($where, $gt etc)
app.use(mongoSanitize());

// Public routes — rate limited
app.use('/api/auth', authLimiter, authRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Admin routes (require JWT + admin role)
app.use('/api/admin', authMiddleware, adminMiddleware, adminRoutes);

// Protected API Routes (require JWT + general rate limit)
app.use('/api/orders', apiLimiter, authMiddleware, orderRoutes);
app.use('/api/products', apiLimiter, authMiddleware, productRoutes);
app.use('/api/marks', apiLimiter, authMiddleware, markRoutes);
app.use('/api/categories', apiLimiter, authMiddleware, categoryRoutes);
app.use('/api/tables', apiLimiter, authMiddleware, tableRoutes);
app.use('/api/printer', apiLimiter, authMiddleware, printerRoutes);

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

// Connect to MongoDB first, then start the server so all routes
// are guaranteed to have an active connection from the first request.
async function startServer() {
  await connectDB();
  app.listen(PORT, async () => {
    console.log(`✓ EZOrder running on http://localhost:${PORT}`);
    await setupAdminIfNeeded();
    startExpiryReminderCron();
  });
}

startServer().catch((error) => {
  console.error('✗ MongoDB connection failed:', error.message);
  process.exit(1);
});