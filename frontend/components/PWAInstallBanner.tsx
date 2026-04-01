'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

export default function PWAInstallBanner() {
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [iosShared, setIosShared] = useState(false)

  useEffect(() => {
    // Already installed as PWA — hide
    if (window.matchMedia('(display-mode: standalone)').matches) return
    // Already dismissed before
    if (localStorage.getItem('pwa-dismissed')) return

    const ua = navigator.userAgent.toLowerCase()
    const ios = /iphone|ipad|ipod/.test(ua)
    const isSafari = /safari/.test(ua) && !/crios|fxios|opios|chrome/.test(ua)

    if (ios && isSafari) {
      setIsIOS(true)
      setTimeout(() => setShowBanner(true), 2500)
      return
    }

    // Android/Chrome: wait for beforeinstallprompt OR show fallback after 5s
    let promptFired = false

    const handler = (e: Event) => {
      e.preventDefault()
      promptFired = true
      setInstallPrompt(e)
      setTimeout(() => setShowBanner(true), 2500)
    }
    window.addEventListener('beforeinstallprompt', handler)

    // Fallback: if prompt never fires in 5s, show manual guide
    const fallback = setTimeout(() => {
      if (!promptFired) {
        setShowBanner(true)
      }
    }, 5000)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      clearTimeout(fallback)
    }
  }, [])

  const handleAndroidInstall = async () => {
    if (installPrompt) {
      // Native prompt available
      installPrompt.prompt()
      const { outcome } = await installPrompt.userChoice
      if (outcome === 'accepted') setShowBanner(false)
      setInstallPrompt(null)
    } else {
      // Fallback: open browser menu guide
      toast('Tekan menu ⋮ → "Add to Home screen"', { icon: '📲' })
    }
  }

  const handleIOSInstall = async () => {
    // Trigger native share sheet — "Add to Home Screen" ada dalam sini
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'EZOrder',
          url: window.location.href,
        })
      } catch (_) {}
    }
    setIosShared(true)
  }

  const handleDismiss = () => {
    setShowBanner(false)
    localStorage.setItem('pwa-dismissed', '1')
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up px-3 pb-4">
      <div className="rounded-2xl bg-slate-800 border border-emerald-500/40 shadow-2xl shadow-emerald-900/40 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <i className="fas fa-shopping-bag text-white text-lg"></i>
          </div>
          <div className="flex-1">
            <p className="font-bold text-white text-sm">Install EZOrder</p>
            <p className="text-slate-400 text-xs">Guna macam app — pantas & offline</p>
          </div>
          <button onClick={handleDismiss} className="text-slate-500 hover:text-slate-300 p-1">
            <i className="fas fa-times"></i>
          </button>
        </div>

        {isIOS ? (
          <button
            onClick={handleIOSInstall}
            className="w-full bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-white font-semibold py-3 rounded-xl text-sm transition flex items-center justify-center gap-2"
          >
            {iosShared ? (
              <>
                <i className="fas fa-check"></i>
                Pilih "Add to Home Screen" tadi
              </>
            ) : (
              <>
                <i className="fas fa-share-square"></i>
                Tekan untuk Install
              </>
            )}
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleAndroidInstall}
              className="flex-1 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-white font-semibold py-3 rounded-xl text-sm transition flex items-center justify-center gap-2"
            >
              <i className="fas fa-download"></i>
              Install Sekarang
            </button>
            <button
              onClick={handleDismiss}
              className="px-5 bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-3 rounded-xl text-sm transition"
            >
              Nanti
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
