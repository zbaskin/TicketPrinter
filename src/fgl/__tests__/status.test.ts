import { describe, it, expect } from 'vitest'
import { decodeS1, firstByteFromHex, decodePrinterByte } from '../status'

// ─────────────────────────────────────────────────────────────────────────────
// decodeS1
// ─────────────────────────────────────────────────────────────────────────────
describe('decodeS1', () => {
  it('returns all false for 0x00', () => {
    const result = decodeS1(0x00)
    expect(result.outOfStock).toBe(false)
    expect(result.jam).toBe(false)
    expect(result.busy).toBe(false)
    expect(result.error).toBe(false)
    expect(result.coverOpen).toBe(false)
    expect(result.cutterFault).toBe(false)
  })

  it('returns all true for 0xFF (bits 0-5 set)', () => {
    const result = decodeS1(0xFF)
    expect(result.outOfStock).toBe(true)
    expect(result.jam).toBe(true)
    expect(result.busy).toBe(true)
    expect(result.error).toBe(true)
    expect(result.coverOpen).toBe(true)
    expect(result.cutterFault).toBe(true)
  })

  it('bit 0 (0x01) sets outOfStock only', () => {
    const result = decodeS1(0x01)
    expect(result.outOfStock).toBe(true)
    expect(result.jam).toBe(false)
    expect(result.busy).toBe(false)
    expect(result.error).toBe(false)
    expect(result.coverOpen).toBe(false)
    expect(result.cutterFault).toBe(false)
  })

  it('bit 1 (0x02) sets jam only', () => {
    const result = decodeS1(0x02)
    expect(result.outOfStock).toBe(false)
    expect(result.jam).toBe(true)
    expect(result.busy).toBe(false)
    expect(result.error).toBe(false)
    expect(result.coverOpen).toBe(false)
    expect(result.cutterFault).toBe(false)
  })

  it('bit 2 (0x04) sets busy only', () => {
    const result = decodeS1(0x04)
    expect(result.outOfStock).toBe(false)
    expect(result.jam).toBe(false)
    expect(result.busy).toBe(true)
    expect(result.error).toBe(false)
    expect(result.coverOpen).toBe(false)
    expect(result.cutterFault).toBe(false)
  })

  it('bit 3 (0x08) sets error only', () => {
    const result = decodeS1(0x08)
    expect(result.outOfStock).toBe(false)
    expect(result.jam).toBe(false)
    expect(result.busy).toBe(false)
    expect(result.error).toBe(true)
    expect(result.coverOpen).toBe(false)
    expect(result.cutterFault).toBe(false)
  })

  it('bit 4 (0x10) sets coverOpen only', () => {
    const result = decodeS1(0x10)
    expect(result.outOfStock).toBe(false)
    expect(result.jam).toBe(false)
    expect(result.busy).toBe(false)
    expect(result.error).toBe(false)
    expect(result.coverOpen).toBe(true)
    expect(result.cutterFault).toBe(false)
  })

  it('bit 5 (0x20) sets cutterFault only', () => {
    const result = decodeS1(0x20)
    expect(result.outOfStock).toBe(false)
    expect(result.jam).toBe(false)
    expect(result.busy).toBe(false)
    expect(result.error).toBe(false)
    expect(result.coverOpen).toBe(false)
    expect(result.cutterFault).toBe(true)
  })

  it('0x03 sets outOfStock and jam (combined bits)', () => {
    const result = decodeS1(0x03)
    expect(result.outOfStock).toBe(true)
    expect(result.jam).toBe(true)
    expect(result.busy).toBe(false)
    expect(result.error).toBe(false)
    expect(result.coverOpen).toBe(false)
    expect(result.cutterFault).toBe(false)
  })

  it('raw field always equals the input byte', () => {
    expect(decodeS1(0x00).raw).toBe(0x00)
    expect(decodeS1(0xFF).raw).toBe(0xFF)
    expect(decodeS1(0x15).raw).toBe(0x15)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// firstByteFromHex
// ─────────────────────────────────────────────────────────────────────────────
describe('firstByteFromHex', () => {
  it('returns null for empty string', () => {
    expect(firstByteFromHex('')).toBeNull()
  })

  it('returns 10 for "0A"', () => {
    expect(firstByteFromHex('0A')).toBe(10)
  })

  it('returns first byte only for multi-byte hex "0A1B2C"', () => {
    expect(firstByteFromHex('0A1B2C')).toBe(10)
  })

  it('returns null for invalid hex "Z"', () => {
    expect(firstByteFromHex('Z')).toBeNull()
  })

  it('returns null for odd-length single hex nibble "0"', () => {
    // A single nibble cannot represent a full byte
    expect(firstByteFromHex('0')).toBeNull()
  })

  it('handles lowercase hex', () => {
    expect(firstByteFromHex('ff')).toBe(255)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// decodePrinterByte
// ─────────────────────────────────────────────────────────────────────────────
describe('decodePrinterByte', () => {
  it('0x06 = ticket ACK: isReady=true, ticketAcknowledged=true', () => {
    const result = decodePrinterByte(0x06)
    expect(result.isReady).toBe(true)
    expect(result.ticketAcknowledged).toBe(true)
    expect(result.outOfTickets).toBe(false)
    expect(result.ticketJam).toBe(false)
    expect(result.cutterJam).toBe(false)
  })

  it('0x41 = S92 good status: isReady=true', () => {
    const result = decodePrinterByte(0x41)
    expect(result.isReady).toBe(true)
    expect(result.ticketJam).toBe(false)
    expect(result.outOfTickets).toBe(false)
  })

  it('0x0A = out of paper path 1: outOfTickets=true, isReady=false', () => {
    const result = decodePrinterByte(0x0A)
    expect(result.outOfTickets).toBe(true)
    expect(result.isReady).toBe(false)
  })

  it('0x0B = out of paper path 2: outOfTickets=true', () => {
    expect(decodePrinterByte(0x0B).outOfTickets).toBe(true)
  })

  it('0x10 = out of tickets: outOfTickets=true', () => {
    expect(decodePrinterByte(0x10).outOfTickets).toBe(true)
  })

  it('0x03 = paper jam path 1: ticketJam=true, isReady=false', () => {
    const result = decodePrinterByte(0x03)
    expect(result.ticketJam).toBe(true)
    expect(result.isReady).toBe(false)
  })

  it('0x04 = paper jam path 2: ticketJam=true', () => {
    expect(decodePrinterByte(0x04).ticketJam).toBe(true)
  })

  it('0x18 = ticket jam: ticketJam=true', () => {
    expect(decodePrinterByte(0x18).ticketJam).toBe(true)
  })

  it('0x1D = cutter jam: cutterJam=true', () => {
    expect(decodePrinterByte(0x1D).cutterJam).toBe(true)
  })

  it('0x12 = power on: powerOn=true, isReady=true', () => {
    const result = decodePrinterByte(0x12)
    expect(result.powerOn).toBe(true)
    expect(result.isReady).toBe(true)
  })

  it('0x11 = X-On: isReady=true, description contains X-On', () => {
    const result = decodePrinterByte(0x11)
    expect(result.isReady).toBe(true)
    expect(result.description).toMatch(/x-on/i)
  })

  it('0x13 = X-Off: isReady=false, description contains X-Off', () => {
    const result = decodePrinterByte(0x13)
    expect(result.isReady).toBe(false)
    expect(result.description).toMatch(/x-off/i)
  })

  it('0x0F = low paper: isReady=false', () => {
    expect(decodePrinterByte(0x0F).isReady).toBe(false)
  })

  it('raw field always equals the input byte', () => {
    expect(decodePrinterByte(0x00).raw).toBe(0x00)
    expect(decodePrinterByte(0x06).raw).toBe(0x06)
    expect(decodePrinterByte(0x41).raw).toBe(0x41)
    expect(decodePrinterByte(0xFF).raw).toBe(0xFF)
  })

  it('unknown byte below 0x20 returns isReady=false with unknown description', () => {
    const result = decodePrinterByte(0x1B)
    expect(result.isReady).toBe(false)
    expect(result.description).toMatch(/unknown/i)
  })

  it('byte >= 0x20 (printable ASCII, not 0x41) returns its char as description', () => {
    const result = decodePrinterByte(0x42) // 'B'
    expect(result.description).toBe('B')
  })
})
