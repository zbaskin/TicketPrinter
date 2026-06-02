import type { TicketDocument, TicketElement } from '../../../fgl/types'
import { getStock } from '../../../fgl/stock'

const SCALE = 0.15

interface EditorCanvasProps {
  document: TicketDocument
  selectedIndex: number | null
  onSelect: (index: number) => void
  onUpdateElement: (index: number, el: TicketElement) => void
}

function ElementShape({
  el,
  index,
  selected,
  onSelect
}: {
  el: TicketElement
  index: number
  selected: boolean
  onSelect: (index: number) => void
}): React.JSX.Element {
  const strokeColor = selected ? '#3b82f6' : '#a3e635'
  const handleClick = (e: React.MouseEvent): void => {
    e.stopPropagation()
    onSelect(index)
  }

  const attrs = {
    'data-element-index': index,
    'data-selected': selected ? 'true' : 'false',
    onClick: handleClick,
    style: { cursor: 'pointer' }
  }

  switch (el.type) {
    case 'text':
      return (
        <text
          {...attrs}
          x={el.col * SCALE}
          y={el.row * SCALE}
          fontSize={10 * SCALE * (el.font ?? 3)}
          fill={selected ? '#3b82f6' : '#a3e635'}
        >
          {el.content}
        </text>
      )

    case 'hline':
      return (
        <line
          {...attrs}
          x1={el.col * SCALE}
          y1={el.row * SCALE}
          x2={(el.col + el.length) * SCALE}
          y2={el.row * SCALE}
          stroke={strokeColor}
          strokeWidth={Math.max(1, el.thickness * SCALE)}
        />
      )

    case 'vline':
      return (
        <line
          {...attrs}
          x1={el.col * SCALE}
          y1={el.row * SCALE}
          x2={el.col * SCALE}
          y2={(el.row + el.height) * SCALE}
          stroke={strokeColor}
          strokeWidth={Math.max(1, el.thickness * SCALE)}
        />
      )

    case 'box':
      return (
        <rect
          {...attrs}
          x={el.col * SCALE}
          y={el.row * SCALE}
          width={el.width * SCALE}
          height={el.height * SCALE}
          fill={el.fill ? strokeColor : 'none'}
          stroke={strokeColor}
          strokeWidth={Math.max(1, el.thickness * SCALE)}
          fillOpacity={el.fill ? 0.5 : 0}
        />
      )

    case 'qr': {
      const dotSize = el.dotSize ?? 6
      const estimatedModules = 41
      const dim = estimatedModules * dotSize * SCALE
      return (
        <g {...attrs}>
          <rect
            x={el.col * SCALE}
            y={el.row * SCALE}
            width={dim}
            height={dim}
            fill="none"
            stroke={strokeColor}
            strokeDasharray="3 2"
            strokeWidth={1}
          />
          <text
            x={el.col * SCALE + dim / 2}
            y={el.row * SCALE + dim / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={8}
            fill={strokeColor}
          >
            QR
          </text>
        </g>
      )
    }

    case 'barcode': {
      const barcodeW = 300 * SCALE
      const barcodeH = el.height * SCALE
      return (
        <g {...attrs}>
          <rect
            x={el.col * SCALE}
            y={el.row * SCALE}
            width={barcodeW}
            height={barcodeH}
            fill="none"
            stroke={strokeColor}
            strokeDasharray="3 2"
            strokeWidth={1}
          />
          <text
            x={el.col * SCALE + barcodeW / 2}
            y={el.row * SCALE + barcodeH / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={8}
            fill={strokeColor}
          >
            Barcode
          </text>
        </g>
      )
    }
  }
}

export default function EditorCanvas({
  document: doc,
  selectedIndex,
  onSelect,
  onUpdateElement: _onUpdateElement
}: EditorCanvasProps): React.JSX.Element {
  const stock = getStock(doc)
  const svgWidth = stock.heightDots * SCALE
  const svgHeight = stock.widthDots * SCALE

  return (
    <div className="overflow-auto bg-gray-800 rounded-lg p-2 flex-1 flex items-center justify-center">
      <svg
        width={svgWidth}
        height={svgHeight}
        style={{ background: '#1f2937', display: 'block' }}
        onClick={() => onSelect(-1)}
      >
        {/* Stock boundary */}
        <rect
          x={0}
          y={0}
          width={svgWidth}
          height={svgHeight}
          fill="none"
          stroke="#6b7280"
          strokeWidth={1}
          data-testid="stock-boundary"
        />

        {/* Safe margin dashed rect */}
        <rect
          x={stock.safeMargin * SCALE}
          y={stock.safeMargin * SCALE}
          width={(stock.heightDots - stock.safeMargin * 2) * SCALE}
          height={(stock.widthDots - stock.safeMargin * 2) * SCALE}
          fill="none"
          stroke="#4b5563"
          strokeWidth={0.5}
          strokeDasharray="4 2"
          data-testid="safe-margin"
        />

        {/* CINEMA exclusion zones */}
        {stock.exclusionZones.map((zone, zi) => (
          <rect
            key={zi}
            x={zone.colStart * SCALE}
            y={0}
            width={(zone.colEnd - zone.colStart) * SCALE}
            height={svgHeight}
            fill="rgba(239, 68, 68, 0.2)"
            stroke="rgba(239, 68, 68, 0.5)"
            strokeWidth={0.5}
            data-testid="exclusion-zone"
          />
        ))}

        {/* Elements */}
        {doc.elements.map((el, i) => (
          <ElementShape
            key={i}
            el={el}
            index={i}
            selected={selectedIndex === i}
            onSelect={onSelect}
          />
        ))}
      </svg>
    </div>
  )
}
