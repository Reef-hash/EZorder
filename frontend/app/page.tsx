'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'
import toast from 'react-hot-toast'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const expired = searchParams.get('expired') === '1'

  useEffect(() => {
    if (user) router.push('/dashboard')
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await login(email, password)
      toast.success('Login successful!')
      router.push('/dashboard')
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Invalid email or password')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass-effect rounded-2xl p-8 w-full max-w-md shadow-2xl border border-slate-700/50">
        <h1 className="text-4xl font-bold mb-2 text-center gradient-text">EZOrder</h1>
        <p className="text-center text-slate-400 mb-8">Professional Order Management System</p>

        {expired && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 text-sm text-center">
            <i className="fas fa-exclamation-triangle mr-1.5"></i>
            Your subscription has expired. Please contact support to renew.
          </div>
        )}

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

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input-base"
              required
            />
          </div>

          <div className="text-right">
            <Link href="/forgot-password" className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
              Forgot password?
            </Link>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
            <i className="fas fa-sign-in-alt"></i>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="text-center text-slate-400 text-sm mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">
            Start free trial
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}

