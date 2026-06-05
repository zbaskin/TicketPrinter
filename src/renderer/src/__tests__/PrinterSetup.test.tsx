// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import PrinterSetup from '../settings/PrinterSetup'
import type { PrinterConnection } from '../../../shared/types'

// ─── Mock window.printerApi ───────────────────────────────────────────────────
const mockListPrinters = vi.fn()
const mockPrint = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  Object.defineProperty(window, 'printerApi', {
    value: {
      listPrinters: mockListPrinters,
      print: mockPrint
    },
    writable: true,
    configurable: true
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// USB mode (default)
// ─────────────────────────────────────────────────────────────────────────────

describe('PrinterSetup — USB mode', () => {
  it('renders printer list from printerApi on mount', async () => {
    mockListPrinters.mockResolvedValueOnce(['Boca Lemur', 'Zebra ZD420'])
    render(<PrinterSetup />)
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Boca Lemur' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Zebra ZD420' })).toBeInTheDocument()
    })
  })

  it('persists USB connection to localStorage when printer is selected', async () => {
    mockListPrinters.mockResolvedValueOnce(['Boca Lemur'])
    render(<PrinterSetup />)
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Boca Lemur' })).toBeInTheDocument()
    })
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Boca Lemur' } })
    const stored = JSON.parse(localStorage.getItem('printerConnection') ?? 'null') as PrinterConnection
    expect(stored).toEqual({ type: 'usb', printerName: 'Boca Lemur' })
  })

  it('calls onConnectionChanged with USB connection when printer selected', async () => {
    mockListPrinters.mockResolvedValueOnce(['Boca Lemur'])
    const onChange = vi.fn()
    render(<PrinterSetup onConnectionChanged={onChange} />)
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Boca Lemur' })).toBeInTheDocument()
    })
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Boca Lemur' } })
    expect(onChange).toHaveBeenCalledWith({ type: 'usb', printerName: 'Boca Lemur' })
  })

  it('calls printerApi.print with USB connection and <NF><p> when Test Connection clicked', async () => {
    mockListPrinters.mockResolvedValueOnce(['Boca Lemur'])
    mockPrint.mockResolvedValueOnce({ success: true, bytesWritten: 10 })
    render(<PrinterSetup />)
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Boca Lemur' })).toBeInTheDocument()
    })
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Boca Lemur' } })
    fireEvent.click(screen.getByRole('button', { name: /test connection/i }))
    await waitFor(() => {
      expect(mockPrint).toHaveBeenCalledWith({ type: 'usb', printerName: 'Boca Lemur' }, '<NF><p>')
    })
  })

  it('shows success status after print returns { success: true }', async () => {
    mockListPrinters.mockResolvedValueOnce(['Boca Lemur'])
    mockPrint.mockResolvedValueOnce({ success: true, bytesWritten: 42 })
    render(<PrinterSetup />)
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Boca Lemur' })).toBeInTheDocument()
    })
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Boca Lemur' } })
    fireEvent.click(screen.getByRole('button', { name: /test connection/i }))
    await waitFor(() => {
      expect(screen.getByText(/success/i)).toBeInTheDocument()
    })
  })

  it('shows error message after print returns { success: false }', async () => {
    mockListPrinters.mockResolvedValueOnce(['Boca Lemur'])
    mockPrint.mockResolvedValueOnce({ success: false, error: 'Out of stock' })
    render(<PrinterSetup />)
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Boca Lemur' })).toBeInTheDocument()
    })
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Boca Lemur' } })
    fireEvent.click(screen.getByRole('button', { name: /test connection/i }))
    await waitFor(() => {
      expect(screen.getByText(/out of stock/i)).toBeInTheDocument()
    })
  })

  it('Test Connection button is disabled when no printer is selected', async () => {
    mockListPrinters.mockResolvedValueOnce(['Boca Lemur'])
    render(<PrinterSetup />)
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Boca Lemur' })).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /test connection/i })).toBeDisabled()
    expect(mockPrint).not.toHaveBeenCalled()
  })

  it('shows printing status while print is in progress', async () => {
    mockListPrinters.mockResolvedValueOnce(['Boca Lemur'])
    let resolvePrint!: (v: unknown) => void
    mockPrint.mockReturnValueOnce(new Promise((res) => { resolvePrint = res }))
    render(<PrinterSetup />)
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Boca Lemur' })).toBeInTheDocument()
    })
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Boca Lemur' } })
    fireEvent.click(screen.getByRole('button', { name: /test connection/i }))
    expect(screen.getByText(/printing/i)).toBeInTheDocument()
    resolvePrint({ success: true, bytesWritten: 1 })
  })

  it('shows error when print throws', async () => {
    mockListPrinters.mockResolvedValueOnce(['Boca Lemur'])
    mockPrint.mockRejectedValueOnce(new Error('Network failure'))
    render(<PrinterSetup />)
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Boca Lemur' })).toBeInTheDocument()
    })
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Boca Lemur' } })
    fireEvent.click(screen.getByRole('button', { name: /test connection/i }))
    await waitFor(() => {
      expect(screen.getByText(/network failure/i)).toBeInTheDocument()
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Ethernet mode
// ─────────────────────────────────────────────────────────────────────────────

describe('PrinterSetup — Ethernet mode', () => {
  it('clicking Ethernet shows IP and port inputs', async () => {
    mockListPrinters.mockResolvedValueOnce([])
    render(<PrinterSetup />)
    fireEvent.click(screen.getByRole('button', { name: /ethernet/i }))
    expect(screen.getByLabelText(/ip address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/port/i)).toBeInTheDocument()
  })

  it('Test Connection calls printerApi.print with ethernet connection', async () => {
    mockListPrinters.mockResolvedValueOnce([])
    mockPrint.mockResolvedValueOnce({ success: true, bytesWritten: 7 })
    render(<PrinterSetup />)
    fireEvent.click(screen.getByRole('button', { name: /ethernet/i }))
    fireEvent.change(screen.getByLabelText(/ip address/i), { target: { value: '192.168.1.100' } })
    fireEvent.change(screen.getByLabelText(/port/i), { target: { value: '9100' } })
    fireEvent.click(screen.getByRole('button', { name: /test connection/i }))
    await waitFor(() => {
      expect(mockPrint).toHaveBeenCalledWith(
        { type: 'ethernet', host: '192.168.1.100', port: 9100 },
        '<NF><p>'
      )
    })
  })

  it('persists ethernet connection to localStorage on test', async () => {
    mockListPrinters.mockResolvedValueOnce([])
    mockPrint.mockResolvedValueOnce({ success: true, bytesWritten: 7 })
    render(<PrinterSetup />)
    fireEvent.click(screen.getByRole('button', { name: /ethernet/i }))
    fireEvent.change(screen.getByLabelText(/ip address/i), { target: { value: '10.0.0.5' } })
    fireEvent.change(screen.getByLabelText(/port/i), { target: { value: '9100' } })
    fireEvent.click(screen.getByRole('button', { name: /test connection/i }))
    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem('printerConnection') ?? 'null') as PrinterConnection
      expect(stored).toEqual({ type: 'ethernet', host: '10.0.0.5', port: 9100 })
    })
  })

  it('Test Connection button disabled when host is empty', async () => {
    mockListPrinters.mockResolvedValueOnce([])
    render(<PrinterSetup />)
    fireEvent.click(screen.getByRole('button', { name: /ethernet/i }))
    expect(screen.getByRole('button', { name: /test connection/i })).toBeDisabled()
  })

  it('shows success status after ethernet print succeeds', async () => {
    mockListPrinters.mockResolvedValueOnce([])
    mockPrint.mockResolvedValueOnce({ success: true, bytesWritten: 7 })
    render(<PrinterSetup />)
    fireEvent.click(screen.getByRole('button', { name: /ethernet/i }))
    fireEvent.change(screen.getByLabelText(/ip address/i), { target: { value: '192.168.1.1' } })
    fireEvent.change(screen.getByLabelText(/port/i), { target: { value: '9100' } })
    fireEvent.click(screen.getByRole('button', { name: /test connection/i }))
    await waitFor(() => {
      expect(screen.getByText(/success/i)).toBeInTheDocument()
    })
  })

  it('restores ethernet settings from localStorage on mount', async () => {
    localStorage.setItem('printerConnection', JSON.stringify({ type: 'ethernet', host: '10.0.0.9', port: 9100 }))
    mockListPrinters.mockResolvedValueOnce([])
    render(<PrinterSetup />)
    expect((screen.getByLabelText(/ip address/i) as HTMLInputElement).value).toBe('10.0.0.9')
  })
})
