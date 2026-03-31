'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Order } from '@/lib/store'
import { ordersAPI } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

interface OrderCardProps {
  order: Order
  onOrderUpdated: () => void
}

export default function OrderCard({ order, onOrderUpdated }: OrderCardProps) {
  const { marks } = useAppStore()
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  const statusColors = {
    pending: 'text-amber-400 bg-amber-500/20',
    completed: 'text-emerald-400 bg-emerald-500/20',
    cancelled: 'text-red-400 bg-red-500/20',
  }

  const handlePaymentMethod = async (method: 'cash' | 'qr') => {
    try {
      await ordersAPI.update(order.id, {
        status: 'completed',
        paymentMethod: method,
      })
      toast.success('Order completed!')
      onOrderUpdated()
      setShowPaymentModal(false)
    } catch {
      toast.error('Failed to update order')
    }
  }

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return

    try {
      await ordersAPI.update(order.id, { status: 'cancelled' })
      toast.success('Order cancelled')
      onOrderUpdated()
    } catch {
      toast.error('Failed to cancel order')
    }
  }

  return (
    <div className="glass-effect rounded-lg p-4 border border-slate-600">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="font-semibold text-slate-100">{order.customerName}</div>
          <div className="text-xs text-slate-500">{formatDate(order.createdAt)}</div>
        </div>
        <span className={`text-xs font-semibold px-3 py-1 rounded ${statusColors[order.status]}`}>
          {order.status.toUpperCase()}
        </span>
      </div>

      <div className="bg-slate-700/30 rounded p-3 mb-3 border border-slate-600 text-sm">
        {order.items.map((item) => (
          <div key={item.id} className="text-slate-300">
            • {item.name} x{item.quantity}
          </div>
        ))}
      </div>

      {order.marks && order.marks.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {order.marks.map((markId) => {
            const mark = marks.find((m) => m.id === markId)
            return mark ? (
              <span
                key={markId}
                className="text-xs font-semibold px-2 py-1 rounded bg-purple-500/20 text-purple-300"
              >
                <i className={`fas fa-${mark.icon}`}></i> {mark.name}
              </span>
            ) : null
          })}
        </div>
      )}

      {order.paymentMethod && (
        <div className="text-sm text-slate-400 mb-2">
          Payment:{' '}
          {order.paymentMethod === 'cash' ? (
            <span className="text-slate-200 font-semibold">
              <i className="fas fa-money-bill"></i> Cash
            </span>
          ) : (
            <span className="text-slate-200 font-semibold">
              <i className="fas fa-qrcode"></i> QR Code
            </span>
          )}
        </div>
      )}

      <div className="flex justify-between items-center mb-3">
        <span className="text-slate-400">Total:</span>
        <span className="text-lg font-bold text-emerald-400">RM{order.total.toFixed(2)}</span>
      </div>

      <div className="flex gap-2">
        {order.status === 'pending' && (
          <>
            <button
              onClick={() => setShowPaymentModal(true)}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded text-sm font-semibold transition flex items-center justify-center gap-1"
            >
              <i className="fas fa-check-circle"></i>
              Complete
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 py-2 rounded text-sm font-semibold transition flex items-center justify-center gap-1"
            >
              <i className="fas fa-ban"></i>
              Cancel
            </button>
          </>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass-effect rounded-2xl p-6 w-full max-w-sm border border-slate-700/50 shadow-2xl">
            <h2 className="text-2xl font-bold text-emerald-400 mb-4">Choose Payment Method</h2>
            <div className="space-y-3 mb-4">
              <button
                onClick={() => handlePaymentMethod('cash')}
                className="w-full bg-slate-700/50 hover:bg-slate-600/50 border-2 border-slate-600 hover:border-emerald-500 text-slate-200 hover:text-white py-3 rounded-lg font-semibold transition flex items-center justify-center gap-3"
              >
                <i className="fas fa-money-bill" style={{ fontSize: '24px' }}></i>
                Cash
              </button>
              <button
                onClick={() => handlePaymentMethod('qr')}
                className="w-full bg-slate-700/50 hover:bg-slate-600/50 border-2 border-slate-600 hover:border-emerald-500 text-slate-200 hover:text-white py-3 rounded-lg font-semibold transition flex items-center justify-center gap-3"
              >
                <i className="fas fa-qrcode" style={{ fontSize: '24px' }}></i>
                QR Code
              </button>
            </div>
            <button
              onClick={() => setShowPaymentModal(false)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg font-semibold transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
