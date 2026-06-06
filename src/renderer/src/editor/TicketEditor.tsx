import { useState } from 'react'
import { useEditorStore } from './useEditorStore'
import EditorCanvas from './EditorCanvas'
import ElementPalette from './ElementPalette'
import PropertiesPanel from './PropertiesPanel'
import FglSourcePanel from './FglSourcePanel'
import FglEditorPanel from './FglEditorPanel'
import PrintDialog from '../print/PrintDialog'
import BatchPrintPanel from '../batch/BatchPrintPanel'
import type { StockId } from '../../../fgl/types'
import type { PrinterConnection } from '../../../shared/types'

function loadStoredConnection(): PrinterConnection | null {
  try {
    const stored = localStorage.getItem('printerConnection')
    return stored ? (JSON.parse(stored) as PrinterConnection) : null
  } catch {
    return null
  }
}

export default function TicketEditor(): React.JSX.Element {
  const store = useEditorStore()
  const [showPrintDialog, setShowPrintDialog] = useState(false)
  const [showBatchPanel, setShowBatchPanel] = useState(false)
  const [editorMode, setEditorMode] = useState<'visual' | 'fgl'>('visual')
  const [zoom, setZoom] = useState(1.5)
  const [layoutMsg, setLayoutMsg] = useState<{ text: string; ok: boolean } | null>(null)

  function zoomIn(): void { setZoom(z => Math.min(4, Math.round((z + 0.25) * 100) / 100)) }
  function zoomOut(): void { setZoom(z => Math.max(0.5, Math.round((z - 0.25) * 100) / 100)) }

  const connection = loadStoredConnection()
  const canPrint = connection !== null

  function handleStockChange(e: React.ChangeEvent<HTMLSelectElement>): void {
    store.setDocument({ ...store.document, stock: e.target.value as StockId })
  }

  function showMsg(text: string, ok: boolean): void {
    setLayoutMsg({ text, ok })
    setTimeout(() => setLayoutMsg(null), 3000)
  }

  async function handleSaveLayout(): Promise<void> {
    const result = await window.layoutApi.save(store.document)
    if (result.success) {
      showMsg('Layout saved', true)
    } else if (result.error) {
      showMsg(result.error, false)
    }
  }

  async function handleOpenLayout(): Promise<void> {
    const result = await window.layoutApi.open()
    if (result.success && result.document) {
      store.setDocument(result.document)
      showMsg('Layout loaded', true)
    } else if (result.error) {
      showMsg(result.error, false)
    }
  }

  return (
    <div className="flex flex-col h-full gap-2">
      {/* Toolbar */}
      <div className="flex items-center gap-4 px-2 py-1 bg-gray-900 border border-gray-700 rounded-lg">
        <label htmlFor="stock-select" className="text-xs font-medium text-gray-400">
          Stock
        </label>
        <select
          id="stock-select"
          value={store.document.stock}
          onChange={handleStockChange}
          className="bg-gray-800 border border-gray-700 text-white rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="CONCERT">CONCERT (2" × 5.5")</option>
          <option value="CINEMA">CINEMA (3.25" × 2")</option>
          <option value="custom">Custom</option>
        </select>

        {/* Visual / FGL mode toggle */}
        <div className="flex rounded overflow-hidden border border-gray-700">
          <button
            onClick={() => setEditorMode('visual')}
            className={`px-3 py-1 text-xs font-medium transition-colors ${editorMode === 'visual' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
          >
            Visual
          </button>
          <button
            onClick={() => setEditorMode('fgl')}
            className={`px-3 py-1 text-xs font-medium transition-colors ${editorMode === 'fgl' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
          >
            FGL
          </button>
        </div>

        {store.document.rawFglOverride !== undefined && editorMode === 'visual' && (
          <span className="text-xs text-yellow-400 font-medium">FGL override active</span>
        )}

        <div className="flex-1" />

        {/* Zoom controls */}
        <div className="flex items-center gap-1 border border-gray-700 rounded overflow-hidden">
          <button
            aria-label="Zoom out"
            onClick={zoomOut}
            disabled={zoom <= 0.5}
            className="px-2 py-1 text-xs font-medium bg-gray-800 text-gray-300 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            −
          </button>
          <span className="px-2 text-xs text-gray-400 tabular-nums select-none">
            {Math.round(zoom * 100)}%
          </span>
          <button
            aria-label="Zoom in"
            onClick={zoomIn}
            disabled={zoom >= 4}
            className="px-2 py-1 text-xs font-medium bg-gray-800 text-gray-300 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            +
          </button>
        </div>

        <button
          onClick={() => void handleOpenLayout()}
          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium rounded transition-colors"
        >
          Open Layout
        </button>

        <button
          onClick={() => void handleSaveLayout()}
          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium rounded transition-colors"
        >
          Save Layout
        </button>

        <button
          onClick={() => setShowBatchPanel(true)}
          className="px-3 py-1 bg-purple-700 hover:bg-purple-600 text-white text-xs font-medium rounded transition-colors"
        >
          Batch Print
        </button>

        <button
          onClick={() => setShowPrintDialog(true)}
          disabled={!canPrint}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white text-xs font-medium rounded transition-colors"
        >
          Print
        </button>

        {layoutMsg && (
          <span className={`text-xs font-medium ${layoutMsg.ok ? 'text-green-400' : 'text-red-400'}`}>
            {layoutMsg.text}
          </span>
        )}
      </div>

      {/* Main layout */}
      <div className="flex flex-1 gap-2 min-h-0 overflow-hidden">
        {editorMode === 'visual' ? (
          <>
            <ElementPalette onAddElement={store.addElement} />

            <EditorCanvas
              document={store.document}
              selectedIndex={store.selectedIndex}
              zoom={zoom}
              onSelect={(idx) => {
                if (idx < 0) {
                  store.selectElement(null)
                } else {
                  store.selectElement(idx)
                }
              }}
              onUpdateElement={store.updateElement}
              onRemoveElement={(idx) => {
                store.removeElement(idx)
                store.selectElement(null)
              }}
            />

            <div className="w-72 shrink-0 flex flex-col gap-2 overflow-hidden">
              <div className="flex-1 bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
                <div className="px-3 py-2 text-xs font-semibold text-gray-400 border-b border-gray-800">
                  Properties
                </div>
                <PropertiesPanel
                  document={store.document}
                  selectedIndex={store.selectedIndex}
                  onUpdateElement={store.updateElement}
                  onRemoveElement={(idx) => {
                    store.removeElement(idx)
                    store.selectElement(null)
                  }}
                />
              </div>

              <FglSourcePanel document={store.document} />
            </div>
          </>
        ) : (
          <div className="flex-1 bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
            <FglEditorPanel
              document={store.document}
              onApply={(fgl) => store.setRawFgl(fgl)}
              onRevert={() => store.setRawFgl(null)}
            />
          </div>
        )}
      </div>

      {showPrintDialog && connection && (
        <PrintDialog
          document={store.document}
          connection={connection}
          onClose={() => setShowPrintDialog(false)}
        />
      )}

      {showBatchPanel && (
        <div
          role="dialog"
          aria-label="Batch Print"
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={(e) => e.target === e.currentTarget && setShowBatchPanel(false)}
        >
          <div className="bg-gray-950 border border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-white">Batch Print</h2>
              <button
                onClick={() => setShowBatchPanel(false)}
                className="text-gray-400 hover:text-white text-xl leading-none"
              >
                ×
              </button>
            </div>
            <BatchPrintPanel
              document={store.document}
              connection={connection}
            />
          </div>
        </div>
      )}
    </div>
  )
}
