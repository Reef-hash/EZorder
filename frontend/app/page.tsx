'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
  const { user, login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    if (user) {
      console.log('User already logged in, redirecting to dashboard')
      router.push('/dashboard')
    }
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const success = login(username, password)
      console.log('Login attempt result:', success)
      if (success) {
        toast.success('Login successful!')
        // Wait a bit for state to update, then navigate
        setTimeout(() => {
          console.log('Navigating to dashboard...')
          router.push('/dashboard')
        }, 100)
      } else {
        toast.error('Invalid credentials')
        setLoading(false)
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error('Login failed')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass-effect rounded-2xl p-8 w-full max-w-md shadow-2xl border border-slate-700/50">
        <h1 className="text-4xl font-bold mb-2 text-center gradient-text">EZOrder</h1>
        <p className="text-center text-slate-400 mb-8">Professional Order Management System</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="user"
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

          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
            <i className="fas fa-sign-in-alt"></i>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="text-center text-slate-400 text-sm mt-4">Demo: user / password</p>
      </div>
    </div>
  )
}
