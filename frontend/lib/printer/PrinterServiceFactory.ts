import { PrinterService, ConnectionType } from './PrinterService'
import { BluetoothPrinterService } from './BluetoothPrinterService'
import { USBPrinterService } from './USBPrinterService'
import { NetworkPrinterService } from './NetworkPrinterService'

/** Singleton instances — one per connection type */
const instances: Partial<Record<ConnectionType, PrinterService>> = {}

/**
 * Returns the singleton PrinterService for the given connection type.
 * Instances are cached so state (connected device etc.) is preserved.
 */
export function getPrinterService(type: ConnectionType): PrinterService {
  if (!instances[type]) {
    switch (type) {
      case 'bluetooth': instances[type] = new BluetoothPrinterService(); break
      case 'usb':       instances[type] = new USBPrinterService();       break
      case 'network':   instances[type] = new NetworkPrinterService();   break
    }
  }
  return instances[type]!
}

/** True when running inside a Capacitor native app (iOS or Android) */
export function isNativeApp(): boolean {
  return typeof window !== 'undefined' &&
    !!(window as any).Capacitor?.isNativePlatform?.()
}

/** True when the browser supports Web Bluetooth */
export function hasWebBluetooth(): boolean {
  return typeof window !== 'undefined' && 'bluetooth' in navigator
}

/** True when the browser supports WebUSB */
export function hasWebUSB(): boolean {
  return typeof window !== 'undefined' && 'usb' in navigator
}

export type { ConnectionType }
