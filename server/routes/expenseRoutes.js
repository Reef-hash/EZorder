import express from 'express';
import { getExpenses, createExpense, deleteExpense } from '../controllers/expenseController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getExpenses);
router.post('/', createExpense);
router.delete('/:id', deleteExpense);

export default router;
