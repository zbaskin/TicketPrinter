import type { TicketDocument } from './types'

export interface ExclusionZone {
  label: string
  colStart: number
  colEnd: number
}

export interface StockDimensions {
  widthDots: number
  heightDots: number
  safeMargin: number
  exclusionZones: ExclusionZone[]
}

// At 600 DPI:
//   CONCERT  2" × 5.5"  →  ROW 0-1200,  COL 0-3300
//   CINEMA   3.25" × 2" →  ROW 0-1200,  COL 0-1950  (perf band at COL 940-1010)
export const STOCKS: Record<string, StockDimensions> = {
  CONCERT: {
    widthDots: 1200,
    heightDots: 3300,
    safeMargin: 20,
    exclusionZones: []
  },
  CINEMA: {
    widthDots: 1200,
    heightDots: 1950,
    safeMargin: 20,
    exclusionZones: [{ label: 'Perforation band', colStart: 940, colEnd: 1010 }]
  }
}

export function getStock(
  doc: Pick<TicketDocument, 'stock' | 'customWidth' | 'customHeight'>
): StockDimensions {
  if (doc.stock === 'custom') {
    return {
      widthDots: doc.customWidth ?? 1200,
      heightDots: doc.customHeight ?? 3300,
      safeMargin: 20,
      exclusionZones: []
    }
  }
  const s = STOCKS[doc.stock]
  if (!s) throw new Error(`Unknown stock: ${doc.stock}`)
  return s
}
