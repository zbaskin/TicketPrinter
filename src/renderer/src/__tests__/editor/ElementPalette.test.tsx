// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ElementPalette from '../../editor/ElementPalette'

describe('ElementPalette', () => {
  it('renders all 6 add buttons', () => {
    const addElement = vi.fn()
    render(<ElementPalette onAddElement={addElement} />)
    expect(screen.getByRole('button', { name: /text/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /h line/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /v line/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^box$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /filled box/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /qr code/i })).toBeInTheDocument()
  })

  it('clicking Text calls addElement with a text element', () => {
    const addElement = vi.fn()
    render(<ElementPalette onAddElement={addElement} />)
    fireEvent.click(screen.getByRole('button', { name: /text/i }))
    expect(addElement).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'text', row: 100, col: 100, font: 3, content: 'New Text' })
    )
  })

  it('clicking H Line calls addElement with an hline element', () => {
    const addElement = vi.fn()
    render(<ElementPalette onAddElement={addElement} />)
    fireEvent.click(screen.getByRole('button', { name: /h line/i }))
    expect(addElement).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'hline', row: 200, col: 100, length: 400, thickness: 4 })
    )
  })

  it('clicking V Line calls addElement with a vline element', () => {
    const addElement = vi.fn()
    render(<ElementPalette onAddElement={addElement} />)
    fireEvent.click(screen.getByRole('button', { name: /v line/i }))
    expect(addElement).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'vline', row: 100, col: 200, height: 400, thickness: 4 })
    )
  })

  it('clicking Box calls addElement with a box element', () => {
    const addElement = vi.fn()
    render(<ElementPalette onAddElement={addElement} />)
    fireEvent.click(screen.getByRole('button', { name: /^box$/i }))
    expect(addElement).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'box', row: 100, col: 100, width: 300, height: 200, thickness: 3 })
    )
  })

  it('clicking Filled Box calls addElement with a filled box element', () => {
    const addElement = vi.fn()
    render(<ElementPalette onAddElement={addElement} />)
    fireEvent.click(screen.getByRole('button', { name: /filled box/i }))
    expect(addElement).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'box', fill: true })
    )
  })

  it('clicking QR Code calls addElement with a qr element', () => {
    const addElement = vi.fn()
    render(<ElementPalette onAddElement={addElement} />)
    fireEvent.click(screen.getByRole('button', { name: /qr code/i }))
    expect(addElement).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'qr', row: 100, col: 100, content: 'https://example.com', dotSize: 6 })
    )
  })
})
