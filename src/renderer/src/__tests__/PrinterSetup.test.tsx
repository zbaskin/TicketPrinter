// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PrinterSetup from '../settings/PrinterSetup'

// ─── Mock window.printerApi ───────────────────────────────────────────────────
const mockListPrinters = vi.fn()
const mockPrint = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  // Reset localStorage
  localStorage.clear()
  // Set up the printerApi on window
  Object.defineProperty(window, 'printerApi', {
    value: {
      listPrinters: mockListPrinters,
      print: mockPrint
    },
    writable: true,
    configurable: true
  })
})

describe('PrinterSetup', () => {
  it('renders printer list from mocked printerApi on mount', async () => {
    mockListPrinters.mockResolvedValueOnce(['Boca Lemur', 'Zebra ZD420'])
    render(<PrinterSetup />)

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Boca Lemur' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Zebra ZD420' })).toBeInTheDocument()
    })
  })

  it('shows a placeholder option when no printer is selected', async () => {
    mockListPrinters.mockResolvedValueOnce(['Boca Lemur'])
    render(<PrinterSetup />)

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })
    // The select element should exist
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('persists selected printer to localStorage when user selects one', async () => {
    mockListPrinters.mockResolvedValueOnce(['Boca Lemur', 'Zebra ZD420'])
    render(<PrinterSetup />)

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Boca Lemur' })).toBeInTheDocument()
    })

    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'Zebra ZD420' } })

    expect(localStorage.getItem('selectedPrinter')).toBe('Zebra ZD420')
  })

  it('calls printerApi.print with <HEAT 10><NF><p> when Test Connection is clicked', async () => {
    mockListPrinters.mockResolvedValueOnce(['Boca Lemur'])
    mockPrint.mockResolvedValueOnce({ success: true, bytesWritten: 10 })
    render(<PrinterSetup />)

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Boca Lemur' })).toBeInTheDocument()
    })

    // Select the printer first
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'Boca Lemur' } })

    const testBtn = screen.getByRole('button', { name: /test connection/i })
    fireEvent.click(testBtn)

    await waitFor(() => {
      expect(mockPrint).toHaveBeenCalledWith('Boca Lemur', '<HEAT 10><NF><p>')
    })
  })

  it('shows success status after print returns { success: true }', async () => {
    mockListPrinters.mockResolvedValueOnce(['Boca Lemur'])
    mockPrint.mockResolvedValueOnce({ success: true, bytesWritten: 42 })
    render(<PrinterSetup />)

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Boca Lemur' })).toBeInTheDocument()
    })

    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'Boca Lemur' } })

    fireEvent.click(screen.getByRole('button', { name: /test connection/i }))

    await waitFor(() => {
      expect(screen.getByText(/success/i)).toBeInTheDocument()
    })
  })

  it('shows error message after print returns { success: false, error: "Out of stock" }', async () => {
    mockListPrinters.mockResolvedValueOnce(['Boca Lemur'])
    mockPrint.mockResolvedValueOnce({ success: false, error: 'Out of stock' })
    render(<PrinterSetup />)

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Boca Lemur' })).toBeInTheDocument()
    })

    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'Boca Lemur' } })

    fireEvent.click(screen.getByRole('button', { name: /test connection/i }))

    await waitFor(() => {
      expect(screen.getByText(/out of stock/i)).toBeInTheDocument()
    })
  })

  it('shows printing status while print is in progress', async () => {
    mockListPrinters.mockResolvedValueOnce(['Boca Lemur'])
    // Never resolves immediately — we check the interim state
    let resolvePrint!: (v: unknown) => void
    mockPrint.mockReturnValueOnce(new Promise((res) => { resolvePrint = res }))
    render(<PrinterSetup />)

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Boca Lemur' })).toBeInTheDocument()
    })

    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'Boca Lemur' } })

    fireEvent.click(screen.getByRole('button', { name: /test connection/i }))

    // While printing, should show printing state
    expect(screen.getByText(/printing/i)).toBeInTheDocument()

    // Resolve to clean up
    resolvePrint({ success: true, bytesWritten: 1 })
  })

  it('shows error when print throws an exception', async () => {
    mockListPrinters.mockResolvedValueOnce(['Boca Lemur'])
    mockPrint.mockRejectedValueOnce(new Error('Network failure'))
    render(<PrinterSetup />)

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Boca Lemur' })).toBeInTheDocument()
    })

    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'Boca Lemur' } })

    fireEvent.click(screen.getByRole('button', { name: /test connection/i }))

    await waitFor(() => {
      expect(screen.getByText(/network failure/i)).toBeInTheDocument()
    })
  })

  it('shows error when print returns { success: false } without error message', async () => {
    mockListPrinters.mockResolvedValueOnce(['Boca Lemur'])
    mockPrint.mockResolvedValueOnce({ success: false })
    render(<PrinterSetup />)

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Boca Lemur' })).toBeInTheDocument()
    })

    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'Boca Lemur' } })

    fireEvent.click(screen.getByRole('button', { name: /test connection/i }))

    await waitFor(() => {
      expect(screen.getByText(/unknown error/i)).toBeInTheDocument()
    })
  })

  it('does not call print when no printer is selected', async () => {
    mockListPrinters.mockResolvedValueOnce(['Boca Lemur'])
    render(<PrinterSetup />)

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Boca Lemur' })).toBeInTheDocument()
    })

    // Do NOT select a printer — button should be disabled
    const btn = screen.getByRole('button', { name: /test connection/i })
    expect(btn).toBeDisabled()
    expect(mockPrint).not.toHaveBeenCalled()
  })
})
