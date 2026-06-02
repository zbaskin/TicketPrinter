// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import EditorCanvas from '../../editor/EditorCanvas'
import type { TicketDocument } from '../../../../fgl/types'

// Mock canvasUtils so svgCoordsFromPointer returns predictable SVG coordinates
vi.mock('../../editor/canvasUtils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../editor/canvasUtils')>()
  return {
    ...actual,
    svgCoordsFromPointer: vi.fn((_clientX: number, _clientY: number, _svgEl: SVGSVGElement) => ({
      x: _clientX * 0.15,
      y: _clientY * 0.15
    }))
  }
})

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
    fireEvent.pointerDown(element!, { clientX: 100, clientY: 100, pointerId: 1 })
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

  // ── Drag tests ──────────────────────────────────────────────────────────────

  it('firing pointerdown on an element calls onSelect with that index', () => {
    const onSelect = vi.fn()
    const { container } = render(
      <EditorCanvas document={concertDoc} selectedIndex={null} onSelect={onSelect} onUpdateElement={vi.fn()} />
    )
    const element = container.querySelector('[data-element-index="0"]')
    expect(element).not.toBeNull()
    fireEvent.pointerDown(element!, { clientX: 100, clientY: 100, pointerId: 1 })
    expect(onSelect).toHaveBeenCalledWith(0)
  })

  it('firing pointerdown then pointermove > 3px then pointerup calls onUpdateElement with new snapped position', () => {
    const onUpdateElement = vi.fn()
    const { container } = render(
      <EditorCanvas document={concertDoc} selectedIndex={null} onSelect={vi.fn()} onUpdateElement={onUpdateElement} />
    )
    const element = container.querySelector('[data-element-index="0"]')!
    const svg = container.querySelector('svg')!

    fireEvent.pointerDown(element, { clientX: 100, clientY: 100, pointerId: 1 })
    fireEvent.pointerMove(svg, { clientX: 160, clientY: 160, pointerId: 1 })
    fireEvent.pointerUp(svg, { clientX: 160, clientY: 160, pointerId: 1 })

    expect(onUpdateElement).toHaveBeenCalled()
    const call = onUpdateElement.mock.calls[onUpdateElement.mock.calls.length - 1]
    expect(call[0]).toBe(0)
    // Snapped position — value should be a multiple of 5
    expect(call[1].row % 5).toBe(0)
    expect(call[1].col % 5).toBe(0)
  })

  it('firing pointerdown then pointerup without significant movement does NOT call onUpdateElement', () => {
    const onUpdateElement = vi.fn()
    const { container } = render(
      <EditorCanvas document={concertDoc} selectedIndex={null} onSelect={vi.fn()} onUpdateElement={onUpdateElement} />
    )
    const element = container.querySelector('[data-element-index="0"]')!
    const svg = container.querySelector('svg')!

    fireEvent.pointerDown(element, { clientX: 100, clientY: 100, pointerId: 1 })
    // Move less than 3px
    fireEvent.pointerUp(svg, { clientX: 101, clientY: 101, pointerId: 1 })

    expect(onUpdateElement).not.toHaveBeenCalled()
  })

  it('pointerdown on the SVG root calls onSelect(-1)', () => {
    const onSelect = vi.fn()
    const { container } = render(
      <EditorCanvas document={concertDoc} selectedIndex={null} onSelect={onSelect} onUpdateElement={vi.fn()} />
    )
    const svg = container.querySelector('svg')!
    fireEvent.pointerDown(svg, { clientX: 10, clientY: 10, pointerId: 1 })
    expect(onSelect).toHaveBeenCalledWith(-1)
  })

  // ── Inline text edit tests ───────────────────────────────────────────────────

  it('double-clicking a text element shows an input with the element content', () => {
    const { container } = render(
      <EditorCanvas document={concertDoc} selectedIndex={null} onSelect={vi.fn()} onUpdateElement={vi.fn()} />
    )
    const element = container.querySelector('[data-element-index="0"]')!
    fireEvent.doubleClick(element)
    const input = container.querySelector('input')
    expect(input).not.toBeNull()
    expect((input as HTMLInputElement).value).toBe('Hello')
  })

  it('typing in input and pressing Enter calls onUpdateElement with updated content', () => {
    const onUpdateElement = vi.fn()
    const { container } = render(
      <EditorCanvas document={concertDoc} selectedIndex={null} onSelect={vi.fn()} onUpdateElement={onUpdateElement} />
    )
    const element = container.querySelector('[data-element-index="0"]')!
    fireEvent.doubleClick(element)
    const input = container.querySelector('input')!
    fireEvent.change(input, { target: { value: 'World' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onUpdateElement).toHaveBeenCalledWith(
      0,
      expect.objectContaining({ content: 'World' })
    )
    // Input should be gone after commit
    expect(container.querySelector('input')).toBeNull()
  })

  it('pressing Escape clears input without calling onUpdateElement', () => {
    const onUpdateElement = vi.fn()
    const { container } = render(
      <EditorCanvas document={concertDoc} selectedIndex={null} onSelect={vi.fn()} onUpdateElement={onUpdateElement} />
    )
    const element = container.querySelector('[data-element-index="0"]')!
    fireEvent.doubleClick(element)
    const input = container.querySelector('input')!
    fireEvent.change(input, { target: { value: 'Cancelled' } })
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(onUpdateElement).not.toHaveBeenCalled()
    expect(container.querySelector('input')).toBeNull()
  })

  it('double-clicking a non-text element does NOT show input', () => {
    const boxDoc: TicketDocument = {
      stock: 'CONCERT',
      heat: 10,
      elements: [
        { type: 'box', row: 100, col: 100, width: 200, height: 100, thickness: 2 }
      ]
    }
    const { container } = render(
      <EditorCanvas document={boxDoc} selectedIndex={null} onSelect={vi.fn()} onUpdateElement={vi.fn()} />
    )
    const element = container.querySelector('[data-element-index="0"]')!
    fireEvent.doubleClick(element)
    expect(container.querySelector('input')).toBeNull()
  })
})
