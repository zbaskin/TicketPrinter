import { useState } from 'react'
import PrinterSetup from './settings/PrinterSetup'
import TicketEditor from './editor/TicketEditor'
import type { } from '../../fgl/types'

type Tab = 'setup' | 'editor'

export default function App(): React.JSX.Element {
  const [tab, setTab] = useState<Tab>('setup')
  const [selectedPrinter, setSelectedPrinter] = useState<string>(
    () => localStorage.getItem('selectedPrinter') ?? ''
  )

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <header className="border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold tracking-tight">TicketPrinter</h1>
          <span className="text-xs text-gray-500 font-mono bg-gray-900 px-2 py-0.5 rounded">Boca Lemur FGL</span>
        </div>
      </header>

      <nav className="border-b border-gray-800 px-6 flex gap-1">
        {(['setup', 'editor'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              tab === t
                ? 'border-blue-500 text-white'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            {t === 'editor' ? 'Editor' : 'Printer Setup'}
          </button>
        ))}
      </nav>

      <main className="flex-1 p-4 flex flex-col">
        {tab === 'setup' && (
          <PrinterSetup
            onPrinterSelected={(p) => setSelectedPrinter(p)}
          />
        )}
        {tab === 'editor' && (
          <TicketEditor />
        )}
      </main>
    </div>
  )
}
