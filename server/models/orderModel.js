import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  id: String,
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  marks: [String],
}, { _id: false });

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  customerName: { type: String, required: true, trim: true },
  items: [orderItemSchema],
  total: { type: Number, required: true, min: 0 },
  marks: [String],
  paymentMethod: { type: String, enum: ['cash', 'qr', null], default: null },
  status: { type: String, enum: ['pending', 'completed', 'cancelled'], default: 'pending' },
  orderType: { type: String, enum: ['dine_in', 'take_away'], default: 'take_away' },
  tableName: { type: String, default: null },
  discount: { type: Number, default: 0, min: 0 },
  discountType: { type: String, enum: ['amount', 'percent'], default: 'amount' },
  amountPaid: { type: Number, default: null },
  change: { type: Number, default: null },
  whatsappMessage: { type: String },
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);

function toPlain(doc) {
  if (!doc) return null;
  const obj = doc.toObject();
  obj.id = obj._id.toString();
  delete obj._id;
  delete obj.__v;
  return obj;
}

function generateWhatsAppMessage(customerName, items, total) {
  const itemsList = items.map((item) => `• ${item.name} x${item.quantity}`).join('\n');
  return `Hi ${customerName},\n\nYour order:\n${itemsList}\n\nTotal: RM${total.toFixed(2)}\n\nThank you!`;
}

async function getAllOrders(userId, { page = 1, limit = 100 } = {}) {
  const skip = (page - 1) * limit;
  const docs = await Order.find({ userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  return docs.map(toPlain);
}

async function addOrder(orderData, userId) {
  const doc = await Order.create({
    userId,
    customerName: orderData.customerName,
    items: orderData.items,
    total: orderData.total,
    marks: orderData.marks || [],
    paymentMethod: orderData.paymentMethod || null,
    status: orderData.status || 'pending',
    orderType: orderData.orderType || 'take_away',
    tableName: orderData.tableName || null,
    discount: orderData.discount || 0,
    discountType: orderData.discountType || 'amount',
    amountPaid: orderData.amountPaid || null,
    change: orderData.change != null ? orderData.change : null,
    whatsappMessage: generateWhatsAppMessage(orderData.customerName, orderData.items, orderData.total),
  });
  return toPlain(doc);
}

async function getOrderById(orderId, userId) {
  const doc = await Order.findOne({ _id: orderId, userId });
  return toPlain(doc);
}

async function updateOrder(orderId, updateData, userId) {
  const doc = await Order.findOneAndUpdate(
    { _id: orderId, userId },
    { $set: updateData },
    { new: true }
  );
  return toPlain(doc);
}

async function updateOrderStatus(orderId, status, userId) {
  return updateOrder(orderId, { status }, userId);
}

export { getAllOrders, addOrder, updateOrderStatus, updateOrder, getOrderById, generateWhatsAppMessage };