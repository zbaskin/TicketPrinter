import { useState, useRef, useCallback } from 'react'
import { compileBatch } from '../../../fgl/compiler'
import { applyDataRow } from '../../../fgl/template'
import type { TicketDocument } from '../../../fgl/types'
import type { PrinterConnection } from '../../../shared/types'

export type RowStatus = 'pending' | 'printing' | 'done' | 'error'

export interface BatchRow {
  id: number
  data: Record<string, string>
  status: RowStatus
  error?: string
}

export interface UseBatchPrintReturn {
  rows: BatchRow[]
  isRunning: boolean
  loadRows: (data: Record<string, string>[]) => void
  startPrint: (doc: TicketDocument, connection: PrinterConnection) => void
  pause: () => void
  reset: () => void
}

export function useBatchPrint(): UseBatchPrintReturn {
  const [rows, setRows] = useState<BatchRow[]>([])
  const rowsRef = useRef<BatchRow[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const isPausedRef = useRef(false)

  const loadRows = useCallback((data: Record<string, string>[]): void => {
    const batchRows: BatchRow[] = data.map((d, i) => ({
      id: i,
      data: d,
      status: 'pending'
    }))
    rowsRef.current = batchRows
    setRows(batchRows)
  }, [])

  const startPrint = useCallback(
    async (doc: TicketDocument, connection: PrinterConnection): Promise<void> => {
      isPausedRef.current = false
      setIsRunning(true)

      // Read pending rows directly from the ref rather than inside a setState
      // updater. React Strict Mode intentionally calls setState updaters twice to
      // detect side effects — running the print loop inside one would cause every
      // ticket to print twice concurrently.
      let pendingRows = rowsRef.current.filter((r) => r.status === 'pending')

      // If nothing is pending but rows exist, all were previously printed.
      // Reset them so Print All acts as a reprint without requiring a manual reset.
      if (pendingRows.length === 0 && rowsRef.current.length > 0) {
        const reset = rowsRef.current.map((r) => ({ ...r, status: 'pending' as RowStatus, error: undefined }))
        rowsRef.current = reset
        setRows(reset)
        pendingRows = reset
      }

      if (pendingRows.length === 0) {
        setIsRunning(false)
        return
      }

      setRows((prev) => {
        const next = prev.map((r) => r.status === 'pending' ? { ...r, status: 'printing' as RowStatus } : r)
        rowsRef.current = next
        return next
      })

      const allFgl = compileBatch(pendingRows.map((row) => applyDataRow(doc, row.data)))

      try {
        const result = await window.printerApi.print(connection, allFgl)
        if (result.success) {
          setRows((prev) => {
            const next = prev.map((r) => r.status === 'printing' ? { ...r, status: 'done' as RowStatus } : r)
            rowsRef.current = next
            return next
          })
        } else {
          setRows((prev) => {
            const next = prev.map((r) =>
              r.status === 'printing' ? { ...r, status: 'error' as RowStatus, error: result.error } : r
            )
            rowsRef.current = next
            return next
          })
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        setRows((prev) => {
          const next = prev.map((r) =>
            r.status === 'printing' ? { ...r, status: 'error' as RowStatus, error: msg } : r
          )
          rowsRef.current = next
          return next
        })
      }

      setIsRunning(false)
    },
    []
  )

  const pause = useCallback((): void => {
    isPausedRef.current = true
  }, [])

  const reset = useCallback((): void => {
    isPausedRef.current = true
    rowsRef.current = []
    setRows([])
    setIsRunning(false)
  }, [])

  return { rows, isRunning, loadRows, startPrint, pause, reset }
}
