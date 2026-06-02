import type { FontId } from './types'

export interface FontMetrics {
  charWidth: number
  charHeight: number
}

// Approximate character cell sizes at 600 DPI.
// HW scale multipliers (e.g. <HW2,2>) scale these linearly.
// Calibrate against actual prints before relying on these for layout.
export const FONT_METRICS: Record<FontId, FontMetrics> = {
  1: { charWidth: 6,  charHeight: 12 },
  2: { charWidth: 8,  charHeight: 16 },
  3: { charWidth: 10, charHeight: 20 },
  4: { charWidth: 12, charHeight: 24 },
  5: { charWidth: 16, charHeight: 32 },
  6: { charWidth: 20, charHeight: 40 },
  7: { charWidth: 24, charHeight: 48 },
  8: { charWidth: 32, charHeight: 64 },
  9: { charWidth: 48, charHeight: 96 }
}

export function textWidth(font: FontId, content: string, hwScale?: [number, number]): number {
  const { charWidth } = FONT_METRICS[font]
  const wScale = hwScale ? hwScale[0] : 1
  return content.length * charWidth * wScale
}

export function textHeight(font: FontId, hwScale?: [number, number]): number {
  const { charHeight } = FONT_METRICS[font]
  const hScale = hwScale ? hwScale[1] : 1
  return charHeight * hScale
}
