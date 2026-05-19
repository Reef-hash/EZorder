import express from 'express';
import { listStaff, createStaff, deleteStaff, toggleStaff } from '../controllers/staffController.js';

const router = express.Router();

router.get('/', listStaff);
router.post('/', createStaff);
router.delete('/:id', deleteStaff);
router.patch('/:id/toggle', toggleStaff);

export default router;
