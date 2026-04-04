'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAppStore, Order } from '@/lib/store'
import { useData } from '@/lib/hooks/useData'
import { reportsAPI } from '@/lib/api'
import type { ProfitLoss } from '@/lib/store'

type Period = 'today' | 'week' | 'month' | 'all'

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function isThisWeek(date: Date) {
  const now = new Date()
  const start = new Date(now)
  start.setDate(now.getDate() - now.getDay())
  start.setHours(0, 0, 0, 0)
  return date >= start
}

function isThisMonth(date: Date) {
  const now = new Date()
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
}

function sumRevenue(arr: Order[]) {
  return arr.reduce((t, o) => t + o.total, 0)
}

function avgOrderValue(arr: Order[]) {
  return arr.length === 0 ? 0 : sumRevenue(arr) / arr.length
}

// Uses costPrice snapshot stored in order item (accurate history)
function sumCOGS(arr: Order[]) {
  return arr.reduce((total, order) => {
    return total + order.items.reduce((s, item) => s + (item.costPrice ?? 0) * item.quantity, 0)
  }, 0)
}

interface StatCardProps {
  icon: string
  label: string
  value: string
  sub: string
  color: 'amber' | 'blue' | 'purple' | 'emerald'
}

function StatCard({ icon, label, value, sub, color }: StatCardProps) {
  const border = {
    amber: 'border-amber-500/25 bg-amber-500/5',
    blue: 'border-blue-500/25 bg-blue-500/5',
    purple: 'border-purple-500/25 bg-purple-500/5',
    emerald: 'border-emerald-500/25 bg-emerald-500/5',
  }[color]
  const text = {
    amber: 'text-amber-400',
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    emerald: 'text-emerald-400',
  }[color]

  return (
    <div className={`border rounded-xl p-3.5 ${border}`}>
      <p className={`text-xs font-semibold mb-2 ${text}`}>
        <i className={`fas ${icon} mr-1.5`}></i>{label}
      </p>
      <p className={`text-xl font-bold ${text}`}>{value}</p>
      <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>
    </div>
  )
}

const PERIODS: { id: Period; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'all', label: 'All Time' },
]

function periodDateRange(period: Period): { from?: string; to?: string } {
  const now = new Date()
  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  if (period === 'today') return { from: fmt(now), to: fmt(now) }
  if (period === 'week') {
    const start = new Date(now)
    start.setDate(now.getDate() - now.getDay())
    return { from: fmt(start), to: fmt(now) }
  }
  if (period === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    return { from: fmt(start), to: fmt(now) }
  }
  return {}
}

export default function SalesTab() {
  const { orders } = useAppStore()
  const { loadOrders } = useData()
  const [period, setPeriod] = useState<Period>('today')
  const [pl, setPl] = useState<ProfitLoss | null>(null)
  const [plLoading, setPlLoading] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)

  useEffect(() => { loadOrders() }, [])

  const fetchPL = useCallback(async (p: Period) => {
    setPlLoading(true)
    try {
      const range = periodDateRange(p)
      const res = await reportsAPI.profitLoss(range)
      setPl(res.data)
    } catch {
      setPl(null)
    } finally {
      setPlLoading(false)
    }
  }, [])

  useEffect(() => { fetchPL(period) }, [period, fetchPL])

  const handleExcelExport = async () => {
    setExportLoading(true)
    try {
      const range = periodDateRange(period)
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : ''
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      const q = new URLSearchParams()
      if (range.from) q.set('from', range.from)
      if (range.to) q.set('to', range.to)
      const resp = await fetch(`${base}/api/reports/export?${q.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!resp.ok) throw new Error('Export failed')
      const blob = await resp.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `laporan_${period}_${new Date().toISOString().slice(0, 10)}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExportLoading(false)
    }
  }

  const exportCSV = (data: Order[], label: string) => {
    const rows = [
      ['Date', 'Bill', 'Items', 'Payment', 'Discount', 'COGS (RM)', 'Total (RM)'],
      ...data.map(o => [
        new Date(o.createdAt).toLocaleString('en-MY'),
        o.customerName,
        o.items.map(i => `${i.name} x${i.quantity}`).join(' | '),
        o.paymentMethod || '',
        o.discount ? `${o.discountType === 'percent' ? o.discount + '%' : 'RM' + o.discount}` : '',
        o.items.reduce((s, i) => s + (i.costPrice ?? 0) * i.quantity, 0).toFixed(2),
        o.total.toFixed(2),
      ]),
    ]
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sales_${label}_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const now = new Date()
  const completed = orders.filter(o => o.status === 'completed')
  const todayOrders  = completed.filter(o => isSameDay(new Date(o.createdAt), now))
  const weekOrders   = completed.filter(o => isThisWeek(new Date(o.createdAt)))
  const monthOrders  = completed.filter(o => isThisMonth(new Date(o.createdAt)))

  const filtered = period === 'today' ? todayOrders
    : period === 'week'  ? weekOrders
    : period === 'month' ? monthOrders
    : completed

  const filtered_revenue = sumRevenue(filtered)
  const filtered_avg = avgOrderValue(filtered)
  const filtered_cogs = sumCOGS(filtered)
  const hasCostData = filtered.some(o => o.items.some(i => i.costPrice != null))

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <i className="fas fa-chart-bar text-amber-400 text-base"></i>
            Sales Report
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Completed orders only</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportCSV(filtered, period)}
            disabled={filtered.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold text-slate-400 hover:text-white hover:border-amber-500/30 transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <i className="fas fa-file-csv"></i>
            CSV
          </button>
          <button
            onClick={handleExcelExport}
            disabled={exportLoading || filtered.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <i className={`fas ${exportLoading ? 'fa-spinner fa-spin' : 'fa-file-excel'}`}></i>
            Excel
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon="fa-sun" color="amber" label="Today"
          value={`RM${sumRevenue(todayOrders).toFixed(2)}`}
          sub={`${todayOrders.length} orders`}
        />
        <StatCard
          icon="fa-calendar-week" color="blue" label="This Week"
          value={`RM${sumRevenue(weekOrders).toFixed(2)}`}
          sub={`${weekOrders.length} orders`}
        />
        <StatCard
          icon="fa-calendar-alt" color="purple" label="This Month"
          value={`RM${sumRevenue(monthOrders).toFixed(2)}`}
          sub={`${monthOrders.length} orders`}
        />
        <StatCard
          icon="fa-chart-line" color="emerald" label="All Time"
          value={`RM${sumRevenue(completed).toFixed(2)}`}
          sub={`${completed.length} orders`}
        />
      </div>

      {/* Period filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {PERIODS.map(p => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${
              period === p.id
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                : 'bg-white/5 border-white/10 text-slate-400 hover:border-amber-500/25'
            }`}
          >
            {p.label}
          </button>
        ))}
        <div className="ml-auto text-right">
          <p className="text-xs font-bold text-amber-400">RM{filtered_revenue.toFixed(2)}</p>
          <p className="text-[10px] text-slate-500">{filtered.length} orders Â· avg RM{filtered_avg.toFixed(2)}</p>
        </div>
      </div>

      {/* P&L Summary â€” from backend aggregation */}
      {plLoading ? (
        <div className="flex items-center gap-2 text-slate-500 text-xs py-2">
          <i className="fas fa-spinner fa-spin"></i> Mengira P&L...
        </div>
      ) : pl ? (
        <div className="bg-white/3 border border-white/8 rounded-xl p-4 space-y-3">
          <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">
            <i className="fas fa-calculator mr-1.5"></i>Laporan Untung Rugi
          </p>
          {/* Revenue â†’ COGS â†’ Gross Profit */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-[10px] text-slate-500 uppercase tracking-wide">Hasil (Revenue)</p>
              <p className="text-sm font-bold text-amber-400">RM{pl.revenue.toFixed(2)}</p>
            </div>
            <div className="text-slate-600">âˆ’</div>
            <div className="flex-1">
              <p className="text-[10px] text-slate-500 uppercase tracking-wide">COGS</p>
              <p className="text-sm font-bold text-slate-400">RM{pl.cogs.toFixed(2)}</p>
            </div>
            <div className="text-slate-600">=</div>
            <div className="flex-1">
              <p className="text-[10px] text-slate-500 uppercase tracking-wide">Untung Kasar</p>
              <p className={`text-sm font-bold ${pl.grossProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                RM{pl.grossProfit.toFixed(2)}
              </p>
            </div>
          </div>
          {/* OPEX â†’ Net Profit */}
          <div className="flex items-center gap-3 border-t border-white/8 pt-3">
            <div className="flex-1">
              <p className="text-[10px] text-slate-500 uppercase tracking-wide">Untung Kasar</p>
              <p className="text-sm font-bold text-emerald-400">RM{pl.grossProfit.toFixed(2)}</p>
            </div>
            <div className="text-slate-600">âˆ’</div>
            <div className="flex-1">
              <p className="text-[10px] text-slate-500 uppercase tracking-wide">OPEX (Belanja)</p>
              <p className="text-sm font-bold text-orange-400">RM{pl.opex.toFixed(2)}</p>
            </div>
            <div className="text-slate-600">=</div>
            <div className={`flex-1 rounded-lg px-2 py-1 ${pl.netProfit >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
              <p className="text-[10px] text-slate-500 uppercase tracking-wide">Untung Bersih</p>
              <p className={`text-base font-bold ${pl.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {pl.netProfit >= 0 ? '+' : ''}RM{pl.netProfit.toFixed(2)}
              </p>
            </div>
          </div>
          {pl.opex === 0 && (
            <p className="text-[10px] text-slate-600 italic">
              <i className="fas fa-info-circle mr-1"></i>
              OPEX = RM0.00 â€” tambah perbelanjaan dalam tab Perbelanjaan untuk kira untung bersih yang tepat.
            </p>
          )}
        </div>
      ) : hasCostData ? (
        <div className="flex items-center gap-3 bg-white/3 border border-white/8 rounded-xl px-4 py-3">
          <div className="flex-1">
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">Hasil</p>
            <p className="text-sm font-bold text-amber-400">RM{filtered_revenue.toFixed(2)}</p>
          </div>
          <div className="text-slate-600">âˆ’</div>
          <div className="flex-1">
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">COGS</p>
            <p className="text-sm font-bold text-slate-400">RM{filtered_cogs.toFixed(2)}</p>
          </div>
          <div className="text-slate-600">=</div>
          <div className="flex-1">
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">Untung Kasar</p>
            <p className={`text-sm font-bold ${filtered_revenue - filtered_cogs >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              RM{(filtered_revenue - filtered_cogs).toFixed(2)}
            </p>
          </div>
        </div>
      ) : null}

      {/* Orders list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-600">
          <i className="fas fa-receipt text-4xl mb-3 opacity-20"></i>
          <p className="text-sm">No sales for this period</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(order => (
            <div key={order.id} className="bg-white/5 border border-white/8 rounded-xl p-3.5 flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-bold text-amber-400 text-sm">Bill {order.customerName}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                    order.paymentMethod === 'cash'
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'bg-blue-500/15 text-blue-400'
                  }`}>
                    {order.paymentMethod === 'cash' ? 'Cash' : 'QR'}
                  </span>
                  {order.orderType === 'dine_in' && (
                    <span className="text-[10px] text-slate-500">
                      <i className="fas fa-chair mr-0.5"></i>
                      {order.tableName || 'Dine In'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 truncate">
                  {order.items.map(i => `${i.name} Ã—${i.quantity}`).join(', ')}
                </p>
                <p className="text-[10px] text-slate-600 mt-1">
                  {new Date(order.createdAt).toLocaleString('en-MY', {
                    day: 'numeric', month: 'short',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-base font-bold text-amber-400">RM{order.total.toFixed(2)}</p>
                {(order.discount ?? 0) > 0 && (
                  <p className="text-[10px] text-red-400/70">
                    -{order.discountType === 'percent' ? `${order.discount}%` : `RM${order.discount}`}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
