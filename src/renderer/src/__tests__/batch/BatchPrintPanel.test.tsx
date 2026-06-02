// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import BatchPrintPanel from '../../batch/BatchPrintPanel'
import type { TicketDocument } from '../../../../fgl/types'

// ─── Mock useBatchPrint ──────────────────────────────────────────────────────

const mockLoadRows = vi.fn()
const mockStartPrint = vi.fn()
const mockPause = vi.fn()
const mockReset = vi.fn()

const mockBatchState = {
  rows: [] as Array<{ id: number; data: Record<string, string>; status: string; error?: string }>,
  isRunning: false,
  loadRows: mockLoadRows,
  startPrint: mockStartPrint,
  pause: mockPause,
  reset: mockReset
}

vi.mock('../../batch/useBatchPrint', () => ({
  useBatchPrint: () => mockBatchState
}))

// ─── Helpers ─────────────────────────────────────────────────────────────────

const sampleDoc: TicketDocument = {
  stock: 'CONCERT',

  elements: [
    { type: 'text', row: 100, col: 100, font: 1, content: 'Hello {{name}}' }
  ]
}

function makePendingRows(count: number): typeof mockBatchState.rows {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    data: { name: `Person ${i}`, seat: `A${i}` },
    status: 'pending'
  }))
}

beforeEach(() => {
  vi.clearAllMocks()
  // Reset to empty/idle state
  mockBatchState.rows = []
  mockBatchState.isRunning = false
})

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('BatchPrintPanel', () => {
  // ─── Section 1: Empty state ─────────────────────────────────────────────────

  it('shows "No data loaded" message when rows is empty', () => {
    render(<BatchPrintPanel document={sampleDoc} printerName="Boca Lemur" />)
    expect(screen.getByText(/no data loaded/i)).toBeInTheDocument()
  })

  it('"Import CSV" button is present', () => {
    render(<BatchPrintPanel document={sampleDoc} printerName="Boca Lemur" />)
    expect(screen.getByRole('button', { name: /import/i })).toBeInTheDocument()
  })

  it('has a hidden file input that accepts CSV and JSON', () => {
    const { container } = render(<BatchPrintPanel document={sampleDoc} printerName="Boca Lemur" />)
    const fileInput = container.querySelector('input[type="file"]')
    expect(fileInput).not.toBeNull()
    expect(fileInput).toHaveAttribute('accept', expect.stringContaining('.csv'))
    expect(fileInput).toHaveAttribute('accept', expect.stringContaining('.json'))
  })

  // ─── Section 2: After loading rows ─────────────────────────────────────────

  it('after loadRows, table shows the correct number of rows', () => {
    mockBatchState.rows = makePendingRows(3)
    render(<BatchPrintPanel document={sampleDoc} printerName="Boca Lemur" />)
    // Should show 3 data rows in the table (not the "no data" message)
    expect(screen.queryByText(/no data loaded/i)).toBeNull()
    // Each row should show row number
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('shows status badge for each row', () => {
    mockBatchState.rows = makePendingRows(2)
    render(<BatchPrintPanel document={sampleDoc} printerName="Boca Lemur" />)
    const pendingBadges = screen.getAllByText(/pending/i)
    expect(pendingBadges.length).toBeGreaterThanOrEqual(2)
  })

  it('shows done status badge in green for done rows', () => {
    mockBatchState.rows = [
      { id: 0, data: { name: 'Alice' }, status: 'done' }
    ]
    render(<BatchPrintPanel document={sampleDoc} printerName="Boca Lemur" />)
    // The badge span contains exactly "done" (not "1 / 1 done")
    const doneBadges = screen.getAllByText(/^done$/i)
    expect(doneBadges.length).toBeGreaterThanOrEqual(1)
    // The badge span should have green styling
    expect(doneBadges[0].className).toMatch(/green/i)
  })

  it('shows error status badge in red for error rows', () => {
    mockBatchState.rows = [
      { id: 0, data: { name: 'Alice' }, status: 'error', error: 'Paper jam' }
    ]
    render(<BatchPrintPanel document={sampleDoc} printerName="Boca Lemur" />)
    const errorBadge = screen.getByText(/error/i)
    expect(errorBadge).toBeInTheDocument()
    expect(errorBadge.className).toMatch(/red/i)
  })

  it('shows printing status badge in yellow for printing rows', () => {
    mockBatchState.rows = [
      { id: 0, data: { name: 'Alice' }, status: 'printing' }
    ]
    render(<BatchPrintPanel document={sampleDoc} printerName="Boca Lemur" />)
    const printingBadge = screen.getByText(/printing/i)
    expect(printingBadge).toBeInTheDocument()
    expect(printingBadge.className).toMatch(/yellow/i)
  })

  // ─── Section 3: Controls ────────────────────────────────────────────────────

  it('"Print All" is disabled when no rows loaded', () => {
    render(<BatchPrintPanel document={sampleDoc} printerName="Boca Lemur" />)
    expect(screen.getByRole('button', { name: /print all/i })).toBeDisabled()
  })

  it('"Print All" is disabled when no printer name provided', () => {
    mockBatchState.rows = makePendingRows(2)
    render(<BatchPrintPanel document={sampleDoc} printerName="" />)
    expect(screen.getByRole('button', { name: /print all/i })).toBeDisabled()
  })

  it('"Print All" is disabled when isRunning is true', () => {
    mockBatchState.rows = makePendingRows(2)
    mockBatchState.isRunning = true
    render(<BatchPrintPanel document={sampleDoc} printerName="Boca Lemur" />)
    expect(screen.getByRole('button', { name: /print all/i })).toBeDisabled()
  })

  it('"Print All" is enabled when rows present, printer present, not running', () => {
    mockBatchState.rows = makePendingRows(2)
    render(<BatchPrintPanel document={sampleDoc} printerName="Boca Lemur" />)
    expect(screen.getByRole('button', { name: /print all/i })).not.toBeDisabled()
  })

  it('"Print All" calls startPrint with correct args when clicked', () => {
    mockBatchState.rows = makePendingRows(1)
    render(<BatchPrintPanel document={sampleDoc} printerName="Boca Lemur" />)
    fireEvent.click(screen.getByRole('button', { name: /print all/i }))
    expect(mockStartPrint).toHaveBeenCalledWith(sampleDoc, 'Boca Lemur')
  })

  it('"Pause" button is visible when isRunning is true', () => {
    mockBatchState.isRunning = true
    mockBatchState.rows = makePendingRows(1)
    render(<BatchPrintPanel document={sampleDoc} printerName="Boca Lemur" />)
    expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument()
  })

  it('"Pause" button is not rendered when isRunning is false', () => {
    render(<BatchPrintPanel document={sampleDoc} printerName="Boca Lemur" />)
    expect(screen.queryByRole('button', { name: /pause/i })).toBeNull()
  })

  it('"Pause" button calls pause()', () => {
    mockBatchState.isRunning = true
    mockBatchState.rows = makePendingRows(1)
    render(<BatchPrintPanel document={sampleDoc} printerName="Boca Lemur" />)
    fireEvent.click(screen.getByRole('button', { name: /pause/i }))
    expect(mockPause).toHaveBeenCalledTimes(1)
  })

  it('"Reset" button calls reset()', () => {
    mockBatchState.rows = makePendingRows(2)
    render(<BatchPrintPanel document={sampleDoc} printerName="Boca Lemur" />)
    fireEvent.click(screen.getByRole('button', { name: /reset/i }))
    expect(mockReset).toHaveBeenCalledTimes(1)
  })

  it('"Reset" button is disabled when isRunning is true', () => {
    mockBatchState.isRunning = true
    mockBatchState.rows = makePendingRows(1)
    render(<BatchPrintPanel document={sampleDoc} printerName="Boca Lemur" />)
    expect(screen.getByRole('button', { name: /reset/i })).toBeDisabled()
  })

  it('"Reset" button is enabled when not running', () => {
    mockBatchState.rows = makePendingRows(2)
    render(<BatchPrintPanel document={sampleDoc} printerName="Boca Lemur" />)
    expect(screen.getByRole('button', { name: /reset/i })).not.toBeDisabled()
  })

  // ─── Progress summary ───────────────────────────────────────────────────────

  it('shows "0 / 2 done" when no rows are done yet', () => {
    mockBatchState.rows = makePendingRows(2)
    render(<BatchPrintPanel document={sampleDoc} printerName="Boca Lemur" />)
    expect(screen.getByText(/0\s*\/\s*2\s*done/i)).toBeInTheDocument()
  })

  it('shows "2 / 3 done" when 2 of 3 rows are done', () => {
    mockBatchState.rows = [
      { id: 0, data: { name: 'Alice' }, status: 'done' },
      { id: 1, data: { name: 'Bob' }, status: 'done' },
      { id: 2, data: { name: 'Carol' }, status: 'pending' }
    ]
    render(<BatchPrintPanel document={sampleDoc} printerName="Boca Lemur" />)
    expect(screen.getByText(/2\s*\/\s*3\s*done/i)).toBeInTheDocument()
  })

  // ─── CSV import and field validation ───────────────────────────────────────

  it('shows loaded row count and fields after successful CSV import', async () => {
    const csvContent = 'name,seat\nAlice,A1\nBob,B2'
    render(<BatchPrintPanel document={sampleDoc} printerName="Boca Lemur" />)

    const { container } = render(<BatchPrintPanel document={sampleDoc} printerName="Boca Lemur" />)
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement

    // Simulate file selection with CSV content
    const file = new File([csvContent], 'data.csv', { type: 'text/csv' })
    Object.defineProperty(fileInput, 'files', { value: [file], configurable: true })

    await act(async () => {
      fireEvent.change(fileInput)
    })

    await waitFor(() => {
      expect(mockLoadRows).toHaveBeenCalledWith([
        { name: 'Alice', seat: 'A1' },
        { name: 'Bob', seat: 'B2' }
      ])
    })
  })

  it('shows warning when imported fields do not match template fields', async () => {
    // Doc has {{name}} placeholder, but CSV only has "seat" column (missing "name")
    const csvContent = 'seat\nA1\nB2'
    const { container } = render(<BatchPrintPanel document={sampleDoc} printerName="Boca Lemur" />)
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement

    const file = new File([csvContent], 'data.csv', { type: 'text/csv' })
    Object.defineProperty(fileInput, 'files', { value: [file], configurable: true })

    await act(async () => {
      fireEvent.change(fileInput)
    })

    await waitFor(() => {
      expect(screen.getByText(/missing fields/i)).toBeInTheDocument()
    })
  })

  it('shows parse error inline when CSV is malformed (no data rows)', async () => {
    const csvContent = 'name,seat' // header only, no data rows
    const { container } = render(<BatchPrintPanel document={sampleDoc} printerName="Boca Lemur" />)
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement

    const file = new File([csvContent], 'data.csv', { type: 'text/csv' })
    Object.defineProperty(fileInput, 'files', { value: [file], configurable: true })

    await act(async () => {
      fireEvent.change(fileInput)
    })

    await waitFor(() => {
      expect(screen.getByText(/no data rows/i)).toBeInTheDocument()
    })
  })

  it('parses JSON file when .json extension is used', async () => {
    const jsonContent = '[{"name":"Alice","seat":"A1"}]'
    const { container } = render(<BatchPrintPanel document={sampleDoc} printerName="Boca Lemur" />)
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement

    const file = new File([jsonContent], 'data.json', { type: 'application/json' })
    Object.defineProperty(fileInput, 'files', { value: [file], configurable: true })

    await act(async () => {
      fireEvent.change(fileInput)
    })

    await waitFor(() => {
      expect(mockLoadRows).toHaveBeenCalledWith([{ name: 'Alice', seat: 'A1' }])
    })
  })
})
