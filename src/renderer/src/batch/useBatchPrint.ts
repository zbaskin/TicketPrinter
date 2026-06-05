import { useState, useRef, useCallback } from 'react'
import { compile } from '../../../fgl/compiler'
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
  const [isRunning, setIsRunning] = useState(false)
  const isPausedRef = useRef(false)

  const loadRows = useCallback((data: Record<string, string>[]): void => {
    const batchRows: BatchRow[] = data.map((d, i) => ({
      id: i,
      data: d,
      status: 'pending'
    }))
    setRows(batchRows)
  }, [])

  const startPrint = useCallback(
    async (doc: TicketDocument, connection: PrinterConnection): Promise<void> => {
      isPausedRef.current = false
      setIsRunning(true)

      setRows((currentRows) => {
        void (async () => {
          const snapshot = currentRows.slice()
          for (const row of snapshot) {
            if (isPausedRef.current) break
            if (row.status !== 'pending') continue

            setRows((prev) =>
              prev.map((r) => (r.id === row.id ? { ...r, status: 'printing' } : r))
            )

            try {
              const fgl = compile(applyDataRow(doc, row.data))
              const result = await window.printerApi.print(connection, fgl)
              if (result.success) {
                setRows((prev) =>
                  prev.map((r) => (r.id === row.id ? { ...r, status: 'done' } : r))
                )
              } else {
                setRows((prev) =>
                  prev.map((r) =>
                    r.id === row.id ? { ...r, status: 'error', error: result.error } : r
                  )
                )
              }
            } catch (err) {
              const msg = err instanceof Error ? err.message : String(err)
              setRows((prev) =>
                prev.map((r) => (r.id === row.id ? { ...r, status: 'error', error: msg } : r))
              )
            }
          }
          setIsRunning(false)
        })()
        return currentRows
      })
    },
    []
  )

  const pause = useCallback((): void => {
    isPausedRef.current = true
  }, [])

  const reset = useCallback((): void => {
    isPausedRef.current = true
    setRows([])
    setIsRunning(false)
  }, [])

  return { rows, isRunning, loadRows, startPrint, pause, reset }
}
