'use client'

import { useAppStore } from '@/lib/store'

interface ItemMarksSelectorProps {
  itemId: string
}

export default function ItemMarksSelector({
  itemId,
}: ItemMarksSelectorProps) {
  const { marks, currentOrder, toggleItemMark } = useAppStore()
  const item = currentOrder.items.find((i: any) => i.id === itemId)

  if (!item) return null

  return (
    <div className="mt-2 pt-2 border-t border-gray-600">
      <p className="text-xs font-semibold text-gray-400 mb-1">Add marks for this item:</p>
      <div className="flex flex-wrap gap-1">
        {marks.map((mark) => (
          <button
            key={mark.id}
            onClick={() => toggleItemMark(itemId, mark.id)}
            className={`text-xs px-2 py-1 rounded transition ${
              item.marks && item.marks.includes(mark.id)
                ? 'bg-cyan-900/50 text-cyan-400 border border-cyan-500/50'
                : 'bg-gray-800 text-gray-400 border border-gray-600 hover:border-cyan-500'
            }`}
          >
            {mark.name}
          </button>
        ))}
      </div>
      {item.marks && item.marks.length > 0 && (
        <div className="mt-2 text-xs text-cyan-400">
          Selected: {item.marks.map((id) => marks.find((m) => m.id === id)?.name).join(', ')}
        </div>
      )}
    </div>
  )
}
