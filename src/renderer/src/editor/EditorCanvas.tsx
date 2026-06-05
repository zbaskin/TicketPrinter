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
  zoom?: number
}

function ElementShape({
  el,
  index,
  selected,
  cinema,
  zoom,
  onPointerDown,
  onDoubleClick
}: {
  el: TicketElement
  index: number
  selected: boolean
  cinema: boolean
  zoom: number
  onPointerDown: (e: React.PointerEvent, index: number) => void
  onDoubleClick: (e: React.MouseEvent, index: number) => void
}): React.JSX.Element {
  const s = SCALE * zoom
  const strokeColor = selected ? '#3b82f6' : '#a3e635'

  const attrs = {
    'data-element-index': index,
    'data-selected': selected ? 'true' : 'false',
    onPointerDown: (e: React.PointerEvent) => onPointerDown(e, index),
    onDoubleClick: (e: React.MouseEvent) => onDoubleClick(e, index),
    style: { cursor: 'grab' }
  }

  switch (el.type) {
    case 'text': {
      const hScale = el.hwScale ? el.hwScale[1] : 1
      const wScale = el.hwScale ? el.hwScale[0] : 1
      const font = el.font ?? 3
      const charHeight = font * 12 * s * hScale
      const charWidth = el.content.length * font * 6 * s * wScale
      // Anchor is at the baseline; character body extends upward (matches FGL <RL> and default).
      const hitY = el.row * s - font * 10 * s * hScale
      return (
        <g {...attrs}>
          {/* Transparent hit-target rect so entire area is draggable */}
          <rect
            x={el.col * s}
            y={hitY}
            width={charWidth}
            height={charHeight}
            fill="transparent"
            pointerEvents="all"
          />
          <text
            x={el.col * s}
            y={el.row * s}
            fontSize={10 * s * font * hScale}
            fill={selected ? '#3b82f6' : '#a3e635'}
            pointerEvents="none"
          >
            {el.content}
          </text>
        </g>
      )
    }

    case 'hline': {
      const s = SCALE * zoom
      return (
        <line
          {...attrs}
          x1={el.col * s}
          y1={el.row * s}
          x2={(el.col + el.length) * s}
          y2={el.row * s}
          stroke={strokeColor}
          strokeWidth={Math.max(1, el.thickness * s)}
        />
      )
    }

    case 'vline': {
      const s = SCALE * zoom
      return (
        <line
          {...attrs}
          x1={el.col * s}
          y1={el.row * s}
          x2={el.col * s}
          y2={(el.row + el.height) * s}
          stroke={strokeColor}
          strokeWidth={Math.max(1, el.thickness * s)}
        />
      )
    }

    case 'box': {
      const s = SCALE * zoom
      return (
        <rect
          {...attrs}
          x={el.col * s}
          y={el.row * s}
          width={el.width * s}
          height={el.height * s}
          fill={el.fill ? strokeColor : 'none'}
          stroke={strokeColor}
          strokeWidth={Math.max(1, el.thickness * s)}
          fillOpacity={el.fill ? 0.5 : 0}
        />
      )
    }

    case 'qr': {
      const s = SCALE * zoom
      const dotSize = el.dotSize ?? 6
      const estimatedModules = 41
      const dim = estimatedModules * dotSize * s
      return (
        <g {...attrs}>
          <rect
            x={el.col * s}
            y={el.row * s}
            width={dim}
            height={dim}
            fill="none"
            stroke={strokeColor}
            strokeDasharray="3 2"
            strokeWidth={1}
          />
          <text
            x={el.col * s + dim / 2}
            y={el.row * s + dim / 2}
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
      const s = SCALE * zoom
      const barcodeW = 300 * s
      const barcodeH = el.height * s
      return (
        <g {...attrs}>
          <rect
            x={el.col * s}
            y={el.row * s}
            width={barcodeW}
            height={barcodeH}
            fill="none"
            stroke={strokeColor}
            strokeDasharray="3 2"
            strokeWidth={1}
          />
          <text
            x={el.col * s + barcodeW / 2}
            y={el.row * s + barcodeH / 2}
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
  cinema,
  zoom,
  value,
  onChange,
  onCommit,
  onCancel
}: {
  el: TicketElement & { type: 'text' }
  cinema: boolean
  zoom: number
  value: string
  onChange: (v: string) => void
  onCommit: () => void
  onCancel: () => void
}): React.JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null)
  const s = SCALE * zoom

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  const hScale = el.hwScale ? el.hwScale[1] : 1
  const topPx = el.row * s - el.font * 10 * s * hScale

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
        left: el.col * s,
        top: topPx,
        fontSize: `${10 * s * (el.font ?? 3) * hScale * 4}px`,
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
  onUpdateElement,
  zoom = 1
}: EditorCanvasProps): React.JSX.Element {
  const stock = getStock(doc)
  const cinema = doc.stock === 'CINEMA'
  const s = SCALE * zoom
  const svgWidth = stock.heightDots * s
  const svgHeight = stock.widthDots * s

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

    const newRow = elementOriginRef.current.row + dy / s
    const newCol = elementOriginRef.current.col + dx / s

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
        // Click — no movement
      } else {
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

        const rawRow = elementOriginRef.current.row + dySvg / s
        const rawCol = elementOriginRef.current.col + dxSvg / s

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
      className="overflow-auto bg-gray-800 rounded-lg p-2 flex-1"
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
          x={stock.safeMargin * s}
          y={stock.safeMargin * s}
          width={(stock.heightDots - stock.safeMargin * 2) * s}
          height={(stock.widthDots - stock.safeMargin * 2) * s}
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
            x={zone.colStart * s}
            y={0}
            width={(zone.colEnd - zone.colStart) * s}
            height={svgHeight}
            fill="rgba(239, 68, 68, 0.2)"
            stroke="rgba(239, 68, 68, 0.5)"
            strokeWidth={0.5}
            data-testid="exclusion-zone"
          />
        ))}

        {/* Clip elements to stock boundary so out-of-bounds content is visually cut */}
        <defs>
          <clipPath id="stock-clip">
            <rect x={0} y={0} width={svgWidth} height={svgHeight} />
          </clipPath>
        </defs>
        <g clip-path="url(#stock-clip)">
          {doc.elements.map((el, i) => (
            <ElementShape
              key={i}
              el={el}
              index={i}
              selected={selectedIndex === i}
              cinema={cinema}
              zoom={zoom}
              onPointerDown={handleElementPointerDown}
              onDoubleClick={handleDoubleClick}
            />
          ))}
        </g>
      </svg>

      {/* Inline text edit input */}
      {editingEl !== null && (
        <InlineTextInput
          el={editingEl}
          cinema={cinema}
          zoom={zoom}
          value={editValue}
          onChange={setEditValue}
          onCommit={commitEdit}
          onCancel={cancelEdit}
        />
      )}
    </div>
  )
}
