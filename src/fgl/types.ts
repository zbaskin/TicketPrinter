export type FontId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

export type BarcodeType = 'code128' | 'code39' | 'upc-a' | 'ean13' | 'interleaved25'

export interface TextElement {
  type: 'text'
  row: number
  col: number
  font: FontId
  hwScale?: [number, number]
  rotation?: 0 | 90 | 180 | 270
  content: string
}

export interface HLineElement {
  type: 'hline'
  row: number
  col: number
  length: number
  thickness: number
}

export interface VLineElement {
  type: 'vline'
  row: number
  col: number
  height: number
  thickness: number
}

export interface BoxElement {
  type: 'box'
  row: number
  col: number
  width: number
  height: number
  thickness: number
  fill?: boolean
}

export interface QRElement {
  type: 'qr'
  row: number
  col: number
  content: string
  dotSize?: number
}

export interface BarcodeElement {
  type: 'barcode'
  row: number
  col: number
  barcodeType: BarcodeType
  height: number
  content: string
}

export type TicketElement =
  | TextElement
  | HLineElement
  | VLineElement
  | BoxElement
  | QRElement
  | BarcodeElement

export type StockId = 'CONCERT' | 'CINEMA' | 'custom'

export interface TicketDocument {
  stock: StockId
  customWidth?: number
  customHeight?: number
  heat: number
  elements: TicketElement[]
  rawFglOverride?: string
}
