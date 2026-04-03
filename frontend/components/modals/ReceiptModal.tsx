'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { useAppStore, Order } from '@/lib/store'
import { generateReceipt } from '@/lib/printer/escpos'
import { getPrinterService } from '@/lib/printer/PrinterServiceFactory'

interface Props {
  order: Order
  onClose: () => void
}

export default function ReceiptModal({ order, onClose }: Props) {
  const { user, printerConfig } = useAppStore()
  const [printing, setPrinting] = useState(false)

  const date = new Date(order.createdAt)
  const dateStr = date.toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })
  const timeStr = date.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit', hour12: true })

  const subtotal = order.items.reduce((s, i) => s + i.price * i.quantity, 0)
  const discountAmt =
    order.discountType === 'percent'
      ? (subtotal * (order.discount || 0)) / 100
      : (order.discount || 0)

  /** Direct ESC/POS print via connected thermal printer */
  const handleDirectPrint = async () => {
    if (!printerConfig.enabled || !printerConfig.printerAddress) {
      // Fallback: browser print dialog
      handleBrowserPrint()
      return
    }
    setPrinting(true)
    try {
      const service = getPrinterService(printerConfig.connectionType)
      if (!service.isConnected()) {
        await service.connect(printerConfig.printerAddress)
      }
      const data = generateReceipt(order, user?.businessName || 'My Business', printerConfig.paperSize)
      await service.print(data)
      toast.success('Receipt printed!')
    } catch (err: any) {
      toast.error(err.message || 'Print failed — trying browser print…')
      handleBrowserPrint()
    } finally {
      setPrinting(false)
    }
  }

  /** Fallback: browser window.print() with 80mm/paper-size page */
  const handleBrowserPrint = () => {
    const w = window.open('', '_blank', 'width=400,height=700')
    if (!w) return

    const rows = order.items.map(item =>
      `<tr>
        <td style="padding:1px 0">${item.name} x${item.quantity}</td>
        <td style="text-align:right;padding:1px 0">RM${(item.price * item.quantity).toFixed(2)}</td>
      </tr>`
    ).join('')

    const discountRow = discountAmt > 0 ? `
      <tr><td colspan="2"><hr style="border:none;border-top:1px dashed #999;margin:4px 0"></td></tr>
      <tr><td>Subtotal</td><td style="text-align:right">RM${subtotal.toFixed(2)}</td></tr>
      <tr><td>Discount${order.discountType === 'percent' ? ` (${order.discount}%)` : ''}</td>
          <td style="text-align:right">-RM${discountAmt.toFixed(2)}</td></tr>` : ''

    const cashRows = order.paymentMethod === 'cash' && order.amountPaid != null ? `
      <tr><td>Paid</td><td style="text-align:right">RM${Number(order.amountPaid).toFixed(2)}</td></tr>
      <tr><td><b>Change</b></td><td style="text-align:right"><b>RM${Number(order.change ?? 0).toFixed(2)}</b></td></tr>` : ''

    const orderTypeRow = order.orderType ? `<tr><td>Type</td><td style="text-align:right">${order.orderType === 'dine_in' ? 'Dine In' : 'Take Away'}${order.tableName ? ` (${order.tableName})` : ''}</td></tr>` : ''

    w.document.write(`<!DOCTYPE html>
<html><head>
  <meta charset="utf-8">
  <title>Receipt</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Courier New',monospace; font-size:12px; width:${printerConfig.paperSize}; padding:5mm; color:#000; }
    table { width:100%; border-collapse:collapse; }
    hr.d { border:none; border-top:1px dashed #999; margin:5px 0; }
    .c { text-align:center; }
    .b { font-weight:bold; }
    .big { font-size:14px; }
    .sm { font-size:10px; color:#555; }
    @media print { @page { margin:0; size:${printerConfig.paperSize} auto; } body { padding:3mm; } }
  </style>
</head><body>
  <div class="c"><p class="b big">${user?.businessName || 'My Business'}</p><p class="sm">Powered by EZOrder</p></div>
  <hr class="d">
  <table>
    <tr><td>Date</td><td style="text-align:right">${dateStr}</td></tr>
    <tr><td>Time</td><td style="text-align:right">${timeStr}</td></tr>
    <tr><td>Bill</td><td style="text-align:right"><b>${order.customerName}</b></td></tr>
    ${orderTypeRow}
  </table>
  <hr class="d">
  <table>${rows}</table>
  ${discountRow}
  <hr class="d">
  <table><tr class="b big"><td>TOTAL</td><td style="text-align:right">RM${order.total.toFixed(2)}</td></tr></table>
  <hr class="d">
  <table>
    <tr><td>Payment</td><td style="text-align:right">${order.paymentMethod === 'cash' ? 'Cash' : 'QR / Online'}</td></tr>
    ${cashRows}
  </table>
  <hr class="d">
  <div class="c sm" style="margin-top:6px"><p>Terima kasih, datang lagi!</p><p>Thank you, come again</p></div>
</body></html>`)
    w.document.close()
    w.focus()
    w.print()
    w.onafterprint = () => w.close()
  }

  const Divider = () => <div className="border-t border-dashed border-black/25 my-1.5" />

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end md:items-center justify-center z-[60] p-4">
      <div className="glass-effect w-full max-w-sm rounded-2xl border border-emerald-500/20 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-emerald-500/15">
          <h2 className="font-bold text-emerald-400 text-lg">
            <i className="fas fa-receipt mr-2"></i>Receipt Ready
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <i className="fas fa-times text-lg"></i>
          </button>
        </div>

        <div className="p-4">
          <div className="bg-white rounded-xl p-4 text-black font-mono text-[10px] max-h-64 overflow-y-auto scrollbar-none space-y-0.5">
            <p className="text-center font-bold text-[13px]">{user?.businessName || 'My Business'}</p>
            <p className="text-center text-[9px] text-black/40">Powered by EZOrder</p>
            <Divider />
            <div className="flex justify-between"><span>Bill</span><span className="font-bold">{order.customerName}</span></div>
            <div className="flex justify-between"><span>Date</span><span>{dateStr} {timeStr}</span></div>
            <Divider />
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between gap-1">
                <span className="flex-1">{item.name} x{item.quantity}</span>
                <span>RM{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <Divider />
            {discountAmt > 0 && <>
              <div className="flex justify-between"><span>Subtotal</span><span>RM{subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Discount</span><span>-RM{discountAmt.toFixed(2)}</span></div>
            </>}
            <div className="flex justify-between font-bold text-[13px]"><span>TOTAL</span><span>RM{order.total.toFixed(2)}</span></div>
            <Divider />
            <div className="flex justify-between"><span>Payment</span><span>{order.paymentMethod === 'cash' ? 'Cash' : 'QR / Online'}</span></div>
            {order.paymentMethod === 'cash' && order.amountPaid != null && <>
              <div className="flex justify-between"><span>Paid</span><span>RM{Number(order.amountPaid).toFixed(2)}</span></div>
              <div className="flex justify-between font-bold"><span>Change</span><span>RM{Number(order.change ?? 0).toFixed(2)}</span></div>
            </>}
          </div>
        </div>

        <div className="px-4 pb-4 flex gap-3">
          <button
            onClick={handleDirectPrint}
            disabled={printing}
            className="flex-1 py-3 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-400 rounded-xl font-bold text-sm transition disabled:opacity-40 flex items-center justify-center gap-2"
          >
            <i className={`fas ${printing ? 'fa-spinner fa-spin' : 'fa-print'}`}></i>
            {printing ? 'Printing…' : printerConfig.enabled && printerConfig.printerAddress ? 'Print Receipt' : 'Browser Print'}
          </button>
          <button onClick={onClose} className="py-3 px-5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 rounded-xl font-semibold text-sm transition">
            Skip
          </button>
        </div>
      </div>
    </div>
  )
}
