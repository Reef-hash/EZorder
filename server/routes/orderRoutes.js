import express from 'express';
import { getOrders, createOrder, updateOrder } from '../controllers/orderController.js';

const router = express.Router();

// GET /api/orders - Get all orders
router.get('/', getOrders);

// POST /api/orders - Create new order
router.post('/', createOrder);

// PATCH /api/orders/:id - Update order status
router.patch('/:id', updateOrder);

export default router;