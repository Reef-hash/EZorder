'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { useState, useEffect } from 'react'

export default function Navbar() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [])

  const toggleTheme = () => {
    const dark = document.documentElement.classList.contains('dark')
    if (dark) {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
      setIsDark(false)
    } else {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
      setIsDark(true)
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-amber-500 to-orange-600 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 md:h-16">
          <div className="flex items-center gap-2">
            <i className="fas fa-shopping-bag text-white text-xl md:text-2xl"></i>
            <h1 className="text-white font-bold text-xl md:text-2xl">EZOrder</h1>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <span className="hidden sm:block text-amber-50 text-sm">Welcome, {user?.businessName}</span>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="bg-white/20 hover:bg-white/30 text-white w-9 h-9 rounded-lg font-semibold transition flex items-center justify-center text-sm"
            >
              <i className={`fas ${isDark ? 'fa-sun' : 'fa-moon'}`}></i>
            </button>

            {user?.role === 'admin' && (
              <button
                onClick={() => router.push('/admin')}
                className="bg-white/20 hover:bg-white/30 text-white px-3 py-2 md:px-4 rounded-lg font-semibold transition flex items-center gap-2 text-sm border border-white/30"
              >
                <i className="fas fa-shield-alt"></i>
                <span className="hidden sm:inline">Admin</span>
              </button>
            )}

            <button
              onClick={handleLogout}
              className="bg-white/20 hover:bg-white/30 text-white px-3 py-2 md:px-4 rounded-lg font-semibold transition flex items-center gap-2 text-sm"
            >
              <i className="fas fa-sign-out-alt"></i>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
