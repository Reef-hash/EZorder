import express from 'express';
import { register, login, forgotPassword, resetPassword, getMe, updateProfile, getNextBill, resetBillCounter } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', authMiddleware, getMe);
router.patch('/profile', authMiddleware, updateProfile);
router.get('/next-bill', authMiddleware, getNextBill);
router.patch('/reset-bill', authMiddleware, resetBillCounter);

export default router;
