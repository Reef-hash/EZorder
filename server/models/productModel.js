import { promises as fs } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const productsFilePath = join(__dirname, '..', 'data', 'products.json');

/**
 * Read all products from JSON file
 */
async function readProducts() {
  try {
    const fileContent = await fs.readFile(productsFilePath, 'utf-8');
    const parsedProducts = JSON.parse(fileContent);
    return Array.isArray(parsedProducts) ? parsedProducts : [];
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

/**
 * Write products back to JSON file
 */
async function writeProducts(products) {
  await fs.writeFile(productsFilePath, JSON.stringify(products, null, 2), 'utf-8');
}

/**
 * Get all products
 */
async function getAllProducts() {
  const products = await readProducts();
  return products.sort((a, b) => a.category.localeCompare(b.category));
}

/**
 * Create a new product
 */
async function addProduct(productData) {
  const products = await readProducts();

  const newProduct = {
    id: Date.now().toString(),
    name: productData.name,
    category: productData.category,
    price: parseFloat(productData.price),
    promoPrice: productData.promoPrice ? parseFloat(productData.promoPrice) : null,
    promoEnabled: productData.promoEnabled || false,
    imageUrl: productData.imageUrl || null,
    createdAt: new Date().toISOString(),
  };

  products.push(newProduct);
  await writeProducts(products);

  return newProduct;
}

/**
 * Get product by ID
 */
async function getProductById(productId) {
  const products = await readProducts();
  return products.find((p) => p.id === productId) || null;
}

/**
 * Update a product
 */
async function updateProduct(productId, productData) {
  const products = await readProducts();
  const index = products.findIndex((p) => p.id === productId);

  if (index === -1) {
    return null;
  }

  const updatedProduct = {
    ...products[index],
    ...productData,
    id: products[index].id,
    createdAt: products[index].createdAt,
    updatedAt: new Date().toISOString(),
  };

  products[index] = updatedProduct;
  await writeProducts(products);

  return updatedProduct;
}

/**
 * Delete a product
 */
async function deleteProduct(productId) {
  const products = await readProducts();
  const index = products.findIndex((p) => p.id === productId);

  if (index === -1) {
    return null;
  }

  const deletedProduct = products[index];
  products.splice(index, 1);
  await writeProducts(products);

  return deletedProduct;
}

/**
 * Get products grouped by category
 */
async function getProductsByCategory() {
  const products = await readProducts();
  const grouped = {};

  products.forEach((product) => {
    if (!grouped[product.category]) {
      grouped[product.category] = [];
    }
    grouped[product.category].push(product);
  });

  return grouped;
}

export {
  getAllProducts,
  addProduct,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductsByCategory,
};
