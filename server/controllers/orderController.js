import * as orderModel from '../models/orderModel.js';

/**
 * Get all orders
 * GET /api/orders
 */
async function getOrders(req, res) {
  try {
    const orders = await orderModel.getAllOrders(req.user._id);
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Failed to load orders.' });
  }
}

/**
 * Create a new order
 * POST /api/orders
 * Body: { customerName, items: [{name, quantity, price}], total }
 */
async function createOrder(req, res) {
  try {
    const { customerName, items, total, marks, paymentMethod } = req.body;

    // Validation
    if (!customerName || !items || !Array.isArray(items) || items.length === 0 || !total) {
      return res.status(400).json({
        message: 'customerName, items (array), and total are required.',
      });
    }

    // Validate items
    for (const item of items) {
      if (!item.name || !item.quantity || !item.price) {
        return res.status(400).json({
          message: 'Each item must have name, quantity, and price.',
        });
      }

      if (item.quantity < 1) {
        return res.status(400).json({
          message: 'Item quantity must be at least 1.',
        });
      }
    }

    const newOrder = await orderModel.addOrder({
      customerName: customerName.trim(),
      items,
      total: parseFloat(total),
      marks: Array.isArray(marks) ? marks : [],
      paymentMethod: paymentMethod || null,
    }, req.user._id);

    res.status(201).json(newOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Failed to create order.' });
  }
}

/**
 * Update order status and payment method
 * PATCH /api/orders/:id
 * Body: { status?, paymentMethod? }
 */
async function updateOrder(req, res) {
  try {
    const { id } = req.params;
    const { status, paymentMethod } = req.body;

    if (!status && !paymentMethod) {
      return res.status(400).json({
        message: 'status or paymentMethod is required.',
      });
    }

    const validStatuses = ['pending', 'completed', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        message: `status must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (paymentMethod) updateData.paymentMethod = paymentMethod;

    const updatedOrder = await orderModel.updateOrder(id, updateData, req.user._id);

    if (!updatedOrder) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    res.json(updatedOrder);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ message: 'Failed to update order.' });
  }
}

export { getOrders, createOrder, updateOrder };