import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

console.log('API_URL configured:', API_URL)

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`)
    return config
  },
  (error) => {
    console.error('[API] Request error:', error)
    return Promise.reject(error)
  }
)

// Add response interceptor for logging
api.interceptors.response.use(
  (response) => {
    console.log(`[API] Response ${response.status}:`, response.data)
    return response
  },
  (error) => {
    console.error('[API] Response error:', error.message, error.response?.data || error.config?.url)
    return Promise.reject(error)
  }
)

// Products
export const productsAPI = {
  getAll: () => api.get('/api/products'),
  create: (data: any) => api.post('/api/products', data),
  update: (id: string, data: any) => api.put(`/api/products/${id}`, data),
  delete: (id: string) => api.delete(`/api/products/${id}`),
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

export default api
