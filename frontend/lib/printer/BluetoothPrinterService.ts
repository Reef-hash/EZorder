import { PrinterService, DiscoveredPrinter } from './PrinterService'

/**
 * Bluetooth printer service using Web Bluetooth API (browser/PWA).
 * When running inside Capacitor native app, this falls back to the
 * Capacitor BLE plugin via a thin native bridge (injected by Capacitor layer).
 *
 * Most thermal printers use Classic Bluetooth SPP (Serial Port Profile).
 * Web Bluetooth only supports BLE; for SPP printers in native apps the
 * Capacitor plugin overrides window.bluetoothPrinterBridge.
 */

declare global {
  interface Window {
    bluetoothPrinterBridge?: {
      scan: () => Promise<Array<{ id: string; name: string; rssi: number }>>
      connect: (address: string) => Promise<void>
      disconnect: () => Promise<void>
      write: (base64: string) => Promise<void>
      isConnected: () => boolean
    }
  }
}

export class BluetoothPrinterService extends PrinterService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private device: any = null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private characteristic: any = null
  private connected = false

  // Common BLE thermal printer service UUIDs
  private static BLE_UUIDS = [
    '000018f0-0000-1000-8000-00805f9b34fb', // Common BLE printer service
    '49535343-fe7d-4ae5-8fa9-9fafd205e455', // Microchip BLE UART
    '6e400001-b5a3-f393-e0a9-e50e24dcca9e', // Nordic UART
  ]

  async discover(): Promise<DiscoveredPrinter[]> {
    // Capacitor native bridge takes priority (supports SPP classic BT)
    if (window.bluetoothPrinterBridge) {
      const devices = await window.bluetoothPrinterBridge.scan()
      return devices.map(d => ({
        id: d.id,
        name: d.name || 'Unknown Printer',
        type: 'bluetooth' as const,
        rssi: d.rssi,
      }))
    }

    // Web Bluetooth BLE fallback
    if (!('bluetooth' in navigator)) {
      throw new Error('Bluetooth not supported on this browser. Use Chrome or install as native app.')
    }
    // Web Bluetooth "discover" means prompting the user to choose a device
    // We trigger the picker but return empty (user selects directly in connect())
    return []
  }

  async connect(address: string): Promise<void> {
    // Capacitor native bridge path
    if (window.bluetoothPrinterBridge) {
      await window.bluetoothPrinterBridge.connect(address)
      this.connected = true
      return
    }

    // Web Bluetooth BLE path
    if (!('bluetooth' in navigator)) {
      throw new Error('Bluetooth not supported')
    }

    this.device = await (navigator as any).bluetooth.requestDevice({
      filters: [{ services: [BluetoothPrinterService.BLE_UUIDS[0]] }],
      optionalServices: BluetoothPrinterService.BLE_UUIDS,
    })

    if (!this.device?.gatt) throw new Error('GATT not available')

    const server = await this.device.gatt.connect()

    // Try each known service UUID
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let service: any = null
    for (const uuid of BluetoothPrinterService.BLE_UUIDS) {
      try {
        service = await server.getPrimaryService(uuid)
        break
      } catch {
        continue
      }
    }
    if (!service) throw new Error('Printer service not found. Try a different printer or use the native app.')

    const characteristics = await service.getCharacteristics()
    // Find a writable characteristic
    this.characteristic = characteristics.find((c: any) =>
      c.properties.write || c.properties.writeWithoutResponse
    ) ?? null

    if (!this.characteristic) throw new Error('No writable characteristic found')

    this.connected = true
    this.device.addEventListener('gattserverdisconnected', () => {
      this.connected = false
      this.characteristic = null
    })
  }

  async disconnect(): Promise<void> {
    if (window.bluetoothPrinterBridge) {
      await window.bluetoothPrinterBridge.disconnect()
      this.connected = false
      return
    }
    this.device?.gatt?.disconnect()
    this.connected = false
    this.characteristic = null
  }

  async print(data: Uint8Array): Promise<void> {
    // Capacitor native bridge path
    if (window.bluetoothPrinterBridge) {
      const base64 = btoa(String.fromCharCode(...data))
      await window.bluetoothPrinterBridge.write(base64)
      return
    }

    if (!this.characteristic || !this.connected) {
      throw new Error('Printer not connected')
    }

    // Send in 512-byte chunks (BLE MTU limit)
    const chunkSize = 512
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize)
      if (this.characteristic.properties.writeWithoutResponse) {
        await this.characteristic.writeValueWithoutResponse(chunk)
      } else {
        await this.characteristic.writeValue(chunk)
      }
      // Small delay between chunks to avoid buffer overflow
      await new Promise(r => setTimeout(r, 20))
    }
  }

  isConnected(): boolean {
    if (window.bluetoothPrinterBridge) {
      return window.bluetoothPrinterBridge.isConnected()
    }
    return this.connected && (this.device?.gatt?.connected ?? false)
  }
}
