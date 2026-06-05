// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import PrintDialog from '../print/PrintDialog'
import type { TicketDocument } from '../../../fgl/types'
import type { PrinterConnection } from '../../../shared/types'

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

// ─── Sample fixtures ──────────────────────────────────────────────────────────
const usbConnection: PrinterConnection = { type: 'usb', printerName: 'Boca Lemur' }
const ethConnection: PrinterConnection = { type: 'ethernet', host: '192.168.1.100', port: 9100 }

const sampleDoc: TicketDocument = {
  stock: 'CONCERT',
  elements: [
    { type: 'text', row: 100, col: 100, font: 1, content: 'Hello World' }
  ]
}

describe('PrintDialog', () => {
  it('renders the FGL byte count for the document', () => {
    render(<PrintDialog document={sampleDoc} connection={usbConnection} onClose={vi.fn()} />)
    expect(screen.getByText(/byte/i)).toBeInTheDocument()
  })

  it('does NOT render a heat slider', () => {
    render(<PrintDialog document={sampleDoc} connection={usbConnection} onClose={vi.fn()} />)
    expect(screen.queryByRole('slider')).toBeNull()
  })

  it('shows copies input with default value 1', () => {
    render(<PrintDialog document={sampleDoc} connection={usbConnection} onClose={vi.fn()} />)
    expect(screen.getByRole('spinbutton')).toHaveValue(1)
  })

  it('copies input has min 1 and max 99', () => {
    render(<PrintDialog document={sampleDoc} connection={usbConnection} onClose={vi.fn()} />)
    const input = screen.getByRole('spinbutton')
    expect(input).toHaveAttribute('min', '1')
    expect(input).toHaveAttribute('max', '99')
  })

  it('shows USB printer label', () => {
    render(<PrintDialog document={sampleDoc} connection={usbConnection} onClose={vi.fn()} />)
    expect(screen.getByText('Boca Lemur')).toBeInTheDocument()
  })

  it('shows ethernet label as host:port', () => {
    render(<PrintDialog document={sampleDoc} connection={ethConnection} onClose={vi.fn()} />)
    expect(screen.getByText('192.168.1.100:9100')).toBeInTheDocument()
  })

  it('calls printerApi.print once when copies=1', async () => {
    mockPrint.mockResolvedValue({ success: true, bytesWritten: 50 })
    render(<PrintDialog document={sampleDoc} connection={usbConnection} onClose={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /print/i }))
    await waitFor(() => {
      expect(mockPrint).toHaveBeenCalledTimes(1)
    })
  })

  it('calls printerApi.print N times when copies=N', async () => {
    mockPrint.mockResolvedValue({ success: true, bytesWritten: 50 })
    render(<PrintDialog document={sampleDoc} connection={usbConnection} onClose={vi.fn()} />)
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '3' } })
    fireEvent.click(screen.getByRole('button', { name: /print/i }))
    await waitFor(() => {
      expect(mockPrint).toHaveBeenCalledTimes(3)
    })
  })

  it('passes the connection object to printerApi.print', async () => {
    mockPrint.mockResolvedValue({ success: true, bytesWritten: 50 })
    render(<PrintDialog document={sampleDoc} connection={usbConnection} onClose={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /print/i }))
    await waitFor(() => {
      expect(mockPrint).toHaveBeenCalledWith(usbConnection, expect.any(String))
    })
  })

  it('passes ethernet connection to printerApi.print', async () => {
    mockPrint.mockResolvedValue({ success: true, bytesWritten: 50 })
    render(<PrintDialog document={sampleDoc} connection={ethConnection} onClose={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /print/i }))
    await waitFor(() => {
      expect(mockPrint).toHaveBeenCalledWith(ethConnection, expect.any(String))
    })
  })

  it('disables Print button while printing is in progress', async () => {
    let resolveFirst!: (v: unknown) => void
    mockPrint.mockReturnValueOnce(new Promise((res) => { resolveFirst = res }))
    render(<PrintDialog document={sampleDoc} connection={usbConnection} onClose={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /print/i }))
    expect(screen.getByRole('button', { name: /print/i })).toBeDisabled()
    resolveFirst({ success: true, bytesWritten: 1 })
  })

  it('shows done status for each copy after successful print', async () => {
    mockPrint.mockResolvedValue({ success: true, bytesWritten: 50 })
    render(<PrintDialog document={sampleDoc} connection={usbConnection} onClose={vi.fn()} />)
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '2' } })
    fireEvent.click(screen.getByRole('button', { name: /print/i }))
    await waitFor(() => {
      expect(screen.getAllByText(/done/i).length).toBeGreaterThanOrEqual(2)
    })
  })

  it('does NOT include a HEAT command in the FGL passed to print', async () => {
    mockPrint.mockResolvedValue({ success: true, bytesWritten: 50 })
    render(<PrintDialog document={sampleDoc} connection={usbConnection} onClose={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /print/i }))
    await waitFor(() => {
      const fglArg = mockPrint.mock.calls[0][1] as string
      expect(fglArg).not.toContain('<HEAT')
      expect(fglArg).toContain('<NF>')
    })
  })

  it('shows error status for a copy when print fails', async () => {
    mockPrint.mockResolvedValueOnce({ success: false, error: 'Paper jam' })
    render(<PrintDialog document={sampleDoc} connection={usbConnection} onClose={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /print/i }))
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument()
    })
  })

  it('shows error status when print throws an exception', async () => {
    mockPrint.mockRejectedValueOnce(new Error('Connection reset'))
    render(<PrintDialog document={sampleDoc} connection={usbConnection} onClose={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /print/i }))
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument()
    })
  })

  it('re-enables Print button after all copies complete', async () => {
    mockPrint.mockResolvedValue({ success: true, bytesWritten: 50 })
    render(<PrintDialog document={sampleDoc} connection={usbConnection} onClose={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /print/i }))
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /print/i })).not.toBeDisabled()
    })
  })

  it('calls onClose when Close button is clicked', () => {
    const onClose = vi.fn()
    render(<PrintDialog document={sampleDoc} connection={usbConnection} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('when rawFglOverride is set, byte count reflects override length', () => {
    const overrideFgl = 'RAW_OVERRIDE'
    const docWithOverride: TicketDocument = { ...sampleDoc, rawFglOverride: overrideFgl }
    render(<PrintDialog document={docWithOverride} connection={usbConnection} onClose={vi.fn()} />)
    const expectedBytes = new TextEncoder().encode(overrideFgl).length
    expect(screen.getByText(new RegExp(`${expectedBytes} bytes`))).toBeInTheDocument()
  })

  it('when rawFglOverride is set, printerApi.print is called with the override string', async () => {
    mockPrint.mockResolvedValue({ success: true, bytesWritten: 12 })
    const overrideFgl = 'RAW_OVERRIDE'
    const docWithOverride: TicketDocument = { ...sampleDoc, rawFglOverride: overrideFgl }
    render(<PrintDialog document={docWithOverride} connection={usbConnection} onClose={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /print/i }))
    await waitFor(() => {
      expect(mockPrint).toHaveBeenCalledWith(usbConnection, overrideFgl)
    })
  })

  it('when rawFglOverride is undefined, printerApi.print is called with compile(doc) output', async () => {
    mockPrint.mockResolvedValue({ success: true, bytesWritten: 50 })
    render(<PrintDialog document={sampleDoc} connection={usbConnection} onClose={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /print/i }))
    await waitFor(() => {
      const fglArg = mockPrint.mock.calls[0][1] as string
      expect(fglArg).toContain('<NF>')
      expect(fglArg).not.toContain('<HEAT')
    })
  })
})
