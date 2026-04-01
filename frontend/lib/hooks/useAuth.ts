import { useAppStore } from '@/lib/store'
import api from '@/lib/api'

export const useAuth = () => {
  const { user, setUser } = useAppStore()

  const login = async (email: string, password: string): Promise<boolean> => {
    const response = await api.post('/api/auth/login', { email, password })
    const { token, user: userData } = response.data
    localStorage.setItem('token', token)
    setUser(userData)
    return true
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('token')
  }

  const initAuth = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const response = await api.get('/api/auth/me')
      setUser(response.data)
    } catch {
      localStorage.removeItem('token')
      setUser(null)
    }
  }

  return { user, login, logout, initAuth }
}
