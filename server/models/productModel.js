import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  promoPrice: { type: Number, default: null },
  promoEnabled: { type: Boolean, default: false },
  imageUrl: { type: String, default: null },
  disabled: { type: Boolean, default: false },
  trackStock: { type: Boolean, default: false },
  stockQty: { type: Number, default: null },
  costPrice: { type: Number, default: null },
  taxRate: { type: Number, enum: [0, 6, 10], default: 0 }, // SST: 0% (exempt), 6% (service tax), 10% (sales tax)
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

function toPlain(doc) {
  if (!doc) return null;
  const obj = doc.toObject();
  obj.id = obj._id.toString();
  delete obj._id;
  delete obj.__v;
  return obj;
}

async function getAllProducts(userId) {
  const docs = await Product.find({ userId }).sort({ category: 1 });
  return docs.map(toPlain);
}

async function addProduct(productData, userId) {
  const doc = await Product.create({
    userId,
    name: productData.name,
    category: productData.category,
    price: parseFloat(productData.price),
    promoPrice: productData.promoPrice ? parseFloat(productData.promoPrice) : null,
    promoEnabled: productData.promoEnabled || false,
    imageUrl: productData.imageUrl || null,
    trackStock: productData.trackStock || false,
    stockQty: productData.trackStock ? (productData.stockQty != null ? parseInt(productData.stockQty) : 0) : null,
    costPrice: productData.costPrice ? parseFloat(productData.costPrice) : null,
    taxRate: productData.taxRate != null ? parseInt(productData.taxRate) : 0,
  });
  return toPlain(doc);
}

async function getProductById(productId, userId) {
  const doc = await Product.findOne({ _id: productId, userId });
  return toPlain(doc);
}

async function updateProduct(productId, productData, userId) {
  const doc = await Product.findOneAndUpdate(
    { _id: productId, userId },
    { $set: productData },
    { new: true }
  );
  return toPlain(doc);
}

async function deleteProduct(productId, userId) {
  const doc = await Product.findOneAndDelete({ _id: productId, userId });
  return toPlain(doc);
}

async function deductStock(items, userId) {
  const qtyMap = {};
  for (const item of items) {
    if (item.id) qtyMap[item.id] = (qtyMap[item.id] || 0) + item.quantity;
  }
  const ops = Object.entries(qtyMap).map(([productId, qty]) => ({
    updateOne: {
      filter: { _id: productId, userId, trackStock: true, stockQty: { $gte: 0 } },
      update: { $inc: { stockQty: -qty } },
    },
  }));
  if (ops.length) await Product.bulkWrite(ops);
}

async function restoreStock(items, userId) {
  const qtyMap = {};
  for (const item of items) {
    if (item.id) qtyMap[item.id] = (qtyMap[item.id] || 0) + item.quantity;
  }
  const ops = Object.entries(qtyMap).map(([productId, qty]) => ({
    updateOne: {
      filter: { _id: productId, userId, trackStock: true },
      update: { $inc: { stockQty: qty } },
    },
  }));
  if (ops.length) await Product.bulkWrite(ops);
}

async function adjustStock(productId, adjustment, userId) {
  const doc = await Product.findOneAndUpdate(
    { _id: productId, userId, trackStock: true },
    { $inc: { stockQty: adjustment } },
    { new: true }
  );
  return toPlain(doc);
}

async function getProductsByCategory(userId) {
  const docs = await Product.find({ userId }).sort({ category: 1 });
  const grouped = {};
  docs.forEach((doc) => {
    const product = toPlain(doc);
    if (!grouped[product.category]) grouped[product.category] = [];
    grouped[product.category].push(product);
  });
  return grouped;
}

export {
  getAllProducts,
  addProduct,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductsByCategory,
  deductStock,
  restoreStock,
  adjustStock,
};
