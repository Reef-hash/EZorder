'use client'

import { useAppStore } from '@/lib/store'
import { categoriesAPI } from '@/lib/api'
import toast from 'react-hot-toast'

interface CategoriesListProps {
  onDeleted: () => void
}

export default function CategoriesList({ onDeleted }: CategoriesListProps) {
  const { categories } = useAppStore()

  const deleteCategory = async (id: string) => {
    if (!confirm('Are you sure?')) return
    try {
      await categoriesAPI.delete(id)
      toast.success('Category deleted!')
      onDeleted()
    } catch {
      toast.error('Failed to delete category')
    }
  }

  if (categories.length === 0) {
    return <p className="text-slate-400">No categories yet</p>
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {categories.map((cat) => (
        <div key={cat.id} className="glass-effect rounded-lg p-4 border border-slate-600">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl text-emerald-400">
              <i className={`fas fa-${cat.icon}`}></i>
            </span>
            <h3 className="font-semibold text-slate-100">{cat.name}</h3>
          </div>
          <button
            onClick={() => deleteCategory(cat.id)}
            className="w-full bg-red-600/20 hover:bg-red-600/30 text-red-400 py-2 rounded text-sm font-semibold transition"
          >
            <i className="fas fa-trash-alt"></i> Delete
          </button>
        </div>
      ))}
    </div>
  )
}
