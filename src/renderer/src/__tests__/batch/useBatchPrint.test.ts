// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useBatchPrint } from '../../batch/useBatchPrint'
import type { TicketDocument } from '../../../../fgl/types'

const mockPrint = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  Object.defineProperty(window, 'printerApi', {
    value: { print: mockPrint, listPrinters: vi.fn() },
    writable: true,
    configurable: true
  })
})

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

    act(() => {
      result.current.loadRows(sampleData)
    })

    expect(result.current.rows).toHaveLength(3)
    expect(result.current.rows[0].status).toBe('pending')
    expect(result.current.rows[1].status).toBe('pending')
    expect(result.current.rows[2].status).toBe('pending')
  })

  it('loadRows assigns sequential IDs starting from 0', () => {
    const { result } = renderHook(() => useBatchPrint())

    act(() => {
      result.current.loadRows(sampleData)
    })

    expect(result.current.rows[0].id).toBe(0)
    expect(result.current.rows[1].id).toBe(1)
    expect(result.current.rows[2].id).toBe(2)
  })

  it('loadRows stores data on each row', () => {
    const { result } = renderHook(() => useBatchPrint())

    act(() => {
      result.current.loadRows(sampleData)
    })

    expect(result.current.rows[0].data).toEqual({ name: 'Alice', seat: 'A1' })
    expect(result.current.rows[2].data).toEqual({ name: 'Carol', seat: 'C3' })
  })

  it('loadRows replaces existing rows', () => {
    const { result } = renderHook(() => useBatchPrint())

    act(() => {
      result.current.loadRows(sampleData)
    })
    act(() => {
      result.current.loadRows([{ name: 'X' }])
    })

    expect(result.current.rows).toHaveLength(1)
    expect(result.current.rows[0].data).toEqual({ name: 'X' })
  })

  it('loadRows with empty array results in empty rows', () => {
    const { result } = renderHook(() => useBatchPrint())

    act(() => {
      result.current.loadRows([])
    })

    expect(result.current.rows).toHaveLength(0)
  })

  // ─── startPrint ─────────────────────────────────────────────────────────────

  it('startPrint sets row to "done" on success', async () => {
    mockPrint.mockResolvedValue({ success: true })
    const { result } = renderHook(() => useBatchPrint())

    act(() => {
      result.current.loadRows([{ name: 'Alice' }])
    })

    await act(async () => {
      result.current.startPrint(sampleDoc, 'Boca Lemur')
    })

    expect(result.current.rows[0].status).toBe('done')
  })

  it('startPrint sets row to "error" when result.success is false', async () => {
    mockPrint.mockResolvedValue({ success: false, error: 'Paper jam' })
    const { result } = renderHook(() => useBatchPrint())

    act(() => {
      result.current.loadRows([{ name: 'Alice' }])
    })

    await act(async () => {
      result.current.startPrint(sampleDoc, 'Boca Lemur')
    })

    expect(result.current.rows[0].status).toBe('error')
    expect(result.current.rows[0].error).toBe('Paper jam')
  })

  it('startPrint sets row to "error" when print throws', async () => {
    mockPrint.mockRejectedValue(new Error('Connection reset'))
    const { result } = renderHook(() => useBatchPrint())

    act(() => {
      result.current.loadRows([{ name: 'Alice' }])
    })

    await act(async () => {
      result.current.startPrint(sampleDoc, 'Boca Lemur')
    })

    expect(result.current.rows[0].status).toBe('error')
    expect(result.current.rows[0].error).toBe('Connection reset')
  })

  it('startPrint processes all rows in sequence', async () => {
    mockPrint.mockResolvedValue({ success: true })
    const { result } = renderHook(() => useBatchPrint())

    act(() => {
      result.current.loadRows(sampleData)
    })

    await act(async () => {
      result.current.startPrint(sampleDoc, 'Boca Lemur')
    })

    expect(mockPrint).toHaveBeenCalledTimes(3)
    expect(result.current.rows.every((r) => r.status === 'done')).toBe(true)
  })

  it('startPrint passes the correct printer name', async () => {
    mockPrint.mockResolvedValue({ success: true })
    const { result } = renderHook(() => useBatchPrint())

    act(() => {
      result.current.loadRows([{ name: 'Alice' }])
    })

    await act(async () => {
      result.current.startPrint(sampleDoc, 'Boca Lemur')
    })

    expect(mockPrint).toHaveBeenCalledWith('Boca Lemur', expect.any(String))
  })

  it('startPrint calls compile(applyDataRow(doc, row.data)) for each row', async () => {
    mockPrint.mockResolvedValue({ success: true })
    const { result } = renderHook(() => useBatchPrint())

    act(() => {
      result.current.loadRows([{ name: 'Alice' }])
    })

    await act(async () => {
      result.current.startPrint(sampleDoc, 'Boca Lemur')
    })

    const fglArg = mockPrint.mock.calls[0][1] as string
    // The compiled FGL should have the substituted name
    expect(fglArg).toContain('Hello Alice')
  })

  it('isRunning is false after all rows complete', async () => {
    mockPrint.mockResolvedValue({ success: true })
    const { result } = renderHook(() => useBatchPrint())

    act(() => {
      result.current.loadRows([{ name: 'Alice' }])
    })

    await act(async () => {
      result.current.startPrint(sampleDoc, 'Boca Lemur')
    })

    expect(result.current.isRunning).toBe(false)
  })

  it('continues processing remaining rows when one row errors', async () => {
    mockPrint
      .mockResolvedValueOnce({ success: false, error: 'Fail' })
      .mockResolvedValue({ success: true })
    const { result } = renderHook(() => useBatchPrint())

    act(() => {
      result.current.loadRows(sampleData)
    })

    await act(async () => {
      result.current.startPrint(sampleDoc, 'Boca Lemur')
    })

    expect(result.current.rows[0].status).toBe('error')
    expect(result.current.rows[1].status).toBe('done')
    expect(result.current.rows[2].status).toBe('done')
  })

  // ─── pause ──────────────────────────────────────────────────────────────────

  it('pause stops the loop after the current row completes', async () => {
    let resolveFirst!: (v: unknown) => void
    mockPrint
      .mockReturnValueOnce(new Promise((res) => { resolveFirst = res }))
      .mockResolvedValue({ success: true })

    const { result } = renderHook(() => useBatchPrint())

    act(() => {
      result.current.loadRows(sampleData) // 3 rows
    })

    // Start printing (will pause on first row awaiting resolve)
    act(() => {
      result.current.startPrint(sampleDoc, 'Boca Lemur')
    })

    // Pause while first row is printing
    act(() => {
      result.current.pause()
    })

    // Resolve first row
    await act(async () => {
      resolveFirst({ success: true })
    })

    // Only 1 row should be done; rows 2 and 3 should remain pending
    expect(result.current.rows[0].status).toBe('done')
    expect(result.current.rows[1].status).toBe('pending')
    expect(result.current.rows[2].status).toBe('pending')
    expect(result.current.isRunning).toBe(false)
  })

  // ─── reset ──────────────────────────────────────────────────────────────────

  it('reset clears all rows', () => {
    const { result } = renderHook(() => useBatchPrint())

    act(() => {
      result.current.loadRows(sampleData)
    })
    act(() => {
      result.current.reset()
    })

    expect(result.current.rows).toHaveLength(0)
  })

  it('reset sets isRunning to false', () => {
    const { result } = renderHook(() => useBatchPrint())

    act(() => {
      result.current.reset()
    })

    expect(result.current.isRunning).toBe(false)
  })
})
