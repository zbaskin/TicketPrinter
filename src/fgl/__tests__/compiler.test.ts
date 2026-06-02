import { describe, it, expect } from 'vitest'
import { compile } from '../compiler'
import type { TicketDocument } from '../types'

const base: TicketDocument = { stock: 'CONCERT', elements: [] }

describe('compile', () => {
  it('wraps output in NF and p commands in order', () => {
    const result = compile(base)
    expect(result).not.toContain('<HEAT')
    expect(result).toContain('<NF>')
    expect(result).toContain('<p>')
    expect(result.indexOf('<NF>')).toBeLessThan(result.indexOf('<p>'))
  })

  it('compiles a text element', () => {
    const result = compile({
      ...base,
      elements: [{ type: 'text', row: 100, col: 200, font: 3, content: 'Hello' }]
    })
    expect(result).toContain('<r0100>')
    expect(result).toContain('<c0200>')
    expect(result).toContain('<F3>')
    expect(result).toContain('Hello')
  })

  it('includes HW scale in text element', () => {
    const result = compile({
      ...base,
      elements: [{ type: 'text', row: 50, col: 50, font: 1, hwScale: [2, 3], content: 'Test' }]
    })
    expect(result).toContain('<HW2,3>')
  })

  it('compiles a 1-dot horizontal line with <lh>', () => {
    const result = compile({
      ...base,
      elements: [{ type: 'hline', row: 200, col: 100, length: 500, thickness: 1 }]
    })
    expect(result).toContain('<lh0200,0100,0500>')
  })

  it('compiles a thick horizontal line as filled box', () => {
    const result = compile({
      ...base,
      elements: [{ type: 'hline', row: 200, col: 100, length: 500, thickness: 4 }]
    })
    expect(result).toContain('<bf0200,0100,0500,0004>')
  })

  it('compiles a 1-dot vertical line with <lv>', () => {
    const result = compile({
      ...base,
      elements: [{ type: 'vline', row: 100, col: 300, height: 400, thickness: 1 }]
    })
    expect(result).toContain('<lv0100,0300,0400>')
  })

  it('compiles a box outline', () => {
    const result = compile({
      ...base,
      elements: [{ type: 'box', row: 50, col: 50, width: 200, height: 100, thickness: 3 }]
    })
    expect(result).toContain('<box0050,0050,0150,0250,3>')
  })

  it('compiles a filled box', () => {
    const result = compile({
      ...base,
      elements: [{ type: 'box', row: 50, col: 50, width: 200, height: 100, thickness: 1, fill: true }]
    })
    expect(result).toContain('<bf0050,0050,0200,0100>')
  })

  it('compiles QR as a sequence of filled box commands', () => {
    const result = compile({
      ...base,
      elements: [{ type: 'qr', row: 100, col: 100, content: 'https://example.com', dotSize: 6 }]
    })
    // QR generates many <bf> commands
    expect(result).toMatch(/<bf\d{4},\d{4},6,6>/)
  })
})
