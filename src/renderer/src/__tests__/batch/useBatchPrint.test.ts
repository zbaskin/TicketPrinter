// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useBatchPrint } from '../../batch/useBatchPrint'
import type { TicketDocument } from '../../../../fgl/types'
import type { PrinterConnection } from '../../../../shared/types'

const mockPrint = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  Object.defineProperty(window, 'printerApi', {
    value: { print: mockPrint, listPrinters: vi.fn() },
    writable: true,
    configurable: true
  })
})

const usbConnection: PrinterConnection = { type: 'usb', printerName: 'Boca Lemur' }

const sampleDoc: TicketDocument = {
  stock: 'CONCERT',
  elements: [
    { type: 'text', row: 100, col: 100, font: 1, content: 'Hello {{name}}' }
  ]
}

const sampleData = [
  { name: 'Alice', seat: 'A1' },
  { name: 'Bob', seat: 'B2' },
  { name: 'Carol', seat: 'C3' }
]

describe('useBatchPrint', () => {
  // ─── loadRows ───────────────────────────────────────────────────────────────

  it('loadRows populates rows with pending status', () => {
    const { result } = renderHook(() => useBatchPrint())
    act(() => { result.current.loadRows(sampleData) })
    expect(result.current.rows).toHaveLength(3)
    expect(result.current.rows[0].status).toBe('pending')
    expect(result.current.rows[1].status).toBe('pending')
    expect(result.current.rows[2].status).toBe('pending')
  })

  it('loadRows assigns sequential IDs starting from 0', () => {
    const { result } = renderHook(() => useBatchPrint())
    act(() => { result.current.loadRows(sampleData) })
    expect(result.current.rows[0].id).toBe(0)
    expect(result.current.rows[1].id).toBe(1)
    expect(result.current.rows[2].id).toBe(2)
  })

  it('loadRows stores data on each row', () => {
    const { result } = renderHook(() => useBatchPrint())
    act(() => { result.current.loadRows(sampleData) })
    expect(result.current.rows[0].data).toEqual({ name: 'Alice', seat: 'A1' })
    expect(result.current.rows[2].data).toEqual({ name: 'Carol', seat: 'C3' })
  })

  it('loadRows replaces existing rows', () => {
    const { result } = renderHook(() => useBatchPrint())
    act(() => { result.current.loadRows(sampleData) })
    act(() => { result.current.loadRows([{ name: 'X' }]) })
    expect(result.current.rows).toHaveLength(1)
    expect(result.current.rows[0].data).toEqual({ name: 'X' })
  })

  it('loadRows with empty array results in empty rows', () => {
    const { result } = renderHook(() => useBatchPrint())
    act(() => { result.current.loadRows([]) })
    expect(result.current.rows).toHaveLength(0)
  })

  // ─── startPrint ─────────────────────────────────────────────────────────────

  it('startPrint sends all rows in a single print call', async () => {
    mockPrint.mockResolvedValue({ success: true })
    const { result } = renderHook(() => useBatchPrint())
    act(() => { result.current.loadRows(sampleData) })
    await act(async () => { result.current.startPrint(sampleDoc, usbConnection) })
    expect(mockPrint).toHaveBeenCalledTimes(1)
    expect(result.current.rows.every((r) => r.status === 'done')).toBe(true)
  })

  it('single FGL call contains all rows substituted content', async () => {
    mockPrint.mockResolvedValue({ success: true })
    const { result } = renderHook(() => useBatchPrint())
    act(() => { result.current.loadRows(sampleData) })
    await act(async () => { result.current.startPrint(sampleDoc, usbConnection) })
    const fglArg = mockPrint.mock.calls[0][1] as string
    expect(fglArg).toContain('Hello Alice')
    expect(fglArg).toContain('Hello Bob')
    expect(fglArg).toContain('Hello Carol')
  })

  it('startPrint sets all rows to "done" on success', async () => {
    mockPrint.mockResolvedValue({ success: true })
    const { result } = renderHook(() => useBatchPrint())
    act(() => { result.current.loadRows([{ name: 'Alice' }]) })
    await act(async () => { result.current.startPrint(sampleDoc, usbConnection) })
    expect(result.current.rows[0].status).toBe('done')
  })

  it('startPrint sets all rows to "error" when result.success is false', async () => {
    mockPrint.mockResolvedValue({ success: false, error: 'Paper jam' })
    const { result } = renderHook(() => useBatchPrint())
    act(() => { result.current.loadRows([{ name: 'Alice' }]) })
    await act(async () => { result.current.startPrint(sampleDoc, usbConnection) })
    expect(result.current.rows[0].status).toBe('error')
    expect(result.current.rows[0].error).toBe('Paper jam')
  })

  it('startPrint sets all rows to "error" when print throws', async () => {
    mockPrint.mockRejectedValue(new Error('Connection reset'))
    const { result } = renderHook(() => useBatchPrint())
    act(() => { result.current.loadRows([{ name: 'Alice' }]) })
    await act(async () => { result.current.startPrint(sampleDoc, usbConnection) })
    expect(result.current.rows[0].status).toBe('error')
    expect(result.current.rows[0].error).toBe('Connection reset')
  })

  it('startPrint passes the connection to printerApi.print', async () => {
    mockPrint.mockResolvedValue({ success: true })
    const { result } = renderHook(() => useBatchPrint())
    act(() => { result.current.loadRows([{ name: 'Alice' }]) })
    await act(async () => { result.current.startPrint(sampleDoc, usbConnection) })
    expect(mockPrint).toHaveBeenCalledWith(usbConnection, expect.any(String))
  })

  it('startPrint works with ethernet connection', async () => {
    const ethConnection: PrinterConnection = { type: 'ethernet', host: '192.168.1.1', port: 9100 }
    mockPrint.mockResolvedValue({ success: true })
    const { result } = renderHook(() => useBatchPrint())
    act(() => { result.current.loadRows([{ name: 'Alice' }]) })
    await act(async () => { result.current.startPrint(sampleDoc, ethConnection) })
    expect(mockPrint).toHaveBeenCalledWith(ethConnection, expect.any(String))
  })

  it('sets all rows to error when the batch print call fails', async () => {
    mockPrint.mockResolvedValue({ success: false, error: 'Paper jam' })
    const { result } = renderHook(() => useBatchPrint())
    act(() => { result.current.loadRows(sampleData) })
    await act(async () => { result.current.startPrint(sampleDoc, usbConnection) })
    expect(result.current.rows.every((r) => r.status === 'error')).toBe(true)
    expect(result.current.rows[0].error).toBe('Paper jam')
  })

  it('isRunning is false after all rows complete', async () => {
    mockPrint.mockResolvedValue({ success: true })
    const { result } = renderHook(() => useBatchPrint())
    act(() => { result.current.loadRows([{ name: 'Alice' }]) })
    await act(async () => { result.current.startPrint(sampleDoc, usbConnection) })
    expect(result.current.isRunning).toBe(false)
  })

  it('reprints all rows when Print All is clicked after all rows are done', async () => {
    mockPrint.mockResolvedValue({ success: true })
    const { result } = renderHook(() => useBatchPrint())
    act(() => { result.current.loadRows([{ name: 'Alice' }, { name: 'Bob' }]) })
    await act(async () => { result.current.startPrint(sampleDoc, usbConnection) })
    expect(result.current.rows.every((r) => r.status === 'done')).toBe(true)
    // Second print without reset
    await act(async () => { result.current.startPrint(sampleDoc, usbConnection) })
    expect(mockPrint).toHaveBeenCalledTimes(2)
    expect(result.current.rows.every((r) => r.status === 'done')).toBe(true)
  })

  // ─── pause ──────────────────────────────────────────────────────────────────

  it('pause() is callable without throwing', () => {
    const { result } = renderHook(() => useBatchPrint())
    expect(() => act(() => { result.current.pause() })).not.toThrow()
  })

  // ─── reset ──────────────────────────────────────────────────────────────────

  it('reset clears all rows', () => {
    const { result } = renderHook(() => useBatchPrint())
    act(() => { result.current.loadRows(sampleData) })
    act(() => { result.current.reset() })
    expect(result.current.rows).toHaveLength(0)
  })

  it('reset sets isRunning to false', () => {
    const { result } = renderHook(() => useBatchPrint())
    act(() => { result.current.reset() })
    expect(result.current.isRunning).toBe(false)
  })
})
