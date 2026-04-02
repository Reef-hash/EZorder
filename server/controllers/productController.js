import * as productModel from '../models/productModel.js';

/**
 * Get all products
 * GET /api/products
 */
async function getProducts(req, res) {
  try {
    const products = await productModel.getAllProducts(req.user._id);
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Failed to load products.' });
  }
}

/**
 * Get products grouped by category
 * GET /api/products/grouped
 */
async function getProductsGrouped(req, res) {
  try {
    const grouped = await productModel.getProductsByCategory(req.user._id);
    res.json(grouped);
  } catch (error) {
    console.error('Error fetching grouped products:', error);
    res.status(500).json({ message: 'Failed to load products.' });
  }
}

/**
 * Create a new product
 * POST /api/products
 * Body: { name, category, price, promoPrice?, promoEnabled?, imageUrl? }
 */
async function createProduct(req, res) {
  try {
    const { name, category, price, promoPrice, promoEnabled, imageUrl } = req.body;

    // Validation
    if (!name || !category || !price) {
      return res.status(400).json({
        message: 'name, category, and price are required.',
      });
    }

    if (isNaN(price) || price < 0) {
      return res.status(400).json({
        message: 'price must be a valid positive number.',
      });
    }

    if (promoPrice && (isNaN(promoPrice) || promoPrice < 0)) {
      return res.status(400).json({
        message: 'promoPrice must be a valid positive number.',
      });
    }

    const newProduct = await productModel.addProduct({
      name: name.trim(),
      category: category.trim(),
      price,
      promoPrice,
      promoEnabled,
      imageUrl,
    }, req.user._id);

    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Failed to create product.' });
  }
}

/**
 * Get a single product by ID
 * GET /api/products/:id
 */
async function getProduct(req, res) {
  try {
    const { id } = req.params;
    const product = await productModel.getProductById(id, req.user._id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Failed to load product.' });
  }
}

/**
 * Update a product
 * PUT /api/products/:id
 * Body: { name?, category?, price?, promoPrice?, imageUrl? }
 */
async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const { name, category, price, promoPrice, imageUrl } = req.body;

    // Validate numeric fields if provided
    if (price && (isNaN(price) || price < 0)) {
      return res.status(400).json({
        message: 'price must be a valid positive number.',
      });
    }

    if (promoPrice && (isNaN(promoPrice) || promoPrice < 0)) {
      return res.status(400).json({
        message: 'promoPrice must be a valid positive number.',
      });
    }

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (category) updateData.category = category.trim();
    if (price) updateData.price = price;
    if (promoPrice !== undefined) updateData.promoPrice = promoPrice;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (req.body.disabled !== undefined) updateData.disabled = req.body.disabled;
    if (req.body.promoEnabled !== undefined) updateData.promoEnabled = req.body.promoEnabled;

    const updatedProduct = await productModel.updateProduct(id, updateData, req.user._id);

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Failed to update product.' });
  }
}

/**
 * Delete a product
 * DELETE /api/products/:id
 */
async function deleteProduct(req, res) {
  try {
    const { id } = req.params;
    const deletedProduct = await productModel.deleteProduct(id, req.user._id);

    if (!deletedProduct) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    res.json({ message: 'Product deleted successfully.', product: deletedProduct });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Failed to delete product.' });
  }
}

export {
  getProducts,
  getProductsGrouped,
  createProduct,
  getProduct,
  updateProduct,
  deleteProduct,
};
