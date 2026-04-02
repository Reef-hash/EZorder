import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  businessName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  plan: { type: String, enum: ['trial', 'active', 'expired', 'cancelled'], default: 'trial' },
  trialExpiry: { type: Date, default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) },
  subscriptionExpiry: { type: Date, default: null },
  resetToken: { type: String, default: null },
  resetTokenExpiry: { type: Date, default: null },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  businessType: { type: String, enum: ['restaurant', 'retail', 'both'], default: 'restaurant' },
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Check if subscription is active
userSchema.methods.isActive = function () {
  if (this.plan === 'trial') return new Date() < this.trialExpiry;
  if (this.plan === 'active') return !this.subscriptionExpiry || new Date() < this.subscriptionExpiry;
  return false;
};

const User = mongoose.model('User', userSchema);
export default User;
