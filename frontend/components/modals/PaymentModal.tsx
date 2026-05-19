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

const NUMPAD_KEYS = ['1','2','3','4','5','6','7','8','9','.','0','âŒ«']

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
    if (key === 'âŒ«') {
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
              {currentOrder.tableName && ` Â· ${currentOrder.tableName}`}
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
                  key === 'âŒ«'
                    ? 'bg-red-50 text-red-400 hover:bg-red-100'
                    : 'bg-gray-100 text-gray-700 hover:bg-orange-50 hover:text-orange-600'
                }`}
              >
                {key === 'âŒ«' ? <i className="fas fa-backspace text-sm"></i> : key}
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

