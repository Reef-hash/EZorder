import express from 'express';
import { getProfitLoss, exportExcel } from '../controllers/reportController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/profit-loss', getProfitLoss);
router.get('/export', exportExcel);

export default router;
