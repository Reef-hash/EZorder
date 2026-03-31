import express from 'express';
import {
  getMarks,
  createMark,
  getMark,
  updateMark,
  deleteMark,
} from '../controllers/markController.js';

const router = express.Router();

// GET /api/marks - Get all marks
router.get('/', getMarks);

// POST /api/marks - Create new mark
router.post('/', createMark);

// GET /api/marks/:id - Get single mark
router.get('/:id', getMark);

// PUT /api/marks/:id - Update mark
router.put('/:id', updateMark);

// DELETE /api/marks/:id - Delete mark
router.delete('/:id', deleteMark);

export default router;
