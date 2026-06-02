// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import EditorCanvas from '../../editor/EditorCanvas'
import type { TicketDocument } from '../../../../fgl/types'

const concertDoc: TicketDocument = {
  stock: 'CONCERT',
  heat: 10,
  elements: [
    { type: 'text', row: 100, col: 100, font: 3, content: 'Hello' }
  ]
}

const cinemaDoc: TicketDocument = {
  stock: 'CINEMA',
  heat: 10,
  elements: []
}

describe('EditorCanvas', () => {
  it('renders an SVG element', () => {
    const { container } = render(
      <EditorCanvas document={concertDoc} selectedIndex={null} onSelect={vi.fn()} onUpdateElement={vi.fn()} />
    )
    expect(container.querySelector('svg')).not.toBeNull()
  })

  it('renders the stock boundary rect', () => {
    const { container } = render(
      <EditorCanvas document={concertDoc} selectedIndex={null} onSelect={vi.fn()} onUpdateElement={vi.fn()} />
    )
    const rects = container.querySelectorAll('rect')
    expect(rects.length).toBeGreaterThan(0)
  })

  it('renders CINEMA exclusion zone when stock is CINEMA', () => {
    const { container } = render(
      <EditorCanvas document={cinemaDoc} selectedIndex={null} onSelect={vi.fn()} onUpdateElement={vi.fn()} />
    )
    const exclusionZone = container.querySelector('[data-testid="exclusion-zone"]')
    expect(exclusionZone).not.toBeNull()
  })

  it('does NOT render CINEMA exclusion zone when stock is CONCERT', () => {
    const { container } = render(
      <EditorCanvas document={concertDoc} selectedIndex={null} onSelect={vi.fn()} onUpdateElement={vi.fn()} />
    )
    const exclusionZone = container.querySelector('[data-testid="exclusion-zone"]')
    expect(exclusionZone).toBeNull()
  })

  it('clicking an element calls onSelect with its index', () => {
    const onSelect = vi.fn()
    const { container } = render(
      <EditorCanvas document={concertDoc} selectedIndex={null} onSelect={onSelect} onUpdateElement={vi.fn()} />
    )
    const element = container.querySelector('[data-element-index="0"]')
    expect(element).not.toBeNull()
    fireEvent.click(element!)
    expect(onSelect).toHaveBeenCalledWith(0)
  })

  it('selected element has data-selected attribute', () => {
    const { container } = render(
      <EditorCanvas document={concertDoc} selectedIndex={0} onSelect={vi.fn()} onUpdateElement={vi.fn()} />
    )
    const selected = container.querySelector('[data-selected="true"]')
    expect(selected).not.toBeNull()
  })

  it('non-selected element does not have data-selected="true"', () => {
    const docTwoElements: TicketDocument = {
      stock: 'CONCERT',
      heat: 10,
      elements: [
        { type: 'text', row: 100, col: 100, font: 3, content: 'A' },
        { type: 'text', row: 200, col: 100, font: 3, content: 'B' }
      ]
    }
    const { container } = render(
      <EditorCanvas document={docTwoElements} selectedIndex={0} onSelect={vi.fn()} onUpdateElement={vi.fn()} />
    )
    const notSelected = container.querySelector('[data-element-index="1"]')
    expect(notSelected?.getAttribute('data-selected')).not.toBe('true')
  })

  it('renders a rect placeholder for qr elements', () => {
    const qrDoc: TicketDocument = {
      stock: 'CONCERT',
      heat: 10,
      elements: [
        { type: 'qr', row: 100, col: 100, content: 'https://example.com', dotSize: 6 }
      ]
    }
    const { container } = render(
      <EditorCanvas document={qrDoc} selectedIndex={null} onSelect={vi.fn()} onUpdateElement={vi.fn()} />
    )
    const el = container.querySelector('[data-element-index="0"]')
    expect(el).not.toBeNull()
  })
})
