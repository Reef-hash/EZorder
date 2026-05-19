'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { staffAPI } from '@/lib/api'
import { useAppStore } from '@/lib/store'
import toast from 'react-hot-toast'

function StaffLoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setUser } = useAppStore()
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setStatus('error')
      setErrorMsg('QR code tidak sah. Sila imbas QR code yang betul.')
      return
    }

    staffAPI.login(token)
      .then(({ data }) => {
        const staffUser = {
          _id: String(data.user.id),
          email: '',
          businessName: data.user.businessName,
          plan: data.user.plan,
          role: 'user' as const,
          businessType: data.user.businessType,
          staffId: String(data.user.staffId),
          staffName: data.user.staffName,
          staffRole: 'staff' as const,
        }
        localStorage.setItem('token', data.token)
        localStorage.setItem('ez_staff_user', JSON.stringify(staffUser))
        setUser(staffUser)
        setStatus('success')
        toast.success(`Selamat datang, ${data.user.staffName}!`)
        router.replace('/dashboard')
      })
      .catch((err) => {
        setStatus('error')
        setErrorMsg(err.response?.data?.message || 'Log masuk gagal. Sila cuba lagi.')
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-[#F4F5F7] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-sm text-center">
        {/* Logo */}
        <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <i className="fas fa-utensils text-2xl text-orange-500"></i>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-1">EZOrder</h1>
        <p className="text-sm text-gray-400 mb-6">Staff Login</p>

        {status === 'loading' && (
          <div>
            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm text-gray-500">Mengesahkan QR code...</p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <i className="fas fa-check text-green-500 text-xl"></i>
            </div>
            <p className="text-sm font-semibold text-gray-700">Log masuk berjaya!</p>
            <p className="text-xs text-gray-400 mt-1">Mengalih arah ke dashboard...</p>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <i className="fas fa-times text-red-500 text-xl"></i>
            </div>
            <p className="text-sm font-semibold text-gray-700 mb-1">Log masuk gagal</p>
            <p className="text-xs text-gray-500 mb-4">{errorMsg}</p>
            <a
              href="/"
              className="inline-block px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition"
            >
              Kembali ke Login
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

export default function StaffLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F4F5F7] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <StaffLoginContent />
    </Suspense>
  )
}
