import mongoose from 'mongoose';
import crypto from 'crypto';

const staffSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 60,
  },
  qrToken: {
    type: String,
    unique: true,
    index: true,
  },
  active: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

// Generate a random QR token before saving new documents
staffSchema.pre('save', function (next) {
  if (this.isNew && !this.qrToken) {
    this.qrToken = crypto.randomBytes(24).toString('hex');
  }
  next();
});

export default mongoose.model('Staff', staffSchema);
