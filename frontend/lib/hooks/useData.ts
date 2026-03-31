import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { productsAPI, categoriesAPI, marksAPI, ordersAPI } from '@/lib/api'
import toast from 'react-hot-toast'

export const useData = () => {
  const [loading, setLoading] = useState(false)
  const { setProducts, setCategories, setMarks, setOrders } = useAppStore()

  const loadProducts = async () => {
    try {
      console.log('📦 Loading products...')
      setLoading(true)
      const { data } = await productsAPI.getAll()
      console.log('📦 Products loaded:', data?.length || 0, 'items')
      setProducts(data)
      return true
    } catch (error) {
      console.error('❌ Products error:', error)
      return false
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      console.log('📂 Loading categories...')
      const { data } = await categoriesAPI.getAll()
      console.log('📂 Categories loaded:', data?.length || 0, 'items')
      setCategories(data)
      return true
    } catch (error) {
      console.error('❌ Categories error:', error)
      return false
    }
  }

  const loadMarks = async () => {
    try {
      console.log('✅ Loading marks...')
      const { data } = await marksAPI.getAll()
      console.log('✅ Marks loaded:', data?.length || 0, 'items')
      setMarks(data)
      return true
    } catch (error) {
      console.error('❌ Marks error:', error)
      return false
    }
  }

  const loadOrders = async () => {
    try {
      console.log('📋 Loading orders...')
      const { data } = await ordersAPI.getAll()
      console.log('📋 Orders loaded:', data?.length || 0, 'items')
      setOrders(data)
      return true
    } catch (error) {
      console.error('❌ Orders error:', error)
      return false
    }
  }

const loadAllData = async () => {
    try {
      console.log('🔄 Starting to load all data...')
      const results = await Promise.all([
        loadProducts().catch(e => { console.error('Products failed:', e); return null }),
        loadCategories().catch(e => { console.error('Categories failed:', e); return null }),
        loadMarks().catch(e => { console.error('Marks failed:', e); return null }),
        loadOrders().catch(e => { console.error('Orders failed:', e); return null }),
      ])
      
      const hasErrors = results.some(r => r === null)
      if (hasErrors) {
        console.warn('⚠️ Some data failed to load, but app can continue')
        toast.error('Some data failed to load')
      } else {
        console.log('✅ All data loaded successfully:', results)
      }
      return results
    } catch (error) {
      console.error('❌ Critical error loading data:', error)
      toast.error('Failed to load dashboard data')
      throw error
    }
  }

  return { loading, loadProducts, loadCategories, loadMarks, loadOrders, loadAllData }
}
