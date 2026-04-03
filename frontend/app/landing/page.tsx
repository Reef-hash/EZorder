import Link from 'next/link'

export const metadata = {
  title: 'EZOrder — Sistem Pengurusan Order Bisnes Anda',
  description: 'Urus order, stok, dan laporan jualan bisnes anda dengan mudah. Cuba percuma 14 hari.',
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0c14] text-white">
      {/* Nav */}
      <nav className="border-b border-white/5 sticky top-0 z-50 bg-[#0a0c14]/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <span className="text-amber-400 font-bold text-xl tracking-tight">EZOrder</span>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-slate-400 hover:text-white text-sm font-medium transition px-3 py-1.5">
              Log Masuk
            </Link>
            <Link href="/register" className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm px-4 py-2 rounded-lg transition">
              Cuba Percuma
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center">
        <span className="inline-block bg-amber-500/15 text-amber-400 border border-amber-500/30 text-xs font-bold px-3 py-1 rounded-full mb-6 uppercase tracking-wider">
          Trial 14 Hari Percuma
        </span>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black leading-tight mb-6">
          Urus Order Bisnes Anda<br />
          <span className="text-amber-400">Lebih Mudah &amp; Pantas</span>
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10">
          EZOrder — sistem POS digital untuk restoran &amp; kedai runcit. Terima order, jejak stok,
          print resit &amp; tengok laporan jualan — semuanya dalam satu tempat.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/register" className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-8 py-3.5 rounded-xl text-base transition shadow-lg shadow-amber-500/20">
            Cuba Percuma 14 Hari →
          </Link>
          <Link href="/" className="bg-white/8 hover:bg-white/12 border border-white/10 text-slate-300 font-semibold px-8 py-3.5 rounded-xl text-base transition">
            Log Masuk
          </Link>
        </div>
        <p className="text-xs text-slate-600 mt-4">Tiada kad kredit diperlukan. Mula terus dalam 30 saat.</p>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-2xl font-bold text-center mb-12 text-white">
          Semua yang anda perlukan, dalam satu app
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { icon: 'fa-cash-register', title: 'POS Digital', desc: 'Tambah item, pilih meja, beri diskaun — proses order dalam masa 10 saat.', color: 'text-amber-400' },
            { icon: 'fa-bell', title: 'Queue Pesanan', desc: 'Pantau order pending secara real-time. Notis merah bila order tunggu lebih 5 minit.', color: 'text-blue-400' },
            { icon: 'fa-print', title: 'Print Resit', desc: 'Sambung terus ke printer thermal melalui Bluetooth atau WiFi. Print dalam 2 saat.', color: 'text-emerald-400' },
            { icon: 'fa-chart-bar', title: 'Laporan Jualan', desc: 'Lihat hasil jualan hari ini, minggu ini dan bulan ini. Export ke CSV untuk perakaunan.', color: 'text-purple-400' },
            { icon: 'fa-boxes', title: 'Jejak Stok', desc: 'Stok dikurang automatik bila order selesai. Amaran bila stok hampir habis.', color: 'text-red-400' },
            { icon: 'fa-mobile-alt', title: 'Mobile-First', desc: 'Guna dari telefon, tablet atau laptop. Boleh install sebagai app (PWA) terus ke home screen.', color: 'text-cyan-400' },
          ].map(f => (
            <div key={f.title} className="bg-white/4 border border-white/8 rounded-2xl p-6 hover:border-amber-500/25 transition">
              <div className={`text-2xl mb-4 ${f.color}`}>
                <i className={`fas ${f.icon}`}></i>
              </div>
              <h3 className="font-bold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Suitable for */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-amber-500/8 border border-amber-500/20 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold mb-6">Sesuai untuk</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {['Restoran', 'Gerai Makan', 'Kafe', 'Kedai Runcit', 'Bakeri', 'Kedai Minuman', 'Food Truck', 'Kantin'].map(b => (
              <span key={b} className="bg-white/5 border border-white/10 text-slate-300 text-sm font-medium px-4 py-2 rounded-full">
                {b}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16" id="pricing">
        <h2 className="text-2xl font-bold text-center mb-12">Harga yang berpatutan</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Trial */}
          <div className="bg-white/4 border border-white/10 rounded-2xl p-8">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Trial</p>
            <p className="text-4xl font-black text-white mb-1">Percuma</p>
            <p className="text-sm text-slate-400 mb-6">14 hari akses penuh</p>
            <ul className="space-y-2 text-sm text-slate-300 mb-8">
              {['Semua ciri tanpa had', 'Tanpa kad kredit', 'Sokongan teknikal', 'Data selamat di cloud'].map(i => (
                <li key={i}><i className="fas fa-check text-emerald-400 mr-2"></i>{i}</li>
              ))}
            </ul>
            <Link href="/register" className="block text-center bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold py-3 rounded-xl transition">
              Mula Percuma →
            </Link>
          </div>
          {/* Pro */}
          <div className="bg-amber-500/12 border-2 border-amber-500/40 rounded-2xl p-8 relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-black text-xs font-bold px-3 py-1 rounded-full">POPULAR</span>
            <p className="text-xs font-bold text-amber-400 uppercase tracking-wide mb-3">Pro</p>
            <p className="text-4xl font-black text-amber-400 mb-1">RM29</p>
            <p className="text-sm text-slate-400 mb-6">sebulan · tanpa kontrak</p>
            <ul className="space-y-2 text-sm text-slate-300 mb-8">
              {['Semua ciri tanpa had', 'Order & stok tanpa limit', 'Laporan &amp; export CSV', 'Sokongan prioriti', 'Akses seumur hidup selagi langgan'].map(i => (
                <li key={i}><i className="fas fa-check text-amber-400 mr-2"></i><span dangerouslySetInnerHTML={{ __html: i }} /></li>
              ))}
            </ul>
            <Link href="/register" className="block text-center bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 rounded-xl transition">
              Cuba Percuma 14 Hari →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="bg-gradient-to-br from-amber-500/15 to-orange-500/10 border border-amber-500/25 rounded-3xl p-12">
          <h2 className="text-3xl font-black mb-4">Sedia untuk mulakan?</h2>
          <p className="text-slate-400 mb-8">Cuba EZOrder percuma selama 14 hari. Tiada risiko, boleh batal bila-bila masa.</p>
          <Link href="/register" className="inline-block bg-amber-500 hover:bg-amber-400 text-black font-bold px-10 py-4 rounded-xl text-lg transition shadow-xl shadow-amber-500/20">
            Daftar Sekarang — Percuma →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center text-slate-600 text-sm">
        <p>© {new Date().getFullYear()} EZOrder · Sistem Pengurusan Order Digital</p>
      </footer>
    </div>
  )
}
