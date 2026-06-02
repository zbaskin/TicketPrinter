import type { TicketDocument } from '../../../fgl/types'
import { compile } from '../../../fgl/compiler'

const MAX_CHARS = 2000

interface FglSourcePanelProps {
  document: TicketDocument
}

export default function FglSourcePanel({ document: doc }: FglSourcePanelProps): React.JSX.Element {
  const raw = compile(doc)
  const truncated = raw.length > MAX_CHARS
  const display = truncated ? raw.slice(0, MAX_CHARS) + '… (truncated)' : raw

  return (
    <div className="bg-gray-900 border border-gray-700 rounded overflow-hidden">
      <div className="px-2 py-1 text-xs text-gray-500 border-b border-gray-800 font-mono">
        FGL Output — {new TextEncoder().encode(raw).length} bytes
      </div>
      <pre className="text-xs font-mono text-green-400 p-2 overflow-auto max-h-48 whitespace-pre-wrap break-all">
        {display}
      </pre>
    </div>
  )
}
