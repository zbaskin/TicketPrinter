import { useState } from 'react'
import type { TicketDocument } from '../../../fgl/types'
import { compile } from '../../../fgl/compiler'

const MAX_BYTES = 65536

interface FglEditorPanelProps {
  document: TicketDocument
  onApply: (fgl: string) => void
  onRevert: () => void
}

export default function FglEditorPanel({
  document: doc,
  onApply,
  onRevert
}: FglEditorPanelProps): React.JSX.Element {
  const [text, setText] = useState<string>(doc.rawFglOverride ?? compile(doc))
  const [error, setError] = useState<string | null>(null)

  function handleApply(): void {
    if (text.trim() === '') {
      setError('FGL cannot be empty')
      return
    }
    const byteLength = new TextEncoder().encode(text).length
    if (byteLength > MAX_BYTES) {
      setError(`FGL exceeds maximum size of 65536 bytes (current: ${byteLength} bytes)`)
      return
    }
    setError(null)
    onApply(text)
  }

  function handleRevert(): void {
    setText(compile(doc))
    onRevert()
  }

  return (
    <div className="flex flex-col h-full gap-2 p-2">
      {doc.rawFglOverride !== undefined && (
        <div className="bg-yellow-500/20 border border-yellow-500/50 rounded px-3 py-2 text-xs text-yellow-300">
          FGL override active — visual edits are ignored until you revert
        </div>
      )}

      <textarea
        className="flex-1 w-full font-mono text-xs bg-gray-800 border border-gray-700 text-green-400 rounded p-2 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
        value={text}
        onChange={(e) => setText(e.target.value)}
        spellCheck={false}
      />

      {error !== null && (
        <div className="text-xs text-red-400">{error}</div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleApply}
          className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded transition-colors"
        >
          Apply
        </button>
        <button
          onClick={handleRevert}
          className="flex-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs font-medium rounded transition-colors"
        >
          Revert to Visual
        </button>
      </div>
    </div>
  )
}
