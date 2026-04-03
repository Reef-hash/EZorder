import * as expenseModel from '../models/expenseModel.js';

// GET /api/expenses?from=&to=
export async function getExpenses(req, res) {
  try {
    const { from, to } = req.query;
    const expenses = await expenseModel.getExpenses(req.user._id, { from, to });
    res.json(expenses);
  } catch (error) {
    console.error('getExpenses error:', error);
    res.status(500).json({ message: 'Failed to fetch expenses.' });
  }
}

// POST /api/expenses
export async function createExpense(req, res) {
  try {
    const { date, category, description, amount, paymentMethod } = req.body;

    if (!description || amount == null) {
      return res.status(400).json({ message: 'description and amount are required.' });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      return res.status(400).json({ message: 'amount must be a non-negative number.' });
    }

    const expense = await expenseModel.addExpense(
      { date, category, description, amount: parsedAmount, paymentMethod },
      req.user._id
    );
    res.status(201).json(expense);
  } catch (error) {
    console.error('createExpense error:', error);
    res.status(500).json({ message: 'Failed to create expense.' });
  }
}

// DELETE /api/expenses/:id
export async function deleteExpense(req, res) {
  try {
    const { id } = req.params;
    const deleted = await expenseModel.deleteExpense(id, req.user._id);
    if (!deleted) return res.status(404).json({ message: 'Expense not found.' });
    res.json({ message: 'Deleted.' });
  } catch (error) {
    console.error('deleteExpense error:', error);
    res.status(500).json({ message: 'Failed to delete expense.' });
  }
}
