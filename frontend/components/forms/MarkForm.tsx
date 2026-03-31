'use client'

import { useState } from 'react'
import { marksAPI } from '@/lib/api'
import toast from 'react-hot-toast'

interface MarkFormProps {
  onSuccess: () => void
}

export default function MarkForm({ onSuccess }: MarkFormProps) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Please enter a mark name')
      return
    }

    setLoading(true)
    try {
      await marksAPI.create({ name: name.trim() })
      toast.success('Mark added successfully!')
      setName('')
      onSuccess()
    } catch (error) {
      toast.error('Failed to add mark')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <div className="flex-1">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Less Spicy, Extra Sweet, No Ice"
          className="input-base"
          required
        />
      </div>
      <button type="submit" disabled={loading} className="btn-primary px-6 whitespace-nowrap">
        <i className="fas fa-plus"></i>
        {loading ? 'Adding...' : 'Add'}
      </button>
    </form>
  )
}
