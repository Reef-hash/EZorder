import * as markModel from '../models/markModel.js';

/**
 * Get all marks
 * GET /api/marks
 */
async function getMarks(req, res) {
  try {
    const marks = await markModel.getAllMarks(req.user._id);
    res.json(marks);
  } catch (error) {
    console.error('Error fetching marks:', error);
    res.status(500).json({ message: 'Failed to load marks.' });
  }
}

/**
 * Create a new mark
 * POST /api/marks
 * Body: { name, icon?, color? }
 */
async function createMark(req, res) {
  try {
    const { name, icon, color } = req.body;

    // Validation - only name is required
    if (!name) {
      return res.status(400).json({
        message: 'Mark name is required.',
      });
    }

    const newMark = await markModel.addMark({
      name: name.trim(),
      icon: icon?.trim() || 'fa-tag',
      color: color?.trim() || '#8b5cf6',
    }, req.user._id);

    res.status(201).json(newMark);
  } catch (error) {
    console.error('Error creating mark:', error);
    res.status(500).json({ message: 'Failed to create mark.' });
  }
}

/**
 * Get a single mark by ID
 * GET /api/marks/:id
 */
async function getMark(req, res) {
  try {
    const { id } = req.params;
    const mark = await markModel.getMarkById(id, req.user._id);

    if (!mark) {
      return res.status(404).json({ message: 'Mark not found.' });
    }

    res.json(mark);
  } catch (error) {
    console.error('Error fetching mark:', error);
    res.status(500).json({ message: 'Failed to load mark.' });
  }
}

/**
 * Update a mark
 * PUT /api/marks/:id
 * Body: { name?, icon?, color? }
 */
async function updateMark(req, res) {
  try {
    const { id } = req.params;
    const { name, icon, color } = req.body;

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (icon) updateData.icon = icon.trim();
    if (color) updateData.color = color.trim();

    const updatedMark = await markModel.updateMark(id, updateData, req.user._id);

    if (!updatedMark) {
      return res.status(404).json({ message: 'Mark not found.' });
    }

    res.json(updatedMark);
  } catch (error) {
    console.error('Error updating mark:', error);
    res.status(500).json({ message: 'Failed to update mark.' });
  }
}

/**
 * Delete a mark
 * DELETE /api/marks/:id
 */
async function deleteMark(req, res) {
  try {
    const { id } = req.params;
    const deletedMark = await markModel.deleteMark(id, req.user._id);

    if (!deletedMark) {
      return res.status(404).json({ message: 'Mark not found.' });
    }

    res.json({ message: 'Mark deleted successfully.', mark: deletedMark });
  } catch (error) {
    console.error('Error deleting mark:', error);
    res.status(500).json({ message: 'Failed to delete mark.' });
  }
}

export {
  getMarks,
  createMark,
  getMark,
  updateMark,
  deleteMark,
};
