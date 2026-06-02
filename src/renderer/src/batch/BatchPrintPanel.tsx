import { useRef, useState } from 'react'
import { useBatchPrint } from './useBatchPrint'
import type { RowStatus } from './useBatchPrint'
import { parseCsv, parseJson } from '../../../fgl/dataParser'
import { extractFields } from '../../../fgl/template'
import type { TicketDocument } from '../../../fgl/types'

interface BatchPrintPanelProps {
  document: TicketDocument
  printerName: string
}

const STATUS_COLORS: Record<RowStatus, string> = {
  pending:  'text-gray-400',
  printing: 'text-yellow-400',
  done:     'text-green-400',
  error:    'text-red-400'
}

export default function BatchPrintPanel({ document: doc, printerName }: BatchPrintPanelProps): React.JSX.Element {
  const { rows, isRunning, loadRows, startPrint, pause, reset } = useBatchPrint()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [parseError, setParseError] = useState<string | undefined>()
  const [missingFields, setMissingFields] = useState<string[]>([])
  const [importedHeaders, setImportedHeaders] = useState<string[]>([])

  const doneCount = rows.filter((r) => r.status === 'done').length
  const totalCount = rows.length
  const canPrint = rows.length > 0 && Boolean(printerName) && !isRunning

  function handleImportClick(): void {
    fileInputRef.current?.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt): void => {
      const text = evt.target?.result as string
      const isJson = file.name.toLowerCase().endsWith('.json')
      const result = isJson ? parseJson(text) : parseCsv(text)

      if (result.error) {
        setParseError(result.error)
        setMissingFields([])
        setImportedHeaders([])
        return
      }

      setParseError(undefined)
      setImportedHeaders(result.headers)

      // Check for missing fields
      const templateFields = extractFields(doc)
      const missing = templateFields.filter((f) => !result.headers.includes(f))
      setMissingFields(missing)

      loadRows(result.rows)
    }
    reader.readAsText(file)

    // Reset file input so the same file can be re-selected
    e.target.value = ''
  }

  return (
    <div className="flex flex-col gap-4 p-4 bg-gray-900 rounded-lg border border-gray-700">
      {/* Section 1: Data Import */}
      <div className="flex flex-col gap-2">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Data Import</div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleImportClick}
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium rounded transition-colors"
          >
            Import CSV / JSON
          </button>
          {importedHeaders.length > 0 && !parseError && (
            <span className="text-xs text-gray-300">
              {rows.length} rows loaded, fields: {importedHeaders.join(', ')}
            </span>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.json"
          className="hidden"
          onChange={handleFileChange}
        />

        {parseError && (
          <div className="text-xs text-red-400 bg-red-950/40 border border-red-800 rounded px-2 py-1">
            {parseError}
          </div>
        )}

        {missingFields.length > 0 && (
          <div className="text-xs text-yellow-400 bg-yellow-950/40 border border-yellow-800 rounded px-2 py-1">
            Missing fields: {missingFields.join(', ')}
          </div>
        )}
      </div>

      {/* Section 2: Queue Table */}
      <div className="flex flex-col gap-1">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Queue</div>
        {rows.length === 0 ? (
          <div className="text-xs text-gray-500 italic py-2">
            No data loaded — import a CSV or JSON file
          </div>
        ) : (
          <div className="border border-gray-700 rounded overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-800 text-gray-400">
                  <th className="px-2 py-1 text-left w-10">#</th>
                  <th className="px-2 py-1 text-left">Preview</th>
                  <th className="px-2 py-1 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const previewValues = Object.values(row.data).slice(0, 2).join(' | ')
                  return (
                    <tr key={row.id} className="border-t border-gray-800">
                      <td className="px-2 py-1 text-gray-400">{row.id + 1}</td>
                      <td className="px-2 py-1 text-gray-300 font-mono truncate max-w-xs">
                        {previewValues}
                      </td>
                      <td className="px-2 py-1 text-right">
                        <span className={`font-medium ${STATUS_COLORS[row.status as RowStatus]}`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 3: Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => startPrint(doc, printerName)}
          disabled={!canPrint}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white text-xs font-medium rounded transition-colors"
        >
          Print All
        </button>

        {isRunning && (
          <button
            onClick={pause}
            className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-500 text-white text-xs font-medium rounded transition-colors"
          >
            Pause
          </button>
        )}

        <button
          onClick={reset}
          disabled={isRunning}
          className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-gray-300 text-xs font-medium rounded transition-colors"
        >
          Reset
        </button>

        <div className="flex-1" />

        {totalCount > 0 && (
          <span className="text-xs text-gray-400">
            {doneCount} / {totalCount} done
          </span>
        )}
      </div>
    </div>
  )
}
