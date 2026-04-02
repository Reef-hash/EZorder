'use client'

import { useAppStore } from '@/lib/store'

interface ItemMarksSelectorProps {
  lineId: string
}

export default function ItemMarksSelector({ lineId }: ItemMarksSelectorProps) {
  const { marks, currentOrder, toggleItemMark } = useAppStore()
  const item = currentOrder.items.find((i: any) => i.lineId === lineId)

  if (!item) return null

  return (
    <div className="mt-2 pt-2 border-t border-white/8">
      <p className="text-xs font-semibold text-slate-500 mb-1.5">Marks for this unit:</p>
      <div className="flex flex-wrap gap-1.5">
        {marks.map((mark) => (
          <button
            key={mark.id}
            onClick={() => toggleItemMark(lineId, mark.id)}
            className={`text-xs px-2.5 py-1 rounded-full border font-semibold transition-all ${
              item.marks && item.marks.includes(mark.id)
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                : 'bg-white/5 text-slate-400 border-white/10 hover:border-cyan-500/40 hover:text-slate-200'
            }`}
          >
            {mark.name}
          </button>
        ))}
      </div>
    </div>
  )
}
