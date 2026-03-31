'use client'

import { useAppStore } from '@/lib/store'
import { marksAPI } from '@/lib/api'
import toast from 'react-hot-toast'

interface MarksListProps {
  onDeleted: () => void
}

export default function MarksList({ onDeleted }: MarksListProps) {
  const { marks } = useAppStore()

  const deleteMark = async (id: string) => {
    if (!confirm('Are you sure?')) return
    try {
      await marksAPI.delete(id)
      toast.success('Mark deleted!')
      onDeleted()
    } catch {
      toast.error('Failed to delete mark')
    }
  }

  if (marks.length === 0) {
    return <p className="text-slate-400">No marks yet</p>
  }

  const colorMap: Record<string, string> = {
    'red': 'text-red-400 bg-red-500/20',
    'amber': 'text-amber-400 bg-amber-500/20',
    'blue': 'text-blue-400 bg-blue-500/20',
    'purple': 'text-purple-400 bg-purple-500/20',
    'green': 'text-green-400 bg-green-500/20',
    'rose': 'text-rose-400 bg-rose-500/20',
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {marks.map((mark) => (
        <div key={mark.id} className="glass-effect rounded-lg p-4 border border-slate-600">
          <div className="flex items-center gap-3 mb-3">
            <span className={`px-3 py-2 rounded ${colorMap[mark.color] || colorMap['purple']}`}>
              <i className={`fas fa-${mark.icon}`}></i>
            </span>
            <h3 className="font-semibold text-slate-100">{mark.name}</h3>
          </div>
          <button
            onClick={() => deleteMark(mark.id)}
            className="w-full bg-red-600/20 hover:bg-red-600/30 text-red-400 py-2 rounded text-sm font-semibold transition"
          >
            <i className="fas fa-trash-alt"></i> Delete
          </button>
        </div>
      ))}
    </div>
  )
}
