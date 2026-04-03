'use client'

import { useState, useEffect } from 'react'
import { useAppStore, Order } from '@/lib/store'
import { ordersAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import ReceiptModal from './ReceiptModal'
import { generateReceipt } from '@/lib/printer/escpos'
import { getPrinterService } from '@/lib/printer/PrinterServiceFactory'

interface PaymentModalProps {
  subtotal: number
  discountAmount: number
  total: number
  onClose: () => void
  onSuccess: () => void
}

export default function PaymentModal({ subtotal, discountAmount, total, onClose, onSuccess }: PaymentModalProps) {
  const { currentOrder, clearCurrentOrder, printerConfig, user } = useAppStore()
  const [method, setMethod] = useState<'cash' | 'qr'>('cash')
  const [amountPaid, setAmountPaid] = useState<string>('')
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
        // Fall through to show ReceiptModal normally
      }
    }
    run()
  }, [completedOrder, autoPrinted, printerConfig, user, onSuccess])

  const paid = parseFloat(amountPaid) || 0
  const change = method === 'cash' ? Math.max(0, paid - total) : 0
  const cashInsufficient = method === 'cash' && amountPaid !== '' && paid < total

  const handleConfirm = async () => {
    if (method === 'cash' && paid < total) {
      toast.error('Amount paid is less than total')
      return
    }

    setLoading(true)
    try {
      const { data } = await ordersAPI.create({
        customerName: currentOrder.customerName,
        items: currentOrder.items,
        total,
        marks: currentOrder.marks || [],
        paymentMethod: method,
        status: 'completed',
        orderType: currentOrder.orderType,
        tableName: currentOrder.tableName,
        discount: currentOrder.discount,
        discountType: currentOrder.discountType,
        amountPaid: method === 'cash' ? paid : null,
        change: method === 'cash' ? change : null,
      })

      clearCurrentOrder()
      toast.success('Order completed!')
      setCompletedOrder(data)
    } catch {
      toast.error('Failed to save order')
    } finally {
      setLoading(false)
    }
  }

  if (completedOrder) {
    return <ReceiptModal order={completedOrder} onClose={onSuccess} />
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end md:items-center justify-center z-50 p-4">
      <div className="glass-effect w-full max-w-sm rounded-2xl border border-amber-500/20 shadow-2xl shadow-amber-500/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-amber-500/15">
          <h2 className="font-bold text-amber-400 text-lg">
            <i className="fas fa-credit-card mr-2"></i>Payment
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <i className="fas fa-times text-lg"></i>
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Order summary */}
          <div className="bg-white/5 rounded-xl p-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal</span>
              <span>RM{subtotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-red-400">
                <span>Discount</span>
                <span>-RM{discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-amber-400 pt-1 border-t border-white/10 text-base">
              <span>Total</span>
              <span>RM{total.toFixed(2)}</span>
            </div>
          </div>

          {/* Order info */}
          <div className="text-xs text-slate-500 flex flex-wrap gap-3">
            <span><i className="fas fa-user mr-1"></i>{currentOrder.customerName}</span>
            <span>
              <i className={`fas ${currentOrder.orderType === 'dine_in' ? 'fa-utensils' : 'fa-shopping-bag'} mr-1`}></i>
              {currentOrder.orderType === 'dine_in' ? 'Dine In' : 'Take Away'}
              {currentOrder.tableName && ` — ${currentOrder.tableName}`}
            </span>
          </div>

          {/* Payment method */}
          <div>
            <p className="text-xs font-semibold text-slate-400 mb-2">Payment Method</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMethod('cash')}
                className={`py-3 rounded-xl text-sm font-semibold border transition-all flex items-center justify-center gap-2 ${
                  method === 'cash'
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:border-amber-500/30'
                }`}
              >
                <i className="fas fa-money-bill-wave"></i> Cash
              </button>
              <button
                onClick={() => setMethod('qr')}
                className={`py-3 rounded-xl text-sm font-semibold border transition-all flex items-center justify-center gap-2 ${
                  method === 'qr'
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:border-amber-500/30'
                }`}
              >
                <i className="fas fa-qrcode"></i> QR / Online
              </button>
            </div>
          </div>

          {/* Cash: amount paid + change */}
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
                  placeholder={total.toFixed(2)}
                  className={`input-base py-2.5 text-sm ${cashInsufficient ? 'border-red-500/50' : ''}`}
                  autoFocus
                />
                {cashInsufficient && (
                  <p className="text-xs text-red-400 mt-1">
                    Amount is short by RM{(total - paid).toFixed(2)}
                  </p>
                )}
              </div>
              {paid >= total && amountPaid !== '' && (
                <div className="flex justify-between items-center bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2.5">
                  <span className="text-sm font-semibold text-emerald-400">Change</span>
                  <span className="text-lg font-bold text-emerald-400">RM{change.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          {/* Quick amount buttons for cash */}
          {method === 'cash' && (
            <div className="flex gap-2 flex-wrap">
              {[Math.ceil(total), Math.ceil(total / 5) * 5, Math.ceil(total / 10) * 10, Math.ceil(total / 50) * 50]
                .filter((v, i, arr) => arr.indexOf(v) === i && v >= total)
                .slice(0, 4)
                .map(v => (
                  <button
                    key={v}
                    onClick={() => setAmountPaid(v.toFixed(2))}
                    className="flex-1 min-w-0 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold text-slate-300 hover:border-amber-500/30 hover:text-amber-400 transition"
                  >
                    RM{v}
                  </button>
                ))}
            </div>
          )}
        </div>

        {/* Confirm button */}
        <div className="px-5 pb-5">
          <button
            onClick={handleConfirm}
            disabled={loading || cashInsufficient}
            className="w-full btn-primary py-3.5 text-sm font-bold disabled:opacity-40"
          >
            {loading ? (
              <><i className="fas fa-spinner fa-spin mr-2"></i>Processing...</>
            ) : (
              <><i className="fas fa-check-circle mr-2"></i>Confirm Payment — RM{total.toFixed(2)}</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

