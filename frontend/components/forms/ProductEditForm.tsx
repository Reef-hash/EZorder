'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { productsAPI, categoriesAPI } from '@/lib/api'
import toast from 'react-hot-toast'

interface ProductEditFormProps {
  productId: string
  onSuccess: () => void
  onCancel: () => void
}

export default function ProductEditForm({
  productId,
  onSuccess,
  onCancel,
}: ProductEditFormProps) {
  const { products, categories, updateProduct, user } = useAppStore()
  const product = products.find((p) => p.id === productId)

  if (!product) return null

  const showStock = user?.businessType === 'retail' || user?.businessType === 'both'

  const [formData, setFormData] = useState({
    name: product.name,
    category: product.category,
    price: product.price.toString(),
    promoPrice: product.promoPrice?.toString() || '',
    promoEnabled: product.promoEnabled,
    trackStock: product.trackStock || false,
    stockQty: product.stockQty?.toString() || '',
    costPrice: product.costPrice?.toString() || '',
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.category || !formData.price) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      await categoriesAPI.getAll()
      await productsAPI.update(productId, {
        name: formData.name,
        category: formData.category,
        price: parseFloat(formData.price),
        promoPrice: formData.promoEnabled
          ? parseFloat(formData.promoPrice || '0')
          : null,
        promoEnabled: formData.promoEnabled,
        trackStock: formData.trackStock,
        stockQty: formData.trackStock ? parseInt(formData.stockQty || '0') : null,
        costPrice: formData.costPrice ? parseFloat(formData.costPrice) : null,
      })

      updateProduct(productId, {
        name: formData.name,
        category: formData.category,
        price: parseFloat(formData.price),
        promoPrice: formData.promoEnabled
          ? parseFloat(formData.promoPrice || '0')
          : null,
        promoEnabled: formData.promoEnabled,
        trackStock: formData.trackStock,
        stockQty: formData.trackStock ? parseInt(formData.stockQty || '0') : null,
        costPrice: formData.costPrice ? parseFloat(formData.costPrice) : null,
      })

      toast.success('Product updated successfully!')
      onSuccess()
    } catch (error) {
      console.error('Error updating product:', error)
      toast.error('Failed to update product')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        name="name"
        placeholder="Product Name"
        value={formData.name}
        onChange={handleChange}
        className="input-base"
        required
      />
      <select
        name="category"
        value={formData.category}
        onChange={handleChange}
        className="input-base"
        required
      >
        <option value="">Select Category</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.name}>
            {cat.name}
          </option>
        ))}
      </select>
      <input
        type="number"
        name="price"
        placeholder="Price (RM)"
        value={formData.price}
        onChange={handleChange}
        step="0.01"
        className="input-base"
        required
      />
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          name="promoEnabled"
          checked={formData.promoEnabled}
          onChange={handleChange}
        />
        <span className="text-sm">Has Promo Price</span>
      </label>
      {formData.promoEnabled && (
        <input
          type="number"
          name="promoPrice"
          placeholder="Promo Price (RM)"
          value={formData.promoPrice}
          onChange={handleChange}
          step="0.01"
          className="input-base"
        />
      )}

      {showStock && (
        <div className="border border-slate-700/50 rounded-xl p-4 space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="trackStock"
              checked={formData.trackStock}
              onChange={handleChange}
            />
            <span className="text-sm font-semibold text-slate-300">Track Stock</span>
          </label>
          {formData.trackStock && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Stock Qty</label>
                <input
                  type="number"
                  name="stockQty"
                  min="0"
                  step="1"
                  value={formData.stockQty}
                  onChange={handleChange}
                  placeholder="0"
                  className="input-base"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Cost Price (RM)</label>
                <input
                  type="number"
                  name="costPrice"
                  step="0.01"
                  min="0"
                  value={formData.costPrice}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="input-base"
                />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="btn-primary flex-1"
        >
          {loading ? 'Updating...' : 'Update Product'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary flex-1"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
