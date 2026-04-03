'use client'

import Link from 'next/link'

export default function SubscribePage() {
  return (
    <div className="min-h-screen bg-[#0a0c14] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-black text-2xl font-black mx-auto shadow-lg shadow-amber-500/30">
          ✦
        </div>
        <h1 className="text-2xl font-black text-white">Langgan EZOrder PRO</h1>
        <p className="text-slate-400">
          Untuk langgan, sila hubungi kami melalui WhatsApp atau email untuk proses pembayaran.
        </p>
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Plan Pro</span>
            <span className="font-bold text-amber-400">RM29 / bulan</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Akses</span>
            <span className="text-slate-300">Semua ciri tanpa had</span>
          </div>
        </div>
        <a
          href="https://wa.me/?text=Saya%20ingin%20langgan%20EZOrder%20PRO"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl transition"
        >
          <i className="fab fa-whatsapp text-lg"></i>
          Hubungi via WhatsApp
        </a>
        <Link href="/dashboard" className="block text-slate-500 hover:text-slate-300 text-sm transition">
          ← Kembali ke dashboard
        </Link>
      </div>
    </div>
  )
}
