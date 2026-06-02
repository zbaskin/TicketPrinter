export interface S1Status {
  outOfStock: boolean
  cutterFault: boolean  // always false on Lemur (no cutter), shown for completeness
  jam: boolean
  busy: boolean
  error: boolean
  coverOpen: boolean
  raw: number
}

/**
 * Decodes the S1 status byte returned by a Boca Lemur printer.
 *
 * Bit mapping:
 *   bit 0 (0x01) = outOfStock
 *   bit 1 (0x02) = jam
 *   bit 2 (0x04) = busy
 *   bit 3 (0x08) = error
 *   bit 4 (0x10) = coverOpen
 *   bit 5 (0x20) = cutterFault
 */
export function decodeS1(byte: number): S1Status {
  return {
    outOfStock: (byte & 0x01) !== 0,
    jam: (byte & 0x02) !== 0,
    busy: (byte & 0x04) !== 0,
    error: (byte & 0x08) !== 0,
    coverOpen: (byte & 0x10) !== 0,
    cutterFault: (byte & 0x20) !== 0,
    raw: byte
  }
}

/**
 * Returns the first byte of a hex string as a number, or null if the input
 * is empty, has fewer than 2 characters, or contains invalid hex digits.
 */
export function firstByteFromHex(hex: string): number | null {
  if (hex.length < 2) return null
  const firstTwo = hex.slice(0, 2)
  // Validate that both characters are valid hex digits
  if (!/^[0-9a-fA-F]{2}$/.test(firstTwo)) return null
  return parseInt(firstTwo, 16)
}
