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

  elements: [
    { type: 'text', row: 100, col: 100, font: 3, content: 'Hello' }
  ]
}

const cinemaDoc: TicketDocument = {
  stock: 'CINEMA',

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

  // ── hwScale text rendering tests ────────────────────────────────────────────

  it('text with hwScale has larger fontSize (height multiplier)', () => {
    const doc: TicketDocument = {
      stock: 'CONCERT',
      elements: [{ type: 'text', row: 100, col: 100, font: 3, hwScale: [2, 3], content: 'Hi' }]
    }
    const { container } = render(
      <EditorCanvas document={doc} selectedIndex={null} onSelect={vi.fn()} onUpdateElement={vi.fn()} />
    )
    const svgText = container.querySelector('[data-element-index="0"] text')
    // fontSize = 10 * SCALE * font * hwScale[1] = 10 * 0.15 * 3 * 3 = 13.5
    expect(svgText?.getAttribute('font-size')).toBe('13.5')
  })

  it('text without hwScale uses base fontSize', () => {
    const { container } = render(
      <EditorCanvas document={concertDoc} selectedIndex={null} onSelect={vi.fn()} onUpdateElement={vi.fn()} />
    )
    const svgText = container.querySelector('[data-element-index="0"] text')
    // fontSize = 10 * SCALE * font = 10 * 0.15 * 3 = 4.5
    expect(svgText?.getAttribute('font-size')).toBe('4.5')
  })

  it('text with hwScale has wider hit rect (width multiplier)', () => {
    const doc: TicketDocument = {
      stock: 'CONCERT',
      elements: [{ type: 'text', row: 100, col: 100, font: 3, hwScale: [2, 3], content: 'Hi' }]
    }
    const { container } = render(
      <EditorCanvas document={doc} selectedIndex={null} onSelect={vi.fn()} onUpdateElement={vi.fn()} />
    )
    const hitRect = container.querySelector('[data-element-index="0"] rect')
    // width = len * font * 6 * SCALE * hwScale[0] = 2 * 3 * 6 * 0.15 * 2 = 10.8
    expect(parseFloat(hitRect?.getAttribute('width') ?? '0')).toBeCloseTo(10.8)
  })

  // ── zoom prop tests ──────────────────────────────────────────────────────────

  it('zoom=2 doubles the SVG width and height', () => {
    const { container } = render(
      <EditorCanvas document={concertDoc} selectedIndex={null} onSelect={vi.fn()} onUpdateElement={vi.fn()} zoom={2} />
    )
    const svg = container.querySelector('svg')
    // CONCERT heightDots=3300, widthDots=1200; SCALE=0.15; zoom=2
    expect(svg?.getAttribute('width')).toBe('990')   // 3300 * 0.15 * 2
    expect(svg?.getAttribute('height')).toBe('360')  // 1200 * 0.15 * 2
  })

  it('default zoom=1 keeps base SVG dimensions', () => {
    const { container } = render(
      <EditorCanvas document={concertDoc} selectedIndex={null} onSelect={vi.fn()} onUpdateElement={vi.fn()} />
    )
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('width')).toBe('495')   // 3300 * 0.15
    expect(svg?.getAttribute('height')).toBe('180')  // 1200 * 0.15
  })

  it('zoom=2 doubles the x position of a text element', () => {
    const { container } = render(
      <EditorCanvas document={concertDoc} selectedIndex={null} onSelect={vi.fn()} onUpdateElement={vi.fn()} zoom={2} />
    )
    const svgText = container.querySelector('[data-element-index="0"] text')
    // col=100, SCALE=0.15, zoom=2 → x = 100 * 0.15 * 2 = 30
    expect(svgText?.getAttribute('x')).toBe('30')
  })

  // ── CINEMA text rendering tests ─────────────────────────────────────────────

  it('CINEMA text does NOT use dominantBaseline (anchor is at baseline, text above — same as CONCERT)', () => {
    const doc: TicketDocument = {
      stock: 'CINEMA',
      elements: [{ type: 'text', row: 200, col: 100, font: 3, content: 'Test' }]
    }
    const { container } = render(
      <EditorCanvas document={doc} selectedIndex={null} onSelect={vi.fn()} onUpdateElement={vi.fn()} />
    )
    const svgText = container.querySelector('[data-element-index="0"] text')
    expect(svgText?.getAttribute('dominant-baseline')).not.toBe('hanging')
  })

  it('CINEMA text hit rect starts ABOVE y=row*SCALE (same baseline convention as CONCERT)', () => {
    const doc: TicketDocument = {
      stock: 'CINEMA',
      elements: [{ type: 'text', row: 200, col: 100, font: 3, content: 'Test' }]
    }
    const { container } = render(
      <EditorCanvas document={doc} selectedIndex={null} onSelect={vi.fn()} onUpdateElement={vi.fn()} />
    )
    const hitRect = container.querySelector('[data-element-index="0"] rect')
    // hit rect top = (row - font*10) * SCALE = (200 - 30) * 0.15 = 25.5
    expect(hitRect?.getAttribute('y')).toBe('25.5')
  })

  it('CONCERT text hit rect starts ABOVE y=row*SCALE (baseline convention)', () => {
    const { container } = render(
      <EditorCanvas document={concertDoc} selectedIndex={null} onSelect={vi.fn()} onUpdateElement={vi.fn()} />
    )
    const hitRect = container.querySelector('[data-element-index="0"] rect')
    // (row - font*10) * SCALE = (100 - 30) * 0.15 = 10.5
    expect(hitRect?.getAttribute('y')).toBe('10.5')
  })

  // ── clipPath boundary tests ─────────────────────────────────────────────────

  it('SVG contains a clipPath element for the stock boundary', () => {
    const { container } = render(
      <EditorCanvas document={concertDoc} selectedIndex={null} onSelect={vi.fn()} onUpdateElement={vi.fn()} />
    )
    expect(container.querySelector('clipPath')).not.toBeNull()
  })

  it('elements group uses clip-path attribute to clip to stock boundary', () => {
    const { container } = render(
      <EditorCanvas document={concertDoc} selectedIndex={null} onSelect={vi.fn()} onUpdateElement={vi.fn()} />
    )
    const clippedGroup = container.querySelector('g[clip-path]')
    expect(clippedGroup).not.toBeNull()
  })

  it('double-clicking a non-text element does NOT show input', () => {
    const boxDoc: TicketDocument = {
      stock: 'CONCERT',

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

  // ── Keyboard delete tests ────────────────────────────────────────────────────

  it('pressing Delete with a selected element calls onRemoveElement with that index', () => {
    const onRemoveElement = vi.fn()
    render(
      <EditorCanvas
        document={concertDoc}
        selectedIndex={0}
        onSelect={vi.fn()}
        onUpdateElement={vi.fn()}
        onRemoveElement={onRemoveElement}
      />
    )
    fireEvent.keyDown(window, { key: 'Delete' })
    expect(onRemoveElement).toHaveBeenCalledWith(0)
  })

  it('pressing Backspace with a selected element calls onRemoveElement with that index', () => {
    const onRemoveElement = vi.fn()
    render(
      <EditorCanvas
        document={concertDoc}
        selectedIndex={0}
        onSelect={vi.fn()}
        onUpdateElement={vi.fn()}
        onRemoveElement={onRemoveElement}
      />
    )
    fireEvent.keyDown(window, { key: 'Backspace' })
    expect(onRemoveElement).toHaveBeenCalledWith(0)
  })

  it('pressing Delete with no element selected does NOT call onRemoveElement', () => {
    const onRemoveElement = vi.fn()
    render(
      <EditorCanvas
        document={concertDoc}
        selectedIndex={null}
        onSelect={vi.fn()}
        onUpdateElement={vi.fn()}
        onRemoveElement={onRemoveElement}
      />
    )
    fireEvent.keyDown(window, { key: 'Delete' })
    expect(onRemoveElement).not.toHaveBeenCalled()
  })

  it('pressing Delete while inline text editing does NOT call onRemoveElement', () => {
    const onRemoveElement = vi.fn()
    const { container } = render(
      <EditorCanvas
        document={concertDoc}
        selectedIndex={0}
        onSelect={vi.fn()}
        onUpdateElement={vi.fn()}
        onRemoveElement={onRemoveElement}
      />
    )
    // Open inline text editor
    const element = container.querySelector('[data-element-index="0"]')!
    fireEvent.doubleClick(element)
    expect(container.querySelector('input')).not.toBeNull()

    fireEvent.keyDown(window, { key: 'Delete' })
    expect(onRemoveElement).not.toHaveBeenCalled()
  })

  it('pressing Delete while a form input is focused does NOT call onRemoveElement', () => {
    const onRemoveElement = vi.fn()
    const { container } = render(
      <div>
        <input data-testid="external-input" />
        <EditorCanvas
          document={concertDoc}
          selectedIndex={0}
          onSelect={vi.fn()}
          onUpdateElement={vi.fn()}
          onRemoveElement={onRemoveElement}
        />
      </div>
    )
    const externalInput = container.querySelector('[data-testid="external-input"]') as HTMLInputElement
    externalInput.focus()
    fireEvent.keyDown(window, { key: 'Delete' })
    expect(onRemoveElement).not.toHaveBeenCalled()
  })

  it('pressing Delete with no onRemoveElement prop does nothing (no crash)', () => {
    render(
      <EditorCanvas
        document={concertDoc}
        selectedIndex={0}
        onSelect={vi.fn()}
        onUpdateElement={vi.fn()}
      />
    )
    expect(() => fireEvent.keyDown(window, { key: 'Delete' })).not.toThrow()
  })

  // ── Hit area tests ───────────────────────────────────────────────────────────

  it('hline element renders a <g> with data-element-index (has hit area wrapper)', () => {
    const hlineDoc: TicketDocument = {
      stock: 'CONCERT',
      elements: [{ type: 'hline', row: 100, col: 50, length: 200, thickness: 2 }]
    }
    const { container } = render(
      <EditorCanvas document={hlineDoc} selectedIndex={null} onSelect={vi.fn()} onUpdateElement={vi.fn()} />
    )
    const el = container.querySelector('[data-element-index="0"]')
    expect(el).not.toBeNull()
    expect(el?.tagName.toLowerCase()).toBe('g')
  })

  it('hline renders an invisible thick hit line with stroke="transparent"', () => {
    const hlineDoc: TicketDocument = {
      stock: 'CONCERT',
      elements: [{ type: 'hline', row: 100, col: 50, length: 200, thickness: 2 }]
    }
    const { container } = render(
      <EditorCanvas document={hlineDoc} selectedIndex={null} onSelect={vi.fn()} onUpdateElement={vi.fn()} />
    )
    const lines = container.querySelectorAll('[data-element-index="0"] line')
    const hitLine = Array.from(lines).find(l => l.getAttribute('stroke') === 'transparent')
    expect(hitLine).not.toBeNull()
    expect(parseFloat(hitLine!.getAttribute('stroke-width') ?? '0')).toBeGreaterThanOrEqual(8)
  })

  it('vline element renders a <g> with data-element-index (has hit area wrapper)', () => {
    const vlineDoc: TicketDocument = {
      stock: 'CONCERT',
      elements: [{ type: 'vline', row: 50, col: 100, height: 200, thickness: 2 }]
    }
    const { container } = render(
      <EditorCanvas document={vlineDoc} selectedIndex={null} onSelect={vi.fn()} onUpdateElement={vi.fn()} />
    )
    const el = container.querySelector('[data-element-index="0"]')
    expect(el).not.toBeNull()
    expect(el?.tagName.toLowerCase()).toBe('g')
  })

  it('vline renders an invisible thick hit line with stroke="transparent"', () => {
    const vlineDoc: TicketDocument = {
      stock: 'CONCERT',
      elements: [{ type: 'vline', row: 50, col: 100, height: 200, thickness: 2 }]
    }
    const { container } = render(
      <EditorCanvas document={vlineDoc} selectedIndex={null} onSelect={vi.fn()} onUpdateElement={vi.fn()} />
    )
    const lines = container.querySelectorAll('[data-element-index="0"] line')
    const hitLine = Array.from(lines).find(l => l.getAttribute('stroke') === 'transparent')
    expect(hitLine).not.toBeNull()
    expect(parseFloat(hitLine!.getAttribute('stroke-width') ?? '0')).toBeGreaterThanOrEqual(8)
  })

  it('qr element inner rect uses fill="transparent" so the interior is clickable', () => {
    const qrDoc: TicketDocument = {
      stock: 'CONCERT',
      elements: [{ type: 'qr', row: 100, col: 100, content: 'https://example.com' }]
    }
    const { container } = render(
      <EditorCanvas document={qrDoc} selectedIndex={null} onSelect={vi.fn()} onUpdateElement={vi.fn()} />
    )
    const rect = container.querySelector('[data-element-index="0"] rect')
    expect(rect?.getAttribute('fill')).toBe('transparent')
  })

  it('barcode element inner rect uses fill="transparent" so the interior is clickable', () => {
    const barcodeDoc: TicketDocument = {
      stock: 'CONCERT',
      elements: [{ type: 'barcode', row: 100, col: 100, barcodeType: 'code128', height: 100, content: '12345' }]
    }
    const { container } = render(
      <EditorCanvas document={barcodeDoc} selectedIndex={null} onSelect={vi.fn()} onUpdateElement={vi.fn()} />
    )
    const rect = container.querySelector('[data-element-index="0"] rect')
    expect(rect?.getAttribute('fill')).toBe('transparent')
  })
})
