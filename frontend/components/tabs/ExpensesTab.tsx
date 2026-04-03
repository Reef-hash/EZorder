'use client'

import { useEffect, useState } from 'react'
import { expensesAPI } from '@/lib/api'
import type { Expense } from '@/lib/store'
import toast from 'react-hot-toast'

const CATEGORIES = ['Utilities', 'Salary', 'Supplies', 'Maintenance', 'Rent', 'Others'] as const
type Category = typeof CATEGORIES[number]

const CATEGORY_ICONS: Record<Category, string> = {
  Utilities: 'fa-bolt',
  Salary: 'fa-users',
  Supplies: 'fa-box',
  Maintenance: 'fa-wrench',
  Rent: 'fa-building',
  Others: 'fa-tags',
}

const CATEGORY_COLORS: Record<Category, string> = {
  Utilities: 'text-yellow-400',
  Salary: 'text-blue-400',
  Supplies: 'text-purple-400',
  Maintenance: 'text-orange-400',
  Rent: 'text-pink-400',
  Others: 'text-slate-400',
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

export default function ExpensesTab() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [filterDate, setFilterDate] = useState(today())

  const [form, setForm] = useState({
    date: today(),
    category: 'Others' as Category,
    description: '',
    amount: '',
    paymentMethod: 'cash' as 'cash' | 'bank_transfer',
  })

  const fetchExpenses = async (dateFilter?: string) => {
    try {
      const d = dateFilter ?? filterDate
      const res = await expensesAPI.getAll(d ? { from: d, to: d } : {})
      setExpenses(res.data)
    } catch {
      toast.error('Gagal muatkan perbelanjaan')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchExpenses() }, [filterDate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.description.trim() || !form.amount) return
    const amt = parseFloat(form.amount)
    if (isNaN(amt) || amt < 0) {
      toast.error('Jumlah tidak sah')
      return
    }
    setSubmitting(true)
    try {
      await expensesAPI.create({
        date: form.date,
        category: form.category,
        description: form.description.trim(),
        amount: amt,
        paymentMethod: form.paymentMethod,
      })
      toast.success('Perbelanjaan ditambah')
      setForm({ date: today(), category: 'Others', description: '', amount: '', paymentMethod: 'cash' })
      setShowForm(false)
      fetchExpenses()
    } catch {
      toast.error('Gagal tambah perbelanjaan')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Padam perbelanjaan ini?')) return
    try {
      await expensesAPI.delete(id)
      setExpenses(prev => prev.filter(e => e.id !== id))
      toast.success('Dipadam')
    } catch {
      toast.error('Gagal padam')
    }
  }

  const totalToday = expenses.reduce((s, e) => s + e.amount, 0)

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <i className="fas fa-wallet text-orange-400 text-base"></i>
            Perbelanjaan
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">OPEX — kos operasi harian</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-orange-500/10 border border-orange-500/25 text-xs font-semibold text-orange-400 hover:bg-orange-500/20 transition"
        >
          <i className={`fas ${showForm ? 'fa-times' : 'fa-plus'}`}></i>
          {showForm ? 'Tutup' : 'Tambah'}
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white/3 border border-white/8 rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-slate-400">Rekod Perbelanjaan Baru</p>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-slate-500 uppercase tracking-wide block mb-1">Tarikh</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500/50"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 uppercase tracking-wide block mb-1">Kategori</label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value as Category }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500/50"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-500 uppercase tracking-wide block mb-1">Penerangan</label>
            <input
              type="text"
              placeholder="cth: Bayar bil elektrik Februari"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              maxLength={200}
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-orange-500/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-slate-500 uppercase tracking-wide block mb-1">Jumlah (RM)</label>
              <input
                type="number"
                placeholder="0.00"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                required
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-orange-500/50"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 uppercase tracking-wide block mb-1">Kaedah Bayaran</label>
              <select
                value={form.paymentMethod}
                onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value as 'cash' | 'bank_transfer' }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500/50"
              >
                <option value="cash">Tunai</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-lg bg-orange-500/20 border border-orange-500/30 text-orange-400 font-semibold text-sm hover:bg-orange-500/30 transition disabled:opacity-50"
          >
            {submitting ? <><i className="fas fa-spinner fa-spin mr-2"></i>Menyimpan...</> : 'Simpan Perbelanjaan'}
          </button>
        </form>
      )}

      {/* Date filter + total */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <label className="text-[10px] text-slate-500 uppercase tracking-wide block mb-1">Tapis Tarikh</label>
          <input
            type="date"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500/50"
          />
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-500 uppercase tracking-wide">Jumlah</p>
          <p className="text-lg font-bold text-orange-400">RM{totalToday.toFixed(2)}</p>
          <p className="text-[10px] text-slate-600">{expenses.length} rekod</p>
        </div>
      </div>

      {/* Category breakdown */}
      {expenses.length > 0 && (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {CATEGORIES.map(cat => {
            const total = expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0)
            if (total === 0) return null
            return (
              <div key={cat} className="bg-white/3 border border-white/8 rounded-xl p-2.5 text-center">
                <i className={`fas ${CATEGORY_ICONS[cat]} ${CATEGORY_COLORS[cat]} text-sm mb-1 block`}></i>
                <p className="text-[9px] text-slate-500">{cat}</p>
                <p className={`text-xs font-bold ${CATEGORY_COLORS[cat]}`}>RM{total.toFixed(2)}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* Expense list */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-slate-600">
          <i className="fas fa-spinner fa-spin mr-2"></i> Memuatkan...
        </div>
      ) : expenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-600">
          <i className="fas fa-wallet text-4xl mb-3 opacity-20"></i>
          <p className="text-sm">Tiada perbelanjaan untuk tarikh ini</p>
          <p className="text-xs mt-1 opacity-60">Tekan "Tambah" untuk rekod perbelanjaan baru</p>
        </div>
      ) : (
        <div className="space-y-2">
          {expenses.map(exp => (
            <div key={exp.id} className="bg-white/5 border border-white/8 rounded-xl p-3.5 flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 flex-shrink-0`}>
                <i className={`fas ${CATEGORY_ICONS[exp.category as Category] ?? 'fa-tags'} ${CATEGORY_COLORS[exp.category as Category] ?? 'text-slate-400'} text-sm`}></i>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{exp.description}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-slate-500">{exp.category}</span>
                  <span className="text-[10px] text-slate-600">·</span>
                  <span className="text-[10px] text-slate-500">
                    {exp.paymentMethod === 'cash' ? 'Tunai' : 'Bank Transfer'}
                  </span>
                  <span className="text-[10px] text-slate-600">·</span>
                  <span className="text-[10px] text-slate-500">
                    {new Date(exp.date).toLocaleDateString('en-MY')}
                  </span>
                </div>
              </div>
              <div className="text-right flex-shrink-0 flex items-center gap-3">
                <p className="text-base font-bold text-orange-400">RM{exp.amount.toFixed(2)}</p>
                <button
                  onClick={() => handleDelete(exp.id)}
                  className="text-slate-600 hover:text-red-400 transition text-xs"
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
