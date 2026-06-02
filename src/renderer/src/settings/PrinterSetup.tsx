import { useState, useEffect } from 'react'
import type { PrintResult } from '../../../shared/types'

type Status = 'idle' | 'printing' | 'success' | 'error'

interface PrinterSetupProps {
  onPrinterSelected?: (printer: string) => void
}

export default function PrinterSetup({ onPrinterSelected }: PrinterSetupProps): React.JSX.Element {
  const [printers, setPrinters] = useState<string[]>([])
  const [selected, setSelected] = useState<string>(() => localStorage.getItem('selectedPrinter') ?? '')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState<string>('')

  useEffect(() => {
    window.printerApi.listPrinters().then(setPrinters)
  }, [])

  function handleSelect(e: React.ChangeEvent<HTMLSelectElement>): void {
    const value = e.target.value
    setSelected(value)
    localStorage.setItem('selectedPrinter', value)
    onPrinterSelected?.(value)
  }

  async function handleTestConnection(): Promise<void> {
    if (!selected) return
    setStatus('printing')
    setErrorMsg('')
    try {
      const result: PrintResult = await window.printerApi.print(selected, '<NF><p>')
      if (result.success) {
        setStatus('success')
      } else {
        setStatus('error')
        setErrorMsg(result.error ?? 'Unknown error')
      }
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h2 className="text-lg font-semibold text-white mb-1">Printer Setup</h2>
        <p className="text-sm text-gray-400">Select your Boca Lemur printer and verify the connection.</p>
      </div>

      <div className="space-y-2">
        <label htmlFor="printer-select" className="block text-sm font-medium text-gray-300">
          Windows Printer
        </label>
        <select
          id="printer-select"
          value={selected}
          onChange={handleSelect}
          className="w-full bg-gray-800 border border-gray-700 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">— Select a printer —</option>
          {printers.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        {printers.length === 0 && (
          <p className="text-xs text-gray-500">No printers found. Is the Boca Lemur connected?</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleTestConnection}
          disabled={status === 'printing' || !selected}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md transition-colors"
        >
          {status === 'printing' ? 'Printing…' : 'Test Connection'}
        </button>

        {status === 'success' && (
          <span className="text-sm text-green-400">Blank ticket sent successfully</span>
        )}
        {status === 'error' && (
          <span className="text-sm text-red-400">{errorMsg}</span>
        )}
      </div>
    </div>
  )
}
