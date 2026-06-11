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

// ─── Printer byte-value status (unsolicited messages and <S92> response) ─────

export interface PrinterByteStatus {
  isReady: boolean
  ticketAcknowledged: boolean
  outOfTickets: boolean
  ticketJam: boolean
  cutterJam: boolean
  powerOn: boolean
  description: string
  raw: number
}

/**
 * Decodes a single byte from the printer's unsolicited status stream or an
 * <S92> solicited-status response. Each byte value has a fixed meaning (unlike
 * the <S1> bit-field format decoded by decodeS1).
 *
 * Key values: 0x06 = ticket ACK, 0x11 = X-On (ready), 0x13 = X-Off (busy),
 *             0x41 = S92 good status, 0x0A/0x0B/0x10 = out of paper.
 */
export function decodePrinterByte(byte: number): PrinterByteStatus {
  const base: PrinterByteStatus = {
    isReady: false,
    ticketAcknowledged: false,
    outOfTickets: false,
    ticketJam: false,
    cutterJam: false,
    powerOn: false,
    description: '',
    raw: byte
  }

  switch (byte) {
    case 0x01: return { ...base, description: 'Reject bin warning' }
    case 0x02: return { ...base, description: 'Reject bin error' }
    case 0x03: return { ...base, ticketJam: true, description: 'Paper jam path 1' }
    case 0x04: return { ...base, ticketJam: true, description: 'Paper jam path 2' }
    case 0x05: return { ...base, isReady: true, ticketAcknowledged: true, description: 'Test ticket ACK' }
    case 0x06: return { ...base, isReady: true, ticketAcknowledged: true, description: 'Ticket ACK' }
    case 0x07: return { ...base, description: 'Wrong file identifier' }
    case 0x08: return { ...base, description: 'Invalid checksum' }
    case 0x09: return { ...base, isReady: true, description: 'Valid checksum' }
    case 0x0A: return { ...base, outOfTickets: true, description: 'Out of paper path 1' }
    case 0x0B: return { ...base, outOfTickets: true, description: 'Out of paper path 2' }
    case 0x0C: return { ...base, isReady: true, description: 'Paper loaded path 1' }
    case 0x0D: return { ...base, isReady: true, description: 'Paper loaded path 2' }
    case 0x0E: return { ...base, ticketJam: true, description: 'Escrow jam' }
    case 0x0F: return { ...base, description: 'Low paper' }
    case 0x10: return { ...base, outOfTickets: true, description: 'Out of tickets' }
    case 0x11: return { ...base, isReady: true, description: 'X-On (ready)' }
    case 0x12: return { ...base, isReady: true, powerOn: true, description: 'Power on' }
    case 0x13: return { ...base, description: 'X-Off (busy)' }
    case 0x14: return { ...base, description: 'Bad flash memory' }
    case 0x15: return { ...base, description: 'Ticket NAK' }
    case 0x16: return { ...base, isReady: true, description: 'Ticket taken' }
    case 0x17: return { ...base, description: 'Ticket waiting' }
    case 0x18: return { ...base, ticketJam: true, description: 'Ticket jam' }
    case 0x19: return { ...base, description: 'Illegal data' }
    case 0x1A: return { ...base, description: 'Powerup problem' }
    case 0x1C: return { ...base, description: 'Download error' }
    case 0x1D: return { ...base, cutterJam: true, description: 'Cutter jam' }
    case 0x1E: return { ...base, ticketJam: true, description: 'Stuck ticket' }
    case 0x1F: return { ...base, cutterJam: true, description: 'Cutter jam path 2' }
    // 0x41 is the S92 "all good" response — checked before the printable ASCII fallback below
    case 0x41: return { ...base, isReady: true, description: 'Good status (S92 ready)' }
    default:
      if (byte >= 0x20) {
        return { ...base, description: String.fromCharCode(byte) }
      }
      return { ...base, description: `Unknown (0x${byte.toString(16).padStart(2, '0').toUpperCase()})` }
  }
}
