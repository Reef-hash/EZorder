'use client'

import { useState, useEffect } from 'react'
import { useAppStore, Order } from '@/lib/store'
import { ordersAPI, authAPI } from '@/lib/api'
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

const NUMPAD_KEYS = ['1','2','3','4','5','6','7','8','9','.','0','⌫']

export default function PaymentModal({ subtotal, discountAmount, total, onClose, onSuccess }: PaymentModalProps) {
  const { currentOrder, clearCurrentOrder, printerConfig, user } = useAppStore()
  const [method, setMethod] = useState<'cash' | 'qr'>('cash')
  const [amountPaid, setAmountPaid] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null)
  const [autoPrinted, setAutoPrinted] = useState(false)

  // Auto-print when order completes
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
        toast.success('Resit dicetak!')
        onSuccess()
      } catch (err: any) {
        toast.error(err.message || 'Auto-print gagal')
      }
    }
    run()
  }, [completedOrder, autoPrinted, printerConfig, user, onSuccess])

  const paid = parseFloat(amountPaid) || 0
  const change = method === 'cash' ? Math.max(0, paid - total) : 0
  const cashInsufficient = method === 'cash' && amountPaid !== '' && paid < total

  // Numpad input handler
  const handleNumpad = (key: string) => {
    if (key === '⌫') {
      setAmountPaid(prev => prev.slice(0, -1))
      return
    }
    if (key === '.' && amountPaid.includes('.')) return
    // Max 2 decimal places
    if (amountPaid.includes('.')) {
      const decimals = amountPaid.split('.')[1]
      if (decimals && decimals.length >= 2) return
    }
    setAmountPaid(prev => prev + key)
  }

  const handleConfirm = async () => {
    if (method === 'cash' && paid < total) {
      toast.error('Jumlah bayaran tidak cukup')
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
      authAPI.nextBill().then(r => clearCurrentOrder(r.data.counter)).catch(() => {})
      toast.success('Order selesai!')
      setCompletedOrder(data)
    } catch {
      toast.error('Gagal simpan order')
    } finally {
      setLoading(false)
    }
  }

  if (completedOrder) {
    return <ReceiptModal order={completedOrder} onClose={onSuccess} />
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 sm:p-4">
      <div className="bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden max-h-[95dvh] overflow-y-auto">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-900 text-base">Collect Payment</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Order #{currentOrder.customerName}
              {currentOrder.tableName && ` · ${currentOrder.tableName}`}
            </p>
          </div>
          <div className="text-right">
            <p className="text-orange-500 font-bold text-xl">RM{total.toFixed(2)}</p>
          </div>
        </div>

        {/* Payment type tabs */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setMethod('cash')}
            className={`flex-1 py-3 text-sm font-semibold transition-all ${
              method === 'cash'
                ? 'bg-orange-500 text-white'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            Full Payment
          </button>
          <button
            onClick={() => setMethod('qr')}
            className={`flex-1 py-3 text-sm font-semibold transition-all ${
              method === 'qr'
                ? 'bg-gray-800 text-white'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            QR / Online
          </button>
        </div>

        {/* Payment methods icons */}
        <div className="flex justify-around px-4 py-3 border-b border-gray-100">
          {[
            { id: 'cash', icon: 'fa-money-bill-wave', label: 'Cash' },
            { id: 'qr', icon: 'fa-qrcode', label: 'QR' },
          ].map(m => (
            <button
              key={m.id}
              onClick={() => setMethod(m.id as 'cash' | 'qr')}
              className={`flex flex-col items-center gap-1.5 px-6 py-2 rounded-xl transition-all ${
                method === m.id
                  ? 'bg-orange-50 text-orange-500'
                  : 'text-gray-400 hover:bg-gray-50'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${method === m.id ? 'bg-orange-100' : 'bg-gray-100'}`}>
                <i className={`fas ${m.icon} text-base`}></i>
              </div>
              <span className="text-[10px] font-semibold">{m.label}</span>
            </button>
          ))}
        </div>

        <div className="px-4 pt-3">
          {/* Amount display */}
          <div className="bg-gray-50 rounded-xl p-3 mb-3 text-center">
            <p className="text-3xl font-bold text-gray-900 tracking-widest min-h-[2.5rem]">
              {amountPaid || '0'}
            </p>
          </div>

          {/* Summary */}
          <div className="space-y-1 text-sm mb-3">
            <div className="flex justify-between text-gray-500">
              <span>Total Bill</span>
              <span className="font-semibold text-gray-700">RM{total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Amount Paid</span>
              <span className="font-semibold text-gray-700">RM{paid > 0 ? paid.toFixed(2) : '0.00'}</span>
            </div>
            {method === 'cash' && paid >= total && amountPaid !== '' ? (
              <div className="flex justify-between font-bold text-green-600">
                <span>Change</span>
                <span>RM{change.toFixed(2)}</span>
              </div>
            ) : (
              <div className={`flex justify-between font-bold ${cashInsufficient ? 'text-red-500' : 'text-orange-500'}`}>
                <span>Due Amount</span>
                <span>RM{cashInsufficient ? (total - paid).toFixed(2) : total.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Quick amounts */}
          <div className="grid grid-cols-4 gap-1.5 mb-2">
            {[Math.ceil(total / 5) * 5, Math.ceil(total / 10) * 10, Math.ceil(total / 50) * 50, Math.ceil(total / 100) * 100]
              .filter((v, i, arr) => arr.indexOf(v) === i && v >= total)
              .slice(0, 4)
              .map(v => (
                <button
                  key={v}
                  onClick={() => setAmountPaid(v.toFixed(2))}
                  className="py-1.5 rounded-lg bg-orange-50 border border-orange-100 text-xs font-bold text-orange-600 hover:bg-orange-100 transition"
                >
                  RM{v}
                </button>
              ))}
          </div>

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-1.5 mb-3">
            {NUMPAD_KEYS.map(key => (
              <button
                key={key}
                onClick={() => handleNumpad(key)}
                className={`py-3 rounded-xl text-base font-semibold transition-all active:scale-95 ${
                  key === '⌫'
                    ? 'bg-red-50 text-red-400 hover:bg-red-100'
                    : 'bg-gray-100 text-gray-700 hover:bg-orange-50 hover:text-orange-600'
                }`}
              >
                {key === '⌫' ? <i className="fas fa-backspace text-sm"></i> : key}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom buttons */}
        <div className="flex gap-2 px-4 pb-4">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || (method === 'cash' && cashInsufficient)}
            className="flex-[2] py-3 rounded-xl text-sm font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-sm shadow-orange-200 disabled:opacity-40 transition"
          >
            {loading ? (
              <><i className="fas fa-spinner fa-spin mr-2"></i>Memproses...</>
            ) : (
              <>Complete Payment</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
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
      // Sync next bill number from DB (non-blocking)
      authAPI.nextBill().then(r => clearCurrentOrder(r.data.counter)).catch(() => {})
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

