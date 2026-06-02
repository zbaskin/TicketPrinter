import { useState } from 'react'
import { useEditorStore } from './useEditorStore'
import EditorCanvas from './EditorCanvas'
import ElementPalette from './ElementPalette'
import PropertiesPanel from './PropertiesPanel'
import FglSourcePanel from './FglSourcePanel'
import PrintDialog from '../print/PrintDialog'
import type { StockId } from '../../../fgl/types'

export default function TicketEditor(): React.JSX.Element {
  const store = useEditorStore()
  const [showPrintDialog, setShowPrintDialog] = useState(false)

  const selectedPrinter = localStorage.getItem('selectedPrinter') ?? ''
  const canPrint = Boolean(selectedPrinter)

  function handleStockChange(e: React.ChangeEvent<HTMLSelectElement>): void {
    store.setDocument({ ...store.document, stock: e.target.value as StockId })
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

        <div className="flex-1" />

        <button
          onClick={() => setShowPrintDialog(true)}
          disabled={!canPrint}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white text-xs font-medium rounded transition-colors"
        >
          Print
        </button>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 gap-2 min-h-0">
        {/* Left: Element palette */}
        <ElementPalette onAddElement={store.addElement} />

        {/* Center: Canvas */}
        <EditorCanvas
          document={store.document}
          selectedIndex={store.selectedIndex}
          onSelect={(idx) => {
            if (idx < 0) {
              store.selectElement(null)
            } else {
              store.selectElement(idx)
            }
          }}
          onUpdateElement={store.updateElement}
        />

        {/* Right: Properties + FGL source */}
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
      </div>

      {showPrintDialog && canPrint && (
        <PrintDialog
          document={store.document}
          printerName={selectedPrinter}
          onClose={() => setShowPrintDialog(false)}
        />
      )}
    </div>
  )
}
