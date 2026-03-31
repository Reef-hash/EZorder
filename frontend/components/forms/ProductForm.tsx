'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { categoriesAPI } from '@/lib/api'
import toast from 'react-hot-toast'

interface ProductFormProps {
  onSuccess: () => void
}

export default function ProductForm({ onSuccess }: ProductFormProps) {
  const { categories, selectCategory } = useAppStore()
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    promoPrice: '',
    promoEnabled: false,
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.category || !formData.price) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      await categoriesAPI.getAll()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          category: formData.category,
          price: parseFloat(formData.price),
          promoPrice: formData.promoEnabled ? parseFloat(formData.promoPrice || '0') : null,
          promoEnabled: formData.promoEnabled,
        }),
      })

      if (!response.ok) throw new Error('Failed to add product')
      toast.success('Product added successfully!')
      setFormData({
        name: '',
        category: '',
        price: '',
        promoPrice: '',
        promoEnabled: false,
      })
      selectCategory(null)
      onSuccess()
    } catch (error) {
      toast.error('Error adding product')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-slate-300 mb-2">Product Name *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g. Iced Coffee"
          className="input-base"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-300 mb-2">Category *</label>
        <select
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          className="input-base"
          required
        >
          <option value="">Select a category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.name}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2">Price (RM) *</label>
          <input
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            placeholder="5.50"
            className="input-base"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2">Promo Price (RM)</label>
          <input
            type="number"
            step="0.01"
            value={formData.promoPrice}
            onChange={(e) => setFormData({ ...formData, promoPrice: e.target.value })}
            placeholder="4.50"
            disabled={!formData.promoEnabled}
            className="input-base disabled:opacity-50"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="promo"
          checked={formData.promoEnabled}
          onChange={(e) => setFormData({ ...formData, promoEnabled: e.target.checked })}
          className="w-4 h-4"
        />
        <label htmlFor="promo" className="text-sm font-semibold text-slate-300">
          Enable Promo Price
        </label>
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full">
        <i className="fas fa-plus"></i>
        {loading ? 'Adding...' : 'Add Product'}
      </button>
    </form>
  )
}
