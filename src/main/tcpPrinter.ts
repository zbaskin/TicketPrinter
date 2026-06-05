import net from 'net'
import type { PrintResult, QueryResult } from '../shared/types'

function hexToDisplayText(hex: string): string {
  if (!hex) return ''
  const text: string[] = []
  for (let i = 0; i + 1 < hex.length; i += 2) {
    const byte = parseInt(hex.slice(i, i + 2), 16)
    text.push(byte >= 0x20 && byte <= 0x7e ? String.fromCharCode(byte) : '.')
  }
  return text.join('')
}

export function queryPrinterTcp(
  host: string,
  port: number,
  command: string,
  timeoutMs = 2000
): Promise<QueryResult> {
  return new Promise((resolve) => {
    const socket = new net.Socket()
    const chunks: Buffer[] = []
    let settled = false

    function finish(error?: string): void {
      if (settled) return
      settled = true
      clearTimeout(timer)
      socket.destroy()
      const sentHex = Buffer.from(command, 'ascii').toString('hex').toUpperCase()
      const responseHex = Buffer.concat(chunks).toString('hex').toUpperCase()
      resolve({
        sent: sentHex,
        responseHex,
        responseText: hexToDisplayText(responseHex),
        ...(error !== undefined ? { error } : {})
      })
    }

    // Belt-and-suspenders: use both socket timeout and a raw timer
    const timer = setTimeout(() => { finish() }, timeoutMs)

    socket.setTimeout(timeoutMs)
    socket.on('connect', () => { socket.write(command, 'ascii') })
    socket.on('data', (chunk) => { chunks.push(chunk) })
    socket.on('timeout', () => { finish() })
    socket.on('end', () => { finish() })
    socket.on('close', () => { finish() })
    socket.on('error', (err) => { finish(err.message) })
    socket.connect(port, host)
  })
}

export function printRawTcp(
  host: string,
  port: number,
  fglData: string
): Promise<PrintResult> {
  return new Promise((resolve) => {
    const socket = new net.Socket()
    let settled = false

    function finish(result: PrintResult): void {
      if (settled) return
      settled = true
      socket.destroy()
      resolve(result)
    }

    socket.on('connect', () => {
      const buf = Buffer.from(fglData, 'ascii')
      socket.write(buf, (err) => {
        if (err) {
          finish({ success: false, error: err.message })
        } else {
          finish({ success: true, bytesWritten: buf.length })
        }
      })
    })

    socket.on('error', (err) => {
      finish({ success: false, error: err.message })
    })

    socket.connect(port, host)
  })
}
