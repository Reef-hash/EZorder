import { create } from 'zustand'

export interface OrderItem {
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

export interface User {
  _id: string
  email: string
  businessName: string
  plan: string
  role: 'user' | 'admin'
  trialExpiry?: string
  subscriptionExpiry?: string | null
}

interface AppStore {
  user: User | null
  products: Product[]
  orders: Order[]
  marks: Mark[]
  categories: Category[]
  currentOrder: {
    customerName: string
    items: OrderItem[]
    marks: string[]
  }
  selectedCategory: string | null
  
  // User actions
  setUser: (user: User | null) => void
  
  // Product actions
  setProducts: (products: Product[]) => void
  updateProduct: (id: string, product: Partial<Product>) => void
  toggleProductDisabled: (id: string) => void
  removeProductLocal: (id: string) => void
  
  // Order actions
  setOrders: (orders: Order[]) => void
  addOrderItem: (item: OrderItem) => void
  removeOrderItem: (productId: string) => void
  updateOrderItemQuantity: (productId: string, quantity: number) => void
  setOrderCustomerName: (name: string) => void
  toggleItemMark: (itemId: string, markId: string) => void
  clearCurrentOrder: () => void
  
  // Marks actions
  setMarks: (marks: Mark[]) => void
  
  // Category actions
  setCategories: (categories: Category[]) => void
  selectCategory: (categoryId: string | null) => void
}

export const useAppStore = create<AppStore>((set) => ({
  user: null,
  products: [],
  orders: [],
  marks: [],
  categories: [],
  currentOrder: {
    customerName: '',
    items: [],
    marks: [],
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
      const existingItem = state.currentOrder.items.find((i) => i.id === item.id)
      if (existingItem) {
        return {
          currentOrder: {
            ...state.currentOrder,
            items: state.currentOrder.items.map((i) =>
              i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
            ),
          },
        }
      }
      return {
        currentOrder: {
          ...state.currentOrder,
          items: [...state.currentOrder.items, { ...item, quantity: 1, marks: [] }],
        },
      }
    }),

  removeOrderItem: (productId) =>
    set((state) => ({
      currentOrder: {
        ...state.currentOrder,
        items: state.currentOrder.items.filter((i) => i.id !== productId),
      },
    })),

  updateOrderItemQuantity: (productId, quantity) =>
    set((state) => ({
      currentOrder: {
        ...state.currentOrder,
        items:
          quantity <= 0
            ? state.currentOrder.items.filter((i) => i.id !== productId)
            : state.currentOrder.items.map((i) =>
                i.id === productId ? { ...i, quantity } : i
              ),
      },
    })),

  setOrderCustomerName: (name) =>
    set((state) => ({
      currentOrder: {
        ...state.currentOrder,
        customerName: name,
      },
    })),

  toggleItemMark: (itemId, markId) =>
    set((state) => ({
      currentOrder: {
        ...state.currentOrder,
        items: state.currentOrder.items.map((item) =>
          item.id === itemId
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
    set({
      currentOrder: {
        customerName: '',
        items: [],
        marks: [],
      },
      selectedCategory: null,
    }),

  setMarks: (marks) => set({ marks }),

  setCategories: (categories) => set({ categories }),

  selectCategory: (categoryId) => set({ selectedCategory: categoryId })
}))
