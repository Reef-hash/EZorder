'use client'

import { useState } from 'react'
import Link from 'next/link'
import { authAPI } from '@/lib/api'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await authAPI.forgotPassword(email)
      setSent(true)
      toast.success('Reset email sent! Check your inbox.')
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass-effect rounded-2xl p-8 w-full max-w-md shadow-2xl border border-slate-700/50">
        <h1 className="text-4xl font-bold mb-2 text-center gradient-text">EZOrder</h1>
        <p className="text-center text-slate-400 mb-8">Reset your password</p>

        {sent ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
              <i className="fas fa-envelope-open text-emerald-400 text-2xl"></i>
            </div>
            <p className="text-slate-300">We sent a reset link to <span className="text-emerald-400 font-semibold">{email}</span></p>
            <p className="text-slate-500 text-sm">Check your inbox and click the link. It expires in 1 hour.</p>
            <Link href="/" className="block text-emerald-400 hover:text-emerald-300 text-sm transition-colors">
              Back to Login
            </Link>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input-base"
                  required
                />
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                <i className="fas fa-paper-plane"></i>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <p className="text-center text-slate-400 text-sm mt-6">
              Remember it?{' '}
              <Link href="/" className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">
                Back to Login
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
