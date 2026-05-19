'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { useData } from '@/lib/hooks/useData'
import Navbar from '@/components/Navbar'
import OrderTab from '@/components/tabs/OrderTab'
import ManageTab from '@/components/tabs/ManageTab'
import QueueTab from '@/components/tabs/QueueTab'
import SalesTab from '@/components/tabs/SalesTab'
import ExpensesTab from '@/components/tabs/ExpensesTab'

type ViewType = 'pos' | 'queue' | 'reports' | 'expenses' | 'manage'

const ALL_NAV_ITEMS: { id: ViewType; icon: string; label: string; ownerOnly?: boolean }[] = [
  { id: 'pos',      icon: 'fa-cash-register', label: 'POS'          },
  { id: 'queue',    icon: 'fa-bell',          label: 'Queue'        },
  { id: 'reports',  icon: 'fa-chart-bar',     label: 'Reports',     ownerOnly: true },
  { id: 'expenses', icon: 'fa-wallet',        label: 'Perbelanjaan', ownerOnly: true },
  { id: 'manage',   icon: 'fa-cog',           label: 'Setup',       ownerOnly: true },
]

export default function DashboardPage() {
  const router = useRouter()
  const { user, initAuth, logout } = useAuth()
  const { loadAllData } = useData()
  const [view, setView] = useState<ViewType>('pos')
  const [loading, setLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)
  const initAuthRef = useRef(false)
  const dataLoadedRef = useRef(false)

  const isStaff = user?.staffRole === 'staff'
  const NAV_ITEMS = ALL_NAV_ITEMS.filter(item => !isStaff || !item.ownerOnly)

  useEffect(() => {
    if (initAuthRef.current) return
    initAuthRef.current = true
    initAuth()
    setAuthChecked(true)
  }, [])

  useEffect(() => {
    if (!authChecked) return
    if (dataLoadedRef.current) return
    if (user) {
      dataLoadedRef.current = true
      loadAllData().finally(() => setLoading(false))
    } else {
      // No user yet — keep waiting (auth bypassed, backend will return first user)
      setLoading(false)
    }
  }, [authChecked, user, router, loadAllData])

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-200">
            <i className="fas fa-receipt text-white text-xl"></i>
          </div>
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
            Loading...
          </div>
        </div>
      </div>
    )
  }

  const daysLeft = (() => {
    const expiry = user.plan === 'trial' ? user.trialExpiry : user.subscriptionExpiry
    if (!expiry) return null
    return Math.max(0, Math.ceil((new Date(expiry).getTime() - Date.now()) / 86400000))
  })()

  return (
    <div className="h-screen flex overflow-hidden bg-[#F4F5F7]">

      {/* ── Left Sidebar (desktop) ── */}
      <aside className="hidden md:flex flex-col w-56 bg-white border-r border-gray-100 flex-shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
          <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center shadow-md shadow-orange-200 flex-shrink-0">
            <i className="fas fa-receipt text-white text-base"></i>
          </div>
          <div>
            <h1 className="text-gray-900 font-bold text-base leading-tight">EZOrder</h1>
            <p className="text-gray-400 text-[10px] leading-none mt-0.5">POS System</p>
          </div>
        </div>

        {/* User info */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
              <span className="text-orange-600 font-bold text-sm">{user.businessName?.charAt(0).toUpperCase()}</span>
            </div>
            <div className="min-w-0">
              <p className="text-gray-800 font-semibold text-xs truncate">{user.businessName}</p>
              {isStaff ? (
                <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none mt-0.5 bg-blue-100 text-blue-700">
                  STAFF · {user.staffName}
                </span>
              ) : (
                <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none mt-0.5 ${
                  user.plan === 'active'
                    ? 'bg-green-100 text-green-700'
                    : daysLeft !== null && daysLeft <= 3
                      ? 'bg-red-100 text-red-600'
                      : 'bg-orange-100 text-orange-600'
                }`}>
                  {user.plan === 'active' ? 'PRO' : `TRIAL${daysLeft !== null ? ` · ${daysLeft}d` : ''}`}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex flex-col gap-0.5 p-3 flex-1">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`sidebar-nav-item ${view === item.id ? 'active' : ''}`}
            >
              <i className={`fas ${item.icon} w-4 text-center text-sm flex-shrink-0`}></i>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="p-3 border-t border-gray-100 space-y-0.5">
          {!isStaff && (
            <button
              onClick={() => router.push('/settings')}
              className="sidebar-nav-item w-full"
            >
              <i className="fas fa-sliders-h w-4 text-center text-sm flex-shrink-0"></i>
              <span>Tetapan</span>
            </button>
          )}
          {!isStaff && user.role === 'admin' && (
            <button
              onClick={() => router.push('/admin')}
              className="sidebar-nav-item w-full"
            >
              <i className="fas fa-shield-alt w-4 text-center text-sm flex-shrink-0"></i>
              <span>Admin Panel</span>
            </button>
          )}
          <button
            onClick={() => { logout(); router.push('/') }}
            className="sidebar-nav-item w-full text-red-400 hover:!text-red-500 hover:!bg-red-50"
          >
            <i className="fas fa-sign-out-alt w-4 text-center text-sm flex-shrink-0"></i>
            <span>Log Keluar</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Navbar currentView={view} />

        <main className="flex-1 overflow-hidden flex flex-col pb-16 md:pb-0">
          {view === 'pos'      && <OrderTab />}
          {view === 'queue'    && <QueueTab />}
          {view === 'reports'  && <SalesTab />}
          {view === 'expenses' && <ExpensesTab />}
          {view === 'manage'   && (
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              <ManageTab />
            </div>
          )}
        </main>
      </div>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex bg-white border-t border-gray-100 shadow-lg safe-area-bottom">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-semibold transition-all no-min-h ${
              view === item.id ? 'text-orange-500 mobile-nav-active' : 'text-gray-400'
            }`}
          >
            <i className={`fas ${item.icon} text-base`}></i>
            <span className="text-[10px]">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
