import mongoose from 'mongoose';

const { Schema } = mongoose;

const taxRuleSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  rate: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  type: {
    type: String,
    enum: ['service', 'sales', 'other'],
    default: 'service',
  },
  applicableTo: {
    type: String,
    enum: ['all', 'categories', 'items'],
    default: 'all',
  },
  categories: [
    {
      type: String,
      trim: true,
    },
  ],
  items: [
    {
      type: String,
      trim: true,
    },
  ],
  enabled: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for faster queries
taxRuleSchema.index({ userId: 1, enabled: 1 });

const TaxRule = mongoose.model('TaxRule', taxRuleSchema);

export async function getTaxRules(userId) {
  return TaxRule.find({ userId }).sort({ createdAt: -1 }).lean();
}

export async function getEnabledTaxRules(userId) {
  return TaxRule.find({ userId, enabled: true }).sort({ createdAt: -1 }).lean();
}

export async function addTaxRule(ruleData) {
  const rule = new TaxRule(ruleData);
  return rule.save();
}

export async function updateTaxRule(ruleId, updates) {
  return TaxRule.findByIdAndUpdate(ruleId, { ...updates, updatedAt: new Date() }, { new: true });
}

export async function deleteTaxRule(ruleId) {
  return TaxRule.findByIdAndDelete(ruleId);
}

export default TaxRule;
