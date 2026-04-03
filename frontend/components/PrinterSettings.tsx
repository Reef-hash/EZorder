'use client'

import { useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { useAppStore } from '@/lib/store'
import { getPrinterService, hasWebBluetooth, hasWebUSB } from '@/lib/printer/PrinterServiceFactory'
import { generateReceipt } from '@/lib/printer/escpos'
import { DiscoveredPrinter, PaperSize, ConnectionType } from '@/lib/printer/PrinterService'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PAPER_SIZES: { value: PaperSize; label: string }[] = [
  { value: '58mm',  label: '58mm' },
  { value: '76mm',  label: '76mm' },
  { value: '80mm',  label: '80mm (Standard)' },
  { value: '110mm', label: '110mm' },
]

const CONNECTION_TYPES: { value: ConnectionType; icon: string; label: string; desc: string }[] = [
  { value: 'bluetooth', icon: 'fa-bluetooth-b',  label: 'Bluetooth', desc: 'Wireless, most common' },
  { value: 'usb',       icon: 'fa-usb',          label: 'USB',       desc: 'Direct cable, reliable' },
  { value: 'network',   icon: 'fa-wifi',          label: 'WiFi / LAN', desc: 'IP-based network printing' },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function PrinterSettings() {
  const { printerConfig, setPrinterConfig, clearPrinterConfig, user } = useAppStore()
  const [scanning, setScanning] = useState(false)
  const [discovered, setDiscovered] = useState<DiscoveredPrinter[]>([])
  const [connecting, setConnecting] = useState(false)
  const [testing, setTesting] = useState(false)
  const [networkInput, setNetworkInput] = useState(printerConfig.printerAddress || '')
  const [showScanner, setShowScanner] = useState(false)

  // ── Scan ────────────────────────────────────────────────────────────────────
  const handleScan = useCallback(async () => {
    setScanning(true)
    setDiscovered([])
    setShowScanner(true)
    try {
      const service = getPrinterService(printerConfig.connectionType)
      const found = await service.discover()
      setDiscovered(found)
      if (found.length === 0) {
        toast('No printers found nearby. Make sure the printer is on and pairable.', { icon: '🔍' })
      }
    } catch (err: any) {
      toast.error(err.message || 'Scan failed')
    } finally {
      setScanning(false)
    }
  }, [printerConfig.connectionType])

  // ── Connect discovered printer ───────────────────────────────────────────────
  const handleConnect = useCallback(async (printer: DiscoveredPrinter) => {
    setConnecting(true)
    try {
      const service = getPrinterService(printerConfig.connectionType)
      await service.connect(printer.id)
      setPrinterConfig({
        enabled: true,
        printerAddress: printer.id,
        printerName: printer.name,
      })
      setShowScanner(false)
      setDiscovered([])
      toast.success(`Connected to ${printer.name}`)
    } catch (err: any) {
      toast.error(err.message || 'Connection failed')
    } finally {
      setConnecting(false)
    }
  }, [printerConfig.connectionType, setPrinterConfig])

  // ── Connect network printer by IP ────────────────────────────────────────────
  const handleNetworkConnect = useCallback(async () => {
    const addr = networkInput.trim()
    if (!addr) { toast.error('Enter printer IP address'); return }
    setConnecting(true)
    try {
      const service = getPrinterService('network')
      await service.connect(addr)
      // Extract a friendly name
      const name = `Network Printer (${addr})`
      setPrinterConfig({
        enabled: true,
        connectionType: 'network',
        printerAddress: addr,
        printerName: name,
      })
      toast.success(`Connected to ${addr}`)
    } catch (err: any) {
      toast.error(err.message || 'Cannot connect to printer')
    } finally {
      setConnecting(false)
    }
  }, [networkInput, setPrinterConfig])

  // ── Test print ───────────────────────────────────────────────────────────────
  const handleTestPrint = useCallback(async () => {
    if (!printerConfig.enabled || !printerConfig.printerAddress) {
      toast.error('No printer connected')
      return
    }
    setTesting(true)
    try {
      const service = getPrinterService(printerConfig.connectionType)
      if (!service.isConnected()) {
        await service.connect(printerConfig.printerAddress)
      }
      const testOrder = {
        id: 'TEST',
        customerName: 'TEST',
        items: [
          { lineId: '1', id: '1', name: 'Test Item', price: 10.00, quantity: 2, marks: [] },
        ],
        marks: [],
        total: 20.00,
        status: 'completed' as const,
        paymentMethod: 'cash' as const,
        orderType: 'dine_in' as const,
        tableName: 'T1',
        discount: 0,
        discountType: 'amount' as const,
        amountPaid: 20.00,
        change: 0,
        createdAt: new Date().toISOString(),
      }
      const data = generateReceipt(testOrder, user?.businessName || 'My Business', printerConfig.paperSize)
      await service.print(data)
      toast.success('Test receipt sent!')
    } catch (err: any) {
      toast.error(err.message || 'Test print failed')
    } finally {
      setTesting(false)
    }
  }, [printerConfig, user?.businessName])

  // ── Disconnect ───────────────────────────────────────────────────────────────
  const handleDisconnect = useCallback(async () => {
    try {
      const service = getPrinterService(printerConfig.connectionType)
      await service.disconnect()
    } catch { /* ignore */ }
    clearPrinterConfig()
    setNetworkInput('')
    setDiscovered([])
    setShowScanner(false)
    toast('Printer disconnected', { icon: '🔌' })
  }, [printerConfig.connectionType, clearPrinterConfig])

  // ── Check availability ───────────────────────────────────────────────────────
  const isTypeAvailable = (type: ConnectionType): boolean => {
    if (type === 'bluetooth') return hasWebBluetooth() || !!(window as any).bluetoothPrinterBridge
    if (type === 'usb')       return hasWebUSB()       || !!(window as any).usbPrinterBridge
    if (type === 'network')   return true
    return false
  }

  // ──────────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* Enable toggle */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-200">Direct Thermal Printing</p>
          <p className="text-xs text-slate-500 mt-0.5">Print receipts directly to a thermal printer</p>
        </div>
        <button
          onClick={() => setPrinterConfig({ enabled: !printerConfig.enabled })}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            printerConfig.enabled ? 'bg-emerald-500' : 'bg-slate-600'
          }`}
        >
          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            printerConfig.enabled ? 'translate-x-6' : 'translate-x-0.5'
          }`} />
        </button>
      </div>

      {printerConfig.enabled && (
        <>
          {/* Paper size */}
          <div>
            <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Paper Size</p>
            <div className="grid grid-cols-4 gap-2">
              {PAPER_SIZES.map(s => (
                <button
                  key={s.value}
                  onClick={() => setPrinterConfig({ paperSize: s.value })}
                  className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                    printerConfig.paperSize === s.value
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:border-emerald-500/30'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Connection type */}
          <div>
            <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Connection</p>
            <div className="grid grid-cols-3 gap-2">
              {CONNECTION_TYPES.map(c => {
                const available = isTypeAvailable(c.value)
                return (
                  <button
                    key={c.value}
                    onClick={() => {
                      setPrinterConfig({ connectionType: c.value, printerAddress: '', printerName: '', enabled: true })
                      setDiscovered([])
                      setShowScanner(false)
                      setNetworkInput('')
                    }}
                    disabled={!available}
                    title={!available ? `${c.label} not supported on this device` : undefined}
                    className={`py-3 px-2 rounded-xl text-xs font-semibold border transition-all flex flex-col items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed ${
                      printerConfig.connectionType === c.value
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:border-emerald-500/30'
                    }`}
                  >
                    <i className={`fab ${c.icon} text-base`}></i>
                    <span>{c.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Network IP input */}
          {printerConfig.connectionType === 'network' && (
            <div>
              <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Printer IP Address</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={networkInput}
                  onChange={e => setNetworkInput(e.target.value)}
                  placeholder="192.168.1.100  or  192.168.1.100:9100"
                  className="input-base flex-1 text-sm"
                  onKeyDown={e => e.key === 'Enter' && handleNetworkConnect()}
                />
                <button
                  onClick={handleNetworkConnect}
                  disabled={connecting}
                  className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-400 rounded-xl text-sm font-semibold transition disabled:opacity-40"
                >
                  {connecting
                    ? <i className="fas fa-spinner fa-spin"></i>
                    : 'Connect'}
                </button>
              </div>
              {/* Network scan */}
              <button
                onClick={handleScan}
                disabled={scanning}
                className="mt-2 text-xs text-slate-500 hover:text-slate-300 transition flex items-center gap-1"
              >
                <i className={`fas ${scanning ? 'fa-spinner fa-spin' : 'fa-search'} text-[10px]`}></i>
                {scanning ? 'Scanning network…' : 'Auto-discover printers on LAN'}
              </button>
            </div>
          )}

          {/* Bluetooth / USB scan button */}
          {printerConfig.connectionType !== 'network' && (
            <div>
              <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">
                {printerConfig.connectionType === 'bluetooth' ? 'Bluetooth' : 'USB'} Printer
              </p>
              <button
                onClick={handleScan}
                disabled={scanning}
                className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/15 text-slate-300 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <i className={`fas ${scanning ? 'fa-spinner fa-spin' : printerConfig.connectionType === 'bluetooth' ? 'fa-bluetooth' : 'fa-plug'}`}></i>
                {scanning ? 'Scanning…' : `Scan for ${printerConfig.connectionType === 'bluetooth' ? 'Bluetooth' : 'USB'} Printers`}
              </button>
            </div>
          )}

          {/* Discovered printers list */}
          {showScanner && discovered.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Found Printers</p>
              {discovered.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleConnect(p)}
                  disabled={connecting}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition disabled:opacity-40"
                >
                  <div className="flex items-center gap-3 text-left">
                    <i className="fas fa-print text-emerald-400"></i>
                    <div>
                      <p className="text-sm font-semibold text-slate-200">{p.name}</p>
                      <p className="text-xs text-slate-500">{p.id}{p.rssi ? ` · ${p.rssi} dBm` : ''}</p>
                    </div>
                  </div>
                  {connecting
                    ? <i className="fas fa-spinner fa-spin text-slate-400 text-xs"></i>
                    : <i className="fas fa-chevron-right text-slate-500 text-xs"></i>}
                </button>
              ))}
            </div>
          )}

          {/* Connected printer status */}
          {printerConfig.printerAddress && (
            <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                <div>
                  <p className="text-sm font-semibold text-emerald-300">{printerConfig.printerName || printerConfig.printerAddress}</p>
                  <p className="text-xs text-emerald-500/70">{printerConfig.connectionType} · {printerConfig.paperSize}</p>
                </div>
              </div>
              <button
                onClick={handleDisconnect}
                className="text-xs text-red-400 hover:text-red-300 transition px-2 py-1"
              >
                <i className="fas fa-unlink mr-1"></i>Remove
              </button>
            </div>
          )}

          {/* Auto-print toggle */}
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-sm font-semibold text-slate-200">Auto-Print after Payment</p>
              <p className="text-xs text-slate-500 mt-0.5">Receipt prints automatically — no need to tap Print</p>
            </div>
            <button
              onClick={() => setPrinterConfig({ autoPrint: !printerConfig.autoPrint })}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                printerConfig.autoPrint ? 'bg-emerald-500' : 'bg-slate-600'
              }`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                printerConfig.autoPrint ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          {/* Test print button */}
          {printerConfig.printerAddress && (
            <button
              onClick={handleTestPrint}
              disabled={testing}
              className="w-full py-3 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-400 rounded-xl font-semibold text-sm transition disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <i className={`fas ${testing ? 'fa-spinner fa-spin' : 'fa-print'}`}></i>
              {testing ? 'Printing…' : 'Print Test Receipt'}
            </button>
          )}
        </>
      )}
    </div>
  )
}
