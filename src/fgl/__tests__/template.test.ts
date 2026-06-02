import { describe, it, expect } from 'vitest'
import { extractFields, substituteFields, applyDataRow } from '../template'
import type { TicketDocument } from '../types'

const emptyDoc: TicketDocument = { stock: 'CONCERT', elements: [] }

const docWithText: TicketDocument = {
  stock: 'CONCERT',

  elements: [
    { type: 'text', row: 100, col: 100, font: 1, content: 'Hello {{name}}!' },
    { type: 'text', row: 200, col: 100, font: 1, content: 'Seat: {{seat_number}}' }
  ]
}

const docMixed: TicketDocument = {
  stock: 'CONCERT',

  elements: [
    { type: 'text', row: 100, col: 100, font: 1, content: '{{name}} - {{seat_number}}' },
    { type: 'hline', row: 50, col: 0, length: 100, thickness: 1 },
    { type: 'text', row: 200, col: 100, font: 1, content: '{{name}} again' }
  ]
}

const docNonText: TicketDocument = {
  stock: 'CONCERT',

  elements: [
    { type: 'hline', row: 50, col: 0, length: 100, thickness: 1 },
    { type: 'box', row: 10, col: 10, width: 50, height: 30, thickness: 1 }
  ]
}

// ─── extractFields ────────────────────────────────────────────────────────────

describe('extractFields', () => {
  it('returns [] for a document with no elements', () => {
    expect(extractFields(emptyDoc)).toEqual([])
  })

  it('returns [] for a document with only non-text elements', () => {
    expect(extractFields(docNonText)).toEqual([])
  })

  it('returns [] for a document with text elements that have no placeholders', () => {
    const doc: TicketDocument = {
      stock: 'CONCERT',
    
      elements: [{ type: 'text', row: 100, col: 100, font: 1, content: 'Plain text, no placeholders' }]
    }
    expect(extractFields(doc)).toEqual([])
  })

  it('returns field names found in a single text element', () => {
    const doc: TicketDocument = {
      stock: 'CONCERT',
    
      elements: [{ type: 'text', row: 100, col: 100, font: 1, content: 'Hello {{name}}!' }]
    }
    expect(extractFields(doc)).toEqual(['name'])
  })

  it('returns field names found across multiple text elements', () => {
    expect(extractFields(docWithText)).toEqual(['name', 'seat_number'])
  })

  it('deduplicates field names that appear in multiple elements', () => {
    expect(extractFields(docMixed)).toEqual(['name', 'seat_number'])
  })

  it('returns a sorted array of field names', () => {
    const doc: TicketDocument = {
      stock: 'CONCERT',
    
      elements: [
        { type: 'text', row: 100, col: 100, font: 1, content: '{{zebra}} {{apple}} {{mango}}' }
      ]
    }
    expect(extractFields(doc)).toEqual(['apple', 'mango', 'zebra'])
  })

  it('supports underscore-separated field names', () => {
    const doc: TicketDocument = {
      stock: 'CONCERT',
    
      elements: [{ type: 'text', row: 100, col: 100, font: 1, content: '{{first_name}} {{last_name}}' }]
    }
    expect(extractFields(doc)).toEqual(['first_name', 'last_name'])
  })

  it('handles multiple occurrences of the same field in one element', () => {
    const doc: TicketDocument = {
      stock: 'CONCERT',
    
      elements: [{ type: 'text', row: 100, col: 100, font: 1, content: '{{name}} and {{name}} again' }]
    }
    expect(extractFields(doc)).toEqual(['name'])
  })

  it('ignores non-text elements (hline, box, qr, barcode) when extracting fields', () => {
    const doc: TicketDocument = {
      stock: 'CONCERT',
    
      elements: [
        { type: 'hline', row: 50, col: 0, length: 100, thickness: 1 },
        { type: 'text', row: 100, col: 100, font: 1, content: '{{event}}' },
        { type: 'box', row: 10, col: 10, width: 50, height: 30, thickness: 1 }
      ]
    }
    expect(extractFields(doc)).toEqual(['event'])
  })
})

// ─── substituteFields ─────────────────────────────────────────────────────────

describe('substituteFields', () => {
  it('replaces a single placeholder', () => {
    expect(substituteFields('Hello {{name}}!', { name: 'World' })).toBe('Hello World!')
  })

  it('replaces multiple different placeholders', () => {
    expect(substituteFields('{{greeting}} {{name}}', { greeting: 'Hi', name: 'Alice' })).toBe('Hi Alice')
  })

  it('replaces multiple occurrences of the same placeholder', () => {
    expect(substituteFields('{{x}} and {{x}}', { x: 'foo' })).toBe('foo and foo')
  })

  it('leaves unknown placeholders unchanged', () => {
    expect(substituteFields('Hello {{unknown}}!', { name: 'World' })).toBe('Hello {{unknown}}!')
  })

  it('with empty data object returns original string unchanged', () => {
    expect(substituteFields('Hello {{name}}!', {})).toBe('Hello {{name}}!')
  })

  it('with empty string input returns empty string', () => {
    expect(substituteFields('', { name: 'World' })).toBe('')
  })

  it('partial data: replaces known fields, leaves unknown fields', () => {
    expect(substituteFields('{{a}} {{b}} {{c}}', { a: '1', c: '3' })).toBe('1 {{b}} 3')
  })

  it('handles numeric string values in data', () => {
    expect(substituteFields('Row {{row}} Seat {{seat}}', { row: '5', seat: '12' })).toBe('Row 5 Seat 12')
  })

  it('handles value that is empty string', () => {
    expect(substituteFields('Hello {{name}}!', { name: '' })).toBe('Hello !')
  })

  it('does not replace invalid placeholder syntax (no double braces)', () => {
    expect(substituteFields('Hello {name}!', { name: 'World' })).toBe('Hello {name}!')
  })
})

// ─── applyDataRow ─────────────────────────────────────────────────────────────

describe('applyDataRow', () => {
  it('substitutes placeholders in all text elements', () => {
    const data = { name: 'Alice', seat_number: 'A1' }
    const result = applyDataRow(docWithText, data)

    const textEls = result.elements.filter((el) => el.type === 'text') as Array<{ content: string }>
    expect(textEls[0].content).toBe('Hello Alice!')
    expect(textEls[1].content).toBe('Seat: A1')
  })

  it('does not mutate the original document', () => {
    const data = { name: 'Bob', seat_number: 'B2' }
    applyDataRow(docWithText, data)

    const textEls = docWithText.elements.filter((el) => el.type === 'text') as Array<{ content: string }>
    expect(textEls[0].content).toBe('Hello {{name}}!')
    expect(textEls[1].content).toBe('Seat: {{seat_number}}')
  })

  it('leaves non-text elements unchanged', () => {
    const doc: TicketDocument = {
      stock: 'CONCERT',
    
      elements: [
        { type: 'hline', row: 50, col: 0, length: 100, thickness: 1 },
        { type: 'text', row: 100, col: 100, font: 1, content: '{{name}}' }
      ]
    }
    const result = applyDataRow(doc, { name: 'Test' })
    expect(result.elements[0]).toEqual({ type: 'hline', row: 50, col: 0, length: 100, thickness: 1 })
  })

  it('preserves non-content properties of text elements', () => {
    const doc: TicketDocument = {
      stock: 'CONCERT',
    
      elements: [
        { type: 'text', row: 42, col: 99, font: 3, hwScale: [2, 2], rotation: 90, content: '{{field}}' }
      ]
    }
    const result = applyDataRow(doc, { field: 'VALUE' })
    const el = result.elements[0] as { type: string; row: number; col: number; font: number; hwScale: number[]; rotation: number; content: string }
    expect(el.row).toBe(42)
    expect(el.col).toBe(99)
    expect(el.font).toBe(3)
    expect(el.hwScale).toEqual([2, 2])
    expect(el.rotation).toBe(90)
    expect(el.content).toBe('VALUE')
  })

  it('returns a new document object (not the same reference)', () => {
    const data = { name: 'Test' }
    const result = applyDataRow(docWithText, data)
    expect(result).not.toBe(docWithText)
    expect(result.elements).not.toBe(docWithText.elements)
  })

  it('preserves document-level properties (stock)', () => {
    const data = { name: 'Alice', seat_number: 'A1' }
    const result = applyDataRow(docWithText, data)
    expect(result.stock).toBe('CONCERT')
  })

  it('with empty data leaves all placeholders unchanged', () => {
    const result = applyDataRow(docWithText, {})
    const textEls = result.elements.filter((el) => el.type === 'text') as Array<{ content: string }>
    expect(textEls[0].content).toBe('Hello {{name}}!')
    expect(textEls[1].content).toBe('Seat: {{seat_number}}')
  })

  it('handles document with no text elements', () => {
    const result = applyDataRow(docNonText, { name: 'Alice' })
    expect(result.elements).toHaveLength(2)
    expect(result.elements[0].type).toBe('hline')
  })
})
