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

async function getAllOrders(userId) {
  const docs = await Order.find({ userId }).sort({ createdAt: -1 });
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
    status: 'pending',
    whatsappMessage: generateWhatsAppMessage(orderData.customerName, orderData.items, orderData.total),
  });
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

export { getAllOrders, addOrder, updateOrderStatus, updateOrder, generateWhatsAppMessage };