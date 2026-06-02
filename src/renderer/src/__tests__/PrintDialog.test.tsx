// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import PrintDialog from '../print/PrintDialog'
import type { TicketDocument } from '../../../fgl/types'

// ─── Mock window.printerApi ───────────────────────────────────────────────────
const mockPrint = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  Object.defineProperty(window, 'printerApi', {
    value: { print: mockPrint, listPrinters: vi.fn() },
    writable: true,
    configurable: true
  })
})

// ─── Sample TicketDocument ────────────────────────────────────────────────────
const sampleDoc: TicketDocument = {
  stock: 'CONCERT',
  heat: 10,
  elements: [
    { type: 'text', row: 100, col: 100, font: 1, content: 'Hello World' }
  ]
}

describe('PrintDialog', () => {
  it('renders the FGL byte count for the document', () => {
    const onClose = vi.fn()
    render(<PrintDialog document={sampleDoc} printerName="Boca Lemur" onClose={onClose} />)
    expect(screen.getByText(/byte/i)).toBeInTheDocument()
  })

  it('does NOT render a heat slider', () => {
    render(<PrintDialog document={sampleDoc} printerName="Boca Lemur" onClose={vi.fn()} />)
    expect(screen.queryByRole('slider')).toBeNull()
  })

  it('shows copies input with default value 1', () => {
    render(<PrintDialog document={sampleDoc} printerName="Boca Lemur" onClose={vi.fn()} />)
    const copiesInput = screen.getByRole('spinbutton')
    expect(copiesInput).toHaveValue(1)
  })

  it('copies input has min 1 and max 99', () => {
    render(<PrintDialog document={sampleDoc} printerName="Boca Lemur" onClose={vi.fn()} />)
    const copiesInput = screen.getByRole('spinbutton')
    expect(copiesInput).toHaveAttribute('min', '1')
    expect(copiesInput).toHaveAttribute('max', '99')
  })

  it('calls printerApi.print once when copies=1', async () => {
    mockPrint.mockResolvedValue({ success: true, bytesWritten: 50 })
    render(<PrintDialog document={sampleDoc} printerName="Boca Lemur" onClose={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /print/i }))

    await waitFor(() => {
      expect(mockPrint).toHaveBeenCalledTimes(1)
    })
  })

  it('calls printerApi.print N times when copies=N', async () => {
    mockPrint.mockResolvedValue({ success: true, bytesWritten: 50 })
    render(<PrintDialog document={sampleDoc} printerName="Boca Lemur" onClose={vi.fn()} />)

    const copiesInput = screen.getByRole('spinbutton')
    fireEvent.change(copiesInput, { target: { value: '3' } })

    fireEvent.click(screen.getByRole('button', { name: /print/i }))

    await waitFor(() => {
      expect(mockPrint).toHaveBeenCalledTimes(3)
    })
  })

  it('passes the correct printer name to printerApi.print', async () => {
    mockPrint.mockResolvedValue({ success: true, bytesWritten: 50 })
    render(<PrintDialog document={sampleDoc} printerName="Boca Lemur" onClose={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /print/i }))

    await waitFor(() => {
      expect(mockPrint).toHaveBeenCalledWith('Boca Lemur', expect.any(String))
    })
  })

  it('disables Print button while printing is in progress', async () => {
    let resolveFirst!: (v: unknown) => void
    mockPrint.mockReturnValueOnce(new Promise((res) => { resolveFirst = res }))
    render(<PrintDialog document={sampleDoc} printerName="Boca Lemur" onClose={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /print/i }))

    expect(screen.getByRole('button', { name: /print/i })).toBeDisabled()

    resolveFirst({ success: true, bytesWritten: 1 })
  })

  it('shows done status for each copy after successful print', async () => {
    mockPrint.mockResolvedValue({ success: true, bytesWritten: 50 })
    render(<PrintDialog document={sampleDoc} printerName="Boca Lemur" onClose={vi.fn()} />)

    const copiesInput = screen.getByRole('spinbutton')
    fireEvent.change(copiesInput, { target: { value: '2' } })

    fireEvent.click(screen.getByRole('button', { name: /print/i }))

    await waitFor(() => {
      const doneItems = screen.getAllByText(/done/i)
      expect(doneItems.length).toBeGreaterThanOrEqual(2)
    })
  })

  it('uses doc.heat (10) in the FGL passed to print', async () => {
    mockPrint.mockResolvedValue({ success: true, bytesWritten: 50 })
    render(<PrintDialog document={sampleDoc} printerName="Boca Lemur" onClose={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /print/i }))

    await waitFor(() => {
      const fglArg = mockPrint.mock.calls[0][1] as string
      expect(fglArg).toContain('<HEAT 10>')
    })
  })

  it('shows error status for a copy when print fails', async () => {
    mockPrint.mockResolvedValueOnce({ success: false, error: 'Paper jam' })
    render(<PrintDialog document={sampleDoc} printerName="Boca Lemur" onClose={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /print/i }))

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument()
    })
  })

  it('shows error status when print throws an exception', async () => {
    mockPrint.mockRejectedValueOnce(new Error('Connection reset'))
    render(<PrintDialog document={sampleDoc} printerName="Boca Lemur" onClose={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /print/i }))

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument()
    })
  })

  it('re-enables Print button after all copies complete', async () => {
    mockPrint.mockResolvedValue({ success: true, bytesWritten: 50 })
    render(<PrintDialog document={sampleDoc} printerName="Boca Lemur" onClose={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /print/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /print/i })).not.toBeDisabled()
    })
  })

  it('calls onClose when Close button is clicked', () => {
    const onClose = vi.fn()
    render(<PrintDialog document={sampleDoc} printerName="Boca Lemur" onClose={onClose} />)

    fireEvent.click(screen.getByRole('button', { name: /close/i }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
