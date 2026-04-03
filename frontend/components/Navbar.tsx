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

export default function Navbar() {
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
    <header className="sticky top-0 z-50 bg-[#0a0c14] border-b border-amber-500/20 shadow-2xl">
      {/* Expiry warning banner */}
      {isExpiringSoon && (
        <div className={`w-full text-center py-1.5 px-4 text-xs font-semibold ${
          isCritical
            ? 'bg-red-500/20 text-red-400 border-b border-red-500/30'
            : 'bg-amber-500/15 text-amber-400 border-b border-amber-500/20'
        }`}>
          <i className={`fas ${isCritical ? 'fa-exclamation-triangle' : 'fa-clock'} mr-1.5`}></i>
          {daysLeft === 0
            ? 'Subscription anda tamat hari ini!'
            : `${user?.plan === 'trial' ? 'Trial' : 'Subscription'} anda tamat dalam ${daysLeft} hari.`}
          {' '}<span className="underline cursor-pointer" onClick={() => router.push('/subscribe')}>Langgan sekarang →</span>
        </div>
      )}
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
              onClick={() => router.push('/settings')}
              className="bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white px-3 py-2 rounded-lg transition flex items-center gap-2 text-sm"
              title="Settings"
            >
              <i className="fas fa-cog"></i>
            </button>

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
