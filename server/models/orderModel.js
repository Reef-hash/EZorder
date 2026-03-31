import { promises as fs } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ordersFilePath = join(__dirname, '..', 'data', 'orders.json');

/**
 * Read all orders from JSON file
 */
async function readOrders() {
  try {
    const fileContent = await fs.readFile(ordersFilePath, 'utf-8');
    const parsedOrders = JSON.parse(fileContent);
    return Array.isArray(parsedOrders) ? parsedOrders : [];
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

/**
 * Write orders back to JSON file
 */
async function writeOrders(orders) {
  await fs.writeFile(ordersFilePath, JSON.stringify(orders, null, 2), 'utf-8');
}

/**
 * Generate WhatsApp message from order
 */
function generateWhatsAppMessage(customerName, items, total) {
  const itemsList = items
    .map((item) => `• ${item.name} x${item.quantity}`)
    .join('\n');

  return `Hi ${customerName},\n\nYour order:\n${itemsList}\n\nTotal: RM${total.toFixed(2)}\n\nThank you!`;
}

/**
 * Get all orders
 */
async function getAllOrders() {
  return readOrders();
}

/**
 * Create a new order
 */
async function addOrder(orderData) {
  const orders = await readOrders();

  const newOrder = {
    id: Date.now().toString(),
    customerName: orderData.customerName,
    items: orderData.items,
    total: orderData.total,
    marks: orderData.marks || [],
    paymentMethod: orderData.paymentMethod || null,
    status: 'pending',
    whatsappMessage: generateWhatsAppMessage(
      orderData.customerName,
      orderData.items,
      orderData.total
    ),
    createdAt: new Date().toISOString(),
  };

  orders.push(newOrder);
  await writeOrders(orders);

  return newOrder;
}

/**
 * Update order (status, payment method, marks, etc.)
 */
async function updateOrder(orderId, updateData) {
  const orders = await readOrders();
  const orderIndex = orders.findIndex((order) => order.id === orderId);

  if (orderIndex === -1) {
    return null;
  }

  orders[orderIndex] = {
    ...orders[orderIndex],
    ...updateData,
    id: orders[orderIndex].id,
    createdAt: orders[orderIndex].createdAt,
    updatedAt: new Date().toISOString(),
  };

  await writeOrders(orders);

  return orders[orderIndex];
}

/**
 * Update order status to completed
 */
async function updateOrderStatus(orderId, status) {
  return updateOrder(orderId, { status });
}

export { getAllOrders, addOrder, updateOrderStatus, updateOrder, generateWhatsAppMessage };