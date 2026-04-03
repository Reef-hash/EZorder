import express from 'express'
import net from 'net'

const router = express.Router()

/**
 * POST /api/printer/test
 * Verifies a TCP connection can be made to a network printer.
 * Body: { host: string, port: number }
 */
router.post('/test', (req, res) => {
  const { host, port = 9100 } = req.body
  if (!host) return res.status(400).json({ message: 'host is required' })

  const socket = new net.Socket()
  const timeout = 3000

  socket.setTimeout(timeout)

  socket.connect(Number(port), host, () => {
    socket.destroy()
    res.json({ ok: true })
  })

  socket.on('error', (err) => {
    socket.destroy()
    res.status(502).json({ message: `Cannot reach printer: ${err.message}` })
  })

  socket.on('timeout', () => {
    socket.destroy()
    res.status(504).json({ message: 'Connection timed out' })
  })
})

/**
 * POST /api/printer/print
 * Forwards base64-encoded ESC/POS data to a network printer via raw TCP.
 * Body: { host: string, port: number, data: string (base64) }
 * Requires: authMiddleware (attached in server.js)
 */
router.post('/print', (req, res) => {
  const { host, port = 9100, data } = req.body
  if (!host) return res.status(400).json({ message: 'host is required' })
  if (!data)  return res.status(400).json({ message: 'data is required' })

  let buffer
  try {
    buffer = Buffer.from(data, 'base64')
  } catch {
    return res.status(400).json({ message: 'Invalid base64 data' })
  }

  const socket = new net.Socket()
  socket.setTimeout(5000)

  socket.connect(Number(port), host, () => {
    socket.write(buffer, (err) => {
      socket.destroy()
      if (err) {
        return res.status(502).json({ message: `Write failed: ${err.message}` })
      }
      res.json({ ok: true })
    })
  })

  socket.on('error', (err) => {
    socket.destroy()
    res.status(502).json({ message: `Printer error: ${err.message}` })
  })

  socket.on('timeout', () => {
    socket.destroy()
    res.status(504).json({ message: 'Printer connection timed out' })
  })
})

export default router
