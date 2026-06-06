import type {
  TicketDocument,
  TicketElement,
  TextElement,
  HLineElement,
  VLineElement,
  BoxElement,
  QRElement,
  BarcodeElement,
  BarcodeType
} from './types'
import { generateQRMatrix } from './qr'

// Plain integer, no zero-padding (FGL does not require padding)
function n(v: number): string {
  return String(Math.round(v))
}

// Rotation commands (uppercase = per-ticket, reset with <NR>)
const ROTATION_CMDS: Record<number, string> = {
  90: '<RR>',
  180: '<RU>',
  270: '<RL>'
}

const CINEMA_WIDTH = 1200 // STOCKS.CINEMA.widthDots

// CINEMA physical layout (Boca Lemur, empirically confirmed):
//   FGL row = horizontal axis (3.25", 0–1950): increasing row moves RIGHT
//   FGL col = vertical axis  (2",    0–1200):  increasing col moves UPWARD (col=0 at bottom)
//
// Canvas convention: el.col = horizontal (x), el.row = vertical (y, increases downward).
// Required transforms: FGL_row = canvas_col (el.col)
//                      FGL_col = 1200 - canvas_row (inverted because canvas↓ ≠ FGL↑)
// CINEMA widthDots = 1200 (STOCKS.CINEMA.widthDots).

function compileText(el: TextElement): string {
  const font = `<F${el.font}>`
  // FGL <HW>: first = height multiplier, second = width multiplier
  // Our hwScale = [widthMult, heightMult], so swap for FGL
  const hw = el.hwScale ? `<HW${el.hwScale[1]},${el.hwScale[0]}>` : ''
  const rotCmd = el.rotation ? (ROTATION_CMDS[el.rotation] ?? '') : ''
  const resetRot = rotCmd ? '<NR>' : ''
  const pos = `<RC${n(el.row)},${n(el.col)}>`
  return `${font}${hw}${rotCmd}${pos}${el.content}${resetRot}`
}

function compileHLine(el: HLineElement): string {
  // <LH row, colStart, colEnd, thickness>
  return `<LH${n(el.row)},${n(el.col)},${n(el.col + el.length)},${el.thickness}>`
}

function compileVLine(el: VLineElement): string {
  // <LV col, rowStart, rowEnd, thickness>  — col is FIRST in FGL spec
  return `<LV${n(el.col)},${n(el.row)},${n(el.row + el.height)},${el.thickness}>`
}

function compileBox(el: BoxElement): string {
  if (el.fill) {
    // Filled rectangle via thick horizontal line (LH with height as thickness)
    return `<LH${n(el.row)},${n(el.col)},${n(el.col + el.width)},${el.height}>`
  }
  // Outline box — BX takes corners only; thickness not supported in basic BX
  return `<BX${n(el.row)},${n(el.col)},${n(el.row + el.height)},${n(el.col + el.width)}>`
}

function compileQR(el: QRElement, cinema = false): string {
  const dotSize = el.dotSize ?? 6
  const matrix = generateQRMatrix(el.content)
  const parts: string[] = []
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (matrix[r][c]) {
        const physRow = el.row + r * dotSize
        const physCol = el.col + c * dotSize
        if (cinema) {
          // FGL_row = physCol; FGL_col inverted: col end = 1200-physRow, col start = 1200-physRow-dotSize
          const colEnd = CINEMA_WIDTH - physRow
          const colStart = colEnd - dotSize
          parts.push(`<LH${n(physCol)},${n(colStart)},${n(colEnd)},${dotSize}>`)
        } else {
          parts.push(`<LH${n(physRow)},${n(physCol)},${n(physCol + dotSize)},${dotSize}>`)
        }
      }
    }
  }
  return parts.join('')
}

// FGL barcode commands (lowercase = all 4 rotations)
const BARCODE_CMDS: Record<BarcodeType, string> = {
  'code128':       'bc',
  'code39':        'b',
  'upc-a':         'upc',
  'ean13':         'e',
  'interleaved25': 'i'
}

function compileBarcode(el: BarcodeElement, cinema = false): string {
  const cmd = BARCODE_CMDS[el.barcodeType]
  // Height in FGL barcode units (1 unit = 8 dots)
  const heightUnits = Math.max(1, Math.round(el.height / 8))
  // <X2> = 2× bar width (minimum for reliable scanning at high DPI)
  // CINEMA: <RL> matches text rotation direction
  const rotPrefix = cinema ? '<RL>' : ''
  const rotSuffix = cinema ? '<NR>' : ''
  return `<X2>${rotPrefix}<RC${n(el.row)},${n(el.col)}><${cmd}${heightUnits}>${el.content}${rotSuffix}`
}

// CINEMA coordinate transform: FGL_row = canvas_col, FGL_col = 1200 - canvas_row.
// HLine/VLine swap types because axes are exchanged.
// Text gains 270° CCW rotation (<RL>) so characters advance left-to-right.
function transformSwap(
  el: TextElement | HLineElement | VLineElement | BoxElement
): TicketElement {
  switch (el.type) {
    case 'text':
      return {
        ...el,
        row: el.col,
        col: CINEMA_WIDTH - el.row,
        rotation: (((el.rotation ?? 0) + 270) % 360) as 0 | 90 | 180 | 270
      }
    case 'hline':
      return {
        type: 'vline',
        row: el.col,
        col: CINEMA_WIDTH - el.row,
        height: el.length,
        thickness: el.thickness
      }
    case 'vline':
      // Lower FGL_col bound = 1200 - (canvas_row + height); length unchanged.
      return {
        type: 'hline',
        row: el.col,
        col: CINEMA_WIDTH - el.row - el.height,
        length: el.height,
        thickness: el.thickness
      }
    case 'box':
      // Lower FGL_col corner = 1200 - (canvas_row + canvas_height); axes swap.
      return {
        ...el,
        row: el.col,
        col: CINEMA_WIDTH - el.row - el.height,
        width: el.height,
        height: el.width
      }
  }
}

function compileElementRaw(el: TicketElement): string {
  switch (el.type) {
    case 'text':    return compileText(el)
    case 'hline':   return compileHLine(el)
    case 'vline':   return compileVLine(el)
    case 'box':     return compileBox(el)
    case 'qr':      return compileQR(el)
    case 'barcode': return compileBarcode(el)
  }
}

function compileElement(el: TicketElement, cinema: boolean): string {
  if (!cinema) return compileElementRaw(el)
  if (el.type === 'qr') return compileQR(el, true)
  if (el.type === 'barcode') {
    return compileBarcode({ ...el, row: el.col, col: CINEMA_WIDTH - el.row }, true)
  }
  return compileElementRaw(transformSwap(el))
}

export function compile(doc: TicketDocument): string {
  if (doc.rawFglOverride !== undefined) {
    return doc.rawFglOverride
  }
  const cinema = doc.stock === 'CINEMA'
  const parts: string[] = ['<NF>']
  for (const el of doc.elements) {
    parts.push(compileElement(el, cinema))
  }
  parts.push('<p>')
  return parts.join('')
}
