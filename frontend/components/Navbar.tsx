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
    <header className="sticky top-0 z-50 bg-[#0a0c14] border-b border-amber-500/20 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 md:h-16">
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center font-bold text-black text-base shadow-lg shadow-amber-500/30">
                {user?.businessName?.charAt(0).toUpperCase() || '?'}
              </div>
              <span className={`absolute -top-1.5 -right-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none ${
                user?.plan === 'active'
                  ? 'bg-amber-400 text-black'
                  : 'bg-[#1a1f2e] text-amber-400 border border-amber-500/50'
              }`}>
                {user?.plan === 'active' ? 'PRO' : 'TRIAL'}
              </span>
            </div>
            <h1 className="text-amber-400 font-bold text-xl md:text-2xl tracking-tight">EZOrder</h1>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <span className="hidden sm:block text-slate-400 text-sm">{user?.businessName}</span>

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
