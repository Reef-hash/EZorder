import * as categoryModel from '../models/categoryModel.js';

/**
 * Get all categories
 * GET /api/categories
 */
async function getCategories(req, res) {
  try {
    const categories = await categoryModel.getAllCategories();
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Failed to load categories.' });
  }
}

/**
 * Create a new category
 * POST /api/categories
 * Body: { name, icon?, color? }
 */
async function createCategory(req, res) {
  try {
    const { name, icon, color } = req.body;

    // Validation
    if (!name) {
      return res.status(400).json({
        message: 'Category name is required.',
      });
    }

    const newCategory = await categoryModel.addCategory({
      name: name.trim(),
      icon: icon?.trim() || 'fa-folder',
      color: color?.trim() || '#8b5cf6',
    });

    res.status(201).json(newCategory);
  } catch (error) {
    console.error('Error creating category:', error);
    if (error.message.includes('already exists')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Failed to create category.' });
  }
}

/**
 * Get a single category by ID
 * GET /api/categories/:id
 */
async function getCategory(req, res) {
  try {
    const { id } = req.params;
    const category = await categoryModel.getCategoryById(id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found.' });
    }

    res.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ message: 'Failed to load category.' });
  }
}

/**
 * Update a category
 * PUT /api/categories/:id
 * Body: { name?, icon?, color? }
 */
async function updateCategory(req, res) {
  try {
    const { id } = req.params;
    const { name, icon, color } = req.body;

    const updatedCategory = await categoryModel.updateCategory(id, {
      name: name?.trim(),
      icon: icon?.trim(),
      color: color?.trim(),
    });

    if (!updatedCategory) {
      return res.status(404).json({ message: 'Category not found.' });
    }

    res.json(updatedCategory);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ message: 'Failed to update category.' });
  }
}

/**
 * Delete a category
 * DELETE /api/categories/:id
 */
async function deleteCategory(req, res) {
  try {
    const { id } = req.params;
    const deletedCategory = await categoryModel.deleteCategory(id);

    if (!deletedCategory) {
      return res.status(404).json({ message: 'Category not found.' });
    }

    res.json({ message: 'Category deleted successfully.', category: deletedCategory });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ message: 'Failed to delete category.' });
  }
}

export {
  getCategories,
  createCategory,
  getCategory,
  updateCategory,
  deleteCategory,
};
