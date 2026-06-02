import type { TicketElement } from '../../../fgl/types'

interface ElementPaletteProps {
  onAddElement: (el: TicketElement) => void
}

const PALETTE_ITEMS: Array<{ label: string; element: TicketElement }> = [
  {
    label: 'Text',
    element: { type: 'text', row: 100, col: 100, font: 3, hwScale: [3, 3], content: 'New Text' }
  },
  {
    label: 'H Line',
    element: { type: 'hline', row: 200, col: 100, length: 400, thickness: 4 }
  },
  {
    label: 'V Line',
    element: { type: 'vline', row: 100, col: 200, height: 400, thickness: 4 }
  },
  {
    label: 'Box',
    element: { type: 'box', row: 100, col: 100, width: 300, height: 200, thickness: 3 }
  },
  {
    label: 'Filled Box',
    element: { type: 'box', row: 100, col: 100, width: 300, height: 200, thickness: 1, fill: true }
  },
  {
    label: 'QR Code',
    element: { type: 'qr', row: 100, col: 100, content: 'https://example.com', dotSize: 6 }
  }
]

export default function ElementPalette({ onAddElement }: ElementPaletteProps): React.JSX.Element {
  return (
    <div className="flex flex-col gap-1 w-12 shrink-0">
      {PALETTE_ITEMS.map((item) => (
        <button
          key={item.label}
          onClick={() => onAddElement(item.element)}
          title={item.label}
          className="w-full px-1 py-2 text-xs font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded text-center transition-colors leading-tight"
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
