'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { adminAPI } from '@/lib/api'
import toast from 'react-hot-toast'

interface AdminUser {
  _id: string
  businessName: string
  email: string
  plan: 'trial' | 'active' | 'expired' | 'cancelled'
  role: string
  trialExpiry?: string
  subscriptionExpiry?: string | null
  createdAt: string
}

interface Stats {
  total: number
  trial: number
  active: number
  expired: number
  cancelled: number
  newToday: number
  newThisWeek: number
}

const PLAN_BADGE: Record<string, string> = {
  trial: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  active: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  expired: 'bg-red-500/20 text-red-400 border border-red-500/30',
  cancelled: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
}

function daysLeft(dateStr?: string | null): string {
  if (!dateStr) return '—'
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return 'Expired'
  if (diff === 0) return 'Today'
  return `${diff}d left`
}

export default function AdminPage() {
  const router = useRouter()
  const { user, initAuth } = useAuth()
  const [authReady, setAuthReady] = useState(false)
  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    initAuth().then(() => setAuthReady(true))
  }, [])

  useEffect(() => {
    if (!authReady) return
    if (!user) { router.push('/'); return }
    if (user.role !== 'admin') { router.push('/dashboard'); return }
    loadData()
  }, [authReady, user])

  const loadData = useCallback(async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getUsers(),
      ])
      setStats(statsRes.data)
      setUsers(usersRes.data)
    } catch {
      toast.error('Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleSearch = async () => {
    try {
      const { data } = await adminAPI.getUsers({ search, plan: planFilter || undefined })
      setUsers(data)
    } catch {
      toast.error('Search failed')
    }
  }

  const handleAction = async (userId: string, action: 'activate' | 'extend_trial' | 'suspend' | 'expire') => {
    setActionLoading(userId + action)
    try {
      await adminAPI.updatePlan(userId, action)
      toast.success('Updated!')
      loadData()
    } catch {
      toast.error('Action failed')
    } finally {
      setActionLoading(null)
    }
  }

  if (!authReady || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-amber-500 to-orange-600 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 md:h-16">
            <div className="flex items-center gap-2">
              <i className="fas fa-shield-alt text-white text-xl"></i>
              <h1 className="text-white font-bold text-xl">EZOrder Admin</h1>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2"
            >
              <i className="fas fa-arrow-left"></i>
              <span className="hidden sm:inline">Back to Dashboard</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Users', value: stats.total, icon: 'fa-users', color: 'text-blue-400' },
              { label: 'Trial', value: stats.trial, icon: 'fa-clock', color: 'text-yellow-400' },
              { label: 'Active', value: stats.active, icon: 'fa-check-circle', color: 'text-emerald-400' },
              { label: 'Expired', value: stats.expired + stats.cancelled, icon: 'fa-times-circle', color: 'text-red-400' },
            ].map((s) => (
              <div key={s.label} className="glass-effect rounded-xl p-4 border border-slate-700/50">
                <div className="flex items-center gap-2 mb-1">
                  <i className={`fas ${s.icon} ${s.color} text-sm`}></i>
                  <span className="text-slate-400 text-xs font-medium">{s.label}</span>
                </div>
                <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {stats && (
          <div className="flex gap-4 text-sm text-slate-400">
            <span><i className="fas fa-calendar-day mr-1 text-emerald-400"></i>New today: <strong className="text-white">{stats.newToday}</strong></span>
            <span><i className="fas fa-calendar-week mr-1 text-emerald-400"></i>This week: <strong className="text-white">{stats.newThisWeek}</strong></span>
          </div>
        )}

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search by email or business name..."
            className="input-base flex-1"
          />
          <select
            value={planFilter}
            onChange={(e) => { setPlanFilter(e.target.value); }}
            className="input-base sm:w-40"
          >
            <option value="">All Plans</option>
            <option value="trial">Trial</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button onClick={handleSearch} className="btn-primary px-5 flex items-center gap-2">
            <i className="fas fa-search"></i>
            Search
          </button>
        </div>

        {/* Users Table */}
        <div className="glass-effect rounded-xl border border-slate-700/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50 bg-slate-800/50">
                  <th className="text-left px-4 py-3 text-slate-400 text-sm font-semibold">Business</th>
                  <th className="text-left px-4 py-3 text-slate-400 text-sm font-semibold">Email</th>
                  <th className="text-left px-4 py-3 text-slate-400 text-sm font-semibold">Plan</th>
                  <th className="text-left px-4 py-3 text-slate-400 text-sm font-semibold">Expiry</th>
                  <th className="text-left px-4 py-3 text-slate-400 text-sm font-semibold">Joined</th>
                  <th className="text-right px-4 py-3 text-slate-400 text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-500">No users found</td>
                  </tr>
                )}
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-white font-medium">{u.businessName}</span>
                      {u.role === 'admin' && (
                        <span className="ml-2 text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30 px-1.5 py-0.5 rounded">admin</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-300 text-sm">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${PLAN_BADGE[u.plan]}`}>
                        {u.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-sm">
                      {u.plan === 'trial' ? daysLeft(u.trialExpiry) : daysLeft(u.subscriptionExpiry)}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-sm">
                      {new Date(u.createdAt).toLocaleDateString('en-MY')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end flex-wrap">
                        {u.plan !== 'active' && (
                          <button
                            onClick={() => handleAction(u._id, 'activate')}
                            disabled={!!actionLoading}
                            className="text-xs bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded transition"
                          >
                            {actionLoading === u._id + 'activate' ? '...' : 'Activate'}
                          </button>
                        )}
                        <button
                          onClick={() => handleAction(u._id, 'extend_trial')}
                          disabled={!!actionLoading}
                          className="text-xs bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30 px-2 py-1 rounded transition"
                        >
                          {actionLoading === u._id + 'extend_trial' ? '...' : '+14d Trial'}
                        </button>
                        {u.plan !== 'cancelled' && u.role !== 'admin' && (
                          <button
                            onClick={() => handleAction(u._id, 'suspend')}
                            disabled={!!actionLoading}
                            className="text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 px-2 py-1 rounded transition"
                          >
                            {actionLoading === u._id + 'suspend' ? '...' : 'Suspend'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}
