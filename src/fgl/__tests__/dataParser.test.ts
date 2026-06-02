import { describe, it, expect } from 'vitest'
import { parseCsv, parseJson } from '../dataParser'

// ─── parseCsv ─────────────────────────────────────────────────────────────────

describe('parseCsv', () => {
  it('parses comma-delimited CSV with 2 data rows', () => {
    const csv = 'name,seat,row\nAlice,A1,1\nBob,B2,2'
    const result = parseCsv(csv)
    expect(result.error).toBeUndefined()
    expect(result.headers).toEqual(['name', 'seat', 'row'])
    expect(result.rows).toHaveLength(2)
    expect(result.rows[0]).toEqual({ name: 'Alice', seat: 'A1', row: '1' })
    expect(result.rows[1]).toEqual({ name: 'Bob', seat: 'B2', row: '2' })
  })

  it('parses semicolon-delimited CSV', () => {
    const csv = 'name;seat;row\nAlice;A1;1\nBob;B2;2'
    const result = parseCsv(csv)
    expect(result.error).toBeUndefined()
    expect(result.headers).toEqual(['name', 'seat', 'row'])
    expect(result.rows[0]).toEqual({ name: 'Alice', seat: 'A1', row: '1' })
    expect(result.rows[1]).toEqual({ name: 'Bob', seat: 'B2', row: '2' })
  })

  it('trims whitespace from headers and values', () => {
    const csv = ' name , seat \n Alice , A1 \n Bob , B2 '
    const result = parseCsv(csv)
    expect(result.headers).toEqual(['name', 'seat'])
    expect(result.rows[0]).toEqual({ name: 'Alice', seat: 'A1' })
    expect(result.rows[1]).toEqual({ name: 'Bob', seat: 'B2' })
  })

  it('skips blank lines in the data', () => {
    const csv = 'name,seat\nAlice,A1\n\nBob,B2\n\n'
    const result = parseCsv(csv)
    expect(result.error).toBeUndefined()
    expect(result.rows).toHaveLength(2)
    expect(result.rows[0]).toEqual({ name: 'Alice', seat: 'A1' })
    expect(result.rows[1]).toEqual({ name: 'Bob', seat: 'B2' })
  })

  it('returns error when only header line present (no data rows)', () => {
    const csv = 'name,seat,row'
    const result = parseCsv(csv)
    expect(result.error).toBeDefined()
    expect(result.error).toMatch(/no data rows/i)
  })

  it('returns error for empty string input', () => {
    const result = parseCsv('')
    expect(result.error).toBeDefined()
    expect(result.headers).toEqual([])
    expect(result.rows).toEqual([])
  })

  it('auto-detects semicolon delimiter when semicolons outnumber commas in first line', () => {
    // first line: 2 semicolons, 0 commas -> use semicolon
    const csv = 'first_name;last_name;ticket_id\nAlice;Smith;T001\nBob;Jones;T002'
    const result = parseCsv(csv)
    expect(result.headers).toHaveLength(3)
    expect(result.headers[0]).toBe('first_name')
    expect(result.rows[0]['ticket_id']).toBe('T001')
  })

  it('auto-detects comma delimiter when commas outnumber semicolons in first line', () => {
    const csv = 'a,b,c\n1,2,3'
    const result = parseCsv(csv)
    expect(result.headers).toEqual(['a', 'b', 'c'])
    expect(result.rows[0]).toEqual({ a: '1', b: '2', c: '3' })
  })

  it('handles a single column CSV', () => {
    const csv = 'name\nAlice\nBob'
    const result = parseCsv(csv)
    expect(result.error).toBeUndefined()
    expect(result.headers).toEqual(['name'])
    expect(result.rows).toHaveLength(2)
    expect(result.rows[0]).toEqual({ name: 'Alice' })
  })

  it('handles Windows-style CRLF line endings', () => {
    const csv = 'name,seat\r\nAlice,A1\r\nBob,B2'
    const result = parseCsv(csv)
    expect(result.error).toBeUndefined()
    expect(result.rows).toHaveLength(2)
    expect(result.rows[0]).toEqual({ name: 'Alice', seat: 'A1' })
  })
})

// ─── parseJson ────────────────────────────────────────────────────────────────

describe('parseJson', () => {
  it('parses a valid JSON array of objects', () => {
    const json = '[{"name":"Alice","seat":"A1"},{"name":"Bob","seat":"B2"}]'
    const result = parseJson(json)
    expect(result.error).toBeUndefined()
    expect(result.rows).toHaveLength(2)
    expect(result.rows[0]).toEqual({ name: 'Alice', seat: 'A1' })
    expect(result.rows[1]).toEqual({ name: 'Bob', seat: 'B2' })
  })

  it('derives headers from keys of first object, sorted', () => {
    const json = '[{"zebra":"z","apple":"a","mango":"m"}]'
    const result = parseJson(json)
    expect(result.headers).toEqual(['apple', 'mango', 'zebra'])
  })

  it('coerces numeric values to strings', () => {
    const json = '[{"name":"Alice","row":5,"seat":12}]'
    const result = parseJson(json)
    expect(result.rows[0]).toEqual({ name: 'Alice', row: '5', seat: '12' })
  })

  it('coerces boolean values to strings', () => {
    const json = '[{"name":"Alice","vip":true}]'
    const result = parseJson(json)
    expect(result.rows[0]).toEqual({ name: 'Alice', vip: 'true' })
  })

  it('returns error for invalid JSON', () => {
    const result = parseJson('not valid json')
    expect(result.error).toBeDefined()
    expect(result.headers).toEqual([])
    expect(result.rows).toEqual([])
  })

  it('returns error for non-array JSON (object)', () => {
    const result = parseJson('{"name":"Alice"}')
    expect(result.error).toBeDefined()
    expect(result.headers).toEqual([])
    expect(result.rows).toEqual([])
  })

  it('returns error for non-array JSON (string)', () => {
    const result = parseJson('"just a string"')
    expect(result.error).toBeDefined()
  })

  it('returns error for non-array JSON (number)', () => {
    const result = parseJson('42')
    expect(result.error).toBeDefined()
  })

  it('returns empty rows and no error for empty array', () => {
    const result = parseJson('[]')
    expect(result.error).toBeUndefined()
    expect(result.headers).toEqual([])
    expect(result.rows).toEqual([])
  })

  it('handles null values by coercing to empty string', () => {
    const json = '[{"name":"Alice","seat":null}]'
    const result = parseJson(json)
    expect(result.rows[0]['seat']).toBe('')
  })
})
