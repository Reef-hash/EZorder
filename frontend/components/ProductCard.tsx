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
      className={`card-hover-glow cursor-pointer select-none transition-all duration-150 ${flash ? 'scale-95' : ''} ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {/* Image area */}
      <div className="relative">
        {product.imageUrl ? (
          <div className="h-28 bg-gray-50 flex items-center justify-center overflow-hidden">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={e => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
                target.parentElement!.innerHTML = `<div class="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center mx-auto"><span class="text-3xl font-black text-orange-400 select-none">${product.name.charAt(0).toUpperCase()}</span></div>`
              }}
            />
          </div>
        ) : (
          <div className="h-28 bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-white shadow-sm flex items-center justify-center">
              <span className="text-3xl font-black text-orange-400 select-none">
                {product.name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        )}

        {/* Add button overlay */}
        {!isOutOfStock && (
          <div className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-orange-500 shadow-md shadow-orange-200 flex items-center justify-center">
            <i className="fas fa-plus text-white text-xs"></i>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="font-semibold text-gray-800 text-sm leading-tight line-clamp-2 mb-1.5">
          {product.name}
        </p>
        <div>
          {product.promoPrice && product.promoEnabled && (
            <p className="text-xs text-gray-400 line-through leading-none">RM{product.price.toFixed(2)}</p>
          )}
          <p className={`text-sm font-bold ${product.promoPrice && product.promoEnabled ? 'text-orange-500' : 'text-gray-900'}`}>
            RM{displayPrice.toFixed(2)}
          </p>
        </div>
        {isOutOfStock && (
          <span className="inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 border border-red-100 text-red-500">
            Habis
          </span>
        )}
        {isLowStock && (
          <span className="inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 border border-orange-100 text-orange-500">
            Baki: {product.stockQty}
          </span>
        )}
      </div>
    </div>
  )
}

