'use client'

import { useState } from 'react'
import { useData } from '@/lib/hooks/useData'
import { useAppStore } from '@/lib/store'
import { tablesAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import ProductForm from '@/components/forms/ProductForm'
import CategoryForm from '@/components/forms/CategoryForm'
import MarkForm from '@/components/forms/MarkForm'
import ProductsList from '@/components/lists/ProductsList'
import CategoriesList from '@/components/lists/CategoriesList'
import MarksList from '@/components/lists/MarksList'

type ManageSection = 'products' | 'categories' | 'marks' | 'tables'

export default function ManageTab() {
  const { loadProducts, loadCategories, loadMarks, loadTables } = useData()
  const { tables, setTables } = useAppStore()
  const [activeSection, setActiveSection] = useState<ManageSection>('products')
  const [tableName, setTableName] = useState('')
  const [tableSeats, setTableSeats] = useState('4')
  const [addingTable, setAddingTable] = useState(false)

  const handleProductAdded = async () => {
    await loadProducts()
    await loadCategories()
  }

  const handleCategoryAdded = async () => {
    await loadCategories()
    await loadProducts()
  }

  const handleMarkAdded = async () => {
    await loadMarks()
  }

  const handleAddTable = async () => {
    if (!tableName.trim()) { toast.error('Enter table name'); return }
    setAddingTable(true)
    try {
      await tablesAPI.create({ name: tableName.trim(), seats: parseInt(tableSeats) || 4 })
      toast.success('Table added!')
      setTableName('')
      setTableSeats('4')
      await loadTables()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to add table')
    } finally {
      setAddingTable(false)
    }
  }

  const handleDeleteTable = async (id: string) => {
    try {
      await tablesAPI.delete(id)
      setTables(tables.filter(t => t.id !== id))
      toast.success('Table deleted')
    } catch {
      toast.error('Failed to delete table')
    }
  }

  const SECTIONS: { id: ManageSection; icon: string; label: string }[] = [
    { id: 'products',   icon: 'fa-box',        label: 'Products'   },
    { id: 'categories', icon: 'fa-folder',     label: 'Categories' },
    { id: 'marks',      icon: 'fa-flag',       label: 'Marks'      },
    { id: 'tables',     icon: 'fa-chair',      label: 'Tables'     },
  ]

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Section Tabs */}
      <div className="flex gap-1 bg-white/5 rounded-xl p-1 border border-white/8 overflow-x-auto scrollbar-none">
        {SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm whitespace-nowrap transition-all flex-1 justify-center ${
              activeSection === s.id
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <i className={`fas ${s.icon}`}></i>
            <span className="hidden sm:inline">{s.label}</span>
          </button>
        ))}
      </div>

      {/* Products Section */}
      {activeSection === 'products' && (
        <div className="space-y-8">
          <div className="glass-effect rounded-2xl p-6 border border-slate-700/50">
            <h2 className="text-2xl font-bold gradient-text mb-6">Add New Product</h2>
            <ProductForm onSuccess={handleProductAdded} />
          </div>
          <div className="glass-effect rounded-2xl p-6 border border-slate-700/50">
            <h2 className="text-2xl font-bold gradient-text mb-6">All Products</h2>
            <ProductsList />
          </div>
        </div>
      )}

      {/* Categories Section */}
      {activeSection === 'categories' && (
        <div className="space-y-8">
          <div className="glass-effect rounded-2xl p-6 border border-slate-700/50">
            <h2 className="text-2xl font-bold gradient-text mb-6">Add New Category</h2>
            <CategoryForm onSuccess={handleCategoryAdded} />
          </div>
          <div className="glass-effect rounded-2xl p-6 border border-slate-700/50">
            <h2 className="text-2xl font-bold gradient-text mb-6">Your Categories</h2>
            <CategoriesList onDeleted={handleCategoryAdded} />
          </div>
        </div>
      )}

      {/* Marks Section */}
      {activeSection === 'marks' && (
        <div className="space-y-8">
          <div className="glass-effect rounded-2xl p-6 border border-slate-700/50">
            <h2 className="text-2xl font-bold gradient-text mb-6">Add New Mark</h2>
            <MarkForm onSuccess={handleMarkAdded} />
          </div>
          <div className="glass-effect rounded-2xl p-6 border border-slate-700/50">
            <h2 className="text-2xl font-bold gradient-text mb-6">Your Marks</h2>
            <MarksList onDeleted={handleMarkAdded} />
          </div>
        </div>
      )}

      {/* Tables Section */}
      {activeSection === 'tables' && (
        <div className="space-y-6">
          <div className="glass-effect rounded-2xl p-6 border border-slate-700/50">
            <h2 className="text-2xl font-bold gradient-text mb-6">Add Table</h2>
            <div className="flex gap-3">
              <input
                type="text"
                value={tableName}
                onChange={e => setTableName(e.target.value)}
                placeholder="Table name, e.g. T1 or Table 1"
                className="input-base flex-1"
                onKeyDown={e => e.key === 'Enter' && handleAddTable()}
              />
              <input
                type="number"
                value={tableSeats}
                onChange={e => setTableSeats(e.target.value)}
                placeholder="Seats"
                className="input-base w-20 text-center"
                min="1"
              />
              <button
                onClick={handleAddTable}
                disabled={addingTable}
                className="btn-primary px-6 disabled:opacity-40"
              >
                {addingTable ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-plus mr-2"></i>Add</>}
              </button>
            </div>
          </div>

          <div className="glass-effect rounded-2xl p-6 border border-slate-700/50">
            <h2 className="text-2xl font-bold gradient-text mb-6">Your Tables ({tables.length})</h2>
            {tables.length === 0 ? (
              <p className="text-slate-500 text-sm">No tables yet. Add tables to use them in Dine In orders.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {tables.map(table => (
                  <div key={table.id} className="glass-effect rounded-xl p-4 flex flex-col items-center gap-2 border border-white/8">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                      <i className="fas fa-chair text-amber-400 text-lg"></i>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-slate-100 text-sm">{table.name}</p>
                      <p className="text-xs text-slate-500">{table.seats} seats</p>
                    </div>
                    <button
                      onClick={() => handleDeleteTable(table.id)}
                      className="text-xs text-red-400 hover:text-red-300 transition px-2 py-1 rounded border border-red-500/20 hover:border-red-500/40"
                    >
                      <i className="fas fa-trash-alt mr-1"></i>Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

