import express from 'express';
import { getAllTaxRules, createTaxRule, updateTaxRule, deleteTaxRule } from '../controllers/taxRuleController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getAllTaxRules);
router.post('/', createTaxRule);
router.patch('/:id', updateTaxRule);
router.delete('/:id', deleteTaxRule);

export default router;
