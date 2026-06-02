import type { TicketDocument, TicketElement } from './types'
import { getStock } from './stock'
import { textWidth, textHeight } from './fonts'

export interface ValidationError {
  elementIndex?: number
  field: string
  message: string
}

interface Bounds {
  row: number
  col: number
  endRow: number
  endCol: number
}

function elementBounds(el: TicketElement): Bounds {
  switch (el.type) {
    case 'text':
      return {
        row: el.row,
        col: el.col,
        endRow: el.row + textHeight(el.font, el.hwScale),
        endCol: el.col + textWidth(el.font, el.content, el.hwScale)
      }
    case 'hline':
      return { row: el.row, col: el.col, endRow: el.row + el.thickness, endCol: el.col + el.length }
    case 'vline':
      return { row: el.row, col: el.col, endRow: el.row + el.height, endCol: el.col + el.thickness }
    case 'box':
      return { row: el.row, col: el.col, endRow: el.row + el.height, endCol: el.col + el.width }
    case 'qr': {
      const dotSize = el.dotSize ?? 6
      // QR matrix size is computed at runtime; use 41 modules (version 3-M) as a safe estimate
      const estimatedModules = 41
      const dim = estimatedModules * dotSize
      return { row: el.row, col: el.col, endRow: el.row + dim, endCol: el.col + dim }
    }
    case 'barcode':
      return { row: el.row, col: el.col, endRow: el.row + el.height, endCol: el.col + 300 }
  }
}

export function validate(doc: TicketDocument): ValidationError[] {
  const errors: ValidationError[] = []
  const stock = getStock(doc)
  const { widthDots, heightDots, safeMargin, exclusionZones } = stock

  const minRow = safeMargin
  const maxRow = widthDots - safeMargin
  const minCol = safeMargin
  const maxCol = heightDots - safeMargin

  if (doc.heat < 1 || doc.heat > 30) {
    errors.push({ field: 'heat', message: `Heat must be 1–30, got ${doc.heat}` })
  }

  doc.elements.forEach((el, i) => {
    const b = elementBounds(el)

    if (b.row < minRow) {
      errors.push({ elementIndex: i, field: 'row', message: `Row ${b.row} is below safe margin (${minRow})` })
    }
    if (b.endRow > maxRow) {
      errors.push({ elementIndex: i, field: 'row', message: `Element bottom ${b.endRow} exceeds max row ${maxRow}` })
    }
    if (b.col < minCol) {
      errors.push({ elementIndex: i, field: 'col', message: `Col ${b.col} is below safe margin (${minCol})` })
    }
    if (b.endCol > maxCol) {
      errors.push({ elementIndex: i, field: 'col', message: `Element right edge ${b.endCol} exceeds max col ${maxCol}` })
    }

    for (const zone of exclusionZones) {
      const overlaps = b.col < zone.colEnd && b.endCol > zone.colStart
      if (overlaps) {
        errors.push({
          elementIndex: i,
          field: 'col',
          message: `Element overlaps ${zone.label} (COL ${zone.colStart}–${zone.colEnd})`
        })
      }
    }

    if (
      (el.type === 'text' || el.type === 'barcode' || el.type === 'qr') &&
      !el.content.trim()
    ) {
      errors.push({ elementIndex: i, field: 'content', message: 'Content cannot be empty' })
    }
  })

  return errors
}
