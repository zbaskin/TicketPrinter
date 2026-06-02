import type { StockDimensions } from '../../../fgl/stock'

export const SCALE = 0.15

export function snapToGrid(value: number, grid = 5): number {
  return Math.round(value / grid) * grid
}

export function clampToStock(
  row: number,
  col: number,
  stock: StockDimensions
): { row: number; col: number } {
  const clampedRow = Math.max(stock.safeMargin, Math.min(stock.widthDots - stock.safeMargin, row))
  const clampedCol = Math.max(stock.safeMargin, Math.min(stock.heightDots - stock.safeMargin, col))
  return { row: clampedRow, col: clampedCol }
}

export function svgCoordsFromPointer(
  clientX: number,
  clientY: number,
  svgEl: SVGSVGElement
): { x: number; y: number } {
  const ctm = svgEl.getScreenCTM()
  if (ctm === null) {
    return { x: NaN, y: NaN }
  }
  const pt = new DOMPoint(clientX, clientY)
  const transformed = pt.matrixTransform(ctm.inverse())
  return { x: transformed.x, y: transformed.y }
}
