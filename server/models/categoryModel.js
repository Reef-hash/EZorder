import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true },
  icon: { type: String, default: 'fa-folder' },
  color: { type: String, default: '#8b5cf6' },
}, { timestamps: true });

categorySchema.index({ userId: 1, name: 1 }, { unique: true });

const Category = mongoose.model('Category', categorySchema);

function toPlain(doc) {
  if (!doc) return null;
  const obj = doc.toObject();
  obj.id = obj._id.toString();
  delete obj._id;
  delete obj.__v;
  return obj;
}

async function getAllCategories(userId) {
  const docs = await Category.find({ userId }).sort({ name: 1 });
  return docs.map(toPlain);
}

async function addCategory(categoryData, userId) {
  const existing = await Category.findOne({ userId, name: new RegExp(`^${categoryData.name}$`, 'i') });
  if (existing) throw new Error('Category already exists');

  const doc = await Category.create({
    userId,
    name: categoryData.name,
    icon: categoryData.icon || 'fa-folder',
    color: categoryData.color || '#8b5cf6',
  });

  return toPlain(doc);

  return newCategory;
}

/**
 * Get category by ID
 */
async function getCategoryById(categoryId, userId) {
  const doc = await Category.findOne({ _id: categoryId, userId });
  return toPlain(doc);
}

async function updateCategory(categoryId, categoryData, userId) {
  const doc = await Category.findOneAndUpdate(
    { _id: categoryId, userId },
    { $set: categoryData },
    { new: true }
  );
  return toPlain(doc);
}

async function deleteCategory(categoryId, userId) {
  const doc = await Category.findOneAndDelete({ _id: categoryId, userId });
  return toPlain(doc);
}

export {
  getAllCategories,
  addCategory,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
