'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import toast from 'react-hot-toast'
import ItemMarksSelector from './ItemMarksSelector'
import PaymentModal from './modals/PaymentModal'

interface CurrentOrderBuilderProps {
  onClose?: () => void
}

export default function CurrentOrderBuilder({ onClose }: CurrentOrderBuilderProps) {
  const {
    currentOrder,
    tables,
    setOrderType,
    setOrderTable,
    setDiscount,
    removeOrderItem,
    updateOrderItemQuantity,
    clearCurrentOrder,
  } = useAppStore()

  const [expandedItem, setExpandedItem] = useState<string | null>(null)
  const [showPayment, setShowPayment] = useState(false)

  const subtotal = currentOrder.items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const discountAmount =
    currentOrder.discountType === 'percent'
      ? (subtotal * currentOrder.discount) / 100
      : currentOrder.discount

  const total = Math.max(0, subtotal - discountAmount)

  const canCheckout = currentOrder.items.length > 0

  const handleClear = () => {
    if (currentOrder.items.length === 0) return
    clearCurrentOrder()
    toast.success('Order cleared')
  }

  return (
    <>
      <div className="flex flex-col h-full overflow-hidden bg-[#0f1117]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-amber-500/10 flex-shrink-0">
          <div>
            <h2 className="font-bold text-amber-400 text-base flex items-center gap-2">
              <i className="fas fa-receipt"></i>
              Current Order
            </h2>
            <p className="text-xs text-blue-400 font-bold tracking-widest mt-0.5">Bill {currentOrder.customerName}</p>
          </div>
          <div className="flex items-center gap-2">
            {currentOrder.items.length > 0 && (
              <button onClick={handleClear} className="text-xs text-red-400 hover:text-red-300 transition px-2 py-1 rounded border border-red-500/20 hover:border-red-500/40">
                <i className="fas fa-trash-alt mr-1"></i>Clear
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-none">
          <div className="p-3 space-y-3">
            {/* Order Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                <i className="fas fa-tag mr-1"></i>Order Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setOrderType('take_away')}
                  className={`py-2 rounded-lg text-xs font-semibold border transition-all ${
                    currentOrder.orderType === 'take_away'
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:border-amber-500/30'
                  }`}
                >
                  <i className="fas fa-shopping-bag mr-1.5"></i>Take Away
                </button>
                <button
                  onClick={() => setOrderType('dine_in')}
                  className={`py-2 rounded-lg text-xs font-semibold border transition-all ${
                    currentOrder.orderType === 'dine_in'
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:border-amber-500/30'
                  }`}
                >
                  <i className="fas fa-utensils mr-1.5"></i>Dine In
                </button>
              </div>
            </div>

            {/* Table Selector — only for Dine In */}
            {currentOrder.orderType === 'dine_in' && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  <i className="fas fa-chair mr-1"></i>Table
                </label>
                {tables.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No tables set up yet. Add tables in Manage.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-1.5 max-h-28 overflow-y-auto scrollbar-none">
                    <button
                      onClick={() => setOrderTable(null)}
                      className={`py-2 rounded-lg text-xs font-semibold border transition-all ${
                        !currentOrder.tableName
                          ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:border-amber-500/30'
                      }`}
                    >
                      None
                    </button>
                    {tables.map(table => (
                      <button
                        key={table.id}
                        onClick={() => setOrderTable(table.name)}
                        className={`py-2 rounded-lg text-xs font-semibold border transition-all ${
                          currentOrder.tableName === table.name
                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:border-amber-500/30'
                        }`}
                      >
                        {table.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Items */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-400">
                  <i className="fas fa-list mr-1"></i>Items ({currentOrder.items.length})
                </span>
              </div>

              {currentOrder.items.length === 0 ? (
                <div className="text-center py-6 text-slate-600">
                  <i className="fas fa-shopping-cart text-2xl mb-2 block opacity-30"></i>
                  <p className="text-xs">Tap products to add</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {currentOrder.items.map(item => (
                    <div key={item.id} className="item-card-blue p-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-100 text-sm truncate">{item.name}</p>
                          <p className="text-xs text-slate-500">RM{item.price.toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => updateOrderItemQuantity(item.id, item.quantity - 1)}
                            className="w-6 h-6 bg-white/10 hover:bg-amber-500/20 text-slate-300 rounded text-xs flex items-center justify-center transition"
                          >
                            <i className="fas fa-minus" style={{ fontSize: '9px' }}></i>
                          </button>
                          <span className="w-6 text-center font-bold text-sm text-white">{item.quantity}</span>
                          <button
                            onClick={() => updateOrderItemQuantity(item.id, item.quantity + 1)}
                            className="w-6 h-6 bg-white/10 hover:bg-amber-500/20 text-slate-300 rounded text-xs flex items-center justify-center transition"
                          >
                            <i className="fas fa-plus" style={{ fontSize: '9px' }}></i>
                          </button>
                          <button
                            onClick={() => removeOrderItem(item.id)}
                            className="w-6 h-6 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded text-xs flex items-center justify-center transition ml-1"
                          >
                            <i className="fas fa-times" style={{ fontSize: '9px' }}></i>
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-1">
                        <button
                          onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                          className="text-xs text-slate-500 hover:text-amber-400 transition"
                        >
                          <i className="fas fa-tag mr-1"></i>
                          {item.marks?.length ? `${item.marks.length} mark(s)` : 'Add marks'}
                        </button>
                        <span className="text-xs font-bold text-amber-400">
                          RM{(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>

                      {expandedItem === item.id && <ItemMarksSelector itemId={item.id} />}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Discount */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                <i className="fas fa-percent mr-1"></i>Discount
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  value={currentOrder.discount || ''}
                  onChange={e => setDiscount(parseFloat(e.target.value) || 0, currentOrder.discountType)}
                  placeholder="0"
                  className="input-base py-2 text-sm flex-1"
                />
                <div className="flex border border-amber-500/20 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setDiscount(currentOrder.discount, 'amount')}
                    className={`px-3 text-xs font-semibold transition ${
                      currentOrder.discountType === 'amount'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                  >RM</button>
                  <button
                    onClick={() => setDiscount(currentOrder.discount, 'percent')}
                    className={`px-3 text-xs font-semibold transition ${
                      currentOrder.discountType === 'percent'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                  >%</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer — Totals + Checkout */}
        <div className="border-t border-amber-500/10 p-3 space-y-2 flex-shrink-0">
          <div className="flex justify-between text-sm text-slate-400">
            <span>Subtotal</span>
            <span className="font-semibold text-slate-200">RM{subtotal.toFixed(2)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-sm text-red-400">
              <span>Discount ({currentOrder.discountType === 'percent' ? `${currentOrder.discount}%` : `RM${currentOrder.discount}`})</span>
              <span>-RM{discountAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-1 border-t border-amber-500/10">
            <span className="font-bold text-amber-400 text-base">Total</span>
            <span className="text-xl font-bold text-amber-400">RM{total.toFixed(2)}</span>
          </div>

          <button
            onClick={() => {
              if (!canCheckout) {
                toast.error('Enter customer name and add items first')
                return
              }
              setShowPayment(true)
            }}
            className={`w-full btn-primary py-3 text-sm font-bold rounded-xl ${!canCheckout ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            <i className="fas fa-credit-card mr-2"></i>
            Checkout — RM{total.toFixed(2)}
          </button>
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

