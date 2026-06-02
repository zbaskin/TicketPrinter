import { useState, useRef, useEffect } from 'react'
import { decodeS1, firstByteFromHex } from '../../../fgl/status'
import type { QueryResult } from '../../../shared/types'
import type { S1Status } from '../../../fgl/status'

interface LogEntry {
  id: number
  timestamp: string
  command: string
  result: QueryResult
  decoded?: S1Status
  pending?: boolean
}

interface PrinterConsoleProps {
  printerName: string
}

const QUICK_COMMANDS = ['<S1>', '<S8>', '<S11>', '<S99>'] as const

function formatTime(d: Date): string {
  return [
    d.getHours().toString().padStart(2, '0'),
    d.getMinutes().toString().padStart(2, '0'),
    d.getSeconds().toString().padStart(2, '0')
  ].join(':')
}

interface StatusFieldProps {
  label: string
  value: boolean
}

function StatusField({ label, value }: StatusFieldProps): React.JSX.Element {
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded ${
      value ? 'bg-red-900/40 text-red-400' : 'bg-green-900/30 text-green-400'
    }`}>
      {label}: {value ? 'YES' : 'no'}
    </span>
  )
}

export default function PrinterConsole({ printerName }: PrinterConsoleProps): React.JSX.Element {
  const [command, setCommand] = useState('')
  const [log, setLog] = useState<LogEntry[]>([])
  const [sending, setSending] = useState(false)
  const nextId = useRef(1)
  const logEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new entries arrive
  useEffect(() => {
    if (logEndRef.current && typeof logEndRef.current.scrollIntoView === 'function') {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [log])

  async function sendCommand(cmd: string): Promise<void> {
    if (!printerName || !cmd.trim() || sending) return
    setSending(true)
    const timestamp = formatTime(new Date())
    const entryId = nextId.current++

    // Add a pending entry immediately so the user sees something happened
    setLog((prev) => [
      ...prev,
      { id: entryId, timestamp, command: cmd, result: { sent: '', responseHex: '', responseText: '' }, pending: true }
    ])

    try {
      const result = await window.printerApi.query(printerName, cmd)
      const decoded =
        cmd === '<S1>' && result.responseHex
          ? decodeS1(firstByteFromHex(result.responseHex) ?? 0)
          : undefined
      setLog((prev) =>
        prev.map((e) => e.id === entryId ? { ...e, result, decoded, pending: false } : e)
      )
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setLog((prev) =>
        prev.map((e) =>
          e.id === entryId
            ? { ...e, result: { sent: '', responseHex: '', responseText: '', error: msg }, pending: false }
            : e
        )
      )
    } finally {
      setSending(false)
    }
  }

  function handleSend(): void {
    void sendCommand(command)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
    if (e.key === 'Enter') handleSend()
  }

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* No-printer banner */}
      {!printerName && (
        <div className="flex items-center justify-center py-3 text-gray-500 font-mono text-sm bg-gray-900/50 rounded-lg border border-gray-800">
          Select a printer in Printer Setup to use the console
        </div>
      )}

      {/* Input row */}
      <div className="flex gap-2">
        <input
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="<S1>"
          disabled={sending}
          className="flex-1 bg-gray-900 border border-gray-700 text-white font-mono text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={!printerName || sending}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md transition-colors"
        >
          Send
        </button>
      </div>

      {/* Quick buttons row */}
      <div className="flex gap-2 flex-wrap">
        {QUICK_COMMANDS.map((cmd) => (
          <button
            key={cmd}
            onClick={() => void sendCommand(cmd)}
            disabled={!printerName || sending}
            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-200 text-xs font-mono rounded-md transition-colors border border-gray-700"
          >
            {cmd}
          </button>
        ))}
      </div>

      {/* Log */}
      <div className="flex-1 overflow-y-auto bg-gray-950 border border-gray-800 rounded-lg p-3 space-y-3 min-h-0">
        {log.length === 0 && (
          <p className="text-gray-600 text-xs font-mono">No queries sent yet.</p>
        )}
        {log.map((entry) => (
          <div key={entry.id} className="border-b border-gray-800 pb-2 last:border-0 last:pb-0">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-gray-500 text-xs font-mono">{entry.timestamp}</span>
              <span className="text-blue-400 text-xs font-mono">{entry.command}</span>
            </div>

            {entry.pending ? (
              <p className="text-gray-500 text-xs font-mono animate-pulse">Waiting for response…</p>
            ) : entry.result.error ? (
              <p className="text-red-400 text-xs font-mono">Error: {entry.result.error}</p>
            ) : entry.result.responseHex ? (
              <>
                <div className="text-xs font-mono">
                  <span className="text-gray-500">HEX: </span>
                  <span className="text-green-400">{entry.result.responseHex}</span>
                  {entry.result.responseText && (
                    <>
                      <span className="text-gray-500 ml-2">ASCII: </span>
                      <span className="text-yellow-300">{entry.result.responseText}</span>
                    </>
                  )}
                </div>

                {entry.decoded && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    <StatusField label="Out of stock" value={entry.decoded.outOfStock} />
                    <StatusField label="Jam" value={entry.decoded.jam} />
                    <StatusField label="Busy" value={entry.decoded.busy} />
                    <StatusField label="Error" value={entry.decoded.error} />
                    <StatusField label="Cover open" value={entry.decoded.coverOpen} />
                    <StatusField label="Cutter fault" value={entry.decoded.cutterFault} />
                  </div>
                )}
              </>
            ) : (
              <p className="text-amber-400 text-xs font-mono">
                No response — driver may not support bidirectional reads
              </p>
            )}
          </div>
        ))}
        <div ref={logEndRef} />
      </div>
    </div>
  )
}
