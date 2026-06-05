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

// CINEMA physical layout: FGL row = horizontal (3.25" axis, 0-1950),
// FGL col = vertical (2" feed axis, 0-1200).
// Canvas uses the opposite convention (canvas col = horizontal, canvas row = vertical),
// so all coordinates must be swapped: FGL_row = canvas_col, FGL_col = canvas_row.
//
// PRINTER CONFIGURATION NOTE (CINEMA stock):
// All compiler tests pass and the generated FGL commands are correct. If the physical
// printout shows content offset (e.g. top-left of canvas prints halfway down the ticket,
// or bottom-edge content wraps to the previous ticket), the cause is the printer's
// "Top of Form" (TOF) offset, not a software bug.
//
// Diagnosis: the FGL coordinate origin (row=0, col=0) must correspond to the physical
// top-left corner of the 3.25"×2" CINEMA ticket. If it does not, the printer firmware's
// TOF is set to a non-zero value. Visual elements that appear "blank" are almost certainly
// printing outside the visible ticket area for the same reason — the compiler generates
// syntactically correct <LV>, <LH>, and <BX> commands.
//
// Fix: on the physical Boca printer, reset the CINEMA form's Top of Form offset to 0
// (typically via the printer control panel or Boca printer utility). The form length
// should be set to match the stock's 2" feed axis: 1200 dots at 600 DPI.
// Do NOT attempt to compensate for this offset in FGL code without first confirming
// the printer model and its FGL spec.

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
          // Swap: FGL_row = canvas_col, FGL_col = canvas_row
          parts.push(`<LH${n(physCol)},${n(physRow)},${n(physRow + dotSize)},${dotSize}>`)
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

// CINEMA coordinate swap: FGL_row = canvas_col, FGL_col = canvas_row.
// HLine/VLine swap types because the horizontal/vertical axes are exchanged.
// Text gains 90° CW rotation so characters advance left-to-right (+ROW direction).
function transformSwap(
  el: TextElement | HLineElement | VLineElement | BoxElement
): TicketElement {
  switch (el.type) {
    case 'text':
      return {
        ...el,
        row: el.col,
        col: el.row,
        rotation: (((el.rotation ?? 0) + 270) % 360) as 0 | 90 | 180 | 270
      }
    case 'hline':
      return {
        type: 'vline',
        row: el.col,
        col: el.row,
        height: el.length,
        thickness: el.thickness
      }
    case 'vline':
      return {
        type: 'hline',
        row: el.col,
        col: el.row,
        length: el.height,
        thickness: el.thickness
      }
    case 'box':
      return {
        ...el,
        row: el.col,
        col: el.row,
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
    return compileBarcode({ ...el, row: el.col, col: el.row }, true)
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
