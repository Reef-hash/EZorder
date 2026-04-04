import express from 'express';
import { getProfitLoss, exportExcel, salesByItem, salesByCategory, salesByPayment, sstSummary } from '../controllers/reportController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/profit-loss', getProfitLoss);
router.get('/by-item', salesByItem);
router.get('/by-category', salesByCategory);
router.get('/by-payment', salesByPayment);
router.get('/sst', sstSummary);
router.get('/export', exportExcel);

export default router;
