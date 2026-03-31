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
  const { products, categories, updateProduct } = useAppStore()
  const product = products.find((p) => p.id === productId)

  if (!product) return null

  const [formData, setFormData] = useState({
    name: product.name,
    category: product.category,
    price: product.price.toString(),
    promoPrice: product.promoPrice?.toString() || '',
    promoEnabled: product.promoEnabled,
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
      })

      updateProduct(productId, {
        name: formData.name,
        category: formData.category,
        price: parseFloat(formData.price),
        promoPrice: formData.promoEnabled
          ? parseFloat(formData.promoPrice || '0')
          : null,
        promoEnabled: formData.promoEnabled,
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
