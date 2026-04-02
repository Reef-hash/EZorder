import { create } from 'zustand'

function fmt(n: number) {
  return `#${String(n).padStart(4, '0')}`
}

function loadCounter(): number {
  if (typeof window === 'undefined') return 1
  return parseInt(localStorage.getItem('ez_order_counter') || '1', 10)
}

function saveCounter(n: number) {
  if (typeof window !== 'undefined') localStorage.setItem('ez_order_counter', String(n))
}

export interface OrderItem {
  lineId: string
  id: string
  name: string
  price: number
  quantity: number
  marks: string[]
}

export interface Order {
  id: string
  customerName: string
  items: OrderItem[]
  marks: string[]
  total: number
  status: 'pending' | 'completed' | 'cancelled'
  paymentMethod?: 'cash' | 'qr' | null
  orderType?: 'dine_in' | 'take_away'
  tableName?: string | null
  discount?: number
  discountType?: 'amount' | 'percent'
  amountPaid?: number | null
  change?: number | null
  createdAt: string
}

export interface Product {
  id: string
  name: string
  category: string
  price: number
  promoPrice: number | null
  promoEnabled: boolean
  disabled: boolean
  imageUrl?: string | null
  trackStock: boolean
  stockQty: number | null
  costPrice: number | null
  createdAt: string
}

export interface Category {
  id: string
  name: string
  icon: string
  color: string
  createdAt: string
}

export interface Mark {
  id: string
  name: string
  icon: string
  color: string
  createdAt: string
}

export interface Table {
  id: string
  name: string
  seats: number
  status: 'available' | 'occupied'
  createdAt: string
}

export interface User {
  _id: string
  email: string
  businessName: string
  plan: string
  role: 'user' | 'admin'
  trialExpiry?: string
  subscriptionExpiry?: string | null
  businessType?: 'restaurant' | 'retail' | 'both'
}

interface AppStore {
  user: User | null
  products: Product[]
  orders: Order[]
  marks: Mark[]
  categories: Category[]
  tables: Table[]
  currentOrder: {
    customerName: string
    items: OrderItem[]
    marks: string[]
    orderType: 'dine_in' | 'take_away'
    tableName: string | null
    discount: number
    discountType: 'amount' | 'percent'
  }
  selectedCategory: string | null
  
  // User actions
  setUser: (user: User | null) => void
  
  // Product actions
  setProducts: (products: Product[]) => void
  updateProduct: (id: string, product: Partial<Product>) => void
  updateProductStock: (id: string, newQty: number) => void
  toggleProductDisabled: (id: string) => void
  removeProductLocal: (id: string) => void
  
  orderCounter: number

  // Order actions
  setOrders: (orders: Order[]) => void
  addOrderItem: (item: OrderItem) => void
  removeOrderItem: (lineId: string) => void
  updateOrderItemQuantity: (lineId: string, quantity: number) => void
  setOrderType: (type: 'dine_in' | 'take_away') => void
  setOrderTable: (tableName: string | null) => void
  setDiscount: (discount: number, discountType: 'amount' | 'percent') => void
  splitOrderItem: (lineId: string) => void
  toggleItemMark: (lineId: string, markId: string) => void
  clearCurrentOrder: () => void
  
  // Marks actions
  setMarks: (marks: Mark[]) => void
  
  // Category actions
  setCategories: (categories: Category[]) => void
  selectCategory: (categoryId: string | null) => void

  // Table actions
  setTables: (tables: Table[]) => void
}

export const useAppStore = create<AppStore>((set) => ({
  user: null,
  products: [],
  orders: [],
  marks: [],
  categories: [],
  tables: [],
  orderCounter: loadCounter(),
  currentOrder: {
    customerName: fmt(loadCounter()),
    items: [],
    marks: [],
    orderType: 'take_away',
    tableName: null,
    discount: 0,
    discountType: 'amount',
  },
  selectedCategory: null,

  setUser: (user) => set({ user }),

  setProducts: (products) => set({ products }),

  updateProduct: (id, updatedFields) =>
    set((state) => ({
      products: state.products.map((p) =>
        p.id === id ? { ...p, ...updatedFields } : p
      ),
    })),

  updateProductStock: (id, newQty) =>
    set((state) => ({
      products: state.products.map((p) =>
        p.id === id ? { ...p, stockQty: newQty } : p
      ),
    })),

  toggleProductDisabled: (id) =>
    set((state) => ({
      products: state.products.map((p) =>
        p.id === id ? { ...p, disabled: !p.disabled } : p
      ),
    })),

  removeProductLocal: (id) =>
    set((state) => ({
      products: state.products.filter((p) => p.id !== id),
    })),

  setOrders: (orders) => set({ orders }),

  addOrderItem: (item) =>
    set((state) => {
      const sameIdLines = state.currentOrder.items.filter((i) => i.id === item.id)
      if (sameIdLines.length === 1) {
        return {
          currentOrder: {
            ...state.currentOrder,
            items: state.currentOrder.items.map((i) =>
              i.lineId === sameIdLines[0].lineId ? { ...i, quantity: i.quantity + 1 } : i
            ),
          },
        }
      }
      return {
        currentOrder: {
          ...state.currentOrder,
          items: [...state.currentOrder.items, { ...item, lineId: crypto.randomUUID(), quantity: 1, marks: [] }],
        },
      }
    }),

  removeOrderItem: (lineId) =>
    set((state) => ({
      currentOrder: {
        ...state.currentOrder,
        items: state.currentOrder.items.filter((i) => i.lineId !== lineId),
      },
    })),

  updateOrderItemQuantity: (lineId, quantity) =>
    set((state) => ({
      currentOrder: {
        ...state.currentOrder,
        items:
          quantity <= 0
            ? state.currentOrder.items.filter((i) => i.lineId !== lineId)
            : state.currentOrder.items.map((i) =>
                i.lineId === lineId ? { ...i, quantity } : i
              ),
      },
    })),

  setOrderType: (orderType) =>
    set((state) => ({
      currentOrder: {
        ...state.currentOrder,
        orderType,
        tableName: orderType === 'take_away' ? null : state.currentOrder.tableName,
      },
    })),

  setOrderTable: (tableName) =>
    set((state) => ({
      currentOrder: { ...state.currentOrder, tableName },
    })),

  setDiscount: (discount, discountType) =>
    set((state) => ({
      currentOrder: { ...state.currentOrder, discount, discountType },
    })),

  splitOrderItem: (lineId) =>
    set((state) => {
      const item = state.currentOrder.items.find((i) => i.lineId === lineId)
      if (!item || item.quantity <= 1) return state
      return {
        currentOrder: {
          ...state.currentOrder,
          items: [
            ...state.currentOrder.items.map((i) =>
              i.lineId === lineId ? { ...i, quantity: i.quantity - 1 } : i
            ),
            { ...item, lineId: crypto.randomUUID(), quantity: 1, marks: [] },
          ],
        },
      }
    }),

  toggleItemMark: (lineId, markId) =>
    set((state) => ({
      currentOrder: {
        ...state.currentOrder,
        items: state.currentOrder.items.map((item) =>
          item.lineId === lineId
            ? {
                ...item,
                marks: item.marks.includes(markId)
                  ? item.marks.filter((m) => m !== markId)
                  : [...item.marks, markId],
              }
            : item
        ),
      },
    })),

  clearCurrentOrder: () =>
    set((_state) => {
      const next = loadCounter() + 1
      saveCounter(next)
      return {
        orderCounter: next,
        currentOrder: {
          customerName: fmt(next),
          items: [],
          marks: [],
          orderType: 'take_away',
          tableName: null,
          discount: 0,
          discountType: 'amount',
        },
        selectedCategory: null,
      }
    }),

  setMarks: (marks) => set({ marks }),

  setCategories: (categories) => set({ categories }),

  selectCategory: (categoryId) => set({ selectedCategory: categoryId }),

  setTables: (tables) => set({ tables }),
}))
