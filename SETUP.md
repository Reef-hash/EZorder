# EZOrder - Complete Setup Guide

## 📋 Prerequisites

Before starting, ensure you have:
- **Node.js** 18+ installed ([Download](https://nodejs.org))
- **npm** or **yarn** package manager
- **Git** (optional, for version control)
- **Terminal/Command Prompt** to run commands

Verify installation:
```bash
node --version  # Should be v18+
npm --version   # Should be v8+
```

---

## 🔧 Installation Steps

### Step 1️⃣: Clone or Navigate to Project

```bash
cd "d:/All About C++/SaaS"
```

### Step 2️⃣: Install Backend Dependencies

```bash
npm install
```

This installs all backend packages:
- express (web framework)
- cors (cross-origin support)
- Other dependencies

### Step 3️⃣: Install Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

This installs all frontend packages:
- next (React framework)
- react (UI library)
- tailwindcss (styling)
- zustand (state management)
- axios (HTTP client)
- react-hot-toast (notifications)
- TypeScript & other dev tools

---

## 🚀 Running the Application

### Option A: Sequential Start (Easier)

**Terminal 1 - Backend:**
```bash
npm start
```
✅ Backend running on `http://localhost:3000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
✅ Frontend running on `http://localhost:3001`

### Option B: Parallel Start (Advanced)

**Using npm-run-all** (if installed):
```bash
npm install -g npm-run-all
npm run dev:all  # If configured in package.json
```

---

## 🌐 Access the Application

1. Open browser: **http://localhost:3001**
2. You'll see the login page
3. Enter credentials:
   - **Username**: `owner`
   - **Password**: `password123`
4. Click **Login**

✅ You're now in the dashboard!

---

## 📖 Understanding the UI

### Tab 1: Take Order 📦
- Select products by clicking cards
- Add special marks (Less Spicy, Extra Sweet, etc.)
- Enter customer name
- See real-time totals
- Confirm order

### Tab 2: Manage ⚙️
- **Products**: Add/delete products with pricing
- **Categories**: Create custom categories (Drinks, Food, etc.)
- **Marks**: Create special notes for customizations

### Tab 3: History 📋
- View pending orders (yellow)
- View completed orders (green)
- View cancelled orders (red)
- Mark orders as complete
- Choose payment method (Cash/QR)
- Cancel orders if needed

---

## 🛠️ Development Commands

### Backend Commands
```bash
# Start Express server
npm start

# Check if port 3000 is in use
netstat -ano | findstr:3000  # Windows
lsof -i :3000                # Mac/Linux
```

### Frontend Commands
```bash
cd frontend

# Development with hot reload
npm run dev

# Production build
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

---

## 🔧 Environment Variables

### Frontend (.env.local)

Already configured! But if needed:

```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**Note**: `NEXT_PUBLIC_` prefix makes it available in browser

---

## ❓ Common Issues & Solutions

### Issue 1: Port 3000 Already in Use

**Error**: `EADDRINUSE: address already in use :::3000`

**Solution**:
```bash
# Kill process on port 3000
# Windows:
netstat -ano | findstr:3000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -i :3000
kill -9 <PID>

# Then restart backend
npm start
```

### Issue 2: Port 3001 Already in Use

**Error**: `Port 3001 is in use`

**Solution**:
```bash
cd frontend

# Use different port
PORT=3002 npm run dev
```

### Issue 3: Dependencies Not Installing

**Solution**:
```bash
# Clear cache
npm cache clean --force

# Delete node_modules
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Issue 4: Backend Connection Failed

**Error**: `Failed to load products`

**Solution**:
1. Ensure backend is running on port 3000
2. Check `.env.local` has correct API URL
3. Verify no CORS issues in browser console
4. Clear browser cache and reload

### Issue 5: TypeScript Errors

**Solution**:
```bash
cd frontend

# Rebuild TypeScript
npm run build
```

---

## 📱 API Integration

The frontend talks to backend via `lib/api.ts`:

```typescript
// Automatically configured to:
// GET    /api/products
// POST   /api/products
// PATCH  /api/orders/:id
// etc.

// Base URL: process.env.NEXT_PUBLIC_API_URL
// Headers: Content-Type: application/json
```

No manual configuration needed!

---

## 🗃️ Data Persistence

All data stored in JSON files:

```
server/data/
├── products.json    # All products
├── categories.json  # All categories
├── marks.json       # All marks
└── orders.json      # All orders
```

**Note**: JSON files are auto-created on first run

---

## 🔐 Authentication Flow

```
1. User enters username & password
2. Frontend validates against hardcoded credentials
3. User object stored in localStorage
4. Session persists across page refreshes
5. Logout clears localStorage
```

**Current**: Simple demo (for learning)  
**Production**: Should use JWT or OAuth

---

## 📊 Project Stats

| Component | Size | Time |
|-----------|------|------|
| Backend | ~50MB | < 1s |
| Frontend | ~450MB | 3-5s |
| Total Install | ~500MB | - |
| Build Time | - | 10-15s |

---

## 🎓 Learning Resources

### Frontend Code Structure
- `app/page.tsx` - Login page implementation
- `app/dashboard/page.tsx` - Main routing
- `components/tabs/OrderTab.tsx` - Order management UI
- `lib/store.ts` - Global state with Zustand
- `lib/api.ts` - API client setup

### Backend Code Structure
- `server/routes/` - API endpoints
- `server/models/` - Data models
- `server/controllers/` - Business logic
- `server/data/` - Persistent storage

---

## 🚀 Next Steps

1. **Customize**: Modify colors, fonts, business logic
2. **Add Features**: Payment integration, notifications, etc.
3. **Deploy**: Use Vercel (frontend), Heroku (backend)
4. **Scale**: Migrate to MongoDB, add real-time updates
5. **Team**: Add multi-user support, authentication

---

## 🆘 Getting Help

If stuck:
1. Check vs code terminal for error messages
2. Check browser console (F12)
3. Ensure both servers are running
4. Verify environment variables
5. Clear cache and reinstall dependencies

---

## 📞 Support

For issues or questions about the setup:
- Check error messages in browser console (F12)
- Review backend logs in terminal
- Verify all dependencies installed: `npm list`
- Ensure ports 3000 and 3001 are free

---

**Happy Building! 🎉**
