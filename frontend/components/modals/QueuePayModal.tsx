'use client'

import { useState, useEffect } from 'react'
import { ordersAPI } from '@/lib/api'
import { useAppStore, Order } from '@/lib/store'
import toast from 'react-hot-toast'
import ReceiptModal from './ReceiptModal'
import { generateReceipt } from '@/lib/printer/escpos'
import { getPrinterService } from '@/lib/printer/PrinterServiceFactory'

interface Props {
  order: Order
  onClose: () => void
  onSuccess: () => void
}

export default function QueuePayModal({ order, onClose, onSuccess }: Props) {
  const { orders, setOrders, printerConfig, user } = useAppStore()
  const [method, setMethod] = useState<'cash' | 'qr'>('cash')
  const [amountPaid, setAmountPaid] = useState('')
  const [loading, setLoading] = useState(false)
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null)
  const [autoPrinted, setAutoPrinted] = useState(false)

  // Auto-print when order completes and autoPrint is on
  useEffect(() => {
    if (!completedOrder || autoPrinted) return
    if (!printerConfig.enabled || !printerConfig.autoPrint || !printerConfig.printerAddress) return
    setAutoPrinted(true)
    const run = async () => {
      try {
        const service = getPrinterService(printerConfig.connectionType)
        if (!service.isConnected()) await service.connect(printerConfig.printerAddress)
        const data = generateReceipt(completedOrder, user?.businessName || 'My Business', printerConfig.paperSize)
        await service.print(data)
        toast.success('Receipt printed!')
        onSuccess()
      } catch (err: any) {
        toast.error(err.message || 'Auto-print failed')
      }
    }
    run()
  }, [completedOrder, autoPrinted, printerConfig, user, onSuccess])

  const paid = parseFloat(amountPaid) || 0
  const change = method === 'cash' ? Math.max(0, paid - order.total) : 0
  const cashInsufficient = method === 'cash' && amountPaid !== '' && paid < order.total

  const quickAmounts = [10, 20, 50, 100].filter(a => a >= order.total)

  const handleConfirm = async () => {
    if (method === 'cash' && paid < order.total) {
      toast.error('Amount paid is less than total')
      return
    }
    setLoading(true)
    try {
      const { data: updated } = await ordersAPI.update(order.id, {
        status: 'completed',
        paymentMethod: method,
        amountPaid: method === 'cash' ? paid : null,
        change: method === 'cash' ? change : null,
      })
      setOrders(orders.map(o => o.id === order.id ? updated : o))
      toast.success(`Bill ${order.customerName} — paid!`)
      setCompletedOrder(updated)
    } catch {
      toast.error('Failed to update order')
    } finally {
      setLoading(false)
    }
  }

  if (completedOrder) {
    return <ReceiptModal order={completedOrder} onClose={onSuccess} />
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end md:items-center justify-center z-50 p-4">
      <div className="glass-effect w-full max-w-sm rounded-2xl border border-blue-500/25 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-blue-500/15">
          <div>
            <h2 className="font-bold text-blue-400 text-lg">
              <i className="fas fa-credit-card mr-2"></i>Payment
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Bill {order.customerName}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <i className="fas fa-times text-lg"></i>
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Order summary */}
          <div className="bg-white/5 rounded-xl p-3 space-y-1.5 text-sm max-h-32 overflow-y-auto scrollbar-none">
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between text-slate-300">
                <span className="truncate flex-1">{item.name} ×{item.quantity}</span>
                <span className="ml-2 flex-shrink-0 text-slate-400">RM{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            {(order.discount ?? 0) > 0 && (
              <div className="flex justify-between text-red-400 pt-1 border-t border-white/10">
                <span>Discount</span>
                <span>-{order.discountType === 'percent' ? `${order.discount}%` : `RM${order.discount}`}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-blue-400 pt-1 border-t border-white/10 text-base">
              <span>Total</span>
              <span>RM{order.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment method */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setMethod('cash')}
              className={`py-3 rounded-xl text-sm font-semibold border transition-all flex items-center justify-center gap-2 ${
                method === 'cash'
                  ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:border-blue-500/30'
              }`}
            >
              <i className="fas fa-money-bill-wave"></i> Cash
            </button>
            <button
              onClick={() => setMethod('qr')}
              className={`py-3 rounded-xl text-sm font-semibold border transition-all flex items-center justify-center gap-2 ${
                method === 'qr'
                  ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:border-blue-500/30'
              }`}
            >
              <i className="fas fa-qrcode"></i> QR / Online
            </button>
          </div>

          {/* Cash: amount + change */}
          {method === 'cash' && (
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Amount Paid (RM)</label>
                <input
                  type="number"
                  min="0"
                  step="0.50"
                  value={amountPaid}
                  onChange={e => setAmountPaid(e.target.value)}
                  placeholder={order.total.toFixed(2)}
                  className={`input-base py-2.5 text-sm ${cashInsufficient ? 'border-red-500/50' : ''}`}
                  autoFocus
                />
                {cashInsufficient && (
                  <p className="text-xs text-red-400 mt-1">
                    Short by RM{(order.total - paid).toFixed(2)}
                  </p>
                )}
              </div>
              {paid >= order.total && amountPaid !== '' && (
                <div className="flex justify-between items-center bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2.5">
                  <span className="text-sm font-semibold text-emerald-400">Change</span>
                  <span className="text-lg font-bold text-emerald-400">RM{change.toFixed(2)}</span>
                </div>
              )}
              {quickAmounts.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {quickAmounts.slice(0, 4).map(amt => (
                    <button
                      key={amt}
                      onClick={() => setAmountPaid(String(amt))}
                      className="flex-1 min-w-[56px] py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-semibold text-slate-300 transition"
                    >
                      RM{amt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleConfirm}
            disabled={loading || (method === 'cash' && amountPaid !== '' && paid < order.total)}
            className="w-full btn-primary py-3 text-sm font-bold rounded-xl"
          >
            {loading
              ? <i className="fas fa-spinner fa-spin mr-2"></i>
              : <i className="fas fa-check mr-2"></i>
            }
            {method === 'qr' ? 'Confirm Payment' : `Paid — RM${order.total.toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  )
}
