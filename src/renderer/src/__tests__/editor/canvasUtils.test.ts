// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { snapToGrid, clampToStock, svgCoordsFromPointer } from '../../editor/canvasUtils'
import type { StockDimensions } from '../../../../fgl/stock'

const sampleStock: StockDimensions = {
  widthDots: 559,
  heightDots: 1600,
  safeMargin: 20,
  exclusionZones: []
}

describe('snapToGrid', () => {
  it('snaps 7 to 5 with grid=5', () => {
    expect(snapToGrid(7, 5)).toBe(5)
  })

  it('snaps 8 to 10 with grid=5', () => {
    expect(snapToGrid(8, 5)).toBe(10)
  })

  it('snaps 0 to 0 with grid=5', () => {
    expect(snapToGrid(0, 5)).toBe(0)
  })

  it('snaps exactly on grid boundary', () => {
    expect(snapToGrid(10, 5)).toBe(10)
  })
})

describe('clampToStock', () => {
  it('clamps row below safeMargin to safeMargin', () => {
    const result = clampToStock(5, 100, sampleStock)
    expect(result.row).toBe(sampleStock.safeMargin)
  })

  it('clamps row above (widthDots - safeMargin) to that max', () => {
    const max = sampleStock.widthDots - sampleStock.safeMargin
    const result = clampToStock(max + 50, 100, sampleStock)
    expect(result.row).toBe(max)
  })

  it('clamps col below safeMargin to safeMargin', () => {
    const result = clampToStock(100, 5, sampleStock)
    expect(result.col).toBe(sampleStock.safeMargin)
  })

  it('clamps col above (heightDots - safeMargin) to that max', () => {
    const max = sampleStock.heightDots - sampleStock.safeMargin
    const result = clampToStock(100, max + 50, sampleStock)
    expect(result.col).toBe(max)
  })

  it('leaves in-bounds values unchanged', () => {
    const result = clampToStock(200, 300, sampleStock)
    expect(result.row).toBe(200)
    expect(result.col).toBe(300)
  })
})

describe('svgCoordsFromPointer', () => {
  it('returns { x: NaN, y: NaN } when getScreenCTM() returns null', () => {
    const mockSvg = {
      getScreenCTM: vi.fn().mockReturnValue(null)
    } as unknown as SVGSVGElement
    const result = svgCoordsFromPointer(100, 200, mockSvg)
    expect(isNaN(result.x)).toBe(true)
    expect(isNaN(result.y)).toBe(true)
  })
})
