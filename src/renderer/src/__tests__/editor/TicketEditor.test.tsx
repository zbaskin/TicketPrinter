// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import TicketEditor from '../../editor/TicketEditor'
import type { TicketDocument } from '../../../../fgl/types'

const mockSave = vi.fn()
const mockOpen = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  Object.defineProperty(window, 'printerApi', {
    value: { print: vi.fn(), listPrinters: vi.fn().mockResolvedValue([]) },
    writable: true,
    configurable: true
  })
  Object.defineProperty(window, 'layoutApi', {
    value: { save: mockSave, open: mockOpen },
    writable: true,
    configurable: true
  })
  localStorage.clear()
})

describe('TicketEditor', () => {
  it('renders the ElementPalette (Text button visible)', () => {
    render(<TicketEditor />)
    expect(screen.getByRole('button', { name: /text/i })).toBeInTheDocument()
  })

  it('renders the EditorCanvas (svg visible)', () => {
    const { container } = render(<TicketEditor />)
    expect(container.querySelector('svg')).not.toBeNull()
  })

  it('renders the PropertiesPanel (select an element text visible)', () => {
    render(<TicketEditor />)
    expect(screen.getByText(/select an element/i)).toBeInTheDocument()
  })

  it('renders the FglSourcePanel (pre block with NF visible)', () => {
    const { container } = render(<TicketEditor />)
    const pre = container.querySelector('pre')
    expect(pre).not.toBeNull()
    expect(pre!.textContent).toContain('<NF>')
  })

  it('stock selector change updates document stock to CINEMA', () => {
    const { container } = render(<TicketEditor />)
    const select = screen.getByLabelText(/stock/i)
    fireEvent.change(select, { target: { value: 'CINEMA' } })
    const exclusionZone = container.querySelector('[data-testid="exclusion-zone"]')
    expect(exclusionZone).not.toBeNull()
  })

  it('Print button is disabled when no printer is in localStorage', () => {
    render(<TicketEditor />)
    expect(screen.getByRole('button', { name: /^print$/i })).toBeDisabled()
  })

  it('Print button is enabled when a printer is in localStorage', () => {
    localStorage.setItem('printerConnection', JSON.stringify({ type: 'usb', printerName: 'Boca Lemur' }))
    render(<TicketEditor />)
    expect(screen.getByRole('button', { name: /^print$/i })).not.toBeDisabled()
  })

  it('"Visual" and "FGL" toggle buttons are present', () => {
    render(<TicketEditor />)
    expect(screen.getByRole('button', { name: /^visual$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^fgl$/i })).toBeInTheDocument()
  })

  it('default mode is "visual" (palette visible)', () => {
    render(<TicketEditor />)
    expect(screen.getByRole('button', { name: /text/i })).toBeInTheDocument()
  })

  it('clicking "FGL" shows FglEditorPanel, hides palette', () => {
    render(<TicketEditor />)
    fireEvent.click(screen.getByRole('button', { name: /^fgl$/i }))
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^text$/i })).toBeNull()
  })

  it('clicking "Visual" after "FGL" restores palette', () => {
    render(<TicketEditor />)
    fireEvent.click(screen.getByRole('button', { name: /^fgl$/i }))
    fireEvent.click(screen.getByRole('button', { name: /^visual$/i }))
    expect(screen.getByRole('button', { name: /text/i })).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).toBeNull()
  })

  it('zoom in and zoom out buttons are present in the toolbar', () => {
    render(<TicketEditor />)
    expect(screen.getByRole('button', { name: /zoom in/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /zoom out/i })).toBeInTheDocument()
  })

  it('clicking zoom in increases canvas SVG width', () => {
    const { container } = render(<TicketEditor />)
    const initialWidth = parseFloat(container.querySelector('svg')?.getAttribute('width') ?? '0')
    fireEvent.click(screen.getByRole('button', { name: /zoom in/i }))
    const newWidth = parseFloat(container.querySelector('svg')?.getAttribute('width') ?? '0')
    expect(newWidth).toBeGreaterThan(initialWidth)
  })

  it('clicking zoom out decreases canvas SVG width', () => {
    const { container } = render(<TicketEditor />)
    fireEvent.click(screen.getByRole('button', { name: /zoom in/i }))
    const zoomedWidth = parseFloat(container.querySelector('svg')?.getAttribute('width') ?? '0')
    fireEvent.click(screen.getByRole('button', { name: /zoom out/i }))
    const finalWidth = parseFloat(container.querySelector('svg')?.getAttribute('width') ?? '0')
    expect(finalWidth).toBeLessThan(zoomedWidth)
  })

  it('"Batch Print" button is present in the toolbar', () => {
    render(<TicketEditor />)
    expect(screen.getByRole('button', { name: /batch print/i })).toBeInTheDocument()
  })

  it('clicking "Batch Print" shows the BatchPrintPanel', () => {
    render(<TicketEditor />)
    fireEvent.click(screen.getByRole('button', { name: /batch print/i }))
    expect(screen.getByRole('button', { name: /print all/i })).toBeInTheDocument()
  })

  // ─── Save Layout ─────────────────────────────────────────────────────────────

  it('"Save Layout" button is present in the toolbar', () => {
    render(<TicketEditor />)
    expect(screen.getByRole('button', { name: /save layout/i })).toBeInTheDocument()
  })

  it('clicking "Save Layout" calls layoutApi.save with the current document', async () => {
    mockSave.mockResolvedValueOnce({ success: true, path: '/tmp/layout.json' })
    render(<TicketEditor />)
    fireEvent.click(screen.getByRole('button', { name: /save layout/i }))
    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledTimes(1)
      const docArg = mockSave.mock.calls[0][0] as TicketDocument
      expect(docArg).toHaveProperty('stock')
      expect(docArg).toHaveProperty('elements')
    })
  })

  it('shows "Layout saved" message after successful save', async () => {
    mockSave.mockResolvedValueOnce({ success: true, path: '/tmp/layout.json' })
    render(<TicketEditor />)
    fireEvent.click(screen.getByRole('button', { name: /save layout/i }))
    await waitFor(() => {
      expect(screen.getByText(/layout saved/i)).toBeInTheDocument()
    })
  })

  it('shows error message when save fails', async () => {
    mockSave.mockResolvedValueOnce({ success: false, error: 'Disk full' })
    render(<TicketEditor />)
    fireEvent.click(screen.getByRole('button', { name: /save layout/i }))
    await waitFor(() => {
      expect(screen.getByText(/disk full/i)).toBeInTheDocument()
    })
  })

  it('no message shown when save dialog is canceled (success: false, no error)', async () => {
    mockSave.mockResolvedValueOnce({ success: false })
    render(<TicketEditor />)
    fireEvent.click(screen.getByRole('button', { name: /save layout/i }))
    await waitFor(() => {
      expect(mockSave).toHaveBeenCalled()
    })
    expect(screen.queryByText(/layout saved/i)).toBeNull()
  })

  // ─── Open Layout ─────────────────────────────────────────────────────────────

  it('"Open Layout" button is present in the toolbar', () => {
    render(<TicketEditor />)
    expect(screen.getByRole('button', { name: /open layout/i })).toBeInTheDocument()
  })

  it('clicking "Open Layout" calls layoutApi.open', async () => {
    mockOpen.mockResolvedValueOnce({ success: false })
    render(<TicketEditor />)
    fireEvent.click(screen.getByRole('button', { name: /open layout/i }))
    await waitFor(() => {
      expect(mockOpen).toHaveBeenCalledTimes(1)
    })
  })

  it('loaded document replaces the current editor document', async () => {
    const newDoc: TicketDocument = {
      stock: 'CINEMA',
      elements: [{ type: 'text', row: 50, col: 50, font: 2, content: 'Loaded!' }]
    }
    mockOpen.mockResolvedValueOnce({ success: true, document: newDoc })
    const { container } = render(<TicketEditor />)
    fireEvent.click(screen.getByRole('button', { name: /open layout/i }))
    await waitFor(() => {
      // CINEMA stock → exclusion zone should appear in canvas
      expect(container.querySelector('[data-testid="exclusion-zone"]')).not.toBeNull()
    })
  })

  it('shows "Layout loaded" message after successful open', async () => {
    const newDoc: TicketDocument = { stock: 'CONCERT', elements: [] }
    mockOpen.mockResolvedValueOnce({ success: true, document: newDoc })
    render(<TicketEditor />)
    fireEvent.click(screen.getByRole('button', { name: /open layout/i }))
    await waitFor(() => {
      expect(screen.getByText(/layout loaded/i)).toBeInTheDocument()
    })
  })

  it('shows error message when open fails', async () => {
    mockOpen.mockResolvedValueOnce({ success: false, error: 'Invalid layout file: missing required fields' })
    render(<TicketEditor />)
    fireEvent.click(screen.getByRole('button', { name: /open layout/i }))
    await waitFor(() => {
      expect(screen.getByText(/invalid layout file/i)).toBeInTheDocument()
    })
  })
})
