'use client'

import { useState, useMemo } from 'react'
import { useAppStore } from '@/lib/store'
import { ordersAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import ProductCard from '@/components/ProductCard'
import CurrentOrderBuilder from '@/components/CurrentOrderBuilder'

export default function OrderTab() {
  const { products, categories, currentOrder, clearCurrentOrder } = useAppStore()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const filteredProducts = useMemo(() => {
    if (!selectedCategory) return products.filter((p: any) => !p.disabled)
    return products.filter((p: any) => {
      const cat = categories.find((c: any) => c.id === selectedCategory)
      return p.category === cat?.name && !p.disabled
    })
  }, [products, selectedCategory, categories])

  const handleConfirmOrder = async () => {
    if (!currentOrder.customerName.trim()) {
      toast.error('Please enter customer name')
      return
    }

    if (currentOrder.items.length === 0) {
      toast.error('Please add items to the order')
      return
    }

    try {
      const total = currentOrder.items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0)

      await ordersAPI.create({
        customerName: currentOrder.customerName,
        items: currentOrder.items,
        marks: [],
        total,
      })

      toast.success('Order saved successfully!')
      clearCurrentOrder()
    } catch (error) {
      toast.error('Failed to save order')
    }
  }

  return (
    <div className="grid lg:grid-cols-4 gap-8">
      {/* Products List */}
      <div className="lg:col-span-3">
        <div className="mb-6">
          <h2 className="text-2xl font-bold gradient-text mb-4">Select Products</h2>

          {/* Category Filter */}
          <div className="flex gap-2 flex-wrap mb-6 p-4 glass-effect rounded-lg">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition border-2 ${
                selectedCategory === null
                  ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300'
                  : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-cyan-500'
              }`}
            >
              All
            </button>
            {categories.map((cat: any) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition border-2 ${
                  selectedCategory === cat.id
                    ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300'
                    : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-cyan-500'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            <p className="text-gray-400">No products available</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Current Order Builder */}
      <div className="lg:col-span-1">
        <CurrentOrderBuilder onConfirmOrder={handleConfirmOrder} />
      </div>
    </div>
  )
}
