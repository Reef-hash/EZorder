import { Order } from '@/lib/store'
import { PaperSize, PAPER_CHARS } from './PrinterService'

// ─── ESC/POS byte constants ───────────────────────────────────────────────────
const ESC = 0x1b
const GS  = 0x1d
const LF  = 0x0a

const CMD = {
  INIT:         [ESC, 0x40],            // Initialize printer
  ALIGN_LEFT:   [ESC, 0x61, 0x00],
  ALIGN_CENTER: [ESC, 0x61, 0x01],
  ALIGN_RIGHT:  [ESC, 0x61, 0x02],
  BOLD_ON:      [ESC, 0x45, 0x01],
  BOLD_OFF:     [ESC, 0x45, 0x00],
  DOUBLE_SIZE:  [GS,  0x21, 0x11],      // double width + height
  NORMAL_SIZE:  [GS,  0x21, 0x00],
  FEED:         (n: number) => [ESC, 0x64, n],
  CUT:          [GS,  0x56, 0x41, 0x03], // partial cut with 3-dot feed
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function encode(text: string): number[] {
  return Array.from(new TextEncoder().encode(text))
}

function line(text: string): number[] {
  return [...encode(text), LF]
}

/** Left-pad `right` so total width == `cols`. Truncates `left` if needed. */
function twoCol(left: string, right: string, cols: number): string {
  const maxLeft = cols - right.length - 1
  const l = left.length > maxLeft ? left.slice(0, maxLeft - 1) + '.' : left
  return l + ' '.repeat(cols - l.length - right.length) + right
}

function dashes(cols: number): number[] {
  return line('-'.repeat(cols))
}

function centerText(text: string, cols: number): string {
  const pad = Math.max(0, Math.floor((cols - text.length) / 2))
  return ' '.repeat(pad) + text
}

// ─── Main generator ───────────────────────────────────────────────────────────
export function generateReceipt(order: Order, businessName: string, paperSize: PaperSize): Uint8Array {
  const cols = PAPER_CHARS[paperSize]
  const bytes: number[] = []
  const push = (...cmds: number[][]) => cmds.forEach(c => bytes.push(...c))

  const date = new Date(order.createdAt)
  const dateStr = date.toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })
  const timeStr = date.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit', hour12: true })

  const subtotal = order.items.reduce((s, i) => s + i.price * i.quantity, 0)
  const discountAmt =
    order.discountType === 'percent'
      ? (subtotal * (order.discount || 0)) / 100
      : (order.discount || 0)

  // Init
  push(CMD.INIT, CMD.FEED(0))

  // Business name — centered, bold, double size (only if fits)
  push(CMD.ALIGN_CENTER, CMD.BOLD_ON, CMD.DOUBLE_SIZE)
  const nameLines = wrapText(businessName, Math.floor(cols / 2))
  nameLines.forEach(l => push(line(l)))
  push(CMD.NORMAL_SIZE, CMD.BOLD_OFF)

  push(line(centerText('Powered by EZOrder', cols)))
  push(dashes(cols))

  // Order meta
  push(CMD.ALIGN_LEFT)
  push(line(twoCol('Date', dateStr, cols)))
  push(line(twoCol('Time', timeStr, cols)))
  push(CMD.BOLD_ON)
  push(line(twoCol('Bill', order.customerName, cols)))
  push(CMD.BOLD_OFF)
  if (order.orderType) {
    const type = order.orderType === 'dine_in' ? 'Dine In' : 'Take Away'
    const label = order.tableName ? `${type} (${order.tableName})` : type
    push(line(twoCol('Type', label, cols)))
  }
  push(dashes(cols))

  // Items
  order.items.forEach(item => {
    const label = `${item.name} x${item.quantity}`
    const price = `RM${(item.price * item.quantity).toFixed(2)}`
    push(line(twoCol(label, price, cols)))
  })
  push(dashes(cols))

  // Discount + total
  if (discountAmt > 0) {
    push(line(twoCol('Subtotal', `RM${subtotal.toFixed(2)}`, cols)))
    const discLabel = order.discountType === 'percent'
      ? `Discount (${order.discount}%)`
      : 'Discount'
    push(line(twoCol(discLabel, `-RM${discountAmt.toFixed(2)}`, cols)))
    push(dashes(cols))
  }
  push(CMD.BOLD_ON, CMD.DOUBLE_SIZE)
  push(line(twoCol('TOTAL', `RM${order.total.toFixed(2)}`, Math.floor(cols / 2))))
  push(CMD.NORMAL_SIZE, CMD.BOLD_OFF)
  push(dashes(cols))

  // Payment
  push(line(twoCol('Payment', order.paymentMethod === 'cash' ? 'Cash' : 'QR / Online', cols)))
  if (order.paymentMethod === 'cash' && order.amountPaid != null) {
    push(line(twoCol('Paid', `RM${Number(order.amountPaid).toFixed(2)}`, cols)))
    push(CMD.BOLD_ON)
    push(line(twoCol('Change', `RM${Number(order.change ?? 0).toFixed(2)}`, cols)))
    push(CMD.BOLD_OFF)
  }
  push(dashes(cols))

  // Footer
  push(CMD.ALIGN_CENTER)
  push(line(centerText('Terima kasih, datang lagi!', cols)))
  push(line(centerText('Thank you, come again', cols)))

  // Feed + cut
  push(CMD.FEED(4), CMD.CUT)

  return new Uint8Array(bytes)
}

/** Wrap text to fit within width chars, breaking at word boundaries. */
function wrapText(text: string, width: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    if ((current + (current ? ' ' : '') + word).length <= width) {
      current += (current ? ' ' : '') + word
    } else {
      if (current) lines.push(current)
      current = word.length > width ? word.slice(0, width) : word
    }
  }
  if (current) lines.push(current)
  return lines.length ? lines : ['']
}
