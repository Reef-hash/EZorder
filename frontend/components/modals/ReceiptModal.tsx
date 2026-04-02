'use client'

import { useAppStore, Order } from '@/lib/store'

interface Props {
  order: Order
  onClose: () => void
}

export default function ReceiptModal({ order, onClose }: Props) {
  const { user } = useAppStore()

  const date = new Date(order.createdAt)
  const dateStr = date.toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })
  const timeStr = date.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit', hour12: true })

  const subtotal = order.items.reduce((s, i) => s + i.price * i.quantity, 0)
  const discountAmt =
    order.discountType === 'percent'
      ? (subtotal * (order.discount || 0)) / 100
      : (order.discount || 0)

  const Divider = () => (
    <div className="border-t border-dashed border-black/25 my-1.5" />
  )

  const receiptContent = (
    <>
      {/* Business */}
      <div className="text-center mb-2">
        <p className="font-bold text-[13px] uppercase tracking-wide">{user?.businessName || 'My Business'}</p>
        <p className="text-[9px] text-black/40 mt-0.5">Powered by EZOrder</p>
      </div>

      <Divider />

      {/* Order info */}
      <div className="space-y-0.5 text-[10px]">
        <div className="flex justify-between"><span>Date</span><span>{dateStr}</span></div>
        <div className="flex justify-between"><span>Time</span><span>{timeStr}</span></div>
        <div className="flex justify-between"><span>Bill</span><span className="font-bold">{order.customerName}</span></div>
        {order.orderType && (
          <div className="flex justify-between">
            <span>Type</span>
            <span>
              {order.orderType === 'dine_in' ? 'Dine In' : 'Take Away'}
              {order.tableName ? ` (${order.tableName})` : ''}
            </span>
          </div>
        )}
      </div>

      <Divider />

      {/* Items */}
      <div className="space-y-1 text-[10px]">
        {order.items.map((item, i) => (
          <div key={i} className="flex justify-between gap-1">
            <span className="flex-1 leading-tight">{item.name} ×{item.quantity}</span>
            <span className="flex-shrink-0 font-semibold">RM{(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>

      <Divider />

      {/* Totals */}
      <div className="space-y-0.5 text-[10px]">
        {discountAmt > 0 && (
          <>
            <div className="flex justify-between">
              <span>Subtotal</span><span>RM{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-black/70">
              <span>
                Discount
                {order.discountType === 'percent' ? ` (${order.discount}%)` : ''}
              </span>
              <span>-RM{discountAmt.toFixed(2)}</span>
            </div>
          </>
        )}
        <div className="flex justify-between font-bold text-[13px] pt-0.5">
          <span>TOTAL</span><span>RM{order.total.toFixed(2)}</span>
        </div>
      </div>

      <Divider />

      {/* Payment */}
      <div className="space-y-0.5 text-[10px]">
        <div className="flex justify-between">
          <span>Payment</span>
          <span>{order.paymentMethod === 'cash' ? 'Cash' : 'QR / Online'}</span>
        </div>
        {order.paymentMethod === 'cash' && order.amountPaid != null && (
          <>
            <div className="flex justify-between">
              <span>Paid</span><span>RM{Number(order.amountPaid).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Change</span><span>RM{Number(order.change ?? 0).toFixed(2)}</span>
            </div>
          </>
        )}
      </div>

      <Divider />

      <div className="text-center text-[10px] text-black/50 mt-1 pb-1">
        <p>Terima kasih, datang lagi!</p>
        <p>Thank you, come again 🙏</p>
      </div>
    </>
  )

  return (
    <>
      {/* Print-only hidden area (off-screen, outside modal DOM flow) */}
      <div
        id="receipt-print-area"
        className="hidden"
        aria-hidden="true"
      >
        {receiptContent}
      </div>

      {/* Modal */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end md:items-center justify-center z-[60] p-4">
        <div className="glass-effect w-full max-w-sm rounded-2xl border border-emerald-500/20 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-emerald-500/15">
            <h2 className="font-bold text-emerald-400 text-lg">
              <i className="fas fa-receipt mr-2"></i>Receipt Ready
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition">
              <i className="fas fa-times text-lg"></i>
            </button>
          </div>

          {/* Preview */}
          <div className="p-4">
            <div className="bg-white rounded-xl p-4 text-black font-mono max-h-64 overflow-y-auto scrollbar-none">
              {receiptContent}
            </div>
          </div>

          {/* Actions */}
          <div className="px-4 pb-4 flex gap-3">
            <button
              onClick={() => window.print()}
              className="flex-1 py-3 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-400 rounded-xl font-bold text-sm transition"
            >
              <i className="fas fa-print mr-2"></i>Print
            </button>
            <button
              onClick={onClose}
              className="py-3 px-5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 rounded-xl font-semibold text-sm transition"
            >
              Skip
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
