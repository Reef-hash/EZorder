'use client'

import { useAppStore } from '@/lib/store'
import { Product } from '@/lib/store'

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addOrderItem } = useAppStore()

  const displayPrice = product.promoPrice && product.promoEnabled ? product.promoPrice : product.price

  return (
    <div
      onClick={() =>
        addOrderItem({
          id: product.id,
          name: product.name,
          price: displayPrice,
          quantity: 1,
        })
      }
      className="glass-effect rounded-lg p-4 cursor-pointer hover:border-emerald-500/50 transition transform hover:-translate-y-1 border border-slate-600 hover:shadow-lg hover:shadow-emerald-500/20"
    >
      <div className="font-semibold text-slate-100 mb-2">{product.name}</div>
      <div className="text-sm text-slate-400">
        {product.promoPrice && product.promoEnabled && (
          <span className="line-through">RM{product.price.toFixed(2)} </span>
        )}
        <span className="text-emerald-400 font-semibold">RM{displayPrice.toFixed(2)}</span>
      </div>
    </div>
  )
}
