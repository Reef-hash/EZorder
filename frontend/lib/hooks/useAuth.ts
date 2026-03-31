import { useAppStore } from '@/lib/store'

export const useAuth = () => {
  const { user, setUser } = useAppStore()

  const login = (username: string, password: string) => {
    console.log('Login attempt with:', username)
    if (username === 'user' && password === 'password') {
      const newUser = { username, loginTime: new Date().toISOString() }
      setUser(newUser)
      localStorage.setItem('session', JSON.stringify(newUser))
      console.log('Login successful, session saved:', newUser)
      return true
    }
    console.log('Login failed - invalid credentials')
    return false
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('session')
  }

  const initAuth = () => {
    const session = localStorage.getItem('session')
    console.log('initAuth: checking localStorage, found:', session)
    if (session) {
      try {
        const userData = JSON.parse(session)
        setUser(userData)
        console.log('Session restored:', userData)
      } catch (e) {
        console.error('Session parse error:', e)
        logout()
      }
    } else {
      console.log('No session in localStorage')
    }
  }

  return { user, login, logout, initAuth }
}
