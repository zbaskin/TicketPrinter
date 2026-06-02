import type { TicketDocument, TicketElement, FontId } from '../../../fgl/types'
import { validate } from '../../../fgl/validator'

interface PropertiesPanelProps {
  document: TicketDocument
  selectedIndex: number | null
  onUpdateElement: (index: number, el: TicketElement) => void
  onRemoveElement: (index: number) => void
}

function labelClass(): string {
  return 'block text-xs font-medium text-gray-400 mb-0.5'
}

function inputClass(): string {
  return 'w-full bg-gray-800 border border-gray-700 text-white rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500'
}

export default function PropertiesPanel({
  document: doc,
  selectedIndex,
  onUpdateElement,
  onRemoveElement
}: PropertiesPanelProps): React.JSX.Element {
  if (selectedIndex === null || selectedIndex < 0 || selectedIndex >= doc.elements.length) {
    return (
      <div className="p-3 text-sm text-gray-500 italic">
        Select an element to edit its properties.
      </div>
    )
  }

  const el = doc.elements[selectedIndex]
  const errors = validate(doc).filter((e) => e.elementIndex === selectedIndex)

  function update(patch: Partial<TicketElement>): void {
    onUpdateElement(selectedIndex!, { ...el, ...patch } as TicketElement)
  }

  return (
    <div className="p-3 space-y-3 overflow-y-auto">
      {errors.length > 0 && (
        <div className="space-y-1">
          {errors.map((err, i) => (
            <div key={i} className="text-xs text-red-400 bg-red-950/40 px-2 py-1 rounded">
              {err.message}
            </div>
          ))}
        </div>
      )}

      {/* Common fields */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor="prop-row" className={labelClass()}>Row</label>
          <input
            id="prop-row"
            type="number"
            className={inputClass()}
            value={el.row}
            onChange={(e) => update({ row: Number(e.target.value) } as Partial<TicketElement>)}
          />
        </div>
        <div>
          <label htmlFor="prop-col" className={labelClass()}>Col</label>
          <input
            id="prop-col"
            type="number"
            className={inputClass()}
            value={el.col}
            onChange={(e) => update({ col: Number(e.target.value) } as Partial<TicketElement>)}
          />
        </div>
      </div>

      {/* Type-specific fields */}
      {el.type === 'text' && (
        <>
          <div>
            <label htmlFor="prop-content" className={labelClass()}>Content</label>
            <input
              id="prop-content"
              type="text"
              className={inputClass()}
              value={el.content}
              onChange={(e) => update({ content: e.target.value } as Partial<TicketElement>)}
            />
          </div>
          <div>
            <label htmlFor="prop-font" className={labelClass()}>Font</label>
            <select
              id="prop-font"
              className={inputClass()}
              value={el.font}
              onChange={(e) => update({ font: Number(e.target.value) as FontId } as Partial<TicketElement>)}
            >
              {([1, 2, 3, 4, 5, 6, 7, 8, 9] as FontId[]).map((f) => (
                <option key={f} value={f}>Font {f}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="prop-hw-w" className={labelClass()}>HW Scale W</label>
              <input
                id="prop-hw-w"
                type="number"
                min={1}
                className={inputClass()}
                value={el.hwScale?.[0] ?? 1}
                onChange={(e) => {
                  const w = Number(e.target.value)
                  const h = el.hwScale?.[1] ?? 1
                  update({ hwScale: [w, h] } as Partial<TicketElement>)
                }}
              />
            </div>
            <div>
              <label htmlFor="prop-hw-h" className={labelClass()}>HW Scale H</label>
              <input
                id="prop-hw-h"
                type="number"
                min={1}
                className={inputClass()}
                value={el.hwScale?.[1] ?? 1}
                onChange={(e) => {
                  const h = Number(e.target.value)
                  const w = el.hwScale?.[0] ?? 1
                  update({ hwScale: [w, h] } as Partial<TicketElement>)
                }}
              />
            </div>
          </div>
        </>
      )}

      {el.type === 'hline' && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="prop-length" className={labelClass()}>Length</label>
            <input
              id="prop-length"
              type="number"
              className={inputClass()}
              value={el.length}
              onChange={(e) => update({ length: Number(e.target.value) } as Partial<TicketElement>)}
            />
          </div>
          <div>
            <label htmlFor="prop-thickness" className={labelClass()}>Thickness</label>
            <input
              id="prop-thickness"
              type="number"
              min={1}
              className={inputClass()}
              value={el.thickness}
              onChange={(e) => update({ thickness: Number(e.target.value) } as Partial<TicketElement>)}
            />
          </div>
        </div>
      )}

      {el.type === 'vline' && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="prop-height-v" className={labelClass()}>Height</label>
            <input
              id="prop-height-v"
              type="number"
              className={inputClass()}
              value={el.height}
              onChange={(e) => update({ height: Number(e.target.value) } as Partial<TicketElement>)}
            />
          </div>
          <div>
            <label htmlFor="prop-thickness-v" className={labelClass()}>Thickness</label>
            <input
              id="prop-thickness-v"
              type="number"
              min={1}
              className={inputClass()}
              value={el.thickness}
              onChange={(e) => update({ thickness: Number(e.target.value) } as Partial<TicketElement>)}
            />
          </div>
        </div>
      )}

      {el.type === 'box' && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="prop-width" className={labelClass()}>Width</label>
              <input
                id="prop-width"
                type="number"
                className={inputClass()}
                value={el.width}
                onChange={(e) => update({ width: Number(e.target.value) } as Partial<TicketElement>)}
              />
            </div>
            <div>
              <label htmlFor="prop-height-b" className={labelClass()}>Height</label>
              <input
                id="prop-height-b"
                type="number"
                className={inputClass()}
                value={el.height}
                onChange={(e) => update({ height: Number(e.target.value) } as Partial<TicketElement>)}
              />
            </div>
          </div>
          <div>
            <label htmlFor="prop-thickness-b" className={labelClass()}>Thickness</label>
            <input
              id="prop-thickness-b"
              type="number"
              min={1}
              className={inputClass()}
              value={el.thickness}
              onChange={(e) => update({ thickness: Number(e.target.value) } as Partial<TicketElement>)}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="prop-fill"
              type="checkbox"
              checked={el.fill ?? false}
              onChange={(e) => update({ fill: e.target.checked } as Partial<TicketElement>)}
              className="accent-blue-500"
            />
            <label htmlFor="prop-fill" className="text-xs text-gray-400">Fill</label>
          </div>
        </>
      )}

      {el.type === 'qr' && (
        <>
          <div>
            <label htmlFor="prop-qr-content" className={labelClass()}>Content</label>
            <input
              id="prop-qr-content"
              type="text"
              className={inputClass()}
              value={el.content}
              onChange={(e) => update({ content: e.target.value } as Partial<TicketElement>)}
            />
          </div>
          <div>
            <label htmlFor="prop-dot-size" className={labelClass()}>Dot Size</label>
            <input
              id="prop-dot-size"
              type="number"
              min={1}
              className={inputClass()}
              value={el.dotSize ?? 6}
              onChange={(e) => update({ dotSize: Number(e.target.value) } as Partial<TicketElement>)}
            />
          </div>
        </>
      )}

      {el.type === 'barcode' && (
        <>
          <div>
            <label htmlFor="prop-barcode-content" className={labelClass()}>Content</label>
            <input
              id="prop-barcode-content"
              type="text"
              className={inputClass()}
              value={el.content}
              onChange={(e) => update({ content: e.target.value } as Partial<TicketElement>)}
            />
          </div>
          <div>
            <label htmlFor="prop-barcode-height" className={labelClass()}>Height</label>
            <input
              id="prop-barcode-height"
              type="number"
              className={inputClass()}
              value={el.height}
              onChange={(e) => update({ height: Number(e.target.value) } as Partial<TicketElement>)}
            />
          </div>
        </>
      )}

      <button
        onClick={() => onRemoveElement(selectedIndex)}
        className="w-full px-3 py-1.5 bg-red-900 hover:bg-red-800 text-red-200 text-xs font-medium rounded transition-colors"
      >
        Delete Element
      </button>
    </div>
  )
}
