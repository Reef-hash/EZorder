import express from 'express';
import {
  getProducts,
  getProductsGrouped,
  createProduct,
  getProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.js';

const router = express.Router();

// GET /api/products - Get all products
router.get('/', getProducts);

// GET /api/products/grouped - Get products grouped by category
router.get('/grouped', getProductsGrouped);

// POST /api/products - Create new product
router.post('/', createProduct);

// GET /api/products/:id - Get single product
router.get('/:id', getProduct);

// PUT /api/products/:id - Update product
router.put('/:id', updateProduct);

// DELETE /api/products/:id - Delete product
router.delete('/:id', deleteProduct);

export default router;
