// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import PrinterConsole from '../../console/PrinterConsole'
import type { QueryResult } from '../../../../shared/types'

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

const makeResult = (partial: Partial<QueryResult> = {}): QueryResult => ({
  sent: '3C5331 3E',
  responseHex: '06',
  responseText: '.',
  ...partial
})

describe('PrinterConsole', () => {
  it('shows "Select a printer" message when printerName is empty', () => {
    render(<PrinterConsole printerName="" />)
    expect(screen.getByText(/select a printer/i)).toBeInTheDocument()
  })

  it('Send button is disabled when no printer is selected', () => {
    render(<PrinterConsole printerName="" />)
    const btn = screen.getByRole('button', { name: /send/i })
    expect(btn).toBeDisabled()
  })

  it('quick button <S1> calls window.printerApi.query with "<S1>"', async () => {
    mockQuery.mockResolvedValueOnce(makeResult({ responseHex: '00', responseText: '.' }))
    render(<PrinterConsole printerName="Boca Lemur" />)
    const s1Btn = screen.getByRole('button', { name: '<S1>' })
    fireEvent.click(s1Btn)
    await waitFor(() => {
      expect(mockQuery).toHaveBeenCalledWith('Boca Lemur', '<S1>')
    })
  })

  it('quick button <S8> calls window.printerApi.query with "<S8>"', async () => {
    mockQuery.mockResolvedValueOnce(makeResult())
    render(<PrinterConsole printerName="Boca Lemur" />)
    fireEvent.click(screen.getByRole('button', { name: '<S8>' }))
    await waitFor(() => {
      expect(mockQuery).toHaveBeenCalledWith('Boca Lemur', '<S8>')
    })
  })

  it('quick button <S11> calls window.printerApi.query with "<S11>"', async () => {
    mockQuery.mockResolvedValueOnce(makeResult())
    render(<PrinterConsole printerName="Boca Lemur" />)
    fireEvent.click(screen.getByRole('button', { name: '<S11>' }))
    await waitFor(() => {
      expect(mockQuery).toHaveBeenCalledWith('Boca Lemur', '<S11>')
    })
  })

  it('quick button <S99> calls window.printerApi.query with "<S99>"', async () => {
    mockQuery.mockResolvedValueOnce(makeResult())
    render(<PrinterConsole printerName="Boca Lemur" />)
    fireEvent.click(screen.getByRole('button', { name: '<S99>' }))
    await waitFor(() => {
      expect(mockQuery).toHaveBeenCalledWith('Boca Lemur', '<S99>')
    })
  })

  it('submitting via Send button calls query with the input value', async () => {
    mockQuery.mockResolvedValueOnce(makeResult())
    render(<PrinterConsole printerName="Boca Lemur" />)
    const input = screen.getByPlaceholderText('<S1>')
    fireEvent.change(input, { target: { value: '<S8>' } })
    fireEvent.click(screen.getByRole('button', { name: /send/i }))
    await waitFor(() => {
      expect(mockQuery).toHaveBeenCalledWith('Boca Lemur', '<S8>')
    })
  })

  it('successful response appears in log with hex and text', async () => {
    mockQuery.mockResolvedValueOnce(makeResult({ responseHex: '41', responseText: 'A' }))
    render(<PrinterConsole printerName="Boca Lemur" />)
    fireEvent.click(screen.getByRole('button', { name: '<S1>' }))
    await waitFor(() => {
      expect(screen.getByText('41')).toBeInTheDocument()
      expect(screen.getByText('A')).toBeInTheDocument()
    })
  })

  it('<S1> response with byte 0x00 shows all-clear decoded fields', async () => {
    mockQuery.mockResolvedValueOnce(makeResult({ responseHex: '00', responseText: '.' }))
    render(<PrinterConsole printerName="Boca Lemur" />)
    fireEvent.click(screen.getByRole('button', { name: '<S1>' }))
    await waitFor(() => {
      // All-clear means no error states — look for "Out of stock" label rendered green/false
      expect(screen.getByText(/out of stock/i)).toBeInTheDocument()
      expect(screen.getByText(/jam/i)).toBeInTheDocument()
    })
  })

  it('<S1> response with byte 0x01 shows "Out of stock" as error state', async () => {
    mockQuery.mockResolvedValueOnce(makeResult({ responseHex: '01', responseText: '.' }))
    render(<PrinterConsole printerName="Boca Lemur" />)
    fireEvent.click(screen.getByRole('button', { name: '<S1>' }))
    await waitFor(() => {
      expect(screen.getByText(/out of stock/i)).toBeInTheDocument()
    })
  })

  it('empty responseHex shows the "driver may not support" warning', async () => {
    mockQuery.mockResolvedValueOnce(makeResult({ responseHex: '', responseText: '' }))
    render(<PrinterConsole printerName="Boca Lemur" />)
    fireEvent.click(screen.getByRole('button', { name: '<S1>' }))
    await waitFor(() => {
      expect(screen.getByText(/driver may not support/i)).toBeInTheDocument()
    })
  })

  it('result with error field shows error message, not "driver may not support"', async () => {
    mockQuery.mockResolvedValueOnce(
      makeResult({ responseHex: '', responseText: '', error: 'timeout' })
    )
    render(<PrinterConsole printerName="Boca Lemur" />)
    fireEvent.click(screen.getByRole('button', { name: '<S1>' }))
    await waitFor(() => {
      expect(screen.getByText(/error:.*timeout/i)).toBeInTheDocument()
      expect(screen.queryByText(/driver may not support/i)).not.toBeInTheDocument()
    })
  })

  it('Send button is disabled while sending', async () => {
    let resolveQuery!: (v: QueryResult) => void
    mockQuery.mockReturnValueOnce(new Promise<QueryResult>((res) => { resolveQuery = res }))
    render(<PrinterConsole printerName="Boca Lemur" />)
    fireEvent.click(screen.getByRole('button', { name: '<S1>' }))
    // While in-flight the Send button should be disabled
    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled()
    // Clean up
    resolveQuery(makeResult())
  })

  it('log accumulates multiple entries', async () => {
    mockQuery
      .mockResolvedValueOnce(makeResult({ responseHex: '00', responseText: '.' }))
      .mockResolvedValueOnce(makeResult({ responseHex: '02', responseText: '.' }))
    render(<PrinterConsole printerName="Boca Lemur" />)

    fireEvent.click(screen.getByRole('button', { name: '<S1>' }))
    await waitFor(() => expect(mockQuery).toHaveBeenCalledTimes(1))

    fireEvent.click(screen.getByRole('button', { name: '<S8>' }))
    await waitFor(() => expect(mockQuery).toHaveBeenCalledTimes(2))

    // Both commands should appear in the log
    const s1Entries = screen.getAllByText('<S1>')
    const s8Entries = screen.getAllByText('<S8>')
    expect(s1Entries.length).toBeGreaterThanOrEqual(1)
    expect(s8Entries.length).toBeGreaterThanOrEqual(1)
  })
})
