import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Handle auth errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== 'undefined') {
      if (error.response?.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/'
      } else if (error.response?.data?.code === 'SUBSCRIPTION_EXPIRED') {
        localStorage.removeItem('token')
        window.location.href = '/?expired=1'
      }
    }
    return Promise.reject(error)
  }
)

// Products
export const productsAPI = {
  getAll: () => api.get('/api/products'),
  create: (data: any) => api.post('/api/products', data),
  update: (id: string, data: any) => api.put(`/api/products/${id}`, data),
  delete: (id: string) => api.delete(`/api/products/${id}`),
  adjustStock: (id: string, adjustment: number) => api.patch(`/api/products/${id}/stock`, { adjustment }),
}

// Categories
export const categoriesAPI = {
  getAll: () => api.get('/api/categories'),
  create: (data: any) => api.post('/api/categories', data),
  update: (id: string, data: any) => api.put(`/api/categories/${id}`, data),
  delete: (id: string) => api.delete(`/api/categories/${id}`),
}

// Marks
export const marksAPI = {
  getAll: () => api.get('/api/marks'),
  create: (data: any) => api.post('/api/marks', data),
  update: (id: string, data: any) => api.put(`/api/marks/${id}`, data),
  delete: (id: string) => api.delete(`/api/marks/${id}`),
}

// Orders
export const ordersAPI = {
  getAll: () => api.get('/api/orders'),
  create: (data: any) => api.post('/api/orders', data),
  update: (id: string, data: any) => api.patch(`/api/orders/${id}`, data),
  delete: (id: string) => api.delete(`/api/orders/${id}`),
}

// Auth
export const authAPI = {
  register: (data: { businessName: string; email: string; password: string }) =>
    api.post('/api/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/api/auth/login', data),
  forgotPassword: (email: string) =>
    api.post('/api/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    api.post('/api/auth/reset-password', { token, password }),
  getMe: () => api.get('/api/auth/me'),
  updateProfile: (data: any) => api.patch('/api/auth/profile', data),
  nextBill: () => api.get('/api/auth/next-bill'),
  resetBill: () => api.patch('/api/auth/reset-bill'),
}

// Admin
export const adminAPI = {
  getStats: () => api.get('/api/admin/stats'),
  getUsers: (params?: { search?: string; plan?: string }) =>
    api.get('/api/admin/users', { params }),
  updatePlan: (id: string, action: 'activate' | 'extend_trial' | 'suspend' | 'expire') =>
    api.patch(`/api/admin/users/${id}/plan`, { action }),
}

// Tables
export const tablesAPI = {
  getAll: () => api.get('/api/tables'),
  create: (data: any) => api.post('/api/tables', data),
  update: (id: string, data: any) => api.patch(`/api/tables/${id}`, data),
  delete: (id: string) => api.delete(`/api/tables/${id}`),
}

// Expenses
export const expensesAPI = {
  getAll: (params?: { from?: string; to?: string }) => api.get('/api/expenses', { params }),
  create: (data: any) => api.post('/api/expenses', data),
  delete: (id: string) => api.delete(`/api/expenses/${id}`),
}

// Reports
export const reportsAPI = {
  profitLoss: (params?: { from?: string; to?: string }) =>
    api.get('/api/reports/profit-loss', { params }),
  exportUrl: (from?: string, to?: string) => {
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
    const q = new URLSearchParams()
    if (from) q.set('from', from)
    if (to) q.set('to', to)
    return `${base}/api/reports/export?${q.toString()}`
  },
}

export default api
