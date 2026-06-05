import { dialog } from 'electron'
import { writeFile, readFile } from 'fs/promises'
import type { TicketDocument } from '../fgl/types'
import type { SaveLayoutResult, OpenLayoutResult } from '../shared/types'

function ensureJsonExtension(filePath: string): string {
  return filePath.endsWith('.json') ? filePath : `${filePath}.json`
}

function isValidDocument(obj: unknown): obj is TicketDocument {
  if (typeof obj !== 'object' || obj === null) return false
  const doc = obj as Record<string, unknown>
  return typeof doc.stock === 'string' && Array.isArray(doc.elements)
}

export async function saveLayout(document: TicketDocument): Promise<SaveLayoutResult> {
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: 'Save Layout',
    defaultPath: 'layout.json',
    filters: [{ name: 'JSON Layout', extensions: ['json'] }]
  })

  if (canceled || !filePath) return { success: false }

  const resolvedPath = ensureJsonExtension(filePath)
  try {
    await writeFile(resolvedPath, JSON.stringify(document, null, 2), 'utf-8')
    return { success: true, path: resolvedPath }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}

export async function openLayout(): Promise<OpenLayoutResult> {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Open Layout',
    filters: [{ name: 'JSON Layout', extensions: ['json'] }],
    properties: ['openFile']
  })

  if (canceled || filePaths.length === 0) return { success: false }

  try {
    const raw = await readFile(filePaths[0], 'utf-8')
    const parsed: unknown = JSON.parse(raw)
    if (!isValidDocument(parsed)) {
      return { success: false, error: 'Invalid layout file: missing required fields' }
    }
    return { success: true, document: parsed }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}
