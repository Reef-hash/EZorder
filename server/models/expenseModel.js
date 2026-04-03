import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  date: { type: Date, required: true, default: Date.now },
  category: {
    type: String,
    required: true,
    enum: ['Utilities', 'Salary', 'Supplies', 'Maintenance', 'Rent', 'Others'],
    default: 'Others',
  },
  description: { type: String, required: true, trim: true, maxlength: 200 },
  amount: { type: Number, required: true, min: 0 },
  paymentMethod: { type: String, enum: ['cash', 'bank_transfer'], default: 'cash' },
}, { timestamps: true });

const Expense = mongoose.model('Expense', expenseSchema);

function toPlain(doc) {
  if (!doc) return null;
  const obj = doc.toObject();
  obj.id = obj._id.toString();
  delete obj._id;
  delete obj.__v;
  return obj;
}

async function getExpenses(userId, { from, to } = {}) {
  const query = { userId };
  if (from || to) {
    query.date = {};
    if (from) query.date.$gte = new Date(from);
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      query.date.$lte = end;
    }
  }
  const docs = await Expense.find(query).sort({ date: -1, createdAt: -1 });
  return docs.map(toPlain);
}

async function addExpense(data, userId) {
  const doc = await Expense.create({
    userId,
    date: data.date ? new Date(data.date) : new Date(),
    category: data.category || 'Others',
    description: data.description.trim(),
    amount: parseFloat(data.amount),
    paymentMethod: data.paymentMethod || 'cash',
  });
  return toPlain(doc);
}

async function deleteExpense(expenseId, userId) {
  const doc = await Expense.findOneAndDelete({ _id: expenseId, userId });
  return toPlain(doc);
}

async function sumExpenses(userId, { from, to } = {}) {
  const match = { userId: new mongoose.Types.ObjectId(userId) };
  if (from || to) {
    match.date = {};
    if (from) match.date.$gte = new Date(from);
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      match.date.$lte = end;
    }
  }
  const result = await Expense.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  return result[0]?.total ?? 0;
}

export { getExpenses, addExpense, deleteExpense, sumExpenses };
