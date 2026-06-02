import { describe, it, expect } from 'vitest'
import { validate } from '../validator'
import type { TicketDocument } from '../types'

const concert: TicketDocument = { stock: 'CONCERT', heat: 10, elements: [] }
const cinema: TicketDocument  = { stock: 'CINEMA',  heat: 10, elements: [] }

describe('validate', () => {
  it('passes a valid empty CONCERT document', () => {
    expect(validate(concert)).toHaveLength(0)
  })

  it('passes a valid empty CINEMA document', () => {
    expect(validate(cinema)).toHaveLength(0)
  })

  it('errors when heat is 0', () => {
    const errors = validate({ ...concert, heat: 0 })
    expect(errors.some((e) => e.field === 'heat')).toBe(true)
  })

  it('errors when heat is 31', () => {
    const errors = validate({ ...concert, heat: 31 })
    expect(errors.some((e) => e.field === 'heat')).toBe(true)
  })

  it('errors when text row is below safe margin', () => {
    const errors = validate({
      ...concert,
      elements: [{ type: 'text', row: 5, col: 200, font: 3, content: 'Test' }]
    })
    expect(errors.some((e) => e.field === 'row')).toBe(true)
  })

  it('errors when element right edge exceeds CONCERT max col', () => {
    const errors = validate({
      ...concert,
      elements: [{ type: 'hline', row: 100, col: 3200, length: 200, thickness: 1 }]
    })
    expect(errors.some((e) => e.field === 'col')).toBe(true)
  })

  it('errors when element overlaps CINEMA perforation band', () => {
    const errors = validate({
      ...cinema,
      elements: [{ type: 'hline', row: 100, col: 900, length: 200, thickness: 1 }]
    })
    expect(errors.some((e) => e.message.includes('Perforation band'))).toBe(true)
  })

  it('does not error when element is fully in CINEMA stub zone', () => {
    const errors = validate({
      ...cinema,
      elements: [{ type: 'text', row: 100, col: 50, font: 1, content: 'Stub text' }]
    })
    expect(errors).toHaveLength(0)
  })

  it('does not error when element is fully in CINEMA main zone', () => {
    const errors = validate({
      ...cinema,
      elements: [{ type: 'text', row: 100, col: 1050, font: 1, content: 'Main' }]
    })
    expect(errors).toHaveLength(0)
  })

  it('errors on empty text content', () => {
    const errors = validate({
      ...concert,
      elements: [{ type: 'text', row: 100, col: 200, font: 3, content: '' }]
    })
    expect(errors.some((e) => e.field === 'content')).toBe(true)
  })

  it('errors on whitespace-only text content', () => {
    const errors = validate({
      ...concert,
      elements: [{ type: 'text', row: 100, col: 200, font: 3, content: '   ' }]
    })
    expect(errors.some((e) => e.field === 'content')).toBe(true)
  })
})
