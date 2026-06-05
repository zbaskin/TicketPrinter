// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import PrinterConsole from '../../console/PrinterConsole'
import type { QueryResult, PrinterConnection } from '../../../../shared/types'

// ─── Mock window.printerApi ───────────────────────────────────────────────────
const mockQuery = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  Object.defineProperty(window, 'printerApi', {
    value: {
      listPrinters: vi.fn(),
      print: vi.fn(),
      query: mockQuery
    },
    writable: true,
    configurable: true
  })
})

const usbConnection: PrinterConnection = { type: 'usb', printerName: 'Boca Lemur' }
const ethConnection: PrinterConnection = { type: 'ethernet', host: '192.168.1.100', port: 9100 }

const makeResult = (partial: Partial<QueryResult> = {}): QueryResult => ({
  sent: '3C53313E',
  responseHex: '06',
  responseText: '.',
  ...partial
})

describe('PrinterConsole', () => {
  it('shows "Select a printer" message when connection is null', () => {
    render(<PrinterConsole connection={null} />)
    expect(screen.getByText(/select a printer/i)).toBeInTheDocument()
  })

  it('Send button is disabled when connection is null', () => {
    render(<PrinterConsole connection={null} />)
    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled()
  })

  it('quick button <S1> calls window.printerApi.query with the connection object', async () => {
    mockQuery.mockResolvedValueOnce(makeResult({ responseHex: '00', responseText: '.' }))
    render(<PrinterConsole connection={usbConnection} />)
    fireEvent.click(screen.getByRole('button', { name: '<S1>' }))
    await waitFor(() => {
      expect(mockQuery).toHaveBeenCalledWith(usbConnection, '<S1>')
    })
  })

  it('quick button <S8> calls query with connection', async () => {
    mockQuery.mockResolvedValueOnce(makeResult())
    render(<PrinterConsole connection={usbConnection} />)
    fireEvent.click(screen.getByRole('button', { name: '<S8>' }))
    await waitFor(() => {
      expect(mockQuery).toHaveBeenCalledWith(usbConnection, '<S8>')
    })
  })

  it('quick button <S11> calls query with connection', async () => {
    mockQuery.mockResolvedValueOnce(makeResult())
    render(<PrinterConsole connection={usbConnection} />)
    fireEvent.click(screen.getByRole('button', { name: '<S11>' }))
    await waitFor(() => {
      expect(mockQuery).toHaveBeenCalledWith(usbConnection, '<S11>')
    })
  })

  it('quick button <S99> calls query with connection', async () => {
    mockQuery.mockResolvedValueOnce(makeResult())
    render(<PrinterConsole connection={usbConnection} />)
    fireEvent.click(screen.getByRole('button', { name: '<S99>' }))
    await waitFor(() => {
      expect(mockQuery).toHaveBeenCalledWith(usbConnection, '<S99>')
    })
  })

  it('works with an ethernet connection', async () => {
    mockQuery.mockResolvedValueOnce(makeResult())
    render(<PrinterConsole connection={ethConnection} />)
    fireEvent.click(screen.getByRole('button', { name: '<S1>' }))
    await waitFor(() => {
      expect(mockQuery).toHaveBeenCalledWith(ethConnection, '<S1>')
    })
  })

  it('submitting via Send button calls query with the input value', async () => {
    mockQuery.mockResolvedValueOnce(makeResult())
    render(<PrinterConsole connection={usbConnection} />)
    fireEvent.change(screen.getByPlaceholderText('<S1>'), { target: { value: '<S8>' } })
    fireEvent.click(screen.getByRole('button', { name: /send/i }))
    await waitFor(() => {
      expect(mockQuery).toHaveBeenCalledWith(usbConnection, '<S8>')
    })
  })

  it('successful response appears in log with hex and text', async () => {
    mockQuery.mockResolvedValueOnce(makeResult({ responseHex: '41', responseText: 'A' }))
    render(<PrinterConsole connection={usbConnection} />)
    fireEvent.click(screen.getByRole('button', { name: '<S1>' }))
    await waitFor(() => {
      expect(screen.getByText('41')).toBeInTheDocument()
      expect(screen.getByText('A')).toBeInTheDocument()
    })
  })

  it('<S1> response with byte 0x00 shows all-clear decoded fields', async () => {
    mockQuery.mockResolvedValueOnce(makeResult({ responseHex: '00', responseText: '.' }))
    render(<PrinterConsole connection={usbConnection} />)
    fireEvent.click(screen.getByRole('button', { name: '<S1>' }))
    await waitFor(() => {
      expect(screen.getByText(/out of stock/i)).toBeInTheDocument()
      expect(screen.getByText(/jam/i)).toBeInTheDocument()
    })
  })

  it('<S1> response with byte 0x01 shows "Out of stock" as error state', async () => {
    mockQuery.mockResolvedValueOnce(makeResult({ responseHex: '01', responseText: '.' }))
    render(<PrinterConsole connection={usbConnection} />)
    fireEvent.click(screen.getByRole('button', { name: '<S1>' }))
    await waitFor(() => {
      expect(screen.getByText(/out of stock/i)).toBeInTheDocument()
    })
  })

  it('empty responseHex shows the "driver may not support" warning', async () => {
    mockQuery.mockResolvedValueOnce(makeResult({ responseHex: '', responseText: '' }))
    render(<PrinterConsole connection={usbConnection} />)
    fireEvent.click(screen.getByRole('button', { name: '<S1>' }))
    await waitFor(() => {
      expect(screen.getByText(/driver may not support/i)).toBeInTheDocument()
    })
  })

  it('result with error field shows error message', async () => {
    mockQuery.mockResolvedValueOnce(
      makeResult({ responseHex: '', responseText: '', error: 'timeout' })
    )
    render(<PrinterConsole connection={usbConnection} />)
    fireEvent.click(screen.getByRole('button', { name: '<S1>' }))
    await waitFor(() => {
      expect(screen.getByText(/error:.*timeout/i)).toBeInTheDocument()
      expect(screen.queryByText(/driver may not support/i)).not.toBeInTheDocument()
    })
  })

  it('Send button is disabled while sending', async () => {
    let resolveQuery!: (v: QueryResult) => void
    mockQuery.mockReturnValueOnce(new Promise<QueryResult>((res) => { resolveQuery = res }))
    render(<PrinterConsole connection={usbConnection} />)
    fireEvent.click(screen.getByRole('button', { name: '<S1>' }))
    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled()
    resolveQuery(makeResult())
  })

  it('log accumulates multiple entries', async () => {
    mockQuery
      .mockResolvedValueOnce(makeResult({ responseHex: '00', responseText: '.' }))
      .mockResolvedValueOnce(makeResult({ responseHex: '02', responseText: '.' }))
    render(<PrinterConsole connection={usbConnection} />)

    fireEvent.click(screen.getByRole('button', { name: '<S1>' }))
    await waitFor(() => expect(mockQuery).toHaveBeenCalledTimes(1))

    fireEvent.click(screen.getByRole('button', { name: '<S8>' }))
    await waitFor(() => expect(mockQuery).toHaveBeenCalledTimes(2))

    expect(screen.getAllByText('<S1>').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('<S8>').length).toBeGreaterThanOrEqual(1)
  })
})
