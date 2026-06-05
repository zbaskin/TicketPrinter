import { useState, useEffect } from 'react'
import type { PrinterConnection } from '../../../shared/types'

type Status = 'idle' | 'printing' | 'success' | 'error'
type ConnType = 'usb' | 'ethernet'

interface PrinterSetupProps {
  onConnectionChanged?: (connection: PrinterConnection) => void
}

function loadStored(): { connType: ConnType; printerName: string; host: string; port: string } {
  try {
    const stored = localStorage.getItem('printerConnection')
    if (!stored) return { connType: 'usb', printerName: '', host: '', port: '9100' }
    const c = JSON.parse(stored) as PrinterConnection
    if (c.type === 'usb') return { connType: 'usb', printerName: c.printerName, host: '', port: '9100' }
    return { connType: 'ethernet', printerName: '', host: c.host, port: String(c.port) }
  } catch {
    return { connType: 'usb', printerName: '', host: '', port: '9100' }
  }
}

export default function PrinterSetup({ onConnectionChanged }: PrinterSetupProps): React.JSX.Element {
  const [printers, setPrinters] = useState<string[]>([])
  const initial = loadStored()
  const [connType, setConnType] = useState<ConnType>(initial.connType)
  const [selectedPrinter, setSelectedPrinter] = useState<string>(initial.printerName)
  const [host, setHost] = useState<string>(initial.host)
  const [port, setPort] = useState<string>(initial.port)
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState<string>('')

  useEffect(() => {
    window.printerApi.listPrinters().then(setPrinters)
  }, [])

  function buildConnection(): PrinterConnection | null {
    if (connType === 'usb') {
      if (!selectedPrinter) return null
      return { type: 'usb', printerName: selectedPrinter }
    }
    const portNum = parseInt(port, 10)
    if (!host || isNaN(portNum)) return null
    return { type: 'ethernet', host, port: portNum }
  }

  function persistAndNotify(c: PrinterConnection): void {
    localStorage.setItem('printerConnection', JSON.stringify(c))
    onConnectionChanged?.(c)
  }

  function handleTypeChange(t: ConnType): void {
    setConnType(t)
    setStatus('idle')
    setErrorMsg('')
  }

  function handlePrinterSelect(e: React.ChangeEvent<HTMLSelectElement>): void {
    const value = e.target.value
    setSelectedPrinter(value)
    if (value) persistAndNotify({ type: 'usb', printerName: value })
  }

  function handleHostChange(e: React.ChangeEvent<HTMLInputElement>): void {
    setHost(e.target.value)
  }

  function handlePortChange(e: React.ChangeEvent<HTMLInputElement>): void {
    setPort(e.target.value)
  }

  function handleSaveEthernet(): void {
    const c = buildConnection()
    if (c) persistAndNotify(c)
  }

  async function handleTestConnection(): Promise<void> {
    const c = buildConnection()
    if (!c) return
    setStatus('printing')
    setErrorMsg('')
    try {
      const result = await window.printerApi.print(c, '<NF><p>')
      if (result.success) {
        setStatus('success')
        persistAndNotify(c)
      } else {
        setStatus('error')
        setErrorMsg(result.error ?? 'Unknown error')
      }
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : String(err))
    }
  }

  const canTest = connType === 'usb' ? Boolean(selectedPrinter) : Boolean(host) && Boolean(port)

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h2 className="text-lg font-semibold text-white mb-1">Printer Setup</h2>
        <p className="text-sm text-gray-400">Configure your Boca Lemur printer connection.</p>
      </div>

      {/* Connection type toggle */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">Connection Type</label>
        <div className="flex rounded overflow-hidden border border-gray-700 w-fit">
          <button
            onClick={() => handleTypeChange('usb')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${connType === 'usb' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
          >
            USB
          </button>
          <button
            onClick={() => handleTypeChange('ethernet')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${connType === 'ethernet' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
          >
            Ethernet
          </button>
        </div>
      </div>

      {/* USB: printer dropdown */}
      {connType === 'usb' && (
        <div className="space-y-2">
          <label htmlFor="printer-select" className="block text-sm font-medium text-gray-300">
            Windows Printer
          </label>
          <select
            id="printer-select"
            value={selectedPrinter}
            onChange={handlePrinterSelect}
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
      )}

      {/* Ethernet: IP + port inputs */}
      {connType === 'ethernet' && (
        <div className="space-y-3">
          <div className="space-y-2">
            <label htmlFor="printer-host" className="block text-sm font-medium text-gray-300">
              Printer IP Address
            </label>
            <input
              id="printer-host"
              type="text"
              value={host}
              onChange={handleHostChange}
              onBlur={handleSaveEthernet}
              placeholder="192.168.1.100"
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="printer-port" className="block text-sm font-medium text-gray-300">
              Port
            </label>
            <input
              id="printer-port"
              type="number"
              value={port}
              onChange={handlePortChange}
              onBlur={handleSaveEthernet}
              min={1}
              max={65535}
              className="w-32 bg-gray-800 border border-gray-700 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>
          <p className="text-xs text-gray-500">Default Boca port is 9100. Requires a switch or second ethernet port.</p>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={handleTestConnection}
          disabled={status === 'printing' || !canTest}
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
