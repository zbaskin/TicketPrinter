import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import net from 'net'
import { queryPrinterTcp, printRawTcp } from '../tcpPrinter'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function listenOnFreePort(server: net.Server): Promise<number> {
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      resolve((server.address() as net.AddressInfo).port)
    })
  })
}

function closeServer(server: net.Server): Promise<void> {
  return new Promise((resolve) => server.close(() => resolve()))
}

async function unusedPort(): Promise<number> {
  const s = net.createServer()
  const p = await listenOnFreePort(s)
  await closeServer(s)
  return p
}

// ─────────────────────────────────────────────────────────────────────────────
// queryPrinterTcp
// ─────────────────────────────────────────────────────────────────────────────

describe('queryPrinterTcp', () => {
  let server: net.Server
  let port: number

  beforeEach(async () => {
    server = net.createServer((socket) => {
      socket.on('data', (data) => {
        const cmd = data.toString('ascii')
        if (cmd === '<S1>') socket.write(Buffer.from([0x06]))
        else if (cmd === '<S99>') socket.write(Buffer.from('OK\r\n', 'ascii'))
        socket.end()
      })
    })
    port = await listenOnFreePort(server)
  })

  afterEach(async () => {
    await closeServer(server)
  })

  it('returns hex of bytes received from printer', async () => {
    const result = await queryPrinterTcp('127.0.0.1', port, '<S1>', 1000)
    expect(result.responseHex).toBe('06')
  })

  it('sent field is the hex encoding of the command', async () => {
    const result = await queryPrinterTcp('127.0.0.1', port, '<S1>', 1000)
    // '<S1>' in ASCII bytes: 0x3C 0x53 0x31 0x3E
    expect(result.sent).toBe('3C53313E')
  })

  it('responseText maps printable bytes and dot for non-printable', async () => {
    const result = await queryPrinterTcp('127.0.0.1', port, '<S1>', 1000)
    // 0x06 = ACK (non-printable) → '.'
    expect(result.responseText).toBe('.')
  })

  it('multi-byte response is fully concatenated', async () => {
    const result = await queryPrinterTcp('127.0.0.1', port, '<S99>', 1000)
    // 'OK\r\n' = 4F 4B 0D 0A
    expect(result.responseHex).toBe('4F4B0D0A')
  })

  it('multi-byte response text shows printable and dots', async () => {
    const result = await queryPrinterTcp('127.0.0.1', port, '<S99>', 1000)
    // 'O', 'K', CR(non-printable)→'.', LF(non-printable)→'.'
    expect(result.responseText).toBe('OK..')
  })

  it('no error field when response is received', async () => {
    const result = await queryPrinterTcp('127.0.0.1', port, '<S1>', 1000)
    expect(result.error).toBeUndefined()
  })

  it('returns empty responseHex when server never sends a response', async () => {
    // Server accepts but never writes; swallow errors from client disconnect
    const silentServer = net.createServer((socket) => { socket.on('error', () => {}) })
    const silentPort = await listenOnFreePort(silentServer)
    // Use a short timeout — raw setTimeout in implementation ensures this resolves quickly
    const result = await queryPrinterTcp('127.0.0.1', silentPort, '<S1>', 200)
    silentServer.close() // don't await — active socket delays close callback
    expect(result.responseHex).toBe('')
    expect(result.error).toBeUndefined()
  }, 2000)

  it('returns error when connection is refused', async () => {
    const closed = await unusedPort()
    const result = await queryPrinterTcp('127.0.0.1', closed, '<S1>', 500)
    expect(result.error).toBeTruthy()
    expect(result.responseHex).toBe('')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// printRawTcp
// ─────────────────────────────────────────────────────────────────────────────

describe('printRawTcp', () => {
  let server: net.Server
  let port: number
  let receivedChunks: Buffer[]

  beforeEach(async () => {
    receivedChunks = []
    server = net.createServer((socket) => {
      socket.on('data', (data) => receivedChunks.push(data))
    })
    port = await listenOnFreePort(server)
  })

  afterEach(async () => {
    await closeServer(server)
  })

  it('returns success with bytesWritten equal to ASCII byte length of fglData', async () => {
    const fgl = '<NF><p>'
    const result = await printRawTcp('127.0.0.1', port, fgl)
    expect(result.success).toBe(true)
    expect(result.bytesWritten).toBe(7)
  })

  it('server receives the correct FGL bytes', async () => {
    const fgl = '<NF><p>'
    await printRawTcp('127.0.0.1', port, fgl)
    // Give loopback a moment to deliver
    await new Promise((r) => setTimeout(r, 20))
    const received = Buffer.concat(receivedChunks).toString('ascii')
    expect(received).toBe(fgl)
  })

  it('returns error when connection is refused', async () => {
    const closed = await unusedPort()
    const result = await printRawTcp('127.0.0.1', closed, '<NF><p>')
    expect(result.success).toBe(false)
    expect(result.error).toBeTruthy()
  })
})

