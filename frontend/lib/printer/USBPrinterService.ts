import { PrinterService, DiscoveredPrinter } from './PrinterService'

/**
 * USB printer service using WebUSB API (Chrome desktop / Chromium-based browsers).
 * In Capacitor native apps, a USB Host bridge (window.usbPrinterBridge) is
 * injected by the plugin layer for Android USB Host support.
 *
 * WebUSB is NOT supported on iOS Safari. On iOS, use Bluetooth or Network instead.
 */

declare global {
  interface Window {
    usbPrinterBridge?: {
      getDevices: () => Promise<Array<{ id: string; name: string; vendorId: number; productId: number }>>
      connect: (deviceId: string) => Promise<void>
      disconnect: () => Promise<void>
      write: (base64: string) => Promise<void>
      isConnected: () => boolean
    }
  }
}

// Common vendor IDs for thermal printers
const THERMAL_PRINTER_VENDORS = [
  { vendorId: 0x0416 },  // Winbond (used by many generic printers)
  { vendorId: 0x04b8 },  // Epson
  { vendorId: 0x0519 },  // Star Micronics
  { vendorId: 0x154f },  // SNBC
  { vendorId: 0x1fc9 },  // Citizen
  { vendorId: 0x0dd4 },  // Custom / Sewoo
  { vendorId: 0x20d1 },  // Bixolon
]

export class USBPrinterService extends PrinterService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private device: any = null
  private endpointOut: number = 1
  private connected = false

  async discover(): Promise<DiscoveredPrinter[]> {
    // Capacitor USB Host bridge
    if (window.usbPrinterBridge) {
      const devices = await window.usbPrinterBridge.getDevices()
      return devices.map(d => ({
        id: d.id,
        name: d.name || `Printer (${d.vendorId.toString(16)}:${d.productId.toString(16)})`,
        type: 'usb' as const,
      }))
    }

    if (!('usb' in navigator)) {
      throw new Error('WebUSB not supported. Use Chrome browser or install as native app.')
    }

    // Return already-paired devices
    const devices = await (navigator as any).usb.getDevices()
    return devices.map((d: any) => ({
      id: `${d.vendorId}:${d.productId}`,
      name: d.productName || d.manufacturerName || 'USB Printer',
      type: 'usb' as const,
    }))
  }

  async connect(address: string): Promise<void> {
    // Capacitor USB bridge path
    if (window.usbPrinterBridge) {
      await window.usbPrinterBridge.connect(address)
      this.connected = true
      return
    }

    if (!('usb' in navigator)) {
      throw new Error('WebUSB not supported')
    }

    // Request device permission prompt
    this.device = await (navigator as any).usb.requestDevice({
      filters: THERMAL_PRINTER_VENDORS,
    })

    await this.device!.open()

    if (this.device!.configuration === null) {
      await this.device!.selectConfiguration(1)
    }

    // Find bulk-out endpoint in the first interface
    const iface = this.device!.configuration!.interfaces[0]
    await this.device!.claimInterface(iface.interfaceNumber)

    const alternate = iface.alternates[0]
    const outEndpoint = alternate.endpoints.find(
      (e: any) => e.direction === 'out' && e.type === 'bulk'
    )
    if (!outEndpoint) throw new Error('No bulk-out endpoint found on USB device')
    this.endpointOut = outEndpoint.endpointNumber

    this.connected = true
  }

  async disconnect(): Promise<void> {
    if (window.usbPrinterBridge) {
      await window.usbPrinterBridge.disconnect()
      this.connected = false
      return
    }
    if (this.device) {
      try {
        await this.device.releaseInterface(this.device.configuration!.interfaces[0].interfaceNumber)
        await this.device.close()
      } catch { /* ignore */ }
      this.device = null
    }
    this.connected = false
  }

  async print(data: Uint8Array): Promise<void> {
    if (window.usbPrinterBridge) {
      const base64 = btoa(String.fromCharCode(...data))
      await window.usbPrinterBridge.write(base64)
      return
    }

    if (!this.device || !this.connected) {
      throw new Error('USB printer not connected')
    }

    // Send in 64-byte chunks (USB packet size)
    const chunkSize = 64
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize)
      await this.device.transferOut(this.endpointOut, chunk)
    }
  }

  isConnected(): boolean {
    if (window.usbPrinterBridge) {
      return window.usbPrinterBridge.isConnected()
    }
    return this.connected && this.device !== null
  }
}
