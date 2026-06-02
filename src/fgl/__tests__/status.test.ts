import { describe, it, expect } from 'vitest'
import { decodeS1, firstByteFromHex } from '../status'

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
