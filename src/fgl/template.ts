import type { TicketDocument } from './types'

const PLACEHOLDER_RE = /\{\{([a-zA-Z0-9_]+)\}\}/g

/**
 * Extract all unique {{field}} names from all text elements in a TicketDocument.
 * Returns a sorted array of unique field names.
 */
export function extractFields(doc: TicketDocument): string[] {
  const fields = new Set<string>()

  for (const el of doc.elements) {
    if (el.type === 'text') {
      const matches = el.content.matchAll(PLACEHOLDER_RE)
      for (const match of matches) {
        fields.add(match[1])
      }
    }
  }

  return Array.from(fields).sort()
}

/**
 * Replace all {{field}} placeholders in a string using the provided data record.
 * Unknown fields are left as-is.
 */
export function substituteFields(text: string, data: Record<string, string>): string {
  return text.replace(PLACEHOLDER_RE, (match, fieldName: string) => {
    return Object.prototype.hasOwnProperty.call(data, fieldName) ? data[fieldName] : match
  })
}

/**
 * Return a deep-cloned TicketDocument with all text element content substituted
 * from the provided data row. Does NOT mutate the original document.
 */
export function applyDataRow(doc: TicketDocument, data: Record<string, string>): TicketDocument {
  return {
    ...doc,
    elements: doc.elements.map((el) => {
      if (el.type === 'text') {
        return { ...el, content: substituteFields(el.content, data) }
      }
      return { ...el }
    })
  }
}
