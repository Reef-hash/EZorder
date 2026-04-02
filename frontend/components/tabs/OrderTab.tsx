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
      {/* ===== Product Area ===== */}
      <div className={`flex-1 overflow-y-auto flex flex-col transition-all duration-300 ${showOrderPanel ? 'md:flex hidden' : 'flex'} md:flex`}>
        <div className="p-3 md:p-4 space-y-3">
          {/* Search */}
          <div className="relative">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm"></i>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="input-base pl-9 py-2.5 text-sm"
            />
          </div>

          {/* Category filter */}
          <div className="flex gap-2.5 overflow-x-auto scrollbar-none pb-1">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`category-card flex-shrink-0 flex flex-col items-center gap-1.5 px-4 py-3 min-w-[72px] ${selectedCategory === null ? 'active' : ''}`}
            >
              <i className={`fas fa-th text-base ${selectedCategory === null ? 'text-blue-400' : 'text-slate-400'}`}></i>
              <span className={`text-xs font-semibold ${selectedCategory === null ? 'text-blue-300' : 'text-slate-400'}`}>All</span>
            </button>
            {categories.map((cat: any) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`category-card flex-shrink-0 flex flex-col items-center gap-1.5 px-4 py-3 min-w-[72px] ${selectedCategory === cat.id ? 'active' : ''}`}
              >
                <i className={`fas ${cat.icon} text-base ${selectedCategory === cat.id ? 'text-blue-400' : 'text-slate-400'}`}></i>
                <span className={`text-xs font-semibold ${selectedCategory === cat.id ? 'text-blue-300' : 'text-slate-400'}`}>{cat.name}</span>
              </button>
            ))}
          </div>

          {/* Separator */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-blue-500/25 to-transparent"></div>
            <span className="text-[10px] font-bold text-blue-500/50 tracking-widest uppercase">Menu</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-blue-500/25 to-transparent"></div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="px-3 md:px-4 pb-24 md:pb-4">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
              <i className="fas fa-box-open text-4xl mb-3 opacity-30"></i>
              <p className="text-sm">No products found</p>
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

      {/* ===== Order Panel — desktop side panel / mobile full screen ===== */}
      <div className={`
        md:flex md:flex-col md:w-[340px] md:flex-shrink-0 md:border-l md:border-amber-500/10 bg-[#0f1117]
        ${showOrderPanel
          ? 'fixed inset-0 z-40 flex flex-col md:relative md:inset-auto md:z-auto'
          : 'hidden md:flex'}
      `}>
        {/* Mobile close button */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-amber-500/10">
          <span className="font-bold text-amber-400">Order Panel</span>
          <button onClick={() => setShowOrderPanel(false)} className="text-slate-400 hover:text-white p-1">
            <i className="fas fa-times text-lg"></i>
          </button>
        </div>
        <CurrentOrderBuilder onClose={() => setShowOrderPanel(false)} />
      </div>

      {/* Mobile floating cart button */}
      {!showOrderPanel && (
        <button
          onClick={() => setShowOrderPanel(true)}
          className="md:hidden fixed bottom-20 right-4 z-30 btn-primary w-14 h-14 rounded-full shadow-2xl shadow-amber-500/30 flex items-center justify-center"
        >
          <i className="fas fa-shopping-cart text-lg"></i>
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </button>
      )}
    </div>
  )
}

