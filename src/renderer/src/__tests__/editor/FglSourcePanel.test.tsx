// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import FglSourcePanel from '../../editor/FglSourcePanel'
import type { TicketDocument } from '../../../../fgl/types'

const simpleDoc: TicketDocument = {
  stock: 'CONCERT',
  heat: 10,
  elements: [
    { type: 'text', row: 100, col: 100, font: 3, content: 'Hello' }
  ]
}

describe('FglSourcePanel', () => {
  it('renders compile() output in a pre block', () => {
    const { container } = render(<FglSourcePanel document={simpleDoc} />)
    const pre = container.querySelector('pre')
    expect(pre).not.toBeNull()
    expect(pre!.textContent).toContain('<HEAT 10>')
  })

  it('shows the <NF> token in the output', () => {
    const { container } = render(<FglSourcePanel document={simpleDoc} />)
    const pre = container.querySelector('pre')
    expect(pre!.textContent).toContain('<NF>')
  })

  it('shows the compiled text element', () => {
    const { container } = render(<FglSourcePanel document={simpleDoc} />)
    const pre = container.querySelector('pre')
    expect(pre!.textContent).toContain('Hello')
  })

  it('truncates at 2000 chars and shows truncation message', () => {
    // Build a doc with enough elements to exceed 2000 chars
    const bigDoc: TicketDocument = {
      stock: 'CONCERT',
      heat: 10,
      elements: Array.from({ length: 50 }, (_, i) => ({
        type: 'text' as const,
        row: 100 + i * 20,
        col: 100,
        font: 3 as const,
        content: 'A'.repeat(40)
      }))
    }
    const { container } = render(<FglSourcePanel document={bigDoc} />)
    const pre = container.querySelector('pre')
    expect(pre!.textContent).toContain('(truncated)')
    expect(pre!.textContent!.length).toBeLessThan(2200)
  })

  it('does not show truncation message for short output', () => {
    const { container } = render(<FglSourcePanel document={simpleDoc} />)
    const pre = container.querySelector('pre')
    expect(pre!.textContent).not.toContain('(truncated)')
  })
})
