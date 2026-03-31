'use client'

import { useAppStore } from '@/lib/store'

interface MarksModalProps {
  onClose: () => void
  marks: any[]
}

export default function MarksModal({ onClose, marks }: MarksModalProps) {
  const { currentOrder, addOrderMark, removeOrderMark } = useAppStore()

  const colorMap: Record<string, string> = {
    'red': 'text-red-400 bg-red-500/20',
    'amber': 'text-amber-400 bg-amber-500/20',
    'blue': 'text-blue-400 bg-blue-500/20',
    'purple': 'text-purple-400 bg-purple-500/20',
    'green': 'text-green-400 bg-green-500/20',
    'rose': 'text-rose-400 bg-rose-500/20',
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="glass-effect rounded-2xl p-6 w-full max-w-md border border-slate-700/50 shadow-2xl max-h-96 overflow-y-auto">
        <h2 className="text-2xl font-bold text-purple-400 mb-4">Add Special Marks</h2>

        <div className="space-y-2 mb-4">
          {marks.length === 0 ? (
            <p className="text-slate-400 text-center py-4">No marks available</p>
          ) : (
            marks.map((mark) => (
              <label
                key={mark.id}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer hover:border-emerald-500 transition ${
                  currentOrder.marks.includes(mark.id)
                    ? 'border-emerald-500 bg-emerald-500/20'
                    : 'border-slate-600 bg-slate-700/30'
                }`}
              >
                <input
                  type="checkbox"
                  checked={currentOrder.marks.includes(mark.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      addOrderMark(mark.id)
                    } else {
                      removeOrderMark(mark.id)
                    }
                  }}
                  className="w-4 h-4"
                />
                <span className={`px-2 py-1 rounded ${colorMap[mark.color] || colorMap['purple']}`}>
                  <i className={`fas fa-${mark.icon}`}></i>
                </span>
                <span className="font-semibold text-slate-100">{mark.name}</span>
              </label>
            ))
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full btn-primary py-3 flex items-center justify-center gap-2"
        >
          <i className="fas fa-check"></i>
          Confirm
        </button>
      </div>
    </div>
  )
}
