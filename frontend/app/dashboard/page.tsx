'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { useData } from '@/lib/hooks/useData'
import Navbar from '@/components/Navbar'
import OrderTab from '@/components/tabs/OrderTab'
import ManageTab from '@/components/tabs/ManageTab'
import HistoryTab from '@/components/tabs/HistoryTab'

type ViewType = 'pos' | 'orders' | 'manage'

const NAV_ITEMS: { id: ViewType; icon: string; label: string }[] = [
  { id: 'pos',     icon: 'fa-cash-register', label: 'POS'    },
  { id: 'orders',  icon: 'fa-list-alt',      label: 'Orders' },
  { id: 'manage',  icon: 'fa-cog',           label: 'Manage' },
]

export default function DashboardPage() {
  const router = useRouter()
  const { user, initAuth } = useAuth()
  const { loadAllData } = useData()
  const [view, setView] = useState<ViewType>('pos')
  const [collapsed, setCollapsed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)
  const initAuthRef = useRef(false)
  const dataLoadedRef = useRef(false)

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
      router.push('/')
      setLoading(false)
    }
  }, [authChecked, user, router, loadAllData])

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0c14]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-amber-500/20 border-t-amber-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#0a0c14]">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — hidden on mobile (use bottom nav instead) */}
        <aside className={`hidden md:flex flex-col bg-[#0f1117] border-r border-amber-500/10 flex-shrink-0 transition-all duration-300 ${collapsed ? 'w-14' : 'w-52'}`}>
          {/* Toggle button */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-end p-3 text-slate-500 hover:text-amber-400 transition border-b border-amber-500/10"
          >
            <i className={`fas fa-${collapsed ? 'chevron-right' : 'chevron-left'} text-xs`}></i>
          </button>

          {/* Nav items */}
          <nav className="flex flex-col gap-1 p-2 flex-1">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl font-semibold text-sm transition-all ${
                  view === item.id
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                <i className={`fas ${item.icon} w-4 text-center flex-shrink-0`}></i>
                {!collapsed && <span>{item.label}</span>}
              </button>
            ))}

            {/* Reports — coming soon */}
            <button
              disabled
              className="flex items-center gap-3 px-3 py-3 rounded-xl font-semibold text-sm text-slate-600 cursor-not-allowed"
            >
              <i className="fas fa-chart-bar w-4 text-center flex-shrink-0"></i>
              {!collapsed && (
                <span className="flex items-center gap-2">
                  Reports
                  <span className="text-[9px] bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded-full">soon</span>
                </span>
              )}
            </button>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-hidden flex flex-col">
          {view === 'pos'    && <OrderTab />}
          {view === 'orders' && (
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              <HistoryTab />
            </div>
          )}
          {view === 'manage' && (
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              <ManageTab />
            </div>
          )}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden flex bg-[#0f1117] border-t border-amber-500/10 safe-area-bottom">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-semibold transition-all ${
              view === item.id ? 'text-amber-400' : 'text-slate-500'
            }`}
          >
            <i className={`fas ${item.icon} text-base`}></i>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

