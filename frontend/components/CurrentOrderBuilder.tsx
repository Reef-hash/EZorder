'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { ordersAPI, authAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import ItemMarksSelector from './ItemMarksSelector'
import PaymentModal from './modals/PaymentModal'

interface CurrentOrderBuilderProps {
  onClose?: () => void
}

export default function CurrentOrderBuilder({ onClose }: CurrentOrderBuilderProps) {
  const {
    currentOrder,
    marks,
    orders,
    setOrders,
    tables,
    user,
    setOrderType,
    setOrderTable,
    setDiscount,
    removeOrderItem,
    updateOrderItemQuantity,
    splitOrderItem,
    clearCurrentOrder,
  } = useAppStore()

  const isRetail = user?.businessType === 'retail'

  const [expandedItem, setExpandedItem] = useState<string | null>(null)
  const [showPayment, setShowPayment] = useState(false)
  const [servingLoading, setServingLoading] = useState(false)

  const subtotal = currentOrder.items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const discountAmount =
    currentOrder.discountType === 'percent'
      ? (subtotal * currentOrder.discount) / 100
      : currentOrder.discount

  const total = Math.max(0, subtotal - discountAmount)

  const canCheckout = currentOrder.items.length > 0

  const handleServe = async () => {
    setServingLoading(true)
    try {
      const { data } = await ordersAPI.create({
        customerName: currentOrder.customerName,
        items: currentOrder.items,
        total,
        marks: currentOrder.marks || [],
        paymentMethod: null,
        status: 'pending',
        orderType: currentOrder.orderType,
        tableName: currentOrder.tableName,
        discount: currentOrder.discount,
        discountType: currentOrder.discountType,
        amountPaid: null,
        change: null,
      })
      setOrders([data, ...orders])
      clearCurrentOrder()
      authAPI.nextBill().then(r => clearCurrentOrder(r.data.counter)).catch(() => {})
      toast.success(`Bill ${data.customerName} dihantar ke kitchen!`)
      onClose?.()
    } catch {
      toast.error('Gagal hantar order')
    } finally {
      setServingLoading(false)
    }
  }

  const handleClear = () => {
    if (currentOrder.items.length === 0) return
    clearCurrentOrder()
    authAPI.nextBill().then(r => clearCurrentOrder(r.data.counter)).catch(() => {})
    toast.success('Order dibersihkan')
  }

  return (
    <>
      <div className="flex flex-col h-full overflow-hidden bg-white">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="font-bold text-gray-800 text-sm flex items-center gap-2">
              <i className="fas fa-receipt text-orange-500"></i>
              Current Order
            </h2>
            <p className="text-xs text-orange-500 font-bold tracking-wider mt-0.5">Order #{currentOrder.customerName}</p>
          </div>
          <div className="flex items-center gap-2">
            {currentOrder.items.length > 0 && (
              <button onClick={handleClear} className="text-xs text-red-400 hover:text-red-500 transition px-2.5 py-1 rounded-lg border border-red-100 hover:border-red-200 hover:bg-red-50">
                <i className="fas fa-trash-alt mr-1"></i>Clear
              </button>
            )}
          </div>
        </div>

        {/* Dining + Table selectors */}
        {!isRetail && (
          <div className="px-3 pt-3 pb-2 border-b border-gray-100 flex-shrink-0">
            <div className="flex gap-2 mb-2">
              {/* Dining type dropdown */}
              <select
                value={currentOrder.orderType}
                onChange={e => setOrderType(e.target.value as 'dine_in' | 'take_away')}
                className="flex-1 px-3 py-2 text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400"
              >
                <option value="take_away">Take Away</option>
                <option value="dine_in">Dine In</option>
              </select>

              {/* Table selector â€” only Dine In */}
              {currentOrder.orderType === 'dine_in' && (
                <select
                  value={currentOrder.tableName || ''}
                  onChange={e => setOrderTable(e.target.value || null)}
                  className="flex-1 px-3 py-2 text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400"
                >
                  <option value="">Select Table</option>
                  {tables.map(t => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        )}

        {/* Items list */}
        <div className="flex-1 overflow-y-auto scrollbar-none">
          <div className="p-3 space-y-2">
            {currentOrder.items.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <i className="fas fa-utensils text-3xl mb-3 block opacity-20"></i>
                <p className="text-sm font-medium">Ketik produk untuk tambah</p>
                <p className="text-xs text-gray-300 mt-1">Order anda akan muncul di sini</p>
              </div>
            ) : (
              currentOrder.items.map(item => (
                <div key={item.lineId} className="item-card-blue p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm truncate">{item.name}</p>
                      <p className="text-xs text-gray-400">RM{item.price.toFixed(2)} / unit</p>
                      {item.marks?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.marks.map(markId => {
                            const mark = marks.find(m => m.id === markId)
                            return mark ? (
                              <span key={markId} className="text-[9px] px-1.5 py-0.5 rounded-full bg-orange-50 border border-orange-100 text-orange-500 font-semibold">
                                {mark.name}
                              </span>
                            ) : null
                          })}
                        </div>
                      )}
                    </div>
                    {/* Qty controls */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {item.quantity > 1 && (
                        <button
                          onClick={() => splitOrderItem(item.lineId)}
                          title="Split"
                          className="w-6 h-6 bg-gray-100 hover:bg-orange-50 text-gray-400 hover:text-orange-500 rounded text-xs flex items-center justify-center transition mr-0.5"
                        >
                          <i className="fas fa-cut" style={{ fontSize: '9px' }}></i>
                        </button>
                      )}
                      <button
                        onClick={() => updateOrderItemQuantity(item.lineId, item.quantity - 1)}
                        className="w-7 h-7 bg-gray-100 hover:bg-orange-500 hover:text-white text-gray-600 rounded-lg text-xs flex items-center justify-center transition font-bold"
                      >
                        <i className="fas fa-minus" style={{ fontSize: '9px' }}></i>
                      </button>
                      <span className="w-7 text-center font-bold text-sm text-gray-800">{item.quantity}</span>
                      <button
                        onClick={() => updateOrderItemQuantity(item.lineId, item.quantity + 1)}
                        className="w-7 h-7 bg-gray-100 hover:bg-orange-500 hover:text-white text-gray-600 rounded-lg text-xs flex items-center justify-center transition font-bold"
                      >
                        <i className="fas fa-plus" style={{ fontSize: '9px' }}></i>
                      </button>
                      <button
                        onClick={() => removeOrderItem(item.lineId)}
                        className="w-7 h-7 bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-500 rounded-lg text-xs flex items-center justify-center transition ml-1"
                      >
                        <i className="fas fa-times" style={{ fontSize: '9px' }}></i>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <button
                      onClick={() => setExpandedItem(expandedItem === item.lineId ? null : item.lineId)}
                      className="text-[11px] text-gray-400 hover:text-orange-500 transition"
                    >
                      <i className="fas fa-tag mr-1"></i>
                      {item.marks?.length ? 'Edit marks' : 'Add Notes'}
                    </button>
                    <span className="text-xs font-bold text-orange-600">
                      RM{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>

                  {expandedItem === item.lineId && <ItemMarksSelector lineId={item.lineId} />}
                </div>
              ))
            )}
          </div>

          {/* Discount */}
          {currentOrder.items.length > 0 && (
            <div className="px-3 pb-3">
              <div className="flex gap-2 items-center">
                <div className="relative flex-1">
                  <i className="fas fa-percent absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
                  <input
                    type="number"
                    min="0"
                    value={currentOrder.discount || ''}
                    onChange={e => setDiscount(parseFloat(e.target.value) || 0, currentOrder.discountType)}
                    placeholder="Diskaun"
                    className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:border-orange-400"
                  />
                </div>
                <div className="flex rounded-lg overflow-hidden border border-gray-200">
                  <button
                    onClick={() => setDiscount(currentOrder.discount, 'amount')}
                    className={`px-3 py-2 text-xs font-bold transition ${
                      currentOrder.discountType === 'amount'
                        ? 'bg-orange-500 text-white'
                        : 'bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >RM</button>
                  <button
                    onClick={() => setDiscount(currentOrder.discount, 'percent')}
                    className={`px-3 py-2 text-xs font-bold transition ${
                      currentOrder.discountType === 'percent'
                        ? 'bg-orange-500 text-white'
                        : 'bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >%</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer â€” Totals + Checkout Buttons */}
        <div className="border-t border-gray-100 p-3 space-y-2 flex-shrink-0 bg-white">
          {/* Summary */}
          <div className="bg-gray-50 rounded-xl p-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Sub Total</span>
              <span className="font-semibold text-gray-700">RM{subtotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-red-500">
                <span>Product Discount</span>
                <span>- RM{discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-1.5 border-t border-gray-200">
              <span className="font-bold text-gray-800 text-sm">Total</span>
              <span className="text-lg font-bold text-orange-500">RM{total.toFixed(2)}</span>
            </div>
          </div>

          {/* Action buttons â€” matching reference: KOT & Print | Bill & Payment | Bill & Print */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleServe}
              disabled={!canCheckout || servingLoading}
              className={`py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                canCheckout
                  ? 'bg-gray-800 hover:bg-gray-700 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {servingLoading
                ? <i className="fas fa-spinner fa-spin"></i>
                : <i className="fas fa-print"></i>
              }
              KOT & Print
            </button>
            <button
              onClick={() => {
                if (!canCheckout) { toast.error('Tambah item dahulu'); return }
                setShowPayment(true)
              }}
              disabled={!canCheckout}
              className={`py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                canCheckout
                  ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-sm shadow-orange-200'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <i className="fas fa-credit-card"></i>
              Bill & Payment
            </button>
          </div>
        </div>
      </div>

      {showPayment && (
        <PaymentModal
          subtotal={subtotal}
          discountAmount={discountAmount}
          total={total}
          onClose={() => setShowPayment(false)}
          onSuccess={() => {
            setShowPayment(false)
            onClose?.()
          }}
        />
      )}
    </>
  )
}

