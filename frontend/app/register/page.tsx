'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authAPI } from '@/lib/api'
import { useAppStore } from '@/lib/store'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const router = useRouter()
  const { setUser } = useAppStore()
  const [businessName, setBusinessName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    setLoading(true)

    try {
      const res = await authAPI.register({ businessName, email, password })
      const { token, user } = res.data
      localStorage.setItem('token', token)
      setUser(user)
      toast.success(`Welcome to EZOrder, ${businessName}! Your 14-day trial starts now.`)
      router.push('/dashboard')
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Registration failed')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="glass-effect rounded-2xl p-8 w-full max-w-md shadow-2xl border border-slate-700/50">
        <h1 className="text-4xl font-bold mb-2 text-center gradient-text">EZOrder</h1>
        <p className="text-center text-slate-400 mb-2">Create your account</p>
        <p className="text-center text-emerald-400 text-sm mb-8 font-semibold">14-day free trial — no credit card required</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Business Name</label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="My Cafe"
              className="input-base"
              required
            />
          </div>

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
              placeholder="Min 6 characters"
              className="input-base"
              required
              minLength={6}
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
            <i className="fas fa-rocket"></i>
            {loading ? 'Creating account...' : 'Start Free Trial'}
          </button>
        </form>

        <p className="text-center text-slate-400 text-sm mt-6">
          Already have an account?{' '}
          <Link href="/" className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">
            Login
          </Link>
        </p>
      </div>
    </div>
  )
}
