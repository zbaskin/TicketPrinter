// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PropertiesPanel from '../../editor/PropertiesPanel'
import type { TicketDocument, TicketElement } from '../../../../fgl/types'

const concertDoc: TicketDocument = {
  stock: 'CONCERT',
  heat: 10,
  elements: [
    { type: 'text', row: 100, col: 100, font: 3, content: 'Hello' }
  ]
}

describe('PropertiesPanel', () => {
  it('shows placeholder text when selectedIndex is null', () => {
    render(
      <PropertiesPanel
        document={concertDoc}
        selectedIndex={null}
        onUpdateElement={vi.fn()}
        onRemoveElement={vi.fn()}
      />
    )
    expect(screen.getByText(/select an element/i)).toBeInTheDocument()
  })

  it('shows text-specific fields for a text element', () => {
    render(
      <PropertiesPanel
        document={concertDoc}
        selectedIndex={0}
        onUpdateElement={vi.fn()}
        onRemoveElement={vi.fn()}
      />
    )
    expect(screen.getByLabelText(/content/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/font/i)).toBeInTheDocument()
  })

  it('shows row and col fields for any element', () => {
    render(
      <PropertiesPanel
        document={concertDoc}
        selectedIndex={0}
        onUpdateElement={vi.fn()}
        onRemoveElement={vi.fn()}
      />
    )
    expect(screen.getByLabelText(/^row$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^col$/i)).toBeInTheDocument()
  })

  it('editing content field calls onUpdateElement with updated content', () => {
    const onUpdateElement = vi.fn()
    render(
      <PropertiesPanel
        document={concertDoc}
        selectedIndex={0}
        onUpdateElement={onUpdateElement}
        onRemoveElement={vi.fn()}
      />
    )
    const contentInput = screen.getByLabelText(/content/i)
    fireEvent.change(contentInput, { target: { value: 'New Content' } })
    expect(onUpdateElement).toHaveBeenCalledWith(
      0,
      expect.objectContaining({ content: 'New Content' })
    )
  })

  it('Delete button calls onRemoveElement with selectedIndex', () => {
    const onRemoveElement = vi.fn()
    render(
      <PropertiesPanel
        document={concertDoc}
        selectedIndex={0}
        onUpdateElement={vi.fn()}
        onRemoveElement={onRemoveElement}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /delete/i }))
    expect(onRemoveElement).toHaveBeenCalledWith(0)
  })

  it('shows validation error when element is out of bounds', () => {
    const outOfBoundsDoc: TicketDocument = {
      stock: 'CONCERT',
      heat: 10,
      elements: [
        { type: 'text', row: 0, col: 100, font: 3, content: 'Bad Row' } // row 0 < safeMargin 20
      ]
    }
    render(
      <PropertiesPanel
        document={outOfBoundsDoc}
        selectedIndex={0}
        onUpdateElement={vi.fn()}
        onRemoveElement={vi.fn()}
      />
    )
    expect(screen.getByText(/below safe margin/i)).toBeInTheDocument()
  })

  it('shows hline-specific fields for an hline element', () => {
    const hlineDoc: TicketDocument = {
      stock: 'CONCERT',
      heat: 10,
      elements: [
        { type: 'hline', row: 200, col: 100, length: 400, thickness: 4 }
      ]
    }
    render(
      <PropertiesPanel
        document={hlineDoc}
        selectedIndex={0}
        onUpdateElement={vi.fn()}
        onRemoveElement={vi.fn()}
      />
    )
    expect(screen.getByLabelText(/length/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/thickness/i)).toBeInTheDocument()
  })

  it('shows box-specific fields including fill checkbox', () => {
    const boxDoc: TicketDocument = {
      stock: 'CONCERT',
      heat: 10,
      elements: [
        { type: 'box', row: 100, col: 100, width: 300, height: 200, thickness: 3 }
      ]
    }
    render(
      <PropertiesPanel
        document={boxDoc}
        selectedIndex={0}
        onUpdateElement={vi.fn()}
        onRemoveElement={vi.fn()}
      />
    )
    expect(screen.getByLabelText(/width/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/height/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/fill/i)).toBeInTheDocument()
  })

  it('shows qr-specific fields', () => {
    const qrDoc: TicketDocument = {
      stock: 'CONCERT',
      heat: 10,
      elements: [
        { type: 'qr', row: 100, col: 100, content: 'https://example.com', dotSize: 6 }
      ]
    }
    render(
      <PropertiesPanel
        document={qrDoc}
        selectedIndex={0}
        onUpdateElement={vi.fn()}
        onRemoveElement={vi.fn()}
      />
    )
    expect(screen.getByLabelText(/content/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/dot size/i)).toBeInTheDocument()
  })
})
