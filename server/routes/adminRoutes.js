import express from 'express';
import { getStats, getUsers, updateUserPlan } from '../controllers/adminController.js';

const router = express.Router();

router.get('/stats', getStats);
router.get('/users', getUsers);
router.patch('/users/:id/plan', updateUserPlan);

export default router;
