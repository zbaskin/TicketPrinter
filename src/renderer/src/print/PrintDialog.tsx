import { useState } from 'react'
import { compile, compileWithCopies } from '../../../fgl/compiler'
import type { TicketDocument } from '../../../fgl/types'
import type { PrinterConnection } from '../../../shared/types'
import { connectionLabel } from '../../../shared/types'

type CopyStatus = 'queued' | 'printing' | 'done' | 'error'

interface CopyState {
  index: number
  status: CopyStatus
  error?: string
}

interface PrintDialogProps {
  document: TicketDocument
  connection: PrinterConnection
  onClose: () => void
}

const STATUS_COLORS: Record<CopyStatus, string> = {
  queued:   'text-gray-400',
  printing: 'text-yellow-400',
  done:     'text-green-400',
  error:    'text-red-400'
}

export default function PrintDialog({ document: doc, connection, onClose }: PrintDialogProps): React.JSX.Element {
  const [copies, setCopies] = useState<number>(1)
  const [printing, setPrinting] = useState<boolean>(false)
  const [copyStates, setCopyStates] = useState<CopyState[]>([])
  const [showFgl, setShowFgl] = useState(false)

  const compiledFgl = compile(doc)
  const byteCount = new TextEncoder().encode(compiledFgl).length
  const isEmpty = !doc.rawFglOverride && doc.elements.length === 0

  async function handlePrint(): Promise<void> {
    const states: CopyState[] = Array.from({ length: copies }, (_, i) => ({ index: i, status: 'printing' }))
    setCopyStates(states)
    setPrinting(true)

    const allFgl = compileWithCopies(doc, copies)

    try {
      const result = await window.printerApi.print(connection, allFgl)
      if (result.success) {
        setCopyStates((prev) => prev.map((c) => ({ ...c, status: 'done' })))
      } else {
        setCopyStates((prev) => prev.map((c) => ({ ...c, status: 'error', error: result.error })))
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setCopyStates((prev) => prev.map((c) => ({ ...c, status: 'error', error: msg })))
    }

    setPrinting(false)
  }

  return (
    <div
      role="dialog"
      aria-label="Print Dialog"
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Print Ticket</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">×</button>
        </div>

        <div className="text-sm text-gray-400">
          Printer: <span className="text-white font-mono">{connectionLabel(connection)}</span>
        </div>

        {isEmpty && (
          <div className="bg-amber-900/30 border border-amber-700 rounded-md px-3 py-2 text-sm text-amber-300">
            No elements on canvas — this will print a blank ticket. Add text or shapes in the Editor first.
          </div>
        )}

        <div className="space-y-1">
          <button
            onClick={() => setShowFgl((v) => !v)}
            className="text-xs text-gray-400 hover:text-gray-200 flex items-center gap-1"
          >
            <span>{showFgl ? '▾' : '▸'}</span>
            FGL payload — {byteCount} bytes
          </button>
          {showFgl && (
            <pre className="bg-gray-950 border border-gray-800 rounded p-2 text-xs font-mono text-green-400 overflow-x-auto max-h-32 whitespace-pre-wrap break-all">
              {compiledFgl}
            </pre>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="copies-input" className="block text-sm font-medium text-gray-300">Copies</label>
          <input
            id="copies-input"
            type="number"
            min="1"
            max="99"
            value={copies}
            onChange={(e) => setCopies(Math.max(1, Math.min(99, Number(e.target.value))))}
            className="w-24 bg-gray-800 border border-gray-700 text-white rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {copyStates.length > 0 && (
          <ul className="space-y-1 max-h-32 overflow-y-auto">
            {copyStates.map((c) => (
              <li key={c.index} className={`text-sm font-mono ${STATUS_COLORS[c.status]}`}>
                Copy {c.index + 1}: {c.status}{c.error ? ` — ${c.error}` : ''}
              </li>
            ))}
          </ul>
        )}

        <div className="flex gap-3 pt-1">
          <button
            onClick={handlePrint}
            disabled={printing}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md transition-colors"
          >
            {printing ? 'Printing…' : `Print${copies > 1 ? ` × ${copies}` : ''}`}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
