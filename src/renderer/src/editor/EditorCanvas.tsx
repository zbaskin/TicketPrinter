import { useRef, useState, useEffect } from 'react'
import type { MutableRefObject } from 'react'
import type { TicketDocument, TicketElement } from '../../../fgl/types'
import { getStock } from '../../../fgl/stock'
import { SCALE, snapToGrid, clampToStock, svgCoordsFromPointer } from './canvasUtils'

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
  onPointerDown,
  onDoubleClick
}: {
  el: TicketElement
  index: number
  selected: boolean
  onPointerDown: (e: React.PointerEvent, index: number) => void
  onDoubleClick: (e: React.MouseEvent, index: number) => void
}): React.JSX.Element {
  const strokeColor = selected ? '#3b82f6' : '#a3e635'

  const attrs = {
    'data-element-index': index,
    'data-selected': selected ? 'true' : 'false',
    onPointerDown: (e: React.PointerEvent) => onPointerDown(e, index),
    onDoubleClick: (e: React.MouseEvent) => onDoubleClick(e, index),
    style: { cursor: 'grab' }
  }

  switch (el.type) {
    case 'text':
      return (
        <g {...attrs}>
          {/* Transparent hit-target rect so entire area is draggable */}
          <rect
            x={el.col * SCALE}
            y={(el.row - el.font * 10) * SCALE}
            width={el.content.length * el.font * 6 * SCALE}
            height={el.font * 12 * SCALE}
            fill="transparent"
            pointerEvents="all"
          />
          <text
            x={el.col * SCALE}
            y={el.row * SCALE}
            fontSize={10 * SCALE * (el.font ?? 3)}
            fill={selected ? '#3b82f6' : '#a3e635'}
            pointerEvents="none"
          >
            {el.content}
          </text>
        </g>
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
            pointerEvents="none"
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
            pointerEvents="none"
          >
            Barcode
          </text>
        </g>
      )
    }
  }
}

// ── Inline text edit input ────────────────────────────────────────────────────

function InlineTextInput({
  el,
  value,
  onChange,
  onCommit,
  onCancel
}: {
  el: TicketElement & { type: 'text' }
  value: string
  onChange: (v: string) => void
  onCommit: () => void
  onCancel: () => void
}): React.JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          onCommit()
        } else if (e.key === 'Escape') {
          e.preventDefault()
          onCancel()
        }
      }}
      onBlur={onCommit}
      style={{
        position: 'absolute',
        left: el.col * SCALE,
        top: el.row * SCALE - el.font * 10 * SCALE,
        fontSize: `${10 * SCALE * (el.font ?? 3) * 4}px`,
        fontFamily: 'monospace',
        background: 'rgba(31,41,55,0.95)',
        color: '#a3e635',
        border: '1px solid #3b82f6',
        borderRadius: 2,
        padding: '0 2px',
        zIndex: 10,
        minWidth: 40
      }}
    />
  )
}

// ── Main EditorCanvas ─────────────────────────────────────────────────────────

export default function EditorCanvas({
  document: doc,
  selectedIndex,
  onSelect,
  onUpdateElement
}: EditorCanvasProps): React.JSX.Element {
  const stock = getStock(doc)
  const svgWidth = stock.heightDots * SCALE
  const svgHeight = stock.widthDots * SCALE

  const svgRef = useRef<SVGSVGElement>(null)

  // Drag state refs (non-rendering)
  const dragIndexRef: MutableRefObject<number | null> = useRef(null)
  const pointerDownSvgRef: MutableRefObject<{ x: number; y: number } | null> = useRef(null)
  const elementOriginRef: MutableRefObject<{ row: number; col: number } | null> = useRef(null)
  const pointerDownClientRef: MutableRefObject<{ x: number; y: number } | null> = useRef(null)

  // Inline text edit state
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editValue, setEditValue] = useState<string>('')

  function handleElementPointerDown(e: React.PointerEvent, index: number): void {
    e.stopPropagation()
    const target = e.currentTarget as Element
    if (typeof target.setPointerCapture === 'function') {
      target.setPointerCapture(e.pointerId)
    }
    onSelect(index)

    if (svgRef.current) {
      const svgCoords = svgCoordsFromPointer(e.clientX, e.clientY, svgRef.current)
      pointerDownSvgRef.current = svgCoords
    }
    pointerDownClientRef.current = { x: e.clientX, y: e.clientY }

    const el = doc.elements[index]
    elementOriginRef.current = { row: el.row, col: el.col }
    dragIndexRef.current = index
  }

  function handleDoubleClick(e: React.MouseEvent, index: number): void {
    e.stopPropagation()
    const el = doc.elements[index]
    if (el.type === 'text') {
      setEditingIndex(index)
      setEditValue(el.content)
    }
  }

  function handleSvgPointerDown(e: React.PointerEvent): void {
    // Only deselect if clicking directly on SVG (not on a child element that stopped propagation)
    onSelect(-1)
  }

  function handleSvgPointerMove(e: React.PointerEvent): void {
    if (dragIndexRef.current === null || pointerDownSvgRef.current === null || elementOriginRef.current === null) {
      return
    }
    if (!svgRef.current) return

    const currentSvg = svgCoordsFromPointer(e.clientX, e.clientY, svgRef.current)
    const dx = currentSvg.x - pointerDownSvgRef.current.x
    const dy = currentSvg.y - pointerDownSvgRef.current.y

    const newRow = elementOriginRef.current.row + dy / SCALE
    const newCol = elementOriginRef.current.col + dx / SCALE

    const clamped = clampToStock(newRow, newCol, stock)

    const el = doc.elements[dragIndexRef.current]
    onUpdateElement(dragIndexRef.current, { ...el, row: clamped.row, col: clamped.col })
  }

  function handleSvgPointerUp(e: React.PointerEvent): void {
    if (dragIndexRef.current === null) return

    const pdc = pointerDownClientRef.current
    if (pdc) {
      const dx = e.clientX - pdc.x
      const dy = e.clientY - pdc.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < 3) {
        // Click — restore original position (no update needed, no move happened)
        // Just clear refs
      } else {
        // Drag — snap final position to grid
        if (!svgRef.current || !elementOriginRef.current) {
          dragIndexRef.current = null
          pointerDownSvgRef.current = null
          elementOriginRef.current = null
          pointerDownClientRef.current = null
          return
        }

        const currentSvg = svgCoordsFromPointer(e.clientX, e.clientY, svgRef.current)
        const dxSvg = currentSvg.x - pointerDownSvgRef.current!.x
        const dySvg = currentSvg.y - pointerDownSvgRef.current!.y

        const rawRow = elementOriginRef.current.row + dySvg / SCALE
        const rawCol = elementOriginRef.current.col + dxSvg / SCALE

        const clamped = clampToStock(rawRow, rawCol, stock)
        const snappedRow = snapToGrid(clamped.row)
        const snappedCol = snapToGrid(clamped.col)

        const el = doc.elements[dragIndexRef.current]
        onUpdateElement(dragIndexRef.current, { ...el, row: snappedRow, col: snappedCol })
      }
    }

    dragIndexRef.current = null
    pointerDownSvgRef.current = null
    elementOriginRef.current = null
    pointerDownClientRef.current = null
  }

  function commitEdit(): void {
    if (editingIndex === null) return
    const el = doc.elements[editingIndex]
    if (el.type === 'text') {
      onUpdateElement(editingIndex, { ...el, content: editValue })
    }
    setEditingIndex(null)
  }

  function cancelEdit(): void {
    setEditingIndex(null)
  }

  const editingEl =
    editingIndex !== null && doc.elements[editingIndex]?.type === 'text'
      ? (doc.elements[editingIndex] as TicketElement & { type: 'text' })
      : null

  return (
    <div
      className="overflow-auto bg-gray-800 rounded-lg p-2 flex-1 flex items-center justify-center"
      style={{ position: 'relative' }}
    >
      <svg
        ref={svgRef}
        width={svgWidth}
        height={svgHeight}
        style={{ background: '#1f2937', display: 'block', overflow: 'visible' }}
        onPointerDown={handleSvgPointerDown}
        onPointerMove={handleSvgPointerMove}
        onPointerUp={handleSvgPointerUp}
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
            onPointerDown={handleElementPointerDown}
            onDoubleClick={handleDoubleClick}
          />
        ))}
      </svg>

      {/* Inline text edit input */}
      {editingEl !== null && (
        <InlineTextInput
          el={editingEl}
          value={editValue}
          onChange={setEditValue}
          onCommit={commitEdit}
          onCancel={cancelEdit}
        />
      )}
    </div>
  )
}
