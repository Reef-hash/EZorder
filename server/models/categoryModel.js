import { promises as fs } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const categoriesFilePath = join(__dirname, '..', 'data', 'categories.json');

/**
 * Read all categories from JSON file
 */
async function readCategories() {
  try {
    const fileContent = await fs.readFile(categoriesFilePath, 'utf-8');
    const parsedCategories = JSON.parse(fileContent);
    return Array.isArray(parsedCategories) ? parsedCategories : [];
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

/**
 * Write categories back to JSON file
 */
async function writeCategories(categories) {
  await fs.writeFile(categoriesFilePath, JSON.stringify(categories, null, 2), 'utf-8');
}

/**
 * Get all categories
 */
async function getAllCategories() {
  const categories = await readCategories();
  return categories.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Add a new category
 */
async function addCategory(categoryData) {
  const categories = await readCategories();

  // Check if category already exists
  if (categories.some(c => c.name.toLowerCase() === categoryData.name.toLowerCase())) {
    throw new Error('Category already exists');
  }

  const newCategory = {
    id: Date.now().toString(),
    name: categoryData.name,
    icon: categoryData.icon || 'fa-folder',
    color: categoryData.color || '#8b5cf6',
    createdAt: new Date().toISOString(),
  };

  categories.push(newCategory);
  await writeCategories(categories);

  return newCategory;
}

/**
 * Get category by ID
 */
async function getCategoryById(categoryId) {
  const categories = await readCategories();
  return categories.find((c) => c.id === categoryId) || null;
}

/**
 * Update a category
 */
async function updateCategory(categoryId, categoryData) {
  const categories = await readCategories();
  const index = categories.findIndex((c) => c.id === categoryId);

  if (index === -1) {
    return null;
  }

  const updatedCategory = {
    ...categories[index],
    ...categoryData,
    id: categories[index].id,
    createdAt: categories[index].createdAt,
    updatedAt: new Date().toISOString(),
  };

  categories[index] = updatedCategory;
  await writeCategories(categories);

  return updatedCategory;
}

/**
 * Delete a category
 */
async function deleteCategory(categoryId) {
  const categories = await readCategories();
  const index = categories.findIndex((c) => c.id === categoryId);

  if (index === -1) {
    return null;
  }

  const deletedCategory = categories[index];
  categories.splice(index, 1);
  await writeCategories(categories);

  return deletedCategory;
}

export {
  getAllCategories,
  addCategory,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
