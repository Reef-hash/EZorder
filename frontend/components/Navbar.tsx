'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'

export default function Navbar() {
  const router = useRouter()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-emerald-600 to-purple-600 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 md:h-16">
          <div className="flex items-center gap-2">
            <i className="fas fa-shopping-bag text-white text-xl md:text-2xl"></i>
            <h1 className="text-white font-bold text-xl md:text-2xl">EZOrder</h1>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <span className="hidden sm:block text-emerald-50 text-sm">Welcome, {user?.businessName}</span>
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
