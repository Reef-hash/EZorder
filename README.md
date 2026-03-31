# EZOrder - Modern Order Management SaaS

Professional WhatsApp-based order management system for restaurants, cafes, and food businesses.

**Platform**: React + Next.js 14 | Node.js + Express | Tailwind CSS | Zustand  
**Status**: ✅ Production Ready | Highly Scalable

---

## 🎯 Project Structure

```
SaaS/
├── server/                  # Express.js Backend (Port 3000)
│   ├── models/             # Data models (products, orders, categories, marks)
│   ├── controllers/        # API business logic
│   ├── routes/             # API route definitions
│   ├── data/               # JSON data persistence
│   └── server.js           # Entry point
│
├── frontend/               # Next.js React Frontend (Port 3001) ⭐ NEW
│   ├── app/               # Next.js app directory (layouts, pages)
│   ├── components/        # Reusable React components
│   │   ├── tabs/         # OrderTab, ManageTab, HistoryTab
│   │   ├── forms/        # ProductForm, CategoryForm, MarkForm
│   │   ├── lists/        # ProductsList, CategoriesList, MarksList
│   │   └── modals/       # Payment, Marks selection modals
│   ├── lib/              # Utilities, hooks, state management
│   │   ├── store.ts      # Zustand global state
│   │   ├── api.ts        # Axios HTTP client
│   │   └── hooks/        # useAuth, useData custom hooks
│   └── public/            # Static assets
│
└── client/                # Legacy vanilla JS (archived, kept for reference)
```

---

## 🚀 Quick Start

### Step 1: Start Backend

```bash
# Terminal 1
npm install
npm start
```
✅ Backend running on `http://localhost:3000`

### Step 2: Start Frontend

```bash
# Terminal 2
cd frontend
npm install
npm run dev
```
✅ Frontend running on `http://localhost:3001`

### Step 3: Login

Open [http://localhost:3001](http://localhost:3001)

**Demo Credentials:**
- Username: `owner`
- Password: `password123`

---

## 🎨 Modern Features

### 🛍️ Order Management
✅ Intuitive order builder with real-time updates  
✅ Customer name input with validation  
✅ Multiple items with quantity management  
✅ Real-time order total calculation  
✅ WhatsApp message generation & copy  

### 📦 Product & Inventory
✅ Add/edit/delete products with ease  
✅ Promo pricing support  
✅ Custom category management  
✅ Category-based product filtering  
✅ Visual product grid cards  

### 🏷️ Special Marks System
✅ Create custom marks (Less Spicy, Extra Sweet, etc.)  
✅ Assign multiple marks per order  
✅ Mark display in order history  
✅ Color-coded mark badges  

### 🎯 Order Tracking
✅ Pending, Completed, Cancelled status  
✅ Payment method tracking (Cash/QR)  
✅ Full order history with timestamps  
✅ One-click order completion workflow  

### 🎨 User Interface
✅ Modern glassmorphism design  
✅ Smooth animations & transitions  
✅ Dark theme optimized for eyes  
✅ Responsive mobile-first design  
✅ Font Awesome icon integration  
✅ Real-time toast notifications  

---

## 🔌 API Endpoints

### Products
```
GET    /api/products              # List all products
POST   /api/products              # Create product
PUT    /api/products/:id          # Update product
DELETE /api/products/:id          # Delete product
```

### Categories
```
GET    /api/categories            # List categories
POST   /api/categories            # Create category
PUT    /api/categories/:id        # Update category
DELETE /api/categories/:id        # Delete category
```

### Marks
```
GET    /api/marks                 # List marks
POST   /api/marks                 # Create mark (name only!)
PUT    /api/marks/:id             # Update mark
DELETE /api/marks/:id             # Delete mark
```

### Orders
```
GET    /api/orders                # List orders
POST   /api/orders                # Create order
PATCH  /api/orders/:id            # Update status/payment
DELETE /api/orders/:id            # Delete order
```

---

## 📊 Tech Stack

### Backend
| Tech | Purpose |
|------|---------|
| Node.js | Runtime |
| Express.js | Web framework |
| JSON Files | Data persistence |
| CORS | API security |

### Frontend
| Tech | Purpose |
|------|---------|
| Next.js 14 | React framework (App Router) |
| React 18 | UI library |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| Zustand | State management |
| Axios | HTTP client |
| React Hot Toast | Notifications |

---

## 💾 Data Models

### Product
```json
{
  "id": "timestamp",
  "name": "Iced Coffee",
  "category": "Drinks",
  "price": 4.5,
  "promoPrice": 3.5,
  "promoEnabled": true,
  "createdAt": "2026-03-31T..."
}
```

### Category
```json
{
  "id": "timestamp",
  "name": "Drinks",
  "icon": "fa-glass",
  "color": "#3b82f6",
  "createdAt": "2026-03-31T..."
}
```

### Mark
```json
{
  "id": "timestamp",
  "name": "Less Spicy",
  "icon": "fa-fire",
  "color": "amber",
  "createdAt": "2026-03-31T..."
}
```

### Order
```json
{
  "id": "timestamp",
  "customerName": "Ahmed",
  "items": [
    { "id": "...", "name": "...", "price": 4.5, "quantity": 2 }
  ],
  "marks": ["mark1", "mark2"],
  "total": 15.5,
  "paymentMethod": "cash",
  "status": "completed",
  "createdAt": "2026-03-31T..."
}
```

---

## 🧠 State Management (Zustand)

```typescript
// Global store manages:
- user (authentication state)
- products (all products)
- orders (order history)
- marks (special marks)
- categories (product categories)
- currentOrder (order being built)
- selectedCategory (filter state)
```

---

## 📝 Development Notes

### Backend
- RESTful API design
- JSON file persistence (no database required)
- Input validation & error handling
- CORS enabled for all origins
- Runs on **port 3000**

### Frontend
- Next.js App Router (modern approach)
- Custom hooks for data fetching (`useAuth`, `useData`)
- Component-based architecture
- Global state with Zustand
- CSS-in-JS with Tailwind
- Runs on **port 3001**

### Full-Stack Flow
1. **User logs in** → Frontend validates → localStorage stores session
2. **Add product** → Frontend POST → Backend creates → reloads products
3. **Take order** → Customer items → Zustand stores in memory
4. **Confirm order** → Frontend POST → Backend persists to JSON
5. **View history** → Frontend loads orders → displayed by status

---

## 🎯 Key Features Implemented

✅ **Authentication**: Simple login with session storage  
✅ **Products**: Full CRUD operations  
✅ **Categories**: Dynamic custom categories  
✅ **Orders**: Complete order lifecycle management  
✅ **Marks**: Special notes system for customizations  
✅ **Payments**: Cash/QR code tracking  
✅ **Cancellation**: Easy order cancellation  
✅ **Messaging**: WhatsApp message generation  
✅ **Notifications**: Real-time toast feedback  
✅ **Responsive**: Mobile & desktop optimized  

---

## 📈 Scalability

Currently optimized for:
- Single user/owner
- Up to 1000+ products
- Up to 10,000+ orders (JSON performance)

**Future migrations** (when scaling):
- MongoDB for database
- WebSocket for real-time updates
- React Query for data caching
- NextAuth.js for authentication
- Multi-user architecture

---

## 🔐 Security Notes

- **Current**: Simple demo authentication (for learning)
- **Production**: Implement proper auth (JWT, OAuth)
- **Future**: User roles, permissions, rate limiting

---

## 📚 Documentation

- Backend API: See `server/routes/`
- Frontend Components: See `frontend/components/`
- Custom Hooks: See `frontend/lib/hooks/`
- State Management: See `frontend/lib/store.ts`

---

## 🏗️ Project Structure

```
project-root/
│
├── server/
│   ├── server.js                 # Express server & middleware setup
│   ├── routes/
│   │   ├── orderRoutes.js       # Order API routes
│   │   └── productRoutes.js     # Product API routes
│   ├── controllers/
│   │   ├── orderController.js   # Order business logic
│   │   └── productController.js # Product business logic
│   ├── models/
│   │   ├── orderModel.js        # Order data operations
│   │   └── productModel.js      # Product data operations
│   └── data/
│       ├── orders.json          # Orders database (JSON)
│       └── products.json        # Products database (JSON)
│
├── client/
│   ├── index.html               # Main HTML structure
│   ├── app.js                   # Frontend logic & API calls
│   └── style.css                # Styling & responsive design
│
├── package.json                 # Dependencies & scripts
└── README.md                    # This file
```

## Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (no frameworks)
- **Backend**: Node.js with Express
- **Database**: JSON files (orders.json, products.json)
- **Architecture**: MVC pattern

## API Endpoints

### Products

```
GET    /api/products          # Get all products
GET    /api/products/grouped  # Get products grouped by category
POST   /api/products          # Create new product
GET    /api/products/:id      # Get single product
PUT    /api/products/:id      # Update product
DELETE /api/products/:id      # Delete product
```

### Orders

```
GET    /api/orders     # Get all orders
POST   /api/orders     # Create new order
PATCH  /api/orders/:id # Update order status
```

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm

### Installation

1. Clone or extract the project:
   ```bash
   cd ezorder
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   ```

4. Open your browser and go to:
   ```
   http://localhost:3000
   ```

## Usage

### Adding Products

1. Go to **Add New Product** section
2. Fill in:
   - Product Name (e.g., "Iced Coffee")
   - Category (e.g., "Drinks" - new categories are auto-created)
   - Price in RM
   - Optional: Promo Price (shows discounted price)
3. Click **Add Product**

### Creating an Order

1. **Add Items**: Click product cards to add them to your order
   - First click adds 1 item
   - Click again to increase quantity
   - Use +/- buttons to adjust quantity
   - Click ✕ to remove item

2. **Enter Customer Name**: Type customer name in the order form

3. **Review Message**: Check the auto-generated message for customer communication

4. **Confirm Order**: Click **Confirm Order** to save

### Managing Orders

1. **View Orders**: All orders appear in **Order History** section
2. **Mark Complete**: Click **Mark Complete** button when order is fulfilled
3. **Copy Message**: Click **Copy Message** to copy order text to clipboard
4. **Track Status**: See pending vs. completed orders at a glance

## Code Highlights

### Clean Separation of Concerns
- **Models**: Handle data file I/O (read/write JSON)
- **Controllers**: Business logic and validation
- **Routes**: API endpoints and HTTP methods
- **Frontend**: State management and UI rendering

### No External Libraries
- Express only dependency (plus CORS)
- Vanilla JavaScript on frontend
- Simple CSS with no frameworks
- Easy to customize and extend

### Data Models

**Product Schema:**
```json
{
  "id": "1",
  "name": "Iced Coffee",
  "category": "Drinks",
  "price": 4.50,
  "promoPrice": 3.50,
  "imageUrl": null,
  "createdAt": "2026-03-31T00:00:00.000Z"
}
```

**Order Schema:**
```json
{
  "id": "1234567890123",
  "customerName": "Ahmed",
  "items": [
    {
      "id": "1",
      "name": "Iced Coffee",
      "price": 4.50,
      "quantity": 2
    }
  ],
  "total": 9.00,
  "status": "pending",
  "message": "Hi Ahmed,\nYour order:\n• Iced Coffee x2\n\nTotal: RM9.00\n\nThank you!",
  "createdAt": "2026-03-31T08:15:00.000Z"
}
```

## UI Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Clean Interface**: 4 main sections:
  1. Product Management
  2. Product Browser (by category)
  3. Order Builder
  4. Order History
- **Intuitive Buttons**: Easy-to-click product cards
- **Real-time Updates**: Instant total calculation
- **Status Indicators**: Visual badges for order status

## Workflow Example

1. **Owner sets up products**: Adds "Iced Coffee" (RM4.50), "Rendang" (RM7.50) under different categories
2. **Customer request comes in**: "I need 2 iced coffee and 1 rendang"
3. **Owner uses dashboard**: 
   - Clicks Iced Coffee twice, Rendang once
   - Enters customer name
   - Sees auto-generated message
   - Copies and sends message back to customer
   - Marks as completed when order is ready
4. **Order tracked in history** with timestamp and status

## Security Notes

- All HTML output is escaped to prevent XSS attacks
- JSON stored locally (no cloud dependencies)
- Input validation on form submissions
- CORS enabled for safe API access

## Future Enhancements

- Add product images
- Customer/order history per customer
- Inventory tracking
- Export orders as PDF
- Admin dashboard
- Analytics & sales reports
- Multi-language support
- Dark mode

## License

MIT License - Feel free to use and modify

## Support

For questions or improvements, refer to the inline code comments throughout the project.

---

---

**Made with care for small business owners.**