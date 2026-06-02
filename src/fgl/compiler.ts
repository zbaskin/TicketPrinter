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

function n4(v: number): string {
  return String(Math.round(v)).padStart(4, '0')
}

function compileText(el: TextElement): string {
  let s = `<r${n4(el.row)}><c${n4(el.col)}><F${el.font}>`
  if (el.hwScale) {
    s += `<HW${el.hwScale[0]},${el.hwScale[1]}>`
  }
  if (el.rotation) {
    const rotMap: Record<number, string> = { 90: '<rte>', 180: '<ud>', 270: '<rte><ud>' }
    s += rotMap[el.rotation] ?? ''
  }
  s += el.content
  return s
}

function compileHLine(el: HLineElement): string {
  if (el.thickness === 1) {
    return `<lh${n4(el.row)},${n4(el.col)},${n4(el.length)}>`
  }
  // thickness > 1: use filled box (height = thickness, width = length)
  return `<bf${n4(el.row)},${n4(el.col)},${n4(el.length)},${n4(el.thickness)}>`
}

function compileVLine(el: VLineElement): string {
  if (el.thickness === 1) {
    return `<lv${n4(el.row)},${n4(el.col)},${n4(el.height)}>`
  }
  // thickness > 1: use filled box (width = thickness, height = height)
  return `<bf${n4(el.row)},${n4(el.col)},${n4(el.thickness)},${n4(el.height)}>`
}

function compileBox(el: BoxElement): string {
  if (el.fill) {
    // <bf row, col, col-extent (width), row-extent (height)>
    return `<bf${n4(el.row)},${n4(el.col)},${n4(el.width)},${n4(el.height)}>`
  }
  // <box row1,col1,row2,col2,thickness>
  return `<box${n4(el.row)},${n4(el.col)},${n4(el.row + el.height)},${n4(el.col + el.width)},${el.thickness}>`
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
        parts.push(`<bf${n4(row)},${n4(col)},${dotSize},${dotSize}>`)
      }
    }
  }
  return parts.join('')
}

// FGL barcode type codes for FGL26/46
const BARCODE_TYPE_CODES: Record<BarcodeType, string> = {
  'code128': '9',
  'code39': '0',
  'upc-a': '1',
  'ean13': '2',
  'interleaved25': '3'
}

function compileBarcode(el: BarcodeElement): string {
  const typeCode = BARCODE_TYPE_CODES[el.barcodeType]
  // <bc TYPE,ROW,COL,HEIGHT,NARROW_WIDTH,WIDE_WIDTH>data
  return `<bc${typeCode},${n4(el.row)},${n4(el.col)},${el.height},2,4>${el.content}`
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
  const parts: string[] = []
  parts.push(`<HEAT ${doc.heat}>`)
  parts.push('<NF>')
  for (const el of doc.elements) {
    parts.push(compileElement(el))
  }
  parts.push('<p>')
  return parts.join('')
}
