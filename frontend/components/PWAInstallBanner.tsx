'use client'

import { useEffect, useState } from 'react'

export default function PWAInstallBanner() {
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if already installed as PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Check if already dismissed
    if (localStorage.getItem('pwa-banner-dismissed')) return

    // Detect iOS Safari
    const ios = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase())
    const safari = /safari/.test(navigator.userAgent.toLowerCase()) && !/chrome/.test(navigator.userAgent.toLowerCase())
    if (ios && safari) {
      setIsIOS(true)
      setTimeout(() => setShowBanner(true), 3000)
      return
    }

    // Android/Chrome — listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e)
      setTimeout(() => setShowBanner(true), 3000)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (installPrompt) {
      installPrompt.prompt()
      const { outcome } = await installPrompt.userChoice
      if (outcome === 'accepted') {
        setShowBanner(false)
      }
      setInstallPrompt(null)
    }
  }

  const handleDismiss = () => {
    setShowBanner(false)
    localStorage.setItem('pwa-banner-dismissed', '1')
  }

  if (isInstalled || !showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
      <div className="m-3 rounded-2xl bg-slate-800 border border-emerald-500/40 shadow-2xl shadow-emerald-900/30 p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <i className="fas fa-shopping-bag text-white text-xl"></i>
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white text-sm">Install EZOrder App</p>
            {isIOS ? (
              <p className="text-slate-400 text-xs mt-1">
                Tap <i className="fas fa-share-square text-blue-400"></i> then <strong className="text-slate-300">"Add to Home Screen"</strong>
              </p>
            ) : (
              <p className="text-slate-400 text-xs mt-1">
                Install untuk akses pantas & guna offline
              </p>
            )}
          </div>

          {/* Close */}
          <button onClick={handleDismiss} className="text-slate-500 hover:text-slate-300 transition flex-shrink-0 p-1">
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Buttons — only for Android/Chrome */}
        {!isIOS && (
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleInstall}
              className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold py-2 rounded-xl text-sm transition"
            >
              <i className="fas fa-download mr-2"></i>Install Sekarang
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-2 rounded-xl text-sm transition"
            >
              Nanti
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
