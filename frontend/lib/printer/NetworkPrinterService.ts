import { PrinterService, DiscoveredPrinter } from './PrinterService'

/**
 * Network / WiFi printer service.
 * Uses TCP port 9100 (standard RAW printing port for most network printers).
 *
 * Browser environments cannot open raw TCP sockets (security restriction).
 * When running inside Capacitor native app, window.networkPrinterBridge is
 * injected by the plugin to provide raw TCP socket access.
 *
 * In pure browser/PWA mode, printing is routed through the backend server
 * which can open TCP sockets. The server acts as a transparent proxy.
 */

declare global {
  interface Window {
    networkPrinterBridge?: {
      scan: () => Promise<Array<{ address: string; name: string }>>
      connect: (host: string, port: number) => Promise<void>
      disconnect: () => Promise<void>
      write: (base64: string) => Promise<void>
      isConnected: () => boolean
    }
  }
}

const DEFAULT_PORT = 9100

export class NetworkPrinterService extends PrinterService {
  private host = ''
  private port = DEFAULT_PORT
  private connected = false

  /** Parse "192.168.1.100:9100" or "192.168.1.100" */
  private static parseAddress(address: string): { host: string; port: number } {
    const parts = address.split(':')
    return {
      host: parts[0],
      port: parts[1] ? parseInt(parts[1], 10) : DEFAULT_PORT,
    }
  }

  async discover(): Promise<DiscoveredPrinter[]> {
    // Capacitor native bridge (mDNS/network scan)
    if (window.networkPrinterBridge) {
      const devices = await window.networkPrinterBridge.scan()
      return devices.map(d => ({
        id: d.address,
        name: d.name || d.address,
        type: 'network' as const,
      }))
    }
    // Browser: no auto-discovery, user must enter IP manually
    return []
  }

  async connect(address: string): Promise<void> {
    const { host, port } = NetworkPrinterService.parseAddress(address)
    this.host = host
    this.port = port

    // Capacitor native bridge
    if (window.networkPrinterBridge) {
      await window.networkPrinterBridge.connect(host, port)
      this.connected = true
      return
    }

    // Browser: ping via backend server proxy to verify reachability
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
    const res = await fetch(`${apiUrl}/api/printer/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ host, port }),
    })
    if (!res.ok) {
      const { message } = await res.json().catch(() => ({ message: 'Cannot reach printer' }))
      throw new Error(message || 'Cannot reach printer')
    }
    this.connected = true
  }

  async disconnect(): Promise<void> {
    if (window.networkPrinterBridge) {
      await window.networkPrinterBridge.disconnect()
    }
    this.connected = false
    this.host = ''
  }

  async print(data: Uint8Array): Promise<void> {
    if (!this.connected) throw new Error('Network printer not connected')

    // Capacitor native bridge
    if (window.networkPrinterBridge) {
      const base64 = btoa(String.fromCharCode(...data))
      await window.networkPrinterBridge.write(base64)
      return
    }

    // Browser: proxy through backend
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    const base64 = btoa(String.fromCharCode(...data))

    const res = await fetch(`${apiUrl}/api/printer/print`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ host: this.host, port: this.port, data: base64 }),
    })
    if (!res.ok) {
      const { message } = await res.json().catch(() => ({ message: 'Print failed' }))
      throw new Error(message || 'Print failed')
    }
  }

  isConnected(): boolean {
    if (window.networkPrinterBridge) {
      return window.networkPrinterBridge.isConnected()
    }
    return this.connected
  }

  getAddress(): string {
    return this.host ? `${this.host}:${this.port}` : ''
  }
}
