'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { useAppStore } from '@/lib/store'
import Navbar from '@/components/Navbar'
import api from '@/lib/api'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const router = useRouter()
  const { user, initAuth } = useAuth()
  const { setUser } = useAppStore()

  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    businessName: '',
    phone: '',
    address: '',
    receiptFooter: '',
    businessType: 'restaurant' as 'restaurant' | 'retail' | 'both',
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
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-slate-400 hover:text-white transition">
            <i className="fas fa-arrow-left"></i>
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Tetapan Akaun</h1>
            <p className="text-xs text-slate-500">Maklumat bisnes &amp; profil</p>
          </div>
        </div>

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
      </main>
    </div>
  )
}
