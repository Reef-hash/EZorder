'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'

function getDaysLeft(user: { plan: string; trialExpiry?: string; subscriptionExpiry?: string | null } | null): number | null {
  if (!user) return null
  const expiry = user.plan === 'trial' ? user.trialExpiry : user.subscriptionExpiry
  if (!expiry) return null
  const diff = new Date(expiry).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / 86400000))
}

interface NavbarProps {
  currentView?: string
}

const PAGE_TITLES: Record<string, string> = {
  pos: 'Point of Sale (POS)',
  queue: 'Order Queue',
  reports: 'Sales Reports',
  expenses: 'Expenses',
  manage: 'Setup & Manage',
}

export default function Navbar({ currentView = 'pos' }: NavbarProps) {
  const router = useRouter()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const daysLeft = getDaysLeft(user)
  const isExpiringSoon = daysLeft !== null && daysLeft <= 7
  const isCritical = daysLeft !== null && daysLeft <= 3

  return (
    <header className="bg-white border-b border-gray-100 flex-shrink-0">
      {/* Expiry warning banner */}
      {isExpiringSoon && (
        <div className={`w-full text-center py-1.5 px-4 text-xs font-semibold ${
          isCritical
            ? 'bg-red-50 text-red-600 border-b border-red-100'
            : 'bg-orange-50 text-orange-600 border-b border-orange-100'
        }`}>
          <i className={`fas ${isCritical ? 'fa-exclamation-triangle' : 'fa-clock'} mr-1.5`}></i>
          {daysLeft === 0
            ? 'Subscription anda tamat hari ini!'
            : `${user?.plan === 'trial' ? 'Trial' : 'Subscription'} anda tamat dalam ${daysLeft} hari.`}
          {' '}<span className="underline cursor-pointer font-bold" onClick={() => router.push('/subscribe')}>Langgan sekarang →</span>
        </div>
      )}

      <div className="px-4 md:px-6 h-14 flex items-center justify-between">
        {/* Left — page title + breadcrumb */}
        <div>
          <h1 className="text-gray-900 font-bold text-base md:text-lg leading-tight">
            {PAGE_TITLES[currentView] || 'Dashboard'}
          </h1>
          <p className="text-gray-400 text-xs">Dashboard › {PAGE_TITLES[currentView] || 'Dashboard'}</p>
        </div>

        {/* Right — actions */}
        <div className="flex items-center gap-2">
          {user?.role === 'admin' && (
            <button
              onClick={() => router.push('/admin')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition"
            >
              <i className="fas fa-shield-alt text-xs"></i>
              Admin
            </button>
          )}

          <button
            onClick={() => router.push('/settings')}
            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 flex items-center justify-center transition"
            title="Settings"
          >
            <i className="fas fa-cog text-sm"></i>
          </button>

          <button
            onClick={handleLogout}
            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-500 flex items-center justify-center transition"
            title="Logout"
          >
            <i className="fas fa-sign-out-alt text-sm"></i>
          </button>

          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
            {user?.businessName?.charAt(0).toUpperCase() || '?'}
          </div>
        </div>
      </div>
    </header>
  )
}

