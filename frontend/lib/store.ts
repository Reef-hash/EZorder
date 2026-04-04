import { create } from 'zustand'
import type { PaperSize, ConnectionType } from './printer/PrinterService'

export interface PrinterConfig {
  enabled: boolean
  connectionType: ConnectionType
  paperSize: PaperSize
  printerAddress: string   // BT MAC / IP:port / USB deviceId
  printerName: string
  autoPrint: boolean
}

const PRINTER_CONFIG_KEY = 'ez_printer_config'

function loadPrinterConfig(): PrinterConfig {
  if (typeof window === 'undefined') return defaultPrinterConfig()
  try {
    const raw = localStorage.getItem(PRINTER_CONFIG_KEY)
    if (raw) return { ...defaultPrinterConfig(), ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return defaultPrinterConfig()
}

function defaultPrinterConfig(): PrinterConfig {
  return {
    enabled: false,
    connectionType: 'bluetooth',
    paperSize: '80mm',
    printerAddress: '',
    printerName: '',
    autoPrint: false,
  }
}

function savePrinterConfig(config: PrinterConfig) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(PRINTER_CONFIG_KEY, JSON.stringify(config))
  }
}

function fmt(n: number) {
  return `#${String(n).padStart(4, '0')}`
}

function counterKey(userId?: string) {
  return userId ? `ez_order_counter_${userId}` : 'ez_order_counter'
}

function loadCounter(userId?: string): number {
  if (typeof window === 'undefined') return 1
  return parseInt(localStorage.getItem(counterKey(userId)) || '1', 10)
}

function saveCounter(n: number, userId?: string) {
  if (typeof window !== 'undefined') localStorage.setItem(counterKey(userId), String(n))
}

export interface OrderItem {
  lineId: string
  id: string
  name: string
  price: number
  costPrice?: number | null
  taxRate?: number
  taxAmount?: number
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
  totalTax?: number
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
  taxRate?: number
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

export interface Expense {
  id: string
  date: string
  category: 'Utilities' | 'Salary' | 'Supplies' | 'Maintenance' | 'Rent' | 'Others'
  description: string
  amount: number
  paymentMethod: 'cash' | 'bank_transfer'
  createdAt: string
}

export interface ProfitLoss {
  revenue: number
  revenueBeforeTax: number
  totalTax: number
  cogs: number
  opex: number
  grossProfit: number
  netProfit: number
  orderCount: number
}

export interface SalesByItem {
  name: string
  qty: number
  revenue: number
  cogs: number
  tax: number
  grossProfit: number
}

export interface SalesByCategory {
  category: string
  qty: number
  revenue: number
  cogs: number
  grossProfit: number
}

export interface SalesByPayment {
  method: string
  count: number
  total: number
  tax: number
}

export interface SstSummary {
  grossSales: number
  taxableAmount: number
  exemptAmount: number
  totalTax: number
  netSales: number
  orderCount: number
  period: { from?: string; to?: string }
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
  phone?: string
  address?: string
  receiptFooter?: string
  tinNumber?: string
  sstRegNo?: string
  sstEnabled?: boolean
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
  clearCurrentOrder: (nextCounter?: number) => void
  
  // Marks actions
  setMarks: (marks: Mark[]) => void
  
  // Category actions
  setCategories: (categories: Category[]) => void
  selectCategory: (categoryId: string | null) => void

  // Table actions
  setTables: (tables: Table[]) => void

  // Printer config
  printerConfig: PrinterConfig
  setPrinterConfig: (config: Partial<PrinterConfig>) => void
  clearPrinterConfig: () => void
}

export const useAppStore = create<AppStore>((set) => ({
  user: null,
  products: [],
  orders: [],
  marks: [],
  categories: [],
  tables: [],
  orderCounter: loadCounter(),
  printerConfig: loadPrinterConfig(),
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

  setUser: (user) => set((state) => {
    if (user) {
      const counter = loadCounter(user._id)
      return {
        user,
        orderCounter: counter,
        currentOrder: {
          ...state.currentOrder,
          customerName: fmt(counter),
        },
      }
    }
    return { user: null }
  }),

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

  clearCurrentOrder: (nextCounter?: number) =>
    set((state) => {
      // Use DB-supplied counter if provided, otherwise fall back to local
      const next = nextCounter ?? (loadCounter(state.user?._id) + 1)
      saveCounter(next, state.user?._id)
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

  setPrinterConfig: (partial) =>
    set((state) => {
      const next = { ...state.printerConfig, ...partial }
      savePrinterConfig(next)
      return { printerConfig: next }
    }),

  clearPrinterConfig: () => {
    const reset = defaultPrinterConfig()
    savePrinterConfig(reset)
    set({ printerConfig: reset })
  },
}))
