import { describe, it, expect } from 'vitest'
import { compile } from '../compiler'
import type { TicketDocument } from '../types'

const base: TicketDocument = { stock: 'CONCERT', elements: [] }

describe('compile', () => {
  it('wraps output in NF and p, no HEAT command', () => {
    const result = compile(base)
    expect(result).toContain('<NF>')
    expect(result).toContain('<p>')
    expect(result).not.toContain('<HEAT')
    expect(result.indexOf('<NF>')).toBeLessThan(result.indexOf('<p>'))
  })

  it('returns rawFglOverride verbatim when set', () => {
    const result = compile({ ...base, rawFglOverride: '<NF>CUSTOM<p>' })
    expect(result).toBe('<NF>CUSTOM<p>')
  })

  it('compiles a text element using RC positioning', () => {
    const result = compile({
      ...base,
      elements: [{ type: 'text', row: 100, col: 200, font: 3, content: 'Hello' }]
    })
    expect(result).toContain('<F3>')
    expect(result).toContain('<RC100,200>')
    expect(result).toContain('Hello')
    // Must NOT use the old <r####> or <c####> format
    expect(result).not.toMatch(/<r\d{4}>/)
    expect(result).not.toMatch(/<c\d{4}>/)
  })

  it('emits HW with height first, width second (FGL spec order)', () => {
    // hwScale = [widthMult, heightMult] internally → FGL outputs <HW heightMult,widthMult>
    const result = compile({
      ...base,
      elements: [{ type: 'text', row: 50, col: 50, font: 1, hwScale: [2, 4], content: 'X' }]
    })
    expect(result).toContain('<HW4,2>') // height=4, width=2
  })

  it('emits symmetric HW unchanged', () => {
    const result = compile({
      ...base,
      elements: [{ type: 'text', row: 50, col: 50, font: 3, hwScale: [3, 3], content: 'Y' }]
    })
    expect(result).toContain('<HW3,3>')
  })

  it('compiles a horizontal line with LH and col_end (not length)', () => {
    const result = compile({
      ...base,
      elements: [{ type: 'hline', row: 200, col: 100, length: 500, thickness: 1 }]
    })
    // <LH row,colStart,colEnd,thickness>  colEnd = 100+500 = 600
    expect(result).toContain('<LH200,100,600,1>')
  })

  it('compiles a thick horizontal line as LH with larger thickness', () => {
    const result = compile({
      ...base,
      elements: [{ type: 'hline', row: 200, col: 100, length: 500, thickness: 4 }]
    })
    expect(result).toContain('<LH200,100,600,4>')
  })

  it('compiles a vertical line with LV (col is first parameter)', () => {
    const result = compile({
      ...base,
      elements: [{ type: 'vline', row: 100, col: 300, height: 400, thickness: 1 }]
    })
    // <LV col,rowStart,rowEnd,thickness>  rowEnd = 100+400 = 500
    expect(result).toContain('<LV300,100,500,1>')
  })

  it('compiles an outline box with BX (corner coordinates)', () => {
    const result = compile({
      ...base,
      elements: [{ type: 'box', row: 50, col: 50, width: 200, height: 100, thickness: 3 }]
    })
    // <BX row1,col1,row2,col2>  row2=50+100=150, col2=50+200=250
    expect(result).toContain('<BX50,50,150,250>')
  })

  it('compiles a filled box as a thick LH line', () => {
    const result = compile({
      ...base,
      elements: [{ type: 'box', row: 50, col: 50, width: 200, height: 100, thickness: 1, fill: true }]
    })
    // <LH row,colStart,colEnd,height>  colEnd=50+200=250, height=100 as thickness
    expect(result).toContain('<LH50,50,250,100>')
  })

  it('compiles QR as LH commands (one per dark module)', () => {
    const result = compile({
      ...base,
      elements: [{ type: 'qr', row: 100, col: 100, content: 'https://example.com', dotSize: 6 }]
    })
    // Each QR dot = <LH row,col,col+6,6>
    expect(result).toMatch(/<LH\d+,\d+,\d+,6>/)
    expect(result).not.toContain('<bf')
  })

  it('compiles rotation using per-ticket commands and resets with NR', () => {
    const result = compile({
      ...base,
      elements: [{ type: 'text', row: 100, col: 100, font: 3, rotation: 90, content: 'Rotated' }]
    })
    expect(result).toContain('<RR>')
    expect(result).toContain('<NR>')
    expect(result).not.toContain('<rte>')
  })
})

const cinema: TicketDocument = { stock: 'CINEMA', elements: [] }

describe('compile CINEMA coordinate swap', () => {
  // CINEMA physical: FGL row = horizontal (3.25" = 0-1950), FGL col = vertical (2" = 0-1200).
  // Canvas: col = horizontal, row = vertical.
  // Transform: new_row = canvas_col, new_col = canvas_row (simple swap, no inversion).
  // Text gains 90° CW rotation (<RR>) so characters advance left-to-right.

  it('swaps text position and adds CCW rotation (<RL>)', () => {
    // (row=100, col=200) → new_row=200, new_col=100; rotation 0→270 (<RL>)
    const result = compile({
      ...cinema,
      elements: [{ type: 'text', row: 100, col: 200, font: 1, content: 'Hello' }]
    })
    expect(result).toContain('<RC200,100>')
    expect(result).toContain('<RL>')
    expect(result).toContain('<NR>')
    expect(result).not.toContain('<RR>')
  })

  it('combines text rotation correctly: 90 + 270 = 0 (no rotation cmd)', () => {
    // 90 + 270 = 360 = 0 → no rotation command emitted
    const result = compile({
      ...cinema,
      elements: [{ type: 'text', row: 50, col: 100, font: 2, rotation: 90, content: 'X' }]
    })
    expect(result).toContain('<RC100,50>')
    expect(result).not.toContain('<RR>')
    expect(result).not.toContain('<RL>')
    expect(result).not.toContain('<NR>')
  })

  it('transforms hline into vline: new_row=col, new_col=row, height=length', () => {
    // hline (row=200, col=100, length=500) → vline(row=100, col=200, height=500)
    // VLine FGL: <LV col, rowStart, rowEnd, thickness> = <LV200,100,600,1>
    const result = compile({
      ...cinema,
      elements: [{ type: 'hline', row: 200, col: 100, length: 500, thickness: 1 }]
    })
    expect(result).toContain('<LV200,100,600,1>')
  })

  it('transforms vline into hline: new_row=col, new_col=row, length=height', () => {
    // vline (row=100, col=300, height=400) → hline(row=300, col=100, length=400)
    // HLine FGL: <LH row, colStart, colEnd, thickness> = <LH300,100,500,1>
    const result = compile({
      ...cinema,
      elements: [{ type: 'vline', row: 100, col: 300, height: 400, thickness: 1 }]
    })
    expect(result).toContain('<LH300,100,500,1>')
  })

  it('transforms outline box: swaps row/col and width/height', () => {
    // box (row=50, col=50, width=200, height=100) → row=50, col=50, width=100, height=200
    // BX: <BX row,col,row+height,col+width> = <BX50,50,250,150>
    const result = compile({
      ...cinema,
      elements: [{ type: 'box', row: 50, col: 50, width: 200, height: 100, thickness: 1 }]
    })
    expect(result).toContain('<BX50,50,250,150>')
  })

  it('transforms filled box: swaps row/col and width/height', () => {
    // box fill=true (row=50, col=50, width=200, height=100) → row=50, col=50, width=100, height=200
    // LH: <LH row,col,col+width,height> = <LH50,50,150,200>
    const result = compile({
      ...cinema,
      elements: [{ type: 'box', row: 50, col: 50, width: 200, height: 100, thickness: 1, fill: true }]
    })
    expect(result).toContain('<LH50,50,150,200>')
  })

  it('transforms QR dot positions by swapping physRow and physCol', () => {
    // QR at (row=0, col=0, dotSize=6): dot (r,c) → LH at (c*6, r*6, r*6+6, 6)
    // All LH row values should be multiples of dotSize (= col positions of original dots)
    const result = compile({
      ...cinema,
      elements: [{ type: 'qr', row: 0, col: 0, content: 'A', dotSize: 6 }]
    })
    const lhMatches = [...result.matchAll(/<LH(\d+),(\d+),(\d+),6>/g)]
    expect(lhMatches.length).toBeGreaterThan(0)
    for (const m of lhMatches) {
      // row values come from original col positions (multiples of dotSize from el.col=0)
      expect(parseInt(m[1]) % 6).toBe(0)
    }
  })

  it('does not affect CONCERT elements', () => {
    const result = compile({
      ...base,
      elements: [{ type: 'text', row: 100, col: 200, font: 1, content: 'Test' }]
    })
    expect(result).toContain('<RC100,200>')
    expect(result).not.toContain('<RR>')
    expect(result).not.toContain('<RL>')
    expect(result).not.toContain('<NR>')
  })
})
