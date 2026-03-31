'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { useData } from '@/lib/hooks/useData'
import OrderCard from '@/components/OrderCard'

export default function HistoryTab() {
  const { orders } = useAppStore()
  const { loadOrders } = useData()
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadOrders()
  }, [])

  const pending = orders.filter((o) => o.status === 'pending')
  const completed = orders.filter((o) => o.status === 'completed')
  const cancelled = orders.filter((o) => o.status === 'cancelled')

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadOrders()
    setRefreshing(false)
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold gradient-text">Order History</h2>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-semibold transition disabled:opacity-50"
        >
          <i className={`fas fa-sync ${refreshing ? 'animate-spin' : ''} mr-2`}></i>
          Refresh
        </button>
      </div>

      {/* Pending Orders */}
      <div>
        <h3 className="text-2xl font-bold text-amber-400 mb-4">Pending Orders ({pending.length})</h3>
        {pending.length === 0 ? (
          <p className="text-slate-400">No pending orders</p>
        ) : (
          <div className="grid gap-4">
            {pending.map((order) => (
              <OrderCard key={order.id} order={order} onOrderUpdated={loadOrders} />
            ))}
          </div>
        )}
      </div>

      {/* Completed Orders */}
      <div>
        <h3 className="text-2xl font-bold text-emerald-400 mb-4">Completed Orders ({completed.length})</h3>
        {completed.length === 0 ? (
          <p className="text-slate-400">No completed orders</p>
        ) : (
          <div className="grid gap-4">
            {completed.map((order) => (
              <OrderCard key={order.id} order={order} onOrderUpdated={loadOrders} />
            ))}
          </div>
        )}
      </div>

      {/* Cancelled Orders */}
      <div>
        <h3 className="text-2xl font-bold text-red-400 mb-4">Cancelled Orders ({cancelled.length})</h3>
        {cancelled.length === 0 ? (
          <p className="text-slate-400">No cancelled orders</p>
        ) : (
          <div className="grid gap-4">
            {cancelled.map((order) => (
              <OrderCard key={order.id} order={order} onOrderUpdated={loadOrders} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
