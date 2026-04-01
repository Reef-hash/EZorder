'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { generateWhatsAppMessage, copyToClipboard } from '@/lib/utils'
import toast from 'react-hot-toast'
import ItemMarksSelector from './ItemMarksSelector'

interface CurrentOrderBuilderProps {
  onConfirmOrder: () => void
}

export default function CurrentOrderBuilder({
  onConfirmOrder,
}: CurrentOrderBuilderProps) {
  const {
    currentOrder,
    setOrderCustomerName,
    removeOrderItem,
    updateOrderItemQuantity,
    clearCurrentOrder,
  } = useAppStore()
  const [expandedItem, setExpandedItem] = useState<string | null>(null)

  const total = currentOrder.items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0)
  const isComplete = currentOrder.customerName.trim() && currentOrder.items.length > 0

  const handleCopyMessage = async () => {
    const message = generateWhatsAppMessage(
      currentOrder.customerName,
      currentOrder.items,
      total
    )
    if (await copyToClipboard(message)) {
      toast.success('Message copied!')
    } else {
      toast.error('Failed to copy')
    }
  }

  return (
    <div className="glass-effect rounded-2xl p-6 sticky top-[130px]">
      <h2 className="text-xl font-bold gradient-text mb-4">Order Builder</h2>

      {/* Customer Name */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-300 mb-2">Customer Name</label>
        <input
          type="text"
          value={currentOrder.customerName}
          onChange={(e) => setOrderCustomerName(e.target.value)}
          placeholder="e.g. Ahmed"
          className="input-base"
        />
      </div>

      {/* Items List */}
      <div className="mb-4">
        <h3 className="font-semibold text-gray-300 mb-2">Items ({currentOrder.items.length})</h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {currentOrder.items.length === 0 ? (
            <p className="text-gray-500 text-sm">No items added yet</p>
          ) : (
            currentOrder.items.map((item: any) => (
              <div
                key={item.id}
                className="neon-card p-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-100">{item.name}</p>
                    <p className="text-xs text-gray-400">RM{item.price.toFixed(2)} each</p>
                    {item.marks && item.marks.length > 0 && (
                      <p className="text-xs mt-1 text-cyan-400">
                        Marks: {item.marks.length}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      type="button"
                      onClick={() => updateOrderItemQuantity(item.id, item.quantity - 1)}
                      className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded text-xs transition"
                    >
                      <i className="fas fa-minus"></i>
                    </button>
                    <span className="w-5 text-center font-semibold text-gray-100 text-xs">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateOrderItemQuantity(item.id, item.quantity + 1)}
                      className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded text-xs transition"
                    >
                      <i className="fas fa-plus"></i>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeOrderItem(item.id)}
                      className="bg-red-900/30 hover:bg-red-900/50 text-red-400 px-2 py-1 rounded ml-1 transition"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                </div>

                {/* Per-item marks selector */}
                <button
                  type="button"
                  onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                  className="w-full mt-2 text-left text-xs font-semibold text-cyan-400 hover:text-cyan-300"
                >
                  <i className="fas fa-flag mr-1"></i>
                  {item.marks && item.marks.length > 0 ? `Edit marks (${item.marks.length})` : 'Add marks'}
                </button>

                {expandedItem === item.id && (
                  <ItemMarksSelector itemId={item.id} />
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Totals */}
      <div className="neon-card p-3 mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-300">Subtotal:</span>
          <span className="text-gray-100 font-semibold">RM {total.toFixed(2)}</span>
        </div>
        <div className="border-t border-gray-600 pt-2 flex justify-between">
          <span className="font-bold text-cyan-400">Total:</span>
          <span className="text-lg font-bold text-cyan-400">RM {total.toFixed(2)}</span>
        </div>
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <button
          type="button"
          onClick={clearCurrentOrder}
          className="btn-secondary py-2"
        >
          <i className="fas fa-trash-alt"></i> Clear
        </button>
        <button
          type="button"
          onClick={onConfirmOrder}
          disabled={!isComplete}
          className="btn-primary py-2 disabled:opacity-50"
        >
          <i className="fas fa-check"></i> Confirm
        </button>
      </div>

      <button
        type="button"
        onClick={handleCopyMessage}
        disabled={!isComplete}
        className="w-full btn-secondary py-2 disabled:opacity-50"
      >
        <i className="fas fa-copy"></i> Copy Message
      </button>
    </div>
  )
}
