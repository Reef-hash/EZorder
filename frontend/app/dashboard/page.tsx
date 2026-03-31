'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { useData } from '@/lib/hooks/useData'
import Navbar from '@/components/Navbar'
import OrderTab from '@/components/tabs/OrderTab'
import ManageTab from '@/components/tabs/ManageTab'
import HistoryTab from '@/components/tabs/HistoryTab'

type TabType = 'order' | 'manage' | 'history'

export default function DashboardPage() {
  const router = useRouter()
  const { user, initAuth } = useAuth()
  const { loadAllData } = useData()
  const [currentTab, setCurrentTab] = useState<TabType>('order')
  const [loading, setLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)
  const initAuthRef = useRef(false)

  useEffect(() => {
    // Only call initAuth once on mount
    if (initAuthRef.current) return
    initAuthRef.current = true
    
    console.log('Dashboard mounted, initializing auth...')
    initAuth()
    setAuthChecked(true)
  }, [])

  useEffect(() => {
    if (!authChecked) return
    
    console.log('Auth checked, user state:', user)
    if (user) {
      console.log('User logged in, loading data...')
      loadAllData().finally(() => {
        console.log('Data loading finished')
        setLoading(false)
      })
    } else {
      console.log('No user, redirecting to login')
      router.push('/')
      setLoading(false)
    }
  }, [authChecked, user, router, loadAllData])

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border b-slate-600 border-t-emerald-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navbar />

      {/* Tab Navigation */}
      <div className="sticky top-16 z-40 bg-slate-900/50 backdrop-blur border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => setCurrentTab('order')}
              className={`flex items-center gap-2 px-6 py-4 font-semibold whitespace-nowrap transition-all border-b-2 ${
                currentTab === 'order'
                  ? 'text-emerald-400 border-emerald-500'
                  : 'text-slate-400 border-transparent hover:text-slate-300'
              }`}
            >
              <i className="fas fa-shopping-cart"></i>
              Take Order
            </button>
            <button
              onClick={() => setCurrentTab('manage')}
              className={`flex items-center gap-2 px-6 py-4 font-semibold whitespace-nowrap transition-all border-b-2 ${
                currentTab === 'manage'
                  ? 'text-emerald-400 border-emerald-500'
                  : 'text-slate-400 border-transparent hover:text-slate-300'
              }`}
            >
              <i className="fas fa-cogs"></i>
              Manage
            </button>
            <button
              onClick={() => setCurrentTab('history')}
              className={`flex items-center gap-2 px-6 py-4 font-semibold whitespace-nowrap transition-all border-b-2 ${
                currentTab === 'history'
                  ? 'text-emerald-400 border-emerald-500'
                  : 'text-slate-400 border-transparent hover:text-slate-300'
              }`}
            >
              <i className="fas fa-history"></i>
              History
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentTab === 'order' && <OrderTab />}
        {currentTab === 'manage' && <ManageTab />}
        {currentTab === 'history' && <HistoryTab />}
      </main>
    </div>
  )
}
