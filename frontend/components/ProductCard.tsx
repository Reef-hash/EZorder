'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Product } from '@/lib/store'
import toast from 'react-hot-toast'

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addOrderItem } = useAppStore()
  const [flash, setFlash] = useState(false)

  const displayPrice = product.promoPrice && product.promoEnabled ? product.promoPrice : product.price
  const isOutOfStock = product.trackStock && product.stockQty !== null && product.stockQty <= 0
  const isLowStock = product.trackStock && product.stockQty !== null && product.stockQty > 0 && product.stockQty <= 5

  const handleAdd = () => {
    if (isOutOfStock) {
      toast.error(`${product.name} is out of stock`)
      return
    }
    addOrderItem({
      lineId: '',
      id: product.id,
      name: product.name,
      price: displayPrice,
      quantity: 1,
      marks: [],
    })
    setFlash(true)
    setTimeout(() => setFlash(false), 300)
  }

  return (
    <div
      onClick={handleAdd}
      className={`card-hover-glow cursor-pointer select-none transition-all duration-150 active:scale-95 ${flash ? 'scale-95' : ''} ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {/* Image area */}
      {product.imageUrl ? (
        <div className="h-28 rounded-t-[13px] overflow-hidden bg-white/5">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        </div>
      ) : (
        <div className="h-20 rounded-t-[13px] bg-gradient-to-br from-amber-500/10 to-amber-500/5 flex items-center justify-center">
          <span className="text-3xl font-black text-amber-500/30 select-none">
            {product.name.charAt(0).toUpperCase()}
          </span>
        </div>
      )}

      {/* Info */}
      <div className="p-3">
        <p className="font-semibold text-slate-100 text-sm leading-tight line-clamp-2 mb-1.5">
          {product.name}
        </p>
        <div>
          {product.promoPrice && product.promoEnabled && (
            <p className="text-xs text-slate-500 line-through leading-none">RM{product.price.toFixed(2)}</p>
          )}
          <p className="text-sm font-bold text-amber-400">
            RM{displayPrice.toFixed(2)}
          </p>
        </div>
        {isOutOfStock && (
          <span className="inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-400">
            Out of Stock
          </span>
        )}
        {isLowStock && (
          <span className="inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400">
            Low: {product.stockQty} left
          </span>
        )}
      </div>
    </div>
  )
}

