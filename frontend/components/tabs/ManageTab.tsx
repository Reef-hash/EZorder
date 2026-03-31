'use client'

import { useState } from 'react'
import { useData } from '@/lib/hooks/useData'
import ProductForm from '@/components/forms/ProductForm'
import CategoryForm from '@/components/forms/CategoryForm'
import MarkForm from '@/components/forms/MarkForm'
import ProductsList from '@/components/lists/ProductsList'
import CategoriesList from '@/components/lists/CategoriesList'
import MarksList from '@/components/lists/MarksList'

type ManageSection = 'products' | 'categories' | 'marks'

export default function ManageTab() {
  const { loadProducts, loadCategories, loadMarks } = useData()
  const [activeSection, setActiveSection] = useState<ManageSection>('products')

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

  return (
    <div className="space-y-8">
      {/* Section Tabs */}
      <div className="flex gap-4 border-b border-slate-700">
        <button
          onClick={() => setActiveSection('products')}
          className={`px-4 py-3 font-semibold border-b-2 transition ${
            activeSection === 'products'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          <i className="fas fa-box mr-2"></i>
          Products
        </button>
        <button
          onClick={() => setActiveSection('categories')}
          className={`px-4 py-3 font-semibold border-b-2 transition ${
            activeSection === 'categories'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          <i className="fas fa-folder mr-2"></i>
          Categories
        </button>
        <button
          onClick={() => setActiveSection('marks')}
          className={`px-4 py-3 font-semibold border-b-2 transition ${
            activeSection === 'marks'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          <i className="fas fa-flag mr-2"></i>
          Marks
        </button>
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
    </div>
  )
}
