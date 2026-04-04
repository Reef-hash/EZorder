'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { productsAPI } from '@/lib/api'
import toast from 'react-hot-toast'

interface ProductFormProps {
  onSuccess: () => void
}

export default function ProductForm({ onSuccess }: ProductFormProps) {
  const { categories, selectCategory, user } = useAppStore()
  const showStock = user?.businessType === 'retail' || user?.businessType === 'both'
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    promoPrice: '',
    promoEnabled: false,
    trackStock: false,
    stockQty: '',
    costPrice: '',
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
      await productsAPI.create({
        name: formData.name,
        category: formData.category,
        price: parseFloat(formData.price),
        promoPrice: formData.promoEnabled ? parseFloat(formData.promoPrice || '0') : null,
        promoEnabled: formData.promoEnabled,
        trackStock: formData.trackStock,
        stockQty: formData.trackStock ? parseInt(formData.stockQty || '0') : null,
        costPrice: formData.costPrice ? parseFloat(formData.costPrice) : null,
      })

      toast.success('Product added successfully!')
      setFormData({
        name: '',
        category: '',
        price: '',
        promoPrice: '',
        promoEnabled: false,
        trackStock: false,
        stockQty: '',
        costPrice: '',
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

      {showStock && (
        <div className="border border-slate-700/50 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="trackStock"
              checked={formData.trackStock}
              onChange={(e) => setFormData({ ...formData, trackStock: e.target.checked, stockQty: e.target.checked ? formData.stockQty : '' })}
              className="w-4 h-4"
            />
            <label htmlFor="trackStock" className="text-sm font-semibold text-slate-300">
              Track Stock
            </label>
          </div>
          {formData.trackStock && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Stock Qty</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={formData.stockQty}
                  onChange={(e) => setFormData({ ...formData, stockQty: e.target.value })}
                  placeholder="0"
                  className="input-base"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Cost Price (RM)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                  placeholder="0.00"
                  className="input-base"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* SST Tax Rate — now managed via Tax Rules in Settings */}
      <p className="text-xs text-slate-600 italic">
        <i className="fas fa-info-circle mr-1"></i>
        Cukai SST diurus dalam tab Tetapan → Cukai SST (bukan per-produk lagi)
      </p>

      <button type="submit" disabled={loading} className="btn-primary w-full">
        <i className="fas fa-plus"></i>
        {loading ? 'Adding...' : 'Add Product'}
      </button>
    </form>
  )
}
