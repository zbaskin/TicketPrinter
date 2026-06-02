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

function compileQR(el: QRElement): string {
  const dotSize = el.dotSize ?? 6
  const matrix = generateQRMatrix(el.content)
  const parts: string[] = []
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (matrix[r][c]) {
        const row = el.row + r * dotSize
        const col = el.col + c * dotSize
        // Each QR module = filled square via thick LH line
        parts.push(`<LH${n(row)},${n(col)},${n(col + dotSize)},${dotSize}>`)
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

function compileBarcode(el: BarcodeElement): string {
  const cmd = BARCODE_CMDS[el.barcodeType]
  // Height in FGL barcode units (1 unit = 8 dots)
  const heightUnits = Math.max(1, Math.round(el.height / 8))
  // <X2> = 2× bar width (minimum for reliable scanning at high DPI)
  return `<X2><RC${n(el.row)},${n(el.col)}><${cmd}${heightUnits}>${el.content}`
}

function compileElement(el: TicketElement): string {
  switch (el.type) {
    case 'text':    return compileText(el)
    case 'hline':   return compileHLine(el)
    case 'vline':   return compileVLine(el)
    case 'box':     return compileBox(el)
    case 'qr':      return compileQR(el)
    case 'barcode': return compileBarcode(el)
  }
}

export function compile(doc: TicketDocument): string {
  if (doc.rawFglOverride !== undefined) {
    return doc.rawFglOverride
  }
  const parts: string[] = ['<NF>']
  for (const el of doc.elements) {
    parts.push(compileElement(el))
  }
  parts.push('<p>')
  return parts.join('')
}
