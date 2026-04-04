'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { taxRulesAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import type { TaxRule } from '@/lib/store'

const PRESET_RULES = [
  { name: '6% Service Tax (SST Perkhidmatan)', rate: 6, type: 'service' },
  { name: '10% Sales Tax (SST Jualan)', rate: 10, type: 'sales' },
  { name: 'Tax-Free (0%)', rate: 0, type: 'other' },
]

export default function TaxRulesSettings() {
  const { categories } = useAppStore()
  const [rules, setRules] = useState<TaxRule[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    rate: 6,
    type: 'service' as 'service' | 'sales' | 'other',
    applicableTo: 'all' as 'all' | 'categories' | 'items',
    categories: [] as string[],
    items: [] as string[],
    enabled: true,
  })

  const fetchRules = async () => {
    try {
      const res = await taxRulesAPI.getAll()
      setRules(res.data)
    } catch {
      toast.error('Gagal muatkan peraturan cukai')
    }
  }

  useEffect(() => {
    fetchRules()
  }, [])

  const handleAddPreset = async (preset: typeof PRESET_RULES[0]) => {
    setLoading(true)
    try {
      await taxRulesAPI.create({
        name: preset.name,
        rate: preset.rate,
        type: preset.type,
        applicableTo: 'all',
        categories: [],
        items: [],
        enabled: true,
      })
      toast.success('Peraturan ditambah!')
      await fetchRules()
    } catch {
      toast.error('Gagal tambah peraturan')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || formData.rate === undefined) {
      toast.error('Nama dan kadar diperlukan')
      return
    }

    if (formData.applicableTo === 'categories' && formData.categories.length === 0) {
      toast.error('Pilih sekurang-kurangnya satu kategori')
      return
    }

    if (formData.applicableTo === 'items' && formData.items.length === 0) {
      toast.error('Pilih sekurang-kurangnya satu item')
      return
    }

    setLoading(true)
    try {
      if (editingId) {
        await taxRulesAPI.update(editingId, formData)
        toast.success('Peraturan dikemaskini!')
      } else {
        await taxRulesAPI.create(formData)
        toast.success('Peraturan ditambah!')
      }
      setFormData({
        name: '',
        rate: 6,
        type: 'service',
        applicableTo: 'all',
        categories: [],
        items: [],
        enabled: true,
      })
      setShowForm(false)
      setEditingId(null)
      await fetchRules()
    } catch {
      toast.error('Gagal simpan peraturan')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (rule: TaxRule) => {
    setFormData({
      name: rule.name,
      rate: rule.rate,
      type: rule.type,
      applicableTo: rule.applicableTo,
      categories: rule.categories,
      items: rule.items,
      enabled: rule.enabled,
    })
    setEditingId(rule._id || null)
    setShowForm(true)
  }

  const handleToggle = async (ruleId: string, currentEnabled: boolean) => {
    try {
      await taxRulesAPI.update(ruleId, { enabled: !currentEnabled })
      await fetchRules()
      toast.success(currentEnabled ? 'Peraturan dilumpuhkan' : 'Peraturan diaktifkan')
    } catch {
      toast.error('Gagal kemaskini')
    }
  }

  const handleDelete = async (ruleId: string) => {
    if (!confirm('Adakah anda pasti mahu padam peraturan ini?')) return
    try {
      await taxRulesAPI.delete(ruleId)
      await fetchRules()
      toast.success('Peraturan dipadam')
    } catch {
      toast.error('Gagal padam peraturan')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <i className="fas fa-landmark text-amber-400"></i>
          Peraturan Cukai SST
        </h2>
        <p className="text-xs text-slate-500 mt-1">Urus peraturan cukai untuk butiran dan laporan LHDN</p>
      </div>

      {/* Presets */}
      <div className="border border-white/8 rounded-xl p-4 space-y-3">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
          <i className="fas fa-star mr-1.5 text-amber-400"></i>Peraturan Pra-tetapan
        </p>
        <div className="space-y-2">
          {PRESET_RULES.map(preset => (
            <div key={preset.name} className="flex items-center justify-between p-3 bg-white/3 rounded-lg border border-white/8">
              <div>
                <p className="text-sm font-medium text-slate-300">{preset.name}</p>
                <p className="text-xs text-slate-600">{preset.rate}% {preset.type}</p>
              </div>
              <button
                onClick={() => handleAddPreset(preset)}
                disabled={rules.some(r => r.rate === preset.rate && r.name === preset.name)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                {rules.some(r => r.rate === preset.rate && r.name === preset.name) ? 'Sudah Ada' : 'Tambah'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Rules List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            <i className="fas fa-list mr-1.5 text-slate-500"></i>Peraturan Aktif ({rules.filter(r => r.enabled).length})
          </p>
          <button
            onClick={() => {
              setFormData({
                name: '',
                rate: 6,
                type: 'service',
                applicableTo: 'all',
                categories: [],
                items: [],
                enabled: true,
              })
              setEditingId(null)
              setShowForm(!showForm)
            }}
            className="px-3 py-1 rounded-lg text-xs font-semibold bg-amber-500/10 border border-amber-500/25 text-amber-400 hover:bg-amber-500/20 transition"
          >
            <i className="fas fa-plus mr-1"></i>Baru
          </button>
        </div>

        {rules.length === 0 ? (
          <p className="text-xs text-slate-600 py-6 text-center">Tiada peraturan cukai. Mulai dengan pra-tetapan di atas.</p>
        ) : (
          rules.map(rule => (
            <div key={rule._id} className={`border rounded-xl p-4 transition-all ${rule.enabled ? 'border-white/8 bg-white/3' : 'border-white/5 bg-white/2 opacity-60'}`}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1">
                  <p className={`font-semibold text-sm ${rule.enabled ? 'text-slate-200' : 'text-slate-500'}`}>
                    {rule.name}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {rule.rate}% · Gunakan untuk: {rule.applicableTo === 'all' ? 'Semua Item' : rule.applicableTo === 'categories' ? rule.categories.join(', ') : rule.items.join(', ')}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleToggle(rule._id || '', rule.enabled)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      rule.enabled
                        ? 'bg-green-500/10 border-green-500/25 text-green-400 hover:bg-green-500/20'
                        : 'bg-gray-500/10 border-gray-500/25 text-gray-400 hover:bg-gray-500/20'
                    }`}
                  >
                    <i className={`fas ${rule.enabled ? 'fa-check' : 'fa-ban'} mr-1`}></i>
                    {rule.enabled ? 'Aktif' : 'Berhenti'}
                  </button>
                  <button
                    onClick={() => handleEdit(rule)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-500/10 border border-blue-500/25 text-blue-400 hover:bg-blue-500/20 transition"
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                  <button
                    onClick={() => handleDelete(rule._id || '')}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 border border-red-500/25 text-red-400 hover:bg-red-500/20 transition"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSaveRule} className="border border-amber-500/20 bg-amber-500/5 rounded-xl p-4 space-y-4">
          <h3 className="font-semibold text-slate-300 text-sm">
            {editingId ? 'Kemaskini Peraturan' : 'Buat Peraturan Baru'}
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Nama Peraturan</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Makanan Bercukai"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Kadar Cukai (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={formData.rate}
              onChange={e => setFormData({ ...formData, rate: parseFloat(e.target.value) })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Jenis Cukai</label>
            <select
              value={formData.type}
              onChange={e => setFormData({ ...formData, type: e.target.value as any })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white"
            >
              <option value="service">Cukai Perkhidmatan</option>
              <option value="sales">Cukai Jualan</option>
              <option value="other">Lain-lain</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Gunakan Untuk</label>
            <div className="flex gap-2">
              {['all', 'categories', 'items'].map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setFormData({ ...formData, applicableTo: opt as any })}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${
                    formData.applicableTo === opt
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                      : 'bg-white/5 border-white/10 text-slate-400'
                  }`}
                >
                  {opt === 'all' ? 'Semua' : opt === 'categories' ? 'Kategori' : 'Item'}
                </button>
              ))}
            </div>
          </div>

          {formData.applicableTo === 'categories' && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Pilih Kategori</label>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {categories.map(cat => (
                  <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.categories.includes(cat.name)}
                      onChange={e => {
                        if (e.target.checked) {
                          setFormData({ ...formData, categories: [...formData.categories, cat.name] })
                        } else {
                          setFormData({ ...formData, categories: formData.categories.filter(c => c !== cat.name) })
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-xs text-slate-300">{cat.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-3 py-2 rounded-lg bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Simpan Peraturan'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                setEditingId(null)
              }}
              className="flex-1 px-3 py-2 rounded-lg bg-white/10 text-slate-400 text-xs font-semibold hover:bg-white/15"
            >
              Batal
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
