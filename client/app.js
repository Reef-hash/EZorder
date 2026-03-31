// ============================================
// STATE MANAGEMENT
// ============================================
const state = {
  user: null,
  products: [],
  orders: [],
  marks: [],
  categories: [],
  currentOrder: {
    customerName: '',
    items: [],
    marks: []
  },
  selectedCategory: null,
  currentPaymentMethod: null,
  currentOrderIdForPayment: null
};

// ============================================
// DOM ELEMENTS
// ============================================
const loginPage = document.getElementById('login-page');
const appPage = document.getElementById('app-page');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');

const productForm = document.getElementById('product-form');
const orderForm = document.getElementById('order-form');
const categoriesContainer = document.getElementById('categories-container');
const orderItemsList = document.getElementById('order-items-list');
const customerNameInput = document.getElementById('customer-name');
const subtotalDisplay = document.getElementById('subtotal');
const totalDisplay = document.getElementById('total');
const whatsappMessageBox = document.getElementById('whatsapp-message-box');
const whatsappMessage = document.getElementById('whatsapp-message');
const confirmOrderBtn = document.getElementById('confirm-order-btn');
const clearOrderBtn = document.getElementById('clear-order-btn');
const noProductsMsg = document.getElementById('no-products');
const productsList = document.getElementById('products-list');

// Tab elements
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// History containers
const pendingOrdersContainer = document.getElementById('pending-orders');
const completedOrdersContainer = document.getElementById('completed-orders');
const cancelledOrdersContainer = document.getElementById('cancelled-orders');

// Marks elements
const markForm = document.getElementById('mark-form');
const marksList = document.getElementById('marks-list');

// Category elements
const categoryForm = document.getElementById('category-form');
const categoriesListContainer = document.getElementById('categories-list');
const categorySelectorContainer = document.getElementById('category-selector');
const addCategoryModal = document.getElementById('add-category-modal');

// Modal elements
const paymentModal = document.getElementById('payment-modal');
const marksModal = document.getElementById('marks-modal');
const marksSelection = document.getElementById('marks-selection');

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
  checkAuth();
  setupEventListeners();
});

function checkAuth() {
  const session = localStorage.getItem('session');
  
  if (session) {
    state.user = JSON.parse(session);
    showApp();
    loadCategories();
    loadProducts();
    loadOrders();
    loadMarks();
  } else {
    showLogin();
  }
}

function setupEventListeners() {
  // Login
  loginForm?.addEventListener('submit', handleLogin);
  logoutBtn?.addEventListener('click', handleLogout);

  // Tab navigation
  tabBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tabName = e.target.dataset.tab;
      switchTab(tabName);
    });
  });

  // Product form
  productForm?.addEventListener('submit', handleAddProduct);

  // Order form
  orderForm?.addEventListener('submit', handleConfirmOrder);
  clearOrderBtn?.addEventListener('click', handleClearOrder);

  // Customer name input for WhatsApp message
  customerNameInput?.addEventListener('input', updateWhatsAppMessage);

  // Promo price toggle
  const enablePromoCheckbox = document.getElementById('enable-promo');
  if (enablePromoCheckbox) {
    enablePromoCheckbox.addEventListener('change', (e) => {
      document.getElementById('product-promo-price').disabled = !e.target.checked;
    });
  }

  // Marks form
  markForm?.addEventListener('submit', handleAddMark);

  // Category form
  categoryForm?.addEventListener('submit', handleAddCategory);
}

// ============================================
// AUTHENTICATION
// ============================================
function showLogin() {
  loginPage.classList.remove('hidden');
  appPage.classList.add('hidden');
}

function showApp() {
  loginPage.classList.add('hidden');
  appPage.classList.remove('hidden');
}

async function handleLogin(e) {
  e.preventDefault();

  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value.trim();

  // Simple demo authentication (username: owner, password: password123)
  if (username === 'owner' && password === 'password123') {
    state.user = { username, loginTime: new Date().toISOString() };
    localStorage.setItem('session', JSON.stringify(state.user));
    
    loginForm.reset();
    showApp();
    await loadCategories();
    await loadProducts();
    await loadOrders();
    await loadMarks();
  } else {
    alert('❌ Invalid credentials. Demo: owner / password123');
  }
}

function handleLogout() {
  localStorage.removeItem('session');
  state.user = null;
  state.products = [];
  state.orders = [];
  state.marks = [];
  state.categories = [];
  state.currentOrder = { customerName: '', items: [], marks: [] };
  showLogin();
}

// ============================================
// TAB NAVIGATION
// ============================================
function switchTab(tabName) {
  // Update button states
  tabBtns.forEach(btn => {
    if (btn.dataset.tab === tabName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Update content visibility
  tabContents.forEach(content => {
    if (content.id === `${tabName}-tab`) {
      content.classList.remove('hidden');
    } else {
      content.classList.add('hidden');
    }
  });

  // Refresh order history if switched to that tab
  if (tabName === 'history') {
    renderOrderHistory();
  }
}

// ============================================
// PRODUCT MANAGEMENT
// ============================================

/**
 * Load all categories from backend
 */
async function loadCategories() {
  try {
    const response = await fetch('/api/categories');
    if (!response.ok) throw new Error('Failed to load categories');
    
    state.categories = await response.json();
    renderCategorySelector();
    renderCategoriesList();
  } catch (error) {
    console.error('Error loading categories:', error);
  }
}

/**
 * Load all products from backend
 */
async function loadProducts() {
  try {
    const response = await fetch('/api/products');
    if (!response.ok) throw new Error('Failed to load products');
    
    state.products = await response.json();
    renderProductsForOrder();
    renderProductsList();
  } catch (error) {
    console.error('Error loading products:', error);
  }
}

// ============================================
// MARKS MANAGEMENT
// ============================================

/**
 * Load all marks from backend
 */
async function loadMarks() {
  try {
    const response = await fetch('/api/marks');
    if (!response.ok) throw new Error('Failed to load marks');
    
    state.marks = await response.json();
    renderMarks();
  } catch (error) {
    console.error('Error loading marks:', error);
  }
}

/**
 * Add a new mark - Simplified (name only)
 */
async function handleAddMark(e) {
  e.preventDefault();

  const name = document.getElementById('mark-name').value.trim();

  if (!name) {
    alert('❌ Please enter a mark name');
    return;
  }

  try {
    const response = await fetch('/api/marks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });

    if (!response.ok) throw new Error('Failed to add mark');

    markForm.reset();
    await loadMarks();
    alert('✓ Mark added successfully!');
  } catch (error) {
    alert('❌ Error adding mark: ' + error.message);
  }
}

/**
 * Render all marks with delete buttons
 */
function renderMarks() {
  if (state.marks.length === 0) {
    marksList.innerHTML = '<p class="text-slate-400">No marks yet. Create one to get started!</p>';
    return;
  }

  const colorMap = {
    'red': 'text-red-400 bg-red-500/20 border-red-500/30',
    'amber': 'text-amber-400 bg-amber-500/20 border-amber-500/30',
    'blue': 'text-blue-400 bg-blue-500/20 border-blue-500/30',
    'purple': 'text-purple-400 bg-purple-500/20 border-purple-500/30',
    'green': 'text-green-400 bg-green-500/20 border-green-500/30',
    'rose': 'text-rose-400 bg-rose-500/20 border-rose-500/30'
  };

  marksList.innerHTML = state.marks
    .map(mark => {
      const colorClass = colorMap[mark.color] || 'text-slate-400 bg-slate-500/20';
      return `
        <div class="glass-effect rounded-lg p-3 border border-slate-600 flex items-center justify-between hover:border-purple-500/50 transition">
          <div class="flex items-center gap-3 flex-1">
            <span class="${colorClass} px-3 py-2 rounded border"><i class="fas fa-${mark.icon}"></i></span>
            <span class="font-semibold text-slate-100">${escapeHtml(mark.name)}</span>
          </div>
          <button class="bg-red-600/20 hover:bg-red-600/30 text-red-400 px-3 py-1 rounded text-sm font-semibold transition" onclick="deleteMark('${mark.id}')" title="Delete mark"><i class="fas fa-trash-alt"></i></button>
        </div>
      `;
    })
    .join('');
}

/**
 * Delete a mark
 */
async function deleteMark(markId) {
  if (!confirm('Are you sure you want to delete this mark?')) return;

  try {
    const response = await fetch(`/api/marks/${markId}`, {
      method: 'DELETE'
    });

    if (!response.ok) throw new Error('Failed to delete mark');

    await loadMarks();
    alert('✓ Mark deleted!');
  } catch (error) {
    alert('❌ Error: ' + error.message);
  }
}

/**
 * Render products grouped by category for the order-taking tab
 */
function renderProductsForOrder() {
  if (state.products.length === 0) {
    noProductsMsg.style.display = 'block';
    categoriesContainer.innerHTML = '';
    return;
  }

  noProductsMsg.style.display = 'none';

  // Group products by category
  const grouped = {};
  state.products.forEach(product => {
    if (!grouped[product.category]) {
      grouped[product.category] = [];
    }
    grouped[product.category].push(product);
  });

  // Render each category
  categoriesContainer.innerHTML = Object.entries(grouped)
    .map(([category, products]) => {
      const productsHtml = products
        .map(product => {
          const displayPrice = product.promoPrice && product.promoEnabled ? product.promoPrice : product.price;
          const priceClass = product.promoPrice && product.promoEnabled ? 'line-through text-sm text-slate-500' : '';
          const originalPrice = product.promoPrice && product.promoEnabled
            ? `<span class="${priceClass}">RM${product.price.toFixed(2)}</span> `
            : '';

          return `
            <div class="glass-effect rounded-lg p-4 cursor-pointer hover:border-emerald-500/50 transition transform hover:-translate-y-1 border border-slate-600 hover:shadow-lg hover:shadow-emerald-500/20" data-product-id="${product.id}" onclick="addToOrder(this)">
              <div class="font-semibold text-slate-100 mb-2">${escapeHtml(product.name)}</div>
              <div class="text-sm text-slate-400">
                ${originalPrice}
                <span class="text-emerald-400 font-semibold">RM${displayPrice.toFixed(2)}</span>
              </div>
            </div>
          `;
        })
        .join('');

      return `
        <div>
          <h3 class="text-lg font-semibold text-emerald-400 mb-3">${escapeHtml(category)}</h3>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-3">${productsHtml}</div>
        </div>
      `;
    })
    .join('');

  // Update category datalist for form
  const categories = Array.from(new Set(state.products.map(p => p.category)));
  document.getElementById('category-list').innerHTML = categories
    .map(cat => `<option value="${escapeHtml(cat)}"></option>`)
    .join('');
}

/**
 * Render products list for the manage tab with edit/delete buttons
 */
function renderProductsList() {
  if (state.products.length === 0) {
    productsList.innerHTML = '<p class="text-slate-400 col-span-full text-center py-8">No products yet</p>';
    return;
  }

  productsList.innerHTML = state.products
    .map(product => {
      const displayPrice = product.promoPrice && product.promoEnabled ? product.promoPrice : product.price;
      const promoStatus = product.promoPrice && product.promoEnabled ? '✓ Promo Active' : 'Regular';
      
      return `
        <div class="glass-effect rounded-lg p-4 border border-slate-600 hover:border-emerald-500/50 transition">
          <div class="mb-3">
            <h3 class="font-semibold text-slate-100">${escapeHtml(product.name)}</h3>
            <p class="text-sm text-slate-400">${escapeHtml(product.category)}</p>
          </div>
          
          <div class="mb-3 space-y-1">
            <div class="flex justify-between text-sm">
              <span class="text-slate-400">Price:</span>
              <span class="text-slate-200">RM${product.price.toFixed(2)}</span>
            </div>
            ${product.promoPrice ? `
            <div class="flex justify-between text-sm">
              <span class="text-slate-400">Promo:</span>
              <span class="text-emerald-400">RM${product.promoPrice.toFixed(2)}</span>
            </div>
            ` : ''}
            <div class="flex justify-between text-sm">
              <span class="text-slate-400">Status:</span>
              <span class="text-emerald-400 text-xs bg-emerald-500/20 px-2 py-1 rounded">${promoStatus}</span>
            </div>
          </div>

          <div class="flex gap-2">
            <button class="flex-1 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 py-2 rounded text-sm font-semibold transition flex items-center justify-center gap-1" onclick="editProduct('${product.id}')"><i class="fas fa-pen"></i> Edit</button>
            <button class="flex-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 py-2 rounded text-sm font-semibold transition flex items-center justify-center gap-1" onclick="deleteProduct('${product.id}')"><i class="fas fa-trash-alt"></i> Delete</button>
          </div>
        </div>
      `;
    })
    .join('');
}

/**
 * Add a new product
 */
async function handleAddProduct(e) {
  e.preventDefault();

  const name = document.getElementById('product-name').value.trim();
  const category = document.getElementById('product-category').value.trim();
  const price = parseFloat(document.getElementById('product-price').value);
  const enablePromo = document.getElementById('enable-promo').checked;
  const promoPrice = enablePromo && document.getElementById('product-promo-price').value
    ? parseFloat(document.getElementById('product-promo-price').value)
    : null;

  if (!name || !category || !price) {
    alert('❌ Please fill in all required fields');
    return;
  }

  try {
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        category,
        price,
        promoPrice,
        promoEnabled: enablePromo
      })
    });

    if (!response.ok) throw new Error('Failed to add product');

    productForm.reset();
    document.getElementById('enable-promo').checked = false;
    document.getElementById('product-promo-price').disabled = true;
    state.selectedCategory = null;
    await loadProducts();
    renderCategorySelector();
    alert('✓ Product added successfully!');
  } catch (error) {
    alert('❌ Error adding product: ' + error.message);
  }
}

/**
 * Edit a product
 */
async function editProduct(productId) {
  const product = state.products.find(p => p.id === productId);
  if (!product) return;

  const newName = prompt('Product Name:', product.name);
  if (newName === null) return;

  const newPrice = prompt('Price (RM):', product.price);
  if (newPrice === null) return;

  try {
    const response = await fetch(`/api/products/${productId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newName.trim(),
        price: parseFloat(newPrice)
      })
    });

    if (!response.ok) throw new Error('Failed to update product');

    await loadProducts();
    alert('✓ Product updated!');
  } catch (error) {
    alert('❌ Error: ' + error.message);
  }
}

/**
 * Delete a product
 */
async function deleteProduct(productId) {
  if (!confirm('Are you sure you want to delete this product?')) return;

  try {
    const response = await fetch(`/api/products/${productId}`, {
      method: 'DELETE'
    });

    if (!response.ok) throw new Error('Failed to delete product');

    await loadProducts();
    alert('✓ Product deleted!');
  } catch (error) {
    alert('❌ Error: ' + error.message);
  }
}

// ============================================
// ORDER BUILDER
// ============================================

// ============================================
// CATEGORY MANAGEMENT
// ============================================

/**
 * Add a new category
 */
async function handleAddCategory(e) {
  e.preventDefault();

  const name = document.getElementById('category-name').value.trim();

  if (!name) {
    alert('❌ Please enter a category name');
    return;
  }

  try {
    const response = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add category');
    }

    categoryForm.reset();
    await loadCategories();
    await loadProducts();
    alert('✓ Category added successfully!');
  } catch (error) {
    alert('❌ Error: ' + error.message);
  }
}

/**
 * Delete a category
 */
async function deleteCategory(categoryId) {
  if (!confirm('Are you sure you want to delete this category?')) return;

  try {
    const response = await fetch(`/api/categories/${categoryId}`, {
      method: 'DELETE'
    });

    if (!response.ok) throw new Error('Failed to delete category');

    await loadCategories();
    await loadProducts();
    alert('✓ Category deleted!');
  } catch (error) {
    alert('❌ Error: ' + error.message);
  }
}

/**
 * Render category selector for product form
 */
function renderCategorySelector() {
  if (state.categories.length === 0) {
    categorySelectorContainer.innerHTML = '<p class="text-slate-400 text-sm">No categories yet</p>';
    return;
  }

  categorySelectorContainer.innerHTML = state.categories
    .map(cat => `
      <button type="button" onclick="selectCategory('${cat.id}', '${escapeHtml(cat.name)}')" class="px-4 py-2 rounded-lg font-semibold text-sm transition border-2 ${
        state.selectedCategory === cat.id 
          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300' 
          : 'border-slate-600 bg-slate-700/50 text-slate-300 hover:border-emerald-500'
      }">
        <i class="fas fa-${cat.icon}"></i> ${escapeHtml(cat.name)}
      </button>
    `)
    .join('');
}

/**
 * Select a category for the product form
 */
function selectCategory(categoryId, categoryName) {
  state.selectedCategory = categoryId;
  document.getElementById('product-category').value = categoryName;
  renderCategorySelector();
}

/**
 * Render categories list in manage tab
 */
function renderCategoriesList() {
  if (state.categories.length === 0) {
    categoriesListContainer.innerHTML = '<p class="text-slate-400">No categories yet. Create one to get started!</p>';
    return;
  }

  categoriesListContainer.innerHTML = state.categories
    .map(cat => `
      <div class="glass-effect rounded-lg p-4 border border-slate-600 hover:border-emerald-500/50 transition">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-3">
            <span class="text-2xl text-emerald-400"><i class="fas fa-${cat.icon}"></i></span>
            <div>
              <h3 class="font-semibold text-slate-100">${escapeHtml(cat.name)}</h3>
              <p class="text-xs text-slate-500">Created ${new Date(cat.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
        <button onclick="deleteCategory('${cat.id}')" class="w-full bg-red-600/20 hover:bg-red-600/30 text-red-400 py-2 rounded font-semibold text-sm transition flex items-center justify-center gap-2">
          <i class="fas fa-trash-alt"></i> Delete
        </button>
      </div>
    `)
    .join('');
}

/**
 * Open add category modal
 */
function openAddCategoryModal() {
  document.getElementById('modal-category-name').value = '';
  addCategoryModal.classList.remove('hidden');
}

/**
 * Close add category modal
 */
function closeAddCategoryModal() {
  addCategoryModal.classList.add('hidden');
}

/**
 * Add category from modal
 */
async function addCategoryFromModal() {
  const name = document.getElementById('modal-category-name').value.trim();

  if (!name) {
    alert('❌ Please enter a category name');
    return;
  }

  try {
    const response = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add category');
    }

    closeAddCategoryModal();
    await loadCategories();
    state.selectedCategory = null;
    renderCategorySelector();
  } catch (error) {
    alert('❌ Error: ' + error.message);
  }
}

/**
 * Add a product to the current order
 */
function addToOrder(productElement) {
  const productId = productElement.dataset.productId;
  const product = state.products.find(p => p.id === productId);
  
  if (!product) return;

  // Check if product already in order
  const existingItem = state.currentOrder.items.find(item => item.id === productId);
  
  if (existingItem) {
    existingItem.quantity++;
  } else {
    const displayPrice = product.promoPrice && product.promoEnabled ? product.promoPrice : product.price;
    state.currentOrder.items.push({
      id: product.id,
      name: product.name,
      price: displayPrice,
      quantity: 1
    });
  }

  renderCurrentOrder();
  updateWhatsAppMessage();
}

/**
 * Remove item from current order
 */
function removeFromOrder(productId) {
  state.currentOrder.items = state.currentOrder.items
    .filter(item => item.id !== productId);
  renderCurrentOrder();
  updateWhatsAppMessage();
}

/**
 * Update quantity of an item
 */
function updateQuantity(productId, change) {
  const item = state.currentOrder.items.find(i => i.id === productId);
  if (!item) return;

  item.quantity += change;
  
  if (item.quantity <= 0) {
    removeFromOrder(productId);
  } else {
    renderCurrentOrder();
    updateWhatsAppMessage();
  }
}

/**
 * Render current order items and totals
 */
function renderCurrentOrder() {
  const { items, marks } = state.currentOrder;

  // Update items list
  if (items.length === 0) {
    orderItemsList.innerHTML = '<p class="text-slate-500 text-sm">No items added yet</p>';
  } else {
    orderItemsList.innerHTML = items
      .map(item => {
        const itemTotal = item.price * item.quantity;
        return `
          <div class="flex items-center justify-between bg-slate-700/30 p-3 rounded border border-slate-600 mb-2">
            <div class="flex-1">
              <div class="font-semibold text-slate-100">${escapeHtml(item.name)}</div>
              <div class="text-sm text-slate-400">RM${item.price.toFixed(2)} each</div>
            </div>
            <div class="flex items-center gap-2">
              <button type="button" class="bg-slate-600 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded transition" onclick="updateQuantity('${item.id}', -1)"><i class="fas fa-minus"></i></button>
              <span class="w-8 text-center font-semibold text-slate-100">${item.quantity}</span>
              <button type="button" class="bg-slate-600 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded transition" onclick="updateQuantity('${item.id}', 1)"><i class="fas fa-plus"></i></button>
              <button type="button" class="bg-red-600/20 hover:bg-red-600/30 text-red-400 px-2 py-1 rounded transition" onclick="removeFromOrder('${item.id}')"><i class="fas fa-times"></i></button>
            </div>
          </div>
        `;
      })
      .join('');
  }

  // Update marks display
  const marksSection = document.getElementById('order-marks-section');
  const marksDisplay = document.getElementById('order-marks-display');
  
  if (marks.length === 0) {
    marksSection.classList.add('hidden');
  } else {
    marksSection.classList.remove('hidden');
    const colorMap = {
      'red': 'text-red-400 bg-red-500/20',
      'amber': 'text-amber-400 bg-amber-500/20',
      'blue': 'text-blue-400 bg-blue-500/20',
      'purple': 'text-purple-400 bg-purple-500/20',
      'green': 'text-green-400 bg-green-500/20',
      'rose': 'text-rose-400 bg-rose-500/20'
    };
    
    marksDisplay.innerHTML = marks
      .map(markId => {
        const mark = state.marks.find(m => m.id === markId);
        if (!mark) return '';
        const colorClass = colorMap[mark.color] || 'text-slate-400 bg-slate-500/20';
        return `
          <span class="text-xs font-semibold px-3 py-1 rounded ${colorClass}">
            <i class="fas fa-${mark.icon}"></i> ${escapeHtml(mark.name)}
            <button type="button" onclick="toggleMark('${markId}')" class="ml-2 hover:opacity-75 transition"><i class="fas fa-times"></i></button>
          </span>
        `;
      })
      .join('');
  }

  // Update totals
  updateOrderTotals();
  confirmOrderBtn.disabled = items.length === 0;
}

/**
 * Calculate and display order totals
 */
function updateOrderTotals() {
  const total = state.currentOrder.items.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);

  subtotalDisplay.textContent = `RM ${total.toFixed(2)}`;
  totalDisplay.textContent = `RM ${total.toFixed(2)}`;
}

/**
 * Clear the current order
 */
function handleClearOrder() {
  state.currentOrder = {
    customerName: '',
    items: [],
    marks: []
  };
  customerNameInput.value = '';
  renderCurrentOrder();
  whatsappMessageBox.classList.add('hidden');
}

// ============================================
// WHATSAPP MESSAGE GENERATION
// ============================================

/**
 * Update WhatsApp message preview
 */
function updateWhatsAppMessage() {
  const { items } = state.currentOrder;
  const customerName = customerNameInput.value.trim() || 'Customer';

  if (items.length === 0) {
    whatsappMessageBox.classList.add('hidden');
    return;
  }

  const itemsList = items
    .map(item => `• ${escapeHtml(item.name)} x${item.quantity}`)
    .join('\n');

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const message = `Hi ${escapeHtml(customerName)},\n\nYour order:\n${itemsList}\n\nTotal: RM${total.toFixed(2)}\n\nThank you!`;

  whatsappMessage.textContent = message;
  whatsappMessageBox.classList.remove('hidden');
}

function copyToClipboard() {
  const text = whatsappMessage.textContent;
  navigator.clipboard.writeText(text).then(() => {
    alert('✓ Message copied to clipboard!');
  }).catch(() => {
    alert('❌ Failed to copy message');
  });
}

// ============================================
// ORDER CONFIRMATION & TRACKING
// ============================================

/**
 * Confirm and save the current order
 */
async function handleConfirmOrder(e) {
  e.preventDefault();

  const customerName = customerNameInput.value.trim();
  const { items, marks } = state.currentOrder;

  if (!customerName) {
    alert('❌ Please enter customer name');
    return;
  }

  if (items.length === 0) {
    alert('❌ Please add items to the order');
    return;
  }

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  try {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName,
        items,
        marks,
        total
      })
    });

    if (!response.ok) throw new Error('Failed to save order');

    // Clear form and reload orders
    handleClearOrder();
    await loadOrders();
    alert('✓ Order saved successfully!');
  } catch (error) {
    alert('❌ Error saving order: ' + error.message);
  }
}

/**
 * Load all orders from backend
 */
async function loadOrders() {
  try {
    const response = await fetch('/api/orders');
    if (!response.ok) throw new Error('Failed to load orders');
    
    state.orders = await response.json();
  } catch (error) {
    console.error('Error loading orders:', error);
  }
}

/**
 * Render order history separated by status
 */
function renderOrderHistory() {
  const pending = state.orders.filter(o => o.status === 'pending');
  const completed = state.orders.filter(o => o.status === 'completed');
  const cancelled = state.orders.filter(o => o.status === 'cancelled');

  // Sort each group by creation date (newest first)
  [pending, completed, cancelled].forEach(arr => {
    arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  });

  // Render pending orders
  if (pending.length === 0) {
    pendingOrdersContainer.innerHTML = '<p class="text-slate-400">No pending orders</p>';
  } else {
    pendingOrdersContainer.innerHTML = pending.map(renderOrderCard).join('');
  }

  // Render completed orders
  if (completed.length === 0) {
    completedOrdersContainer.innerHTML = '<p class="text-slate-400">No completed orders</p>';
  } else {
    completedOrdersContainer.innerHTML = completed.map(renderOrderCard).join('');
  }

  // Render cancelled orders
  if (cancelled.length === 0) {
    cancelledOrdersContainer.innerHTML = '<p class="text-slate-400">No cancelled orders</p>';
  } else {
    cancelledOrdersContainer.innerHTML = cancelled.map(renderOrderCard).join('');
  }
}

/**
 * Render a single order card
 */
function renderOrderCard(order) {
  const total = order.total.toFixed(2);
  const itemsHtml = order.items
    .map(item => `<div class="text-sm text-slate-300">• ${escapeHtml(item.name)} x${item.quantity}</div>`)
    .join('');
  const createdDate = new Date(order.createdAt).toLocaleString();

  const statusColors = {
    pending: 'text-amber-400 bg-amber-500/20',
    completed: 'text-emerald-400 bg-emerald-500/20',
    cancelled: 'text-red-400 bg-red-500/20'
  };

  // Payment method icon and text
  const paymentDisplay = order.paymentMethod 
    ? `<div class="text-sm text-slate-400 mb-2">Payment: <span class="text-slate-200 font-semibold">${order.paymentMethod === 'cash' ? '<i class="fas fa-money-bill"></i> Cash' : '<i class="fas fa-qrcode"></i> QR Code'}</span></div>`
    : '';

  // Render marks if any
  const marksHtml = order.marks && order.marks.length > 0 
    ? `<div class="mb-2 flex flex-wrap gap-2">${order.marks.map(markId => {
      const mark = state.marks.find(m => m.id === markId);
      if (!mark) return '';
      const colorMap = {
        'red': 'text-red-400 bg-red-500/20',
        'amber': 'text-amber-400 bg-amber-500/20',
        'blue': 'text-blue-400 bg-blue-500/20',
        'purple': 'text-purple-400 bg-purple-500/20',
        'green': 'text-green-400 bg-green-500/20',
        'rose': 'text-rose-400 bg-rose-500/20'
      };
      const colorClass = colorMap[mark.color] || 'text-slate-400 bg-slate-500/20';
      return `<span class="text-xs font-semibold px-2 py-1 rounded ${colorClass}"><i class="fas fa-${mark.icon}"></i> ${escapeHtml(mark.name)}</span>`;
    }).join('')}</div>`
    : '';

  return `
    <div class="glass-effect rounded-lg p-4 border border-slate-600 mb-4">
      <div class="flex justify-between items-start mb-3">
        <div>
          <div class="font-semibold text-slate-100">${escapeHtml(order.customerName)}</div>
          <div class="text-xs text-slate-500">${createdDate}</div>
        </div>
        <span class="text-xs font-semibold px-3 py-1 rounded ${statusColors[order.status]}">${order.status.toUpperCase()}</span>
      </div>
      
      <div class="bg-slate-700/30 rounded p-3 mb-3 border border-slate-600">
        ${itemsHtml}
      </div>

      ${marksHtml}
      ${paymentDisplay}
      
      <div class="flex justify-between items-center mb-3">
        <span class="text-slate-400">Total:</span>
        <span class="text-lg font-bold text-emerald-400">RM${total}</span>
      </div>

      <div class="flex gap-2">
        ${order.status === 'pending' 
          ? `<button class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded text-sm font-semibold transition flex items-center justify-center gap-1" onclick="showPaymentModal('${order.id}')"><i class="fas fa-check-circle"></i> Mark Complete</button>
             <button class="flex-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 py-2 rounded text-sm font-semibold transition flex items-center justify-center gap-1" onclick="cancelOrder('${order.id}')"><i class="fas fa-ban"></i> Cancel</button>` 
          : ''
        }
        <button class="flex-1 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 py-2 rounded text-sm font-semibold transition flex items-center justify-center gap-1" onclick="copyOrderMessage('${order.id}')"><i class="fas fa-clipboard"></i> Copy Message</button>
      </div>
    </div>
  `;
}

/**
 * Mark an order as completed
 */
/**
 * Show payment method modal before marking order as completed
 */
function showPaymentModal(orderId) {
  state.currentOrderIdForPayment = orderId;
  paymentModal.classList.remove('hidden');
}

/**
 * Close payment modal
 */
function closePaymentModal() {
  paymentModal.classList.add('hidden');
  state.currentOrderIdForPayment = null;
}

/**
 * Select payment method and complete order
 */
async function selectPaymentMethod(method) {
  const orderId = state.currentOrderIdForPayment;
  if (!orderId) return;

  try {
    const response = await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        status: 'completed',
        paymentMethod: method
      })
    });

    if (!response.ok) throw new Error('Failed to update order');

    closePaymentModal();
    await loadOrders();
    renderOrderHistory();
    alert('✓ Order marked as completed!');
  } catch (error) {
    alert('❌ Error: ' + error.message);
  }
}

/**
 * Cancel an order
 */
async function cancelOrder(orderId) {
  if (!confirm('Are you sure you want to cancel this order?')) return;

  try {
    const response = await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' })
    });

    if (!response.ok) throw new Error('Failed to cancel order');

    await loadOrders();
    renderOrderHistory();
    alert('✓ Order cancelled!');
  } catch (error) {
    alert('❌ Error: ' + error.message);
  }
}

/**
 * Mark an order as completed (deprecated - use selectPaymentMethod instead)
 */
async function markOrderCompleted(orderId) {
  showPaymentModal(orderId);
}

/**
 * Copy order WhatsApp message
 */
function copyOrderMessage(orderId) {
  const order = state.orders.find(o => o.id === orderId);
  if (!order) return;

  const itemsList = order.items.map(item => `• ${item.name} x${item.quantity}`).join('\n');
  const message = `Hi ${order.customerName},\n\nYour order:\n${itemsList}\n\nTotal: RM${order.total.toFixed(2)}\n\nThank you!`;

  navigator.clipboard.writeText(message).then(() => {
    alert('✓ Message copied!');
  }).catch(() => {
    alert('❌ Failed to copy');
  });
}

// ============================================
// MARKS MODAL FUNCTIONS
// ============================================

/**
 * Open marks selection modal for taking order
 */
function openMarksModal() {
  if (state.marks.length === 0) {
    alert('⚠️ No marks available. Create some in the Manage Products tab first!');
    return;
  }

  const colorMap = {
    'red': 'text-red-400 bg-red-500/20',
    'amber': 'text-amber-400 bg-amber-500/20',
    'blue': 'text-blue-400 bg-blue-500/20',
    'purple': 'text-purple-400 bg-purple-500/20',
    'green': 'text-green-400 bg-green-500/20',
    'rose': 'text-rose-400 bg-rose-500/20'
  };

  marksSelection.innerHTML = state.marks
    .map(mark => {
      const isSelected = state.currentOrder.marks.includes(mark.id);
      const colorClass = colorMap[mark.color] || 'text-slate-400 bg-slate-500/20';
      return `
        <label class="flex items-center gap-3 p-3 rounded-lg border-2 ${isSelected ? 'border-emerald-500 bg-emerald-500/20' : 'border-slate-600 bg-slate-700/30'} cursor-pointer hover:border-emerald-500 transition">
          <input type="checkbox" ${isSelected ? 'checked' : ''} onchange="toggleMark('${mark.id}')" class="w-4 h-4">
          <i class="fas fa-${mark.icon} ${colorClass} px-2 py-1 rounded text-sm"></i>
          <span class="font-semibold text-slate-100">${escapeHtml(mark.name)}</span>
        </label>
      `;
    })
    .join('');

  marksModal.classList.remove('hidden');
}

/**
 * Close marks modal
 */
function closeMarksModal() {
  marksModal.classList.add('hidden');
}

/**
 * Toggle a mark in the current order
 */
function toggleMark(markId) {
  const index = state.currentOrder.marks.indexOf(markId);
  if (index === -1) {
    state.currentOrder.marks.push(markId);
  } else {
    state.currentOrder.marks.splice(index, 1);
  }
  renderCurrentOrder();
}

/**
 * Confirm marks selection
 */
function confirmMarks() {
  closeMarksModal();
  renderCurrentOrder();
}

// ============================================
// UTILITIES
// ============================================

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
