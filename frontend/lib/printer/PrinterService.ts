export type PaperSize = '58mm' | '76mm' | '80mm' | '110mm'
export type ConnectionType = 'bluetooth' | 'usb' | 'network'

export interface PrinterConfig {
  paperSize: PaperSize
  connectionType: ConnectionType
  printerAddress: string   // BT MAC address | IP:port | USB deviceId
  printerName: string
  autoPrint: boolean
  enabled: boolean
}

export interface DiscoveredPrinter {
  id: string          // device id / MAC / ip:port
  name: string
  type: ConnectionType
  rssi?: number       // signal strength (BT only)
}

export const PAPER_CHARS: Record<PaperSize, number> = {
  '58mm':  32,
  '76mm':  42,
  '80mm':  48,
  '110mm': 64,
}

export abstract class PrinterService {
  abstract discover(): Promise<DiscoveredPrinter[]>
  abstract connect(address: string): Promise<void>
  abstract disconnect(): Promise<void>
  abstract print(data: Uint8Array): Promise<void>
  abstract isConnected(): boolean
}
