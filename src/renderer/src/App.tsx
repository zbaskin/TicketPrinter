import { useState, useEffect } from 'react'

function App(): React.JSX.Element {
  const [printers, setPrinters] = useState<string[]>([])

  useEffect(() => {
    window.printerApi.listPrinters().then(setPrinters)
  }, [])

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center gap-3">
        <h1 className="text-xl font-semibold tracking-tight">TicketPrinter</h1>
        <span className="text-xs text-gray-500 font-mono">Boca Lemur FGL</span>
      </header>

      <main className="flex-1 p-6">
        <p className="text-gray-400 mb-6 text-sm">
          Visual ticket designer — editor coming soon.
        </p>

        {printers.length > 0 && (
          <div className="bg-gray-900 rounded-lg p-4 max-w-sm">
            <h2 className="text-sm font-medium text-gray-300 mb-2">Detected Printers</h2>
            <ul className="space-y-1">
              {printers.map((p) => (
                <li key={p} className="text-sm font-mono text-green-400">
                  {p}
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
