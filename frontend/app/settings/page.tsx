'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { useAppStore } from '@/lib/store'
import Navbar from '@/components/Navbar'
import TaxRulesSettings from '@/components/TaxRulesSettings'
import PrinterSettings from '@/components/PrinterSettings'
import { staffAPI } from '@/lib/api'
import api from '@/lib/api'
import toast from 'react-hot-toast'

type SettingsTab = 'account' | 'staff' | 'tax' | 'printer'

interface StaffMember {
  _id: string
  name: string
  qrToken: string
  active: boolean
  createdAt: string
}

export default function SettingsPage() {
  const router = useRouter()
  const { user, initAuth } = useAuth()
  const { setUser } = useAppStore()
  const [tab, setTab] = useState<SettingsTab>('account')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    businessName: '',
    phone: '',
    address: '',
    receiptFooter: '',
    businessType: 'restaurant' as 'restaurant' | 'retail' | 'both',
    tinNumber: '',
    sstRegNo: '',
    sstEnabled: false,
  })

  // Staff state
  const [staffList, setStaffList] = useState<StaffMember[]>([])
  const [staffLoading, setStaffLoading] = useState(false)
  const [newStaffName, setNewStaffName] = useState('')
  const [creatingStaff, setCreatingStaff] = useState(false)

  useEffect(() => { initAuth() }, []) // eslint-disable-line

  useEffect(() => {
    if (!user) return
    setForm({
      businessName: user.businessName || '',
      phone: user.phone || '',
      address: user.address || '',
      receiptFooter: user.receiptFooter || '',
      businessType: user.businessType || 'restaurant',
      tinNumber: user.tinNumber || '',
      sstRegNo: user.sstRegNo || '',
      sstEnabled: user.sstEnabled || false,
    })
  }, [user?._id]) // eslint-disable-line

  useEffect(() => { if (user === null) router.push('/') }, [user]) // eslint-disable-line

  useEffect(() => { if (tab === 'staff') loadStaff() }, [tab]) // eslint-disable-line

  const loadStaff = async () => {
    setStaffLoading(true)
    try {
      const { data } = await staffAPI.getAll()
      setStaffList(data)
    } catch {
      toast.error('Gagal muat staff')
    } finally {
      setStaffLoading(false)
    }
  }

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStaffName.trim()) return
    setCreatingStaff(true)
    try {
      const { data } = await staffAPI.create({ name: newStaffName.trim() })
      setStaffList(prev => [data, ...prev])
      setNewStaffName('')
      toast.success(`Staff "${data.name}" dicipta!`)
    } catch {
      toast.error('Gagal cipta staff')
    } finally {
      setCreatingStaff(false)
    }
  }

  const handleDeleteStaff = async (id: string, name: string) => {
    if (!confirm(`Padam staff "${name}"?`)) return
    try {
      await staffAPI.delete(id)
      setStaffList(prev => prev.filter(s => s._id !== id))
      toast.success('Staff dipadamkan')
    } catch {
      toast.error('Gagal padamkan staff')
    }
  }

  const handleToggleStaff = async (id: string) => {
    try {
      const { data } = await staffAPI.toggle(id)
      setStaffList(prev => prev.map(s => s._id === id ? data : s))
    } catch {
      toast.error('Gagal kemaskini staff')
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { data } = await api.patch('/api/auth/profile', form)
      setUser(data)
      toast.success('Tetapan disimpan!')
    } catch {
      toast.error('Gagal simpan tetapan')
    } finally {
      setSaving(false)
    }
  }

  if (!user) return null

  const daysLeft = (() => {
    const expiry = user.plan === 'trial' ? user.trialExpiry : user.subscriptionExpiry
    if (!expiry) return null
    return Math.max(0, Math.ceil((new Date(expiry).getTime() - Date.now()) / 86400000))
  })()

  const frontendUrl = typeof window !== 'undefined' ? window.location.origin : ''

  const TABS = [
    { id: 'account', icon: 'fa-user', label: 'Akaun' },
    { id: 'staff',   icon: 'fa-users', label: 'Staff' },
    { id: 'tax',     icon: 'fa-landmark', label: 'Cukai SST' },
    { id: 'printer', icon: 'fa-print', label: 'Pencetak' },
  ] as const

  return (
    <div className="min-h-screen bg-[#F4F5F7]">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-6 pb-16 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition">
            <i className="fas fa-arrow-left text-sm"></i>
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Tetapan</h1>
            <p className="text-xs text-gray-400">Urus akaun &amp; konfigurasi sistem</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl p-1 border border-gray-100 shadow-sm">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                tab === t.id ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <i className={`fas ${t.icon}`}></i>
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* ── Account Tab ── */}
        {tab === 'account' && (
          <div className="space-y-4">
            {/* Plan banner */}
            <div className={`rounded-xl p-4 flex items-center justify-between ${
              user.plan === 'active' ? 'bg-green-50 border border-green-100'
              : daysLeft !== null && daysLeft <= 3 ? 'bg-red-50 border border-red-100'
              : 'bg-orange-50 border border-orange-100'
            }`}>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Plan Semasa</p>
                <p className={`font-bold text-base ${user.plan === 'active' ? 'text-green-700' : 'text-orange-600'}`}>
                  {user.plan === 'active' ? '✦ PRO' : 'Trial'}
                </p>
                {daysLeft !== null && (
                  <p className={`text-xs mt-0.5 ${daysLeft <= 3 ? 'text-red-500' : 'text-gray-500'}`}>
                    {daysLeft === 0 ? 'Tamat hari ini' : `Tamat dalam ${daysLeft} hari`}
                  </p>
                )}
              </div>
              {user.plan !== 'active' && (
                <button onClick={() => router.push('/subscribe')}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2 rounded-xl text-sm transition shadow-sm">
                  Langgan →
                </button>
              )}
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Business info */}
              <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4 shadow-sm">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <i className="fas fa-store text-orange-400"></i>Maklumat Bisnes
                </h2>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Nama Bisnes</label>
                  <input type="text" value={form.businessName} onChange={e => setForm(f => ({ ...f, businessName: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-orange-400" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">No. Telefon</label>
                  <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-orange-400" maxLength={20} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Alamat</label>
                  <textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-orange-400 resize-none" rows={3} maxLength={200} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Footer Resit</label>
                  <input type="text" value={form.receiptFooter} onChange={e => setForm(f => ({ ...f, receiptFooter: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-orange-400" maxLength={200} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Jenis Bisnes</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['restaurant', 'retail', 'both'] as const).map(t => (
                      <button key={t} type="button" onClick={() => setForm(f => ({ ...f, businessType: t }))}
                        className={`py-2 rounded-lg text-xs font-semibold border transition-all ${
                          form.businessType === t ? 'bg-orange-500 border-orange-500 text-white' : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-orange-300'
                        }`}>
                        {t === 'restaurant' ? 'Restoran' : t === 'retail' ? 'Runcit' : 'Kedua-dua'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* LHDN */}
              <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4 shadow-sm">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <i className="fas fa-landmark text-orange-400"></i>Cukai &amp; LHDN
                </h2>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">No. TIN</label>
                  <input type="text" value={form.tinNumber} onChange={e => setForm(f => ({ ...f, tinNumber: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-orange-400" placeholder="C1234567890" maxLength={20} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">No. Pendaftaran SST</label>
                  <input type="text" value={form.sstRegNo} onChange={e => setForm(f => ({ ...f, sstRegNo: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-orange-400" placeholder="W12-1234-12345678" maxLength={30} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-700">Aktifkan SST (6%)</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Kenakan cukai 6% pada item</p>
                  </div>
                  <button type="button" onClick={() => setForm(f => ({ ...f, sstEnabled: !f.sstEnabled }))}
                    className={`relative w-11 h-6 rounded-full transition-colors ${form.sstEnabled ? 'bg-orange-500' : 'bg-gray-200'}`}>
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.sstEnabled ? 'translate-x-5' : ''}`} />
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Email</span>
                  <span className="text-gray-700 font-medium">{user.email}</span>
                </div>
              </div>

              <button type="submit" disabled={saving}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-sm shadow-orange-200">
                <i className="fas fa-save"></i>
                {saving ? 'Menyimpan...' : 'Simpan Tetapan'}
              </button>
            </form>
          </div>
        )}

        {/* ── Staff Tab ── */}
        {tab === 'staff' && (
          <div className="space-y-4">
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 text-sm">
              <p className="font-semibold text-orange-700 mb-1"><i className="fas fa-info-circle mr-2"></i>Cara guna Staff Login</p>
              <p className="text-xs text-orange-600 leading-relaxed">Cipta akaun staff di bawah. Setiap staff mendapat pautan QR unik. Kongsi pautan itu kepada staff — mereka boleh log masuk terus. Staff hanya boleh akses POS dan Queue sahaja.</p>
            </div>

            {/* Add staff form */}
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Tambah Staff Baru</h2>
              <form onSubmit={handleAddStaff} className="flex gap-2">
                <input type="text" value={newStaffName} onChange={e => setNewStaffName(e.target.value)}
                  placeholder="Nama staff (contoh: Ahmad)" maxLength={60}
                  className="flex-1 px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-orange-400" />
                <button type="submit" disabled={creatingStaff || !newStaffName.trim()}
                  className="px-4 py-2.5 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600 disabled:opacity-40 transition">
                  {creatingStaff ? <i className="fas fa-spinner fa-spin"></i> : 'Tambah'}
                </button>
              </form>
            </div>

            {/* Staff list */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Senarai Staff ({staffList.length})</h2>
                <button onClick={loadStaff} className="text-xs text-gray-400 hover:text-orange-500 transition">
                  <i className="fas fa-sync-alt"></i>
                </button>
              </div>
              {staffLoading ? (
                <div className="py-8 text-center text-gray-400 text-sm"><i className="fas fa-spinner fa-spin mr-2"></i>Memuatkan...</div>
              ) : staffList.length === 0 ? (
                <div className="py-10 text-center text-gray-400">
                  <i className="fas fa-users text-3xl mb-3 block opacity-20"></i>
                  <p className="text-sm">Tiada staff lagi</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {staffList.map(staff => {
                    const loginUrl = `${frontendUrl}/staff-login?token=${staff.qrToken}`
                    return (
                      <div key={staff._id} className="p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                              <span className="text-orange-600 font-bold text-sm">{staff.name.charAt(0).toUpperCase()}</span>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800 text-sm">{staff.name}</p>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${staff.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                {staff.active ? 'AKTIF' : 'TIDAK AKTIF'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => handleToggleStaff(staff._id)}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${staff.active ? 'bg-gray-100 text-gray-500 hover:bg-gray-200' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                              {staff.active ? 'Nyahaktif' : 'Aktifkan'}
                            </button>
                            <button onClick={() => handleDeleteStaff(staff._id, staff.name)}
                              className="w-7 h-7 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center text-xs transition">
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </div>
                        <div className="mt-3 bg-gray-50 rounded-lg p-3">
                          <p className="text-[10px] font-semibold text-gray-400 mb-1.5">Pautan Login Staff</p>
                          <div className="flex items-center gap-2">
                            <p className="flex-1 text-xs text-gray-500 font-mono truncate">{loginUrl}</p>
                            <button
                              onClick={() => { navigator.clipboard.writeText(loginUrl); toast.success('Pautan disalin!') }}
                              className="flex-shrink-0 px-2.5 py-1 bg-orange-500 text-white text-xs font-semibold rounded-lg hover:bg-orange-600 transition">
                              <i className="fas fa-copy mr-1"></i>Salin
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Tax Tab ── */}
        {tab === 'tax' && <TaxRulesSettings />}

        {/* ── Printer Tab ── */}
        {tab === 'printer' && <PrinterSettings />}
      </main>
    </div>
  )
}

type SettingsTab = 'account' | 'tax'

export default function SettingsPage() {
  const router = useRouter()
  const { user, initAuth } = useAuth()
  const { setUser } = useAppStore()
  const [tab, setTab] = useState<SettingsTab>('account')

  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    businessName: '',
    phone: '',
    address: '',
    receiptFooter: '',
    businessType: 'restaurant' as 'restaurant' | 'retail' | 'both',
    tinNumber: '',
    sstRegNo: '',
    sstEnabled: false,
  })

  useEffect(() => {
    initAuth()
  }, [])

  useEffect(() => {
    if (!user) return
    setForm({
      businessName: user.businessName || '',
      phone: user.phone || '',
      address: user.address || '',
      receiptFooter: user.receiptFooter || '',
      businessType: user.businessType || 'restaurant',
      tinNumber: user.tinNumber || '',
      sstRegNo: user.sstRegNo || '',
      sstEnabled: user.sstEnabled || false,
    })
  }, [user?._id])

  useEffect(() => {
    if (user === null) router.push('/')
  }, [user])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { data } = await api.patch('/api/auth/profile', form)
      setUser(data)
      toast.success('Tetapan disimpan!')
    } catch {
      toast.error('Gagal simpan tetapan')
    } finally {
      setSaving(false)
    }
  }

  if (!user) return null

  const daysLeft = (() => {
    const expiry = user.plan === 'trial' ? user.trialExpiry : user.subscriptionExpiry
    if (!expiry) return null
    const diff = new Date(expiry).getTime() - Date.now()
    return Math.max(0, Math.ceil(diff / 86400000))
  })()

  return (
    <div className="min-h-screen bg-[#0a0c14]">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="text-slate-400 hover:text-white transition">
              <i className="fas fa-arrow-left"></i>
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Tetapan</h1>
              <p className="text-xs text-slate-500">Urus akaun, cukai & profil</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-white/8">
          <button
            onClick={() => setTab('account')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
              tab === 'account'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-400'
            }`}
          >
            <i className="fas fa-user mr-1.5"></i>Akaun
          </button>
          <button
            onClick={() => setTab('tax')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
              tab === 'tax'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-400'
            }`}
          >
            <i className="fas fa-landmark mr-1.5"></i>Cukai SST
          </button>
        </div>

        {/* Account Tab */}
        {tab === 'account' && (
          <div className="space-y-6">
            {/* Subscription status */}
            <div className={`rounded-xl border p-4 ${
              user.plan === 'active'
                ? 'bg-amber-500/10 border-amber-500/30'
                : 'bg-white/5 border-white/10'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">Plan</p>
                  <p className={`text-lg font-bold ${user.plan === 'active' ? 'text-amber-400' : 'text-slate-300'}`}>
                    {user.plan === 'active' ? '✦ PRO' : 'Trial'}
                  </p>
                  {daysLeft !== null && (
                    <p className={`text-xs mt-0.5 ${daysLeft <= 3 ? 'text-red-400' : 'text-slate-500'}`}>
                      {daysLeft === 0 ? 'Tamat hari ini' : `Tamat dalam ${daysLeft} hari`}
                    </p>
                  )}
                </div>
                {user.plan !== 'active' && (
                  <button
                    onClick={() => router.push('/subscribe')}
                    className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-4 py-2 rounded-lg text-sm transition"
                  >
                    Langgan →
                  </button>
                )}
              </div>
            </div>

            {/* Profile form */}
            <form onSubmit={handleSave} className="space-y-4">
              <div className="bg-white/4 border border-white/8 rounded-xl p-5 space-y-4">
                <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wide">
                  <i className="fas fa-store mr-2 text-amber-400"></i>Maklumat Bisnes
                </h2>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Nama Bisnes</label>
                  <input
                    type="text"
                value={form.businessName}
                onChange={e => setForm(f => ({ ...f, businessName: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50"
                placeholder="Nama kedai anda"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">No. Telefon</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50"
                placeholder="0123456789"
                maxLength={20}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Alamat</label>
              <textarea
                value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 resize-none"
                placeholder="No 1, Jalan Contoh, 50000 Kuala Lumpur"
                rows={3}
                maxLength={200}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Footer Resit
                <span className="text-slate-600 font-normal ml-1">(teks di bawah resit)</span>
              </label>
              <input
                type="text"
                value={form.receiptFooter}
                onChange={e => setForm(f => ({ ...f, receiptFooter: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50"
                placeholder="Terima kasih atas pembelian anda!"
                maxLength={200}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Jenis Bisnes</label>
              <div className="flex gap-2">
                {(['restaurant', 'retail', 'both'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, businessType: t }))}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${
                      form.businessType === t
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:border-amber-500/25'
                    }`}
                  >
                    {t === 'restaurant' ? 'Restoran' : t === 'retail' ? 'Kedai Runcit' : 'Kedua-dua'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* LHDN / Tax section */}
          <div className="bg-white/4 border border-amber-500/15 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wide">
              <i className="fas fa-landmark mr-2 text-amber-400"></i>Cukai &amp; LHDN
            </h2>
            <p className="text-[11px] text-slate-600">Maklumat ini digunakan dalam laporan Excel LHDN yang boleh dimuat turun dari tab Jualan.</p>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                No. TIN (Tax Identification Number)
              </label>
              <input
                type="text"
                value={form.tinNumber}
                onChange={e => setForm(f => ({ ...f, tinNumber: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50"
                placeholder="Contoh: C1234567890"
                maxLength={20}
              />
              <p className="text-[10px] text-slate-600 mt-1">Semak TIN anda di <span className="text-blue-400">mytax.hasil.gov.my</span></p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                No. Pendaftaran SST
              </label>
              <input
                type="text"
                value={form.sstRegNo}
                onChange={e => setForm(f => ({ ...f, sstRegNo: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50"
                placeholder="Contoh: W12-1234-12345678"
                maxLength={30}
              />
              <p className="text-[10px] text-slate-600 mt-1">Hanya diisi jika perniagaan anda berdaftar SST</p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400">Aktifkan SST (6% Cukai Perkhidmatan)</p>
                <p className="text-[10px] text-slate-600 mt-0.5">Item akan dikenakan cukai 6% apabila dijual</p>
              </div>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, sstEnabled: !f.sstEnabled }))}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  form.sstEnabled ? 'bg-amber-500' : 'bg-white/10'
                }`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  form.sstEnabled ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </div>

          {/* Account info (read-only) */}
          <div className="bg-white/4 border border-white/8 rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wide">
              <i className="fas fa-user mr-2 text-amber-400"></i>Akaun
            </h2>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Email</span>
              <span className="text-slate-300">{user.email}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">ID Akaun</span>
              <span className="text-slate-600 font-mono text-xs">{user._id}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
          >
            <i className="fas fa-save"></i>
            {saving ? 'Menyimpan...' : 'Simpan Tetapan'}
          </button>
            </form>
          </div>
        )}

        {/* Tax Tab */}
        {tab === 'tax' && (
          <TaxRulesSettings />
        )}
      </main>
    </div>
  )
}
