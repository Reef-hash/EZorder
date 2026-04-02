import express from 'express';
import { getTables, createTable, updateTable, deleteTable } from '../controllers/tableController.js';

const router = express.Router();

router.get('/', getTables);
router.post('/', createTable);
router.patch('/:id', updateTable);
router.delete('/:id', deleteTable);

export default router;
