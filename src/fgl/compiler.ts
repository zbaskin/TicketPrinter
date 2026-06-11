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
import { getStock } from './stock'

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

// CINEMA form height = 1200 dots (2" × 600 DPI).
// FGL col range is 0–1200; values above 1200 are silently discarded by the printer.
// If physical output appears offset, adjust the printer's TOF (Top of Form) setting —
// do NOT increase this constant past 1200, as that clips the top half of the canvas.
const CINEMA_WIDTH = 1200

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
  const inverseOn = el.inverse ? '<EI>' : ''
  const inverseOff = el.inverse ? '<DI>' : ''

  if (el.align === 'center' && el.fieldWidth) {
    return `${font}${hw}${rotCmd}${pos}${inverseOn}<CTR${el.fieldWidth}>~${el.content}~${inverseOff}${resetRot}`
  }
  if (el.align === 'right' && el.fieldWidth) {
    return `${font}${hw}${rotCmd}${pos}${inverseOn}<RTJ${el.fieldWidth}>~${el.content}~${inverseOff}${resetRot}`
  }
  return `${font}${hw}${rotCmd}${pos}${inverseOn}${el.content}${inverseOff}${resetRot}`
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

// Wrap barcode content in the delimiters required by the FGL spec for each type.
// Already-wrapped content is left unchanged to avoid double-wrapping.
function wrapBarcodeContent(type: BarcodeType, content: string): string {
  switch (type) {
    case 'code128':
      if (!content.startsWith('^')) content = '^' + content
      if (!content.endsWith('^')) content = content + '^'
      return content
    case 'code39':
      if (!content.startsWith('*')) content = '*' + content
      if (!content.endsWith('*')) content = content + '*'
      return content
    case 'interleaved25':
      if (!content.startsWith(':')) content = ':' + content
      if (!content.endsWith(':')) content = content + ':'
      return content
    case 'upc-a':
      // 12-digit string gets J/K/L guard characters; already-formatted strings pass through
      if (content.length === 12 && !content.includes('J')) {
        return `J${content.slice(0, 6)}K${content.slice(6)}L`
      }
      return content
    case 'ean13':
      // 13-digit string: first digit is parity flag, rest gets J/K/L guards
      if (content.length === 13 && !content.includes('J')) {
        return `${content[0]}J${content.slice(1, 7)}K${content.slice(7)}L`
      }
      return content
    default:
      return content
  }
}

function compileQR(el: QRElement, cinema = false): string {
  // Native QR: use the printer's built-in <QR> command (requires FGL46G36+ + font SB03+).
  // Much smaller FGL payload than the manual matrix approach.
  if (el.nativeQR) {
    const fontNum = el.fontNumber ?? 68  // F65–78 controls module size; 68 ≈ 6pt (medium)
    const fglRow = cinema ? el.col : el.row
    const fglCol = cinema ? CINEMA_WIDTH - el.row : el.col
    return `<F${fontNum}><RC${n(fglRow)},${n(fglCol)}><QR>{${el.content}}`
  }

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
  const bi = el.showText ? '<BI>' : ''
  // <X2> = 2× bar width (minimum for reliable scanning at high DPI)
  // CINEMA: <RL> matches text rotation direction
  const rotPrefix = cinema ? '<RL>' : ''
  const rotSuffix = cinema ? '<NR>' : ''
  const content = wrapBarcodeContent(el.barcodeType, el.content)
  return `<X2>${bi}${rotPrefix}<RC${n(el.row)},${n(el.col)}><${cmd}${heightUnits}>${content}${rotSuffix}`
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

// Body of a ticket without the leading <NF>. Used for tickets after the first
// in a batch stream — <NF> between tickets causes the printer to advance an
// extra form, skipping the current ticket's print position.
// When copies > 1, <RE{copies-1}> is prepended to <p> so the printer repeats
// internally — no need to send the full FGL N times.
export function compileSingle(doc: TicketDocument, copies = 1): string {
  if (doc.rawFglOverride !== undefined) {
    return doc.rawFglOverride
  }
  const cinema = doc.stock === 'CINEMA'
  const stock = getStock(doc)
  const feedDots = cinema ? stock.widthDots : stock.heightDots
  const parts: string[] = [`<FL${feedDots}>`]
  for (const el of doc.elements) {
    parts.push(compileElement(el, cinema))
  }
  parts.push(copies > 1 ? `<RE${copies - 1}><p>` : '<p>')
  return parts.join('')
}

export function compileBatch(docs: TicketDocument[]): string {
  if (docs.length === 0) return ''
  return compile(docs[0]) + docs.slice(1).map((d) => compileSingle(d)).join('')
}

export function compile(doc: TicketDocument): string {
  if (doc.rawFglOverride !== undefined) {
    return doc.rawFglOverride
  }
  return '<NF>' + compileSingle(doc)
}

// Print N copies of one ticket using the printer's native repeat mechanism.
// Sends the layout once with <RE{copies-1}> before <p> — far more efficient
// than compiling N identical tickets via compileBatch.
export function compileWithCopies(doc: TicketDocument, copies: number): string {
  if (doc.rawFglOverride !== undefined) return doc.rawFglOverride
  return '<NF>' + compileSingle(doc, copies)
}
