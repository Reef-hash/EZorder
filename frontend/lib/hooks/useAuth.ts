import { useAppStore } from '@/lib/store'
import api from '@/lib/api'

const STAFF_USER_KEY = 'ez_staff_user'

export const useAuth = () => {
  const { user, setUser } = useAppStore()

  const login = async (email: string, password: string): Promise<boolean> => {
    const response = await api.post('/api/auth/login', { email, password })
    const { token, user: userData } = response.data
    localStorage.setItem('token', token)
    localStorage.removeItem(STAFF_USER_KEY)
    setUser(userData)
    return true
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem(STAFF_USER_KEY)
  }

  const initAuth = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    // Check if this is a staff session (staff user is stored locally)
    const staffUserRaw = localStorage.getItem(STAFF_USER_KEY)
    if (staffUserRaw) {
      try {
        const staffUser = JSON.parse(staffUserRaw)
        setUser(staffUser)
        return
      } catch {
        localStorage.removeItem(STAFF_USER_KEY)
      }
    }

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
