import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { TicketDocument } from '../../fgl/types'

// ─── Hoist mock functions ─────────────────────────────────────────────────────
const mocks = vi.hoisted(() => ({
  showSaveDialog: vi.fn(),
  showOpenDialog: vi.fn(),
  writeFile: vi.fn(),
  readFile: vi.fn(),
  getAppPath: vi.fn(() => '/fake/app/path')
}))

vi.mock('electron', () => ({
  app: { isPackaged: false, getAppPath: mocks.getAppPath },
  dialog: {
    showSaveDialog: mocks.showSaveDialog,
    showOpenDialog: mocks.showOpenDialog
  }
}))

vi.mock('fs/promises', () => ({
  writeFile: mocks.writeFile,
  readFile: mocks.readFile
}))

import { saveLayout, openLayout } from '../layout'

const sampleDoc: TicketDocument = {
  stock: 'CONCERT',
  elements: [
    { type: 'text', row: 100, col: 100, font: 1, content: 'Hello World' }
  ]
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.writeFile.mockResolvedValue(undefined)
})

// ─────────────────────────────────────────────────────────────────────────────
// saveLayout
// ─────────────────────────────────────────────────────────────────────────────

describe('saveLayout', () => {
  it('opens a save dialog with json filter', async () => {
    mocks.showSaveDialog.mockResolvedValueOnce({ canceled: false, filePath: '/tmp/layout.json' })
    await saveLayout(sampleDoc)
    expect(mocks.showSaveDialog).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: expect.arrayContaining([
          expect.objectContaining({ extensions: expect.arrayContaining(['json']) })
        ])
      })
    )
  })

  it('writes formatted JSON to the chosen file path', async () => {
    mocks.showSaveDialog.mockResolvedValueOnce({ canceled: false, filePath: '/tmp/layout.json' })
    await saveLayout(sampleDoc)
    expect(mocks.writeFile).toHaveBeenCalledWith(
      '/tmp/layout.json',
      expect.stringContaining('"stock"'),
      'utf-8'
    )
  })

  it('written JSON round-trips back to the original document', async () => {
    mocks.showSaveDialog.mockResolvedValueOnce({ canceled: false, filePath: '/tmp/layout.json' })
    await saveLayout(sampleDoc)
    const written = mocks.writeFile.mock.calls[0][1] as string
    expect(JSON.parse(written)).toEqual(sampleDoc)
  })

  it('returns success: true and the file path when saved', async () => {
    mocks.showSaveDialog.mockResolvedValueOnce({ canceled: false, filePath: '/tmp/layout.json' })
    const result = await saveLayout(sampleDoc)
    expect(result).toEqual({ success: true, path: '/tmp/layout.json' })
  })

  it('returns success: false when dialog is canceled', async () => {
    mocks.showSaveDialog.mockResolvedValueOnce({ canceled: true, filePath: undefined })
    const result = await saveLayout(sampleDoc)
    expect(result.success).toBe(false)
    expect(mocks.writeFile).not.toHaveBeenCalled()
  })

  it('returns success: false with error when writeFile throws', async () => {
    mocks.showSaveDialog.mockResolvedValueOnce({ canceled: false, filePath: '/tmp/layout.json' })
    mocks.writeFile.mockRejectedValueOnce(new Error('Disk full'))
    const result = await saveLayout(sampleDoc)
    expect(result.success).toBe(false)
    expect(result.error).toBe('Disk full')
  })

  it('appends .json extension when user omits it', async () => {
    mocks.showSaveDialog.mockResolvedValueOnce({ canceled: false, filePath: '/tmp/myticket' })
    await saveLayout(sampleDoc)
    expect(mocks.writeFile).toHaveBeenCalledWith(
      '/tmp/myticket.json',
      expect.any(String),
      'utf-8'
    )
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// openLayout
// ─────────────────────────────────────────────────────────────────────────────

describe('openLayout', () => {
  it('opens an open dialog with json filter', async () => {
    mocks.showOpenDialog.mockResolvedValueOnce({ canceled: false, filePaths: ['/tmp/layout.json'] })
    mocks.readFile.mockResolvedValueOnce(JSON.stringify(sampleDoc))
    await openLayout()
    expect(mocks.showOpenDialog).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: expect.arrayContaining([
          expect.objectContaining({ extensions: expect.arrayContaining(['json']) })
        ])
      })
    )
  })

  it('returns success: true with the parsed document', async () => {
    mocks.showOpenDialog.mockResolvedValueOnce({ canceled: false, filePaths: ['/tmp/layout.json'] })
    mocks.readFile.mockResolvedValueOnce(JSON.stringify(sampleDoc))
    const result = await openLayout()
    expect(result).toEqual({ success: true, document: sampleDoc })
  })

  it('returns success: false when dialog is canceled', async () => {
    mocks.showOpenDialog.mockResolvedValueOnce({ canceled: true, filePaths: [] })
    const result = await openLayout()
    expect(result.success).toBe(false)
    expect(mocks.readFile).not.toHaveBeenCalled()
  })

  it('returns success: false with error when file cannot be read', async () => {
    mocks.showOpenDialog.mockResolvedValueOnce({ canceled: false, filePaths: ['/tmp/bad.json'] })
    mocks.readFile.mockRejectedValueOnce(new Error('Permission denied'))
    const result = await openLayout()
    expect(result.success).toBe(false)
    expect(result.error).toBe('Permission denied')
  })

  it('returns success: false when file contains invalid JSON', async () => {
    mocks.showOpenDialog.mockResolvedValueOnce({ canceled: false, filePaths: ['/tmp/bad.json'] })
    mocks.readFile.mockResolvedValueOnce('not valid json {{{')
    const result = await openLayout()
    expect(result.success).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('returns success: false when JSON is valid but missing required fields', async () => {
    mocks.showOpenDialog.mockResolvedValueOnce({ canceled: false, filePaths: ['/tmp/bad.json'] })
    mocks.readFile.mockResolvedValueOnce(JSON.stringify({ someOtherField: 123 }))
    const result = await openLayout()
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/invalid/i)
  })

  it('returns success: false when elements is not an array', async () => {
    mocks.showOpenDialog.mockResolvedValueOnce({ canceled: false, filePaths: ['/tmp/bad.json'] })
    mocks.readFile.mockResolvedValueOnce(JSON.stringify({ stock: 'CONCERT', elements: 'nope' }))
    const result = await openLayout()
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/invalid/i)
  })

  it('reads the file with utf-8 encoding', async () => {
    mocks.showOpenDialog.mockResolvedValueOnce({ canceled: false, filePaths: ['/tmp/layout.json'] })
    mocks.readFile.mockResolvedValueOnce(JSON.stringify(sampleDoc))
    await openLayout()
    expect(mocks.readFile).toHaveBeenCalledWith('/tmp/layout.json', 'utf-8')
  })

  it('preserves optional fields like rawFglOverride', async () => {
    const docWithOverride: TicketDocument = { ...sampleDoc, rawFglOverride: '<NF><p>' }
    mocks.showOpenDialog.mockResolvedValueOnce({ canceled: false, filePaths: ['/tmp/layout.json'] })
    mocks.readFile.mockResolvedValueOnce(JSON.stringify(docWithOverride))
    const result = await openLayout()
    expect(result.success).toBe(true)
    expect(result.document?.rawFglOverride).toBe('<NF><p>')
  })
})
