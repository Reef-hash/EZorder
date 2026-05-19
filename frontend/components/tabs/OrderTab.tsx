'use client'

import { useState, useMemo } from 'react'
import { useAppStore } from '@/lib/store'
import ProductCard from '@/components/ProductCard'
import CurrentOrderBuilder from '@/components/CurrentOrderBuilder'

export default function OrderTab() {
  const { products, categories, currentOrder } = useAppStore()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showOrderPanel, setShowOrderPanel] = useState(false)

  const filteredProducts = useMemo(() => {
    let result = products.filter((p: any) => !p.disabled)
    if (selectedCategory) {
      const cat = categories.find((c: any) => c.id === selectedCategory)
      result = result.filter((p: any) => p.category === cat?.name)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter((p: any) => p.name.toLowerCase().includes(q))
    }
    return result
  }, [products, selectedCategory, categories, searchQuery])

  const cartCount = currentOrder.items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <div className="flex-1 flex overflow-hidden relative">
      {/* ── Product Area ── */}
      <div className={`flex-1 overflow-y-auto flex flex-col ${showOrderPanel ? 'md:flex hidden' : 'flex'} md:flex`}>
        
        {/* Top search + filter bar */}
        <div className="bg-white border-b border-gray-100 px-4 py-3 flex-shrink-0">
          {/* Search */}
          <div className="relative mb-3">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari produk..."
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:bg-white transition-all"
            />
          </div>

          {/* Category pills */}
          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-0.5">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                selectedCategory === null
                  ? 'bg-orange-500 border-orange-500 text-white shadow-sm shadow-orange-200'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-500'
              }`}
            >
              Show All
            </button>
            {categories.map((cat: any) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-orange-500 border-orange-500 text-white shadow-sm shadow-orange-200'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-500'
                }`}
              >
                <i className={`fas ${cat.icon} text-[10px]`}></i>
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 p-3 md:p-4 pb-32 md:pb-4">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <i className="fas fa-box-open text-4xl mb-3 opacity-30"></i>
              <p className="text-sm font-medium">Tiada produk dijumpai</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProducts.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Order Panel — desktop side panel / mobile full screen ── */}
      <div className={`
        md:flex md:flex-col md:w-[340px] md:flex-shrink-0 md:border-l md:border-gray-100 bg-white
        ${showOrderPanel
          ? 'fixed inset-0 z-40 flex flex-col md:relative md:inset-auto md:z-auto'
          : 'hidden md:flex'}
      `}>
        {/* Mobile close button */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <span className="font-bold text-gray-800">Order Panel</span>
          <button onClick={() => setShowOrderPanel(false)} className="text-gray-400 hover:text-gray-600 p-1">
            <i className="fas fa-times text-lg"></i>
          </button>
        </div>
        <CurrentOrderBuilder onClose={() => setShowOrderPanel(false)} />
      </div>

      {/* Mobile floating cart button */}
      {!showOrderPanel && (
        <button
          onClick={() => setShowOrderPanel(true)}
          className="md:hidden fixed bottom-24 right-4 z-30 w-14 h-14 rounded-full bg-orange-500 shadow-lg shadow-orange-200 flex items-center justify-center no-min-h"
        >
          <i className="fas fa-shopping-cart text-white text-lg"></i>
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </button>
      )}
    </div>
  )
}


