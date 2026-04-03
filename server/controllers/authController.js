import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import validator from 'validator';
import User from '../models/userModel.js';
import { sendWelcomeEmail, sendPasswordResetEmail } from '../services/emailService.js';

function generateToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

// POST /api/auth/register
export async function register(req, res) {
  try {
    const { businessName, email, password } = req.body;

    if (!businessName || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const user = await User.create({ businessName, email, password });
    const token = generateToken(user._id);

    // Send welcome email (non-blocking — don't let email failure break registration)
    sendWelcomeEmail({ to: email, businessName, trialExpiry: user.trialExpiry }).catch(console.error);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        businessName: user.businessName,
        plan: user.plan,
        trialExpiry: user.trialExpiry,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
}

// POST /api/auth/login
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        businessName: user.businessName,
        plan: user.plan,
        role: user.role,
        businessType: user.businessType || 'restaurant',
        trialExpiry: user.trialExpiry,
        isActive: user.isActive(),
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
}

// POST /api/auth/forgot-password
export async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email required' });
    if (!validator.isEmail(email)) return res.status(400).json({ message: 'Invalid email format' });

    const user = await User.findOne({ email });
    // Always return success (don't reveal if email exists)
    if (!user) return res.json({ message: 'If that email exists, a reset link has been sent' });

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    user.resetToken = tokenHash; // store hash — never the raw token
    user.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    await sendPasswordResetEmail({ to: email, businessName: user.businessName, resetUrl });

    res.json({ message: 'If that email exists, a reset link has been sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Failed to send reset email' });
  }
}

// POST /api/auth/reset-password
export async function resetPassword(req, res) {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ message: 'Token and password required' });
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetToken: tokenHash,
      resetTokenExpiry: { $gt: new Date() },
    });

    if (!user) return res.status(400).json({ message: 'Invalid or expired reset link' });

    user.password = password;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Failed to reset password' });
  }
}

// GET /api/auth/next-bill
// Returns the current counter value then increments it atomically
export async function getNextBill(req, res) {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $inc: { billCounter: 1 } },
      { new: false } // return the value BEFORE increment
    );
    res.json({ counter: user.billCounter ?? 1 });
  } catch (error) {
    console.error('getNextBill error:', error);
    res.status(500).json({ message: 'Failed to get bill counter' });
  }
}

// PATCH /api/auth/reset-bill
export async function resetBillCounter(req, res) {
  try {
    await User.findByIdAndUpdate(req.user._id, { $set: { billCounter: 1 } });
    res.json({ counter: 1 });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reset counter' });
  }
}

// GET /api/auth/me
export async function getMe(req, res) {
  res.json({
    id: req.user._id,
    email: req.user.email,
    businessName: req.user.businessName,
    plan: req.user.plan,
    role: req.user.role,
    businessType: req.user.businessType || 'restaurant',
    trialExpiry: req.user.trialExpiry,
    subscriptionExpiry: req.user.subscriptionExpiry || null,
    phone: req.user.phone || '',
    address: req.user.address || '',
    receiptFooter: req.user.receiptFooter || '',
    isActive: req.user.isActive(),
  });
}

// PATCH /api/auth/profile
export async function updateProfile(req, res) {
  try {
    const { businessType, businessName, phone, address, receiptFooter } = req.body;
    const validTypes = ['restaurant', 'retail', 'both'];
    if (businessType && !validTypes.includes(businessType)) {
      return res.status(400).json({ message: 'Invalid businessType' });
    }
    const update = {};
    if (businessType) update.businessType = businessType;
    if (businessName && businessName.trim()) update.businessName = businessName.trim();
    if (phone !== undefined) update.phone = String(phone).trim().slice(0, 20);
    if (address !== undefined) update.address = String(address).trim().slice(0, 200);
    if (receiptFooter !== undefined) update.receiptFooter = String(receiptFooter).trim().slice(0, 200);

    const user = await User.findByIdAndUpdate(req.user._id, { $set: update }, { new: true });
    res.json({
      id: user._id,
      email: user.email,
      businessName: user.businessName,
      plan: user.plan,
      role: user.role,
      businessType: user.businessType,
      trialExpiry: user.trialExpiry,
      subscriptionExpiry: user.subscriptionExpiry || null,
      phone: user.phone || '',
      address: user.address || '',
      receiptFooter: user.receiptFooter || '',
      isActive: user.isActive(),
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
}
