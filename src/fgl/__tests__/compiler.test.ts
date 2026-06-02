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
