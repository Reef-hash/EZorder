'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { productsAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import ProductEditForm from '../forms/ProductEditForm'

export default function ProductsList() {
  const { products, toggleProductDisabled, removeProductLocal } = useAppStore()
  const [editingId, setEditingId] = useState<string | null>(null)

  const deleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    try {
      await productsAPI.delete(id)
      removeProductLocal(id)
      toast.success('Product deleted!')
    } catch {
      toast.error('Failed to delete product')
    }
  }

  const toggleDisable = async (id: string) => {
    const product = products.find((p) => p.id === id)
    if (!product) return
    try {
      await productsAPI.update(id, { disabled: !product.disabled })
      toggleProductDisabled(id)
      toast.success(product.disabled ? 'Product enabled!' : 'Product disabled!')
    } catch {
      toast.error('Failed to update product status')
    }
  }

  if (products.length === 0) {
    return <p className="text-gray-400">No products yet</p>
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map((product) => (
        <div
          key={product.id}
          className={`glass-effect rounded-lg p-4 transition-all ${
            product.disabled ? 'opacity-50' : ''
          } ${editingId === product.id ? 'neon-border' : ''}`}
        >
          {editingId === product.id ? (
            <ProductEditForm
              productId={product.id}
              onSuccess={() => setEditingId(null)}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className={`font-semibold ${product.disabled ? 'line-through text-gray-500' : 'text-gray-100'}`}>
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-400">{product.category}</p>
                </div>
                {product.disabled && (
                  <span className="text-xs bg-red-900/30 text-red-400 px-2 py-1 rounded">
                    Disabled
                  </span>
                )}
              </div>

              <div className="space-y-1 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Price:</span>
                  <span className="text-gray-200">RM{product.price.toFixed(2)}</span>
                </div>
                {product.promoPrice && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Promo:</span>
                    <span className="text-cyan-400">
                      RM{product.promoPrice.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setEditingId(product.id)}
                  className="flex-1 bg-cyan-900/30 hover:bg-cyan-900/50 text-cyan-400 py-2 rounded text-sm font-semibold transition border border-cyan-500/30"
                >
                  <i className="fas fa-edit"></i> Edit
                </button>
                <button
                  onClick={() => toggleDisable(product.id)}
                  className={`flex-1 py-2 rounded text-sm font-semibold transition border ${
                    product.disabled
                      ? 'bg-green-900/30 hover:bg-green-900/50 text-green-400 border-green-500/30'
                      : 'bg-yellow-900/30 hover:bg-yellow-900/50 text-yellow-400 border-yellow-500/30'
                  }`}
                >
                  <i className={`fas fa-${product.disabled ? 'check' : 'ban'}`}></i>
                  {product.disabled ? ' Enable' : ' Disable'}
                </button>
                <button
                  onClick={() => deleteProduct(product.id)}
                  className="flex-1 bg-red-900/30 hover:bg-red-900/50 text-red-400 py-2 rounded text-sm font-semibold transition border border-red-500/30"
                >
                  <i className="fas fa-trash-alt"></i> Delete
                </button>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  )
}
