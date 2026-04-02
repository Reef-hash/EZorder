'use client'

import { useEffect, useState } from 'react'
import { useAppStore, Order } from '@/lib/store'
import { useData } from '@/lib/hooks/useData'
import QueuePayModal from '@/components/modals/QueuePayModal'

function ElapsedTimer({ since }: { since: string }) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const start = new Date(since).getTime()
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [since])

  const m = Math.floor(elapsed / 60)
  const s = elapsed % 60
  const isLong = elapsed > 300 // warn after 5 min

  return (
    <span className={`text-xs font-mono font-bold ${isLong ? 'text-red-400' : 'text-blue-400'}`}>
      <i className={`fas fa-clock mr-1 text-[10px] ${isLong ? 'text-red-400' : 'text-blue-400/50'}`}></i>
      {m}:{String(s).padStart(2, '0')}
    </span>
  )
}

export default function QueueTab() {
  const { orders } = useAppStore()
  const { loadOrders } = useData()
  const [payOrder, setPayOrder] = useState<Order | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const pending = orders
    .filter(o => o.status === 'pending')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  // Load on mount + auto-refresh every 10s
  useEffect(() => {
    loadOrders()
    const id = setInterval(loadOrders, 10000)
    return () => clearInterval(id)
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadOrders()
    setRefreshing(false)
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <i className="fas fa-bell text-blue-400 text-base"></i>
            Order Queue
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {pending.length === 0
              ? 'No pending orders'
              : `${pending.length} order${pending.length !== 1 ? 's' : ''} waiting`
            }
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="text-xs text-blue-400/70 hover:text-blue-400 transition flex items-center gap-1.5 px-3 py-2 border border-blue-500/20 hover:border-blue-500/40 rounded-lg"
        >
          <i className={`fas fa-sync text-xs ${refreshing ? 'animate-spin' : ''}`}></i>
          Refresh
        </button>
      </div>

      {pending.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-600">
          <i className="fas fa-check-circle text-5xl mb-4 opacity-20"></i>
          <p className="font-semibold text-slate-500">All clear!</p>
          <p className="text-xs mt-1 text-slate-600">Tap <span className="text-blue-400/70 font-semibold">Serve</span> in POS to queue an order here</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {pending.map(order => (
            <div key={order.id} className="item-card-blue p-4 flex flex-col gap-3">
              {/* Top row: bill number + timer */}
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-300 text-base tracking-widest">
                  Bill {order.customerName}
                </span>
                <ElapsedTimer since={order.createdAt} />
              </div>

              {/* Items list */}
              <div className="space-y-1.5 flex-1">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-slate-300 truncate flex-1">{item.name}</span>
                    <span className="text-slate-500 ml-2 flex-shrink-0 font-semibold">×{item.quantity}</span>
                  </div>
                ))}
                {order.orderType === 'dine_in' && (
                  <p className="text-xs text-slate-600 mt-1">
                    <i className="fas fa-chair mr-1"></i>
                    {order.tableName || 'Dine In'}
                  </p>
                )}
              </div>

              {/* Footer: total + pay */}
              <div className="border-t border-blue-500/15 pt-3 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-600 uppercase tracking-widest">Total</p>
                  <p className="text-xl font-bold text-blue-300">RM{order.total.toFixed(2)}</p>
                </div>
                <button
                  onClick={() => setPayOrder(order)}
                  className="px-5 py-2.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 hover:border-blue-500/65 text-blue-300 text-sm font-bold rounded-xl transition-all hover:shadow-lg hover:shadow-blue-500/15"
                >
                  <i className="fas fa-credit-card mr-1.5"></i>Pay
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {payOrder && (
        <QueuePayModal
          order={payOrder}
          onClose={() => setPayOrder(null)}
          onSuccess={() => {
            setPayOrder(null)
            loadOrders()
          }}
        />
      )}
    </div>
  )
}
