export interface ParseResult {
  headers: string[]
  rows: Record<string, string>[]
  error?: string
}

/**
 * Parse CSV text. Auto-detects comma or semicolon delimiter based on
 * which appears more frequently in the first line. First row = headers.
 * Trims whitespace from all headers and values. Skips blank lines.
 */
export function parseCsv(text: string): ParseResult {
  if (!text || !text.trim()) {
    return { headers: [], rows: [], error: 'No data rows found' }
  }

  // Normalize CRLF to LF
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const allLines = normalized.split('\n')

  // Filter out blank lines but keep track of non-blank ones
  const lines = allLines.filter((line) => line.trim().length > 0)

  if (lines.length === 0) {
    return { headers: [], rows: [], error: 'No data rows found' }
  }

  // Detect delimiter from first line
  const firstLine = lines[0]
  const semicolonCount = (firstLine.match(/;/g) ?? []).length
  const commaCount = (firstLine.match(/,/g) ?? []).length
  const delimiter = semicolonCount > commaCount ? ';' : ','

  // Parse headers from first line
  const headers = firstLine.split(delimiter).map((h) => h.trim())

  if (lines.length < 2) {
    return { headers: [], rows: [], error: 'No data rows found' }
  }

  // Parse data rows
  const rows: Record<string, string>[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(delimiter).map((v) => v.trim())
    const row: Record<string, string> = {}
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] ?? ''
    }
    rows.push(row)
  }

  return { headers, rows }
}

/**
 * Parse a JSON array of objects. Values are coerced to strings.
 * Headers are derived from keys of the first object (sorted).
 */
export function parseJson(text: string): ParseResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { headers: [], rows: [], error: `Invalid JSON: ${msg}` }
  }

  if (!Array.isArray(parsed)) {
    return { headers: [], rows: [], error: 'Expected a JSON array of objects' }
  }

  if (parsed.length === 0) {
    return { headers: [], rows: [] }
  }

  // Derive sorted headers from the first object's keys
  const firstObj = parsed[0]
  if (typeof firstObj !== 'object' || firstObj === null || Array.isArray(firstObj)) {
    return { headers: [], rows: [], error: 'Expected each array element to be an object' }
  }

  const headers = Object.keys(firstObj as Record<string, unknown>).sort()

  const rows: Record<string, string>[] = parsed.map((item) => {
    const obj = item as Record<string, unknown>
    const row: Record<string, string> = {}
    for (const key of Object.keys(obj)) {
      const val = obj[key]
      row[key] = val === null || val === undefined ? '' : String(val)
    }
    return row
  })

  return { headers, rows }
}
