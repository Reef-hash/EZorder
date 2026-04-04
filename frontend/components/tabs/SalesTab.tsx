'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { useData } from '@/lib/hooks/useData'
import { reportsAPI } from '@/lib/api'
import type { ProfitLoss, SalesByItem, SalesByCategory, SalesByPayment, SstSummary } from '@/lib/store'

type Period = 'today' | 'week' | 'month' | 'all'
type SubTab = 'summary' | 'by-item' | 'by-category' | 'by-payment' | 'sst'

const PERIODS: { id: Period; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'all', label: 'All Time' },
]

const SUB_TABS: { id: SubTab; label: string; icon: string }[] = [
  { id: 'summary',      label: 'Summary',    icon: 'fa-chart-bar' },
  { id: 'by-item',      label: 'By Item',    icon: 'fa-list' },
  { id: 'by-category',  label: 'By Category',icon: 'fa-tags' },
  { id: 'by-payment',   label: 'By Payment', icon: 'fa-credit-card' },
  { id: 'sst',          label: 'SST',        icon: 'fa-landmark' },
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

function rm(n: number) { return `RM ${n.toFixed(2)}` }

function CardStat({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div className={`border rounded-xl p-3.5 ${color}`}>
      <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide mb-1">{label}</p>
      <p className="text-base font-bold text-amber-400">{value}</p>
      {sub && <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>}
    </div>
  )
}

export default function SalesTab() {
  const { orders } = useAppStore()
  const { loadOrders } = useData()
  const [period, setPeriod]     = useState<Period>('today')
  const [subTab, setSubTab]     = useState<SubTab>('summary')
  const [loading, setLoading]   = useState(false)
  const [pl, setPl]             = useState<ProfitLoss | null>(null)
  const [byItem, setByItem]     = useState<SalesByItem[]>([])
  const [byCat, setByCat]       = useState<SalesByCategory[]>([])
  const [byPay, setByPay]       = useState<SalesByPayment[]>([])
  const [sst, setSst]           = useState<SstSummary | null>(null)
  const [exportLoading, setExportLoading] = useState(false)

  useEffect(() => { loadOrders() }, [])

  const fetchAll = useCallback(async (p: Period) => {
    setLoading(true)
    try {
      const range = periodDateRange(p)
      const [plRes, itemRes, catRes, payRes, sstRes] = await Promise.allSettled([
        reportsAPI.profitLoss(range),
        reportsAPI.byItem(range),
        reportsAPI.byCategory(range),
        reportsAPI.byPayment(range),
        reportsAPI.sst(range),
      ])
      if (plRes.status === 'fulfilled')  setPl(plRes.value.data)
      if (itemRes.status === 'fulfilled') setByItem(itemRes.value.data)
      if (catRes.status === 'fulfilled')  setByCat(catRes.value.data)
      if (payRes.status === 'fulfilled')  setByPay(payRes.value.data)
      if (sstRes.status === 'fulfilled')  setSst(sstRes.value.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll(period) }, [period, fetchAll])

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
      a.download = `EZOrder_Laporan_${period}_${new Date().toISOString().slice(0, 10)}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExportLoading(false)
    }
  }

  const completed = orders.filter(o => o.status === 'completed')

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <i className="fas fa-chart-bar text-amber-400 text-base"></i>
            Sales Report
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Laporan jualan — siap untuk LHDN</p>
        </div>
        <button
          onClick={handleExcelExport}
          disabled={exportLoading || completed.length === 0}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <i className={`fas ${exportLoading ? 'fa-spinner fa-spin' : 'fa-file-excel'}`}></i>
          Excel LHDN
        </button>
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
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-white/3 border border-white/8 rounded-xl p-1 overflow-x-auto">
        {SUB_TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
              subTab === t.id
                ? 'bg-amber-500/20 text-amber-400'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <i className={`fas ${t.icon} text-[10px]`}></i>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-500 text-xs py-6">
          <i className="fas fa-spinner fa-spin"></i> Memuatkan data...
        </div>
      ) : (
        <>
          {/* ── Summary ─────────────────────────────────────────────────── */}
          {subTab === 'summary' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <CardStat label="Jualan Kasar" value={rm(pl?.revenue ?? 0)} sub={`${pl?.orderCount ?? 0} bil`} color="border-amber-500/20 bg-amber-500/5" />
                <CardStat label="Cukai SST" value={rm(pl?.totalTax ?? 0)} sub="6% perkhidmatan" color="border-orange-500/20 bg-orange-500/5" />
                <CardStat label="Jualan Bersih" value={rm(pl?.revenueBeforeTax ?? 0)} sub="selepas SST" color="border-blue-500/20 bg-blue-500/5" />
                <CardStat label="COGS" value={rm(pl?.cogs ?? 0)} sub="kos barangan" color="border-purple-500/20 bg-purple-500/5" />
                <CardStat label="OPEX" value={rm(pl?.opex ?? 0)} sub="perbelanjaan" color="border-rose-500/20 bg-rose-500/5" />
                <div className={`border rounded-xl p-3.5 ${(pl?.netProfit ?? 0) >= 0 ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-red-500/30 bg-red-500/10'}`}>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide mb-1">Untung Bersih</p>
                  <p className={`text-base font-bold ${(pl?.netProfit ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {(pl?.netProfit ?? 0) >= 0 ? '+' : ''}{rm(pl?.netProfit ?? 0)}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">selepas semua kos</p>
                </div>
              </div>
              {pl && pl.opex === 0 && (
                <p className="text-[10px] text-slate-600 italic px-1">
                  <i className="fas fa-info-circle mr-1"></i>
                  OPEX RM0.00 — rekod perbelanjaan dalam tab "Perbelanjaan" untuk untung bersih yang tepat.
                </p>
              )}
            </div>
          )}

          {/* ── By Item ─────────────────────────────────────────────────── */}
          {subTab === 'by-item' && (
            <div className="overflow-x-auto rounded-xl border border-white/8">
              <table className="w-full text-xs min-w-[500px]">
                <thead>
                  <tr className="bg-slate-800/60 text-slate-400">
                    <th className="text-left px-3 py-2.5 font-semibold">Nama Item</th>
                    <th className="text-right px-3 py-2.5 font-semibold">Kuantiti</th>
                    <th className="text-right px-3 py-2.5 font-semibold">Hasil (RM)</th>
                    <th className="text-right px-3 py-2.5 font-semibold">COGS (RM)</th>
                    <th className="text-right px-3 py-2.5 font-semibold">SST (RM)</th>
                    <th className="text-right px-3 py-2.5 font-semibold">Untung (RM)</th>
                  </tr>
                </thead>
                <tbody>
                  {byItem.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-8 text-slate-600">Tiada data</td></tr>
                  ) : byItem.map((row) => (
                    <tr key={row.name} className="border-t border-white/5 hover:bg-white/3 transition">
                      <td className="px-3 py-2 font-medium text-slate-200">{row.name}</td>
                      <td className="px-3 py-2 text-right text-slate-400">{row.qty}</td>
                      <td className="px-3 py-2 text-right text-amber-400">{row.revenue.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right text-slate-500">{row.cogs.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right text-orange-400">{row.tax.toFixed(2)}</td>
                      <td className={`px-3 py-2 text-right font-semibold ${row.grossProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {row.grossProfit.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                {byItem.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 border-amber-500/30 bg-slate-800/60">
                      <td className="px-3 py-2 font-bold text-slate-300">JUMLAH</td>
                      <td className="px-3 py-2 text-right font-bold text-slate-300">{byItem.reduce((s, r) => s + r.qty, 0)}</td>
                      <td className="px-3 py-2 text-right font-bold text-amber-400">{byItem.reduce((s, r) => s + r.revenue, 0).toFixed(2)}</td>
                      <td className="px-3 py-2 text-right font-bold text-slate-400">{byItem.reduce((s, r) => s + r.cogs, 0).toFixed(2)}</td>
                      <td className="px-3 py-2 text-right font-bold text-orange-400">{byItem.reduce((s, r) => s + r.tax, 0).toFixed(2)}</td>
                      <td className="px-3 py-2 text-right font-bold text-emerald-400">{byItem.reduce((s, r) => s + r.grossProfit, 0).toFixed(2)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}

          {/* ── By Category ─────────────────────────────────────────────── */}
          {subTab === 'by-category' && (
            <div className="overflow-x-auto rounded-xl border border-white/8">
              <table className="w-full text-xs min-w-[400px]">
                <thead>
                  <tr className="bg-slate-800/60 text-slate-400">
                    <th className="text-left px-3 py-2.5 font-semibold">Kategori</th>
                    <th className="text-right px-3 py-2.5 font-semibold">Kuantiti</th>
                    <th className="text-right px-3 py-2.5 font-semibold">Hasil (RM)</th>
                    <th className="text-right px-3 py-2.5 font-semibold">COGS (RM)</th>
                    <th className="text-right px-3 py-2.5 font-semibold">Untung (RM)</th>
                  </tr>
                </thead>
                <tbody>
                  {byCat.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-8 text-slate-600">Tiada data</td></tr>
                  ) : byCat.map((row) => (
                    <tr key={row.category} className="border-t border-white/5 hover:bg-white/3 transition">
                      <td className="px-3 py-2 font-medium text-slate-200">{row.category}</td>
                      <td className="px-3 py-2 text-right text-slate-400">{row.qty}</td>
                      <td className="px-3 py-2 text-right text-amber-400">{row.revenue.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right text-slate-500">{row.cogs.toFixed(2)}</td>
                      <td className={`px-3 py-2 text-right font-semibold ${row.grossProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {row.grossProfit.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── By Payment ──────────────────────────────────────────────── */}
          {subTab === 'by-payment' && (
            <div className="space-y-3">
              {byPay.length === 0 ? (
                <p className="text-center py-8 text-slate-600 text-xs">Tiada data</p>
              ) : byPay.map((row) => {
                const totalAll = byPay.reduce((s, r) => s + r.total, 0)
                const pct = totalAll > 0 ? (row.total / totalAll) * 100 : 0
                return (
                  <div key={row.method} className="border border-white/8 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <i className={`fas ${row.method === 'cash' ? 'fa-money-bill-wave text-emerald-400' : 'fa-qrcode text-blue-400'} text-sm`}></i>
                        <span className="text-sm font-semibold text-slate-200 capitalize">{row.method === 'cash' ? 'Tunai' : row.method === 'qr' ? 'QR / Online' : row.method}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-amber-400">RM {row.total.toFixed(2)}</p>
                        <p className="text-[10px] text-slate-500">{row.count} transaksi · SST RM{row.tax.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${pct}%` }}></div>
                    </div>
                    <p className="text-[10px] text-slate-600 mt-1">{pct.toFixed(1)}% daripada jumlah jualan</p>
                  </div>
                )
              })}
              {byPay.length > 0 && (
                <div className="flex items-center justify-between border-t border-white/8 pt-3 px-1">
                  <span className="text-xs text-slate-500 font-semibold">JUMLAH</span>
                  <span className="text-sm font-bold text-amber-400">RM {byPay.reduce((s, r) => s + r.total, 0).toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          {/* ── SST ─────────────────────────────────────────────────────── */}
          {subTab === 'sst' && (
            <div className="space-y-4">
              <div className="border border-amber-500/20 bg-amber-500/5 rounded-xl p-4">
                <p className="text-xs font-semibold text-amber-400 mb-3">
                  <i className="fas fa-landmark mr-1.5"></i>Ringkasan SST — Borang SST-02
                </p>
                {sst ? (
                  <div className="space-y-2.5">
                    <Row label="Jualan Kasar" value={rm(sst.grossSales)} />
                    <hr className="border-white/8" />
                    <Row label="Jualan Bercukai (Taxable)" value={rm(sst.taxableAmount)} note="Dikenakan 6% SST" />
                    <Row label="Jualan Dikecualikan (Exempt)" value={rm(sst.exemptAmount)} note="Tiada cukai" />
                    <hr className="border-white/8" />
                    <Row label="Kadar Cukai Perkhidmatan" value="6%" />
                    <Row label="Jumlah Cukai SST Dikutip" value={rm(sst.totalTax)} highlight />
                    <hr className="border-white/8" />
                    <Row label="Jualan Bersih (selepas SST)" value={rm(sst.netSales)} />
                    <Row label="Bilangan Transaksi" value={String(sst.orderCount)} />
                  </div>
                ) : (
                  <p className="text-xs text-slate-600">Tiada data untuk tempoh ini.</p>
                )}
              </div>
              <div className="border border-white/8 rounded-xl p-4 text-xs text-slate-500 space-y-1">
                <p className="font-semibold text-slate-400"><i className="fas fa-info-circle mr-1.5 text-blue-400"></i>Panduan Pematuhan LHDN</p>
                <p>• Muat turun Excel LHDN di atas untuk rekod lengkap.</p>
                <p>• Isikan data SST di atas ke dalam Borang SST-02 di <span className="text-blue-400">mysst.customs.gov.my</span></p>
                <p>• Sertakan No. TIN dan No. Pendaftaran SST anda dalam tetapan akaun.</p>
                <p>• Rekod mesti disimpan sekurang-kurangnya 7 tahun (Akta Cukai Jualan 2018).</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function Row({ label, value, note, highlight }: { label: string; value: string; note?: string; highlight?: boolean }) {
  return (
    <div className={`flex items-center justify-between rounded-lg px-2 py-1 ${highlight ? 'bg-amber-500/10' : ''}`}>
      <div>
        <p className={`text-xs ${highlight ? 'font-bold text-amber-300' : 'text-slate-400'}`}>{label}</p>
        {note && <p className="text-[10px] text-slate-600">{note}</p>}
      </div>
      <p className={`text-xs font-bold ${highlight ? 'text-amber-400' : 'text-slate-300'}`}>{value}</p>
    </div>
  )
}
