import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Hoist mock functions so they're available in vi.mock factories ───────────
const mocks = vi.hoisted(() => ({
  exec: vi.fn(),
  writeFile: vi.fn(),
  unlink: vi.fn(),
  getAppPath: vi.fn(() => '/fake/app/path')
}))

// ─── Mock electron ────────────────────────────────────────────────────────────
vi.mock('electron', () => ({
  app: {
    isPackaged: false,
    getAppPath: mocks.getAppPath
  }
}))

// ─── Mock child_process ───────────────────────────────────────────────────────
vi.mock('child_process', () => ({
  exec: mocks.exec
}))

// ─── Mock fs/promises ─────────────────────────────────────────────────────────
vi.mock('fs/promises', () => ({
  writeFile: mocks.writeFile,
  unlink: mocks.unlink
}))

// ─── Mock util so that promisify(exec) returns exec itself ────────────────────
// printer.ts does: const execAsync = promisify(exec)
// We mock promisify to be identity so execAsync === mocks.exec
vi.mock('util', () => ({
  promisify: (fn: unknown) => fn
}))

// Import AFTER mocks
import { listPrinters, printRaw } from '../printer'

beforeEach(() => {
  vi.clearAllMocks()
  mocks.unlink.mockResolvedValue(undefined)
  mocks.writeFile.mockResolvedValue(undefined)
})

// ─────────────────────────────────────────────────────────────────────────────
// listPrinters
// ─────────────────────────────────────────────────────────────────────────────
describe('listPrinters', () => {
  it('parses newline-separated printer names from stdout', async () => {
    mocks.exec.mockResolvedValueOnce({ stdout: 'Zebra ZD420\nBoca Lemur\nMicrosoft Print to PDF\n', stderr: '' })
    const result = await listPrinters()
    expect(result).toEqual(['Zebra ZD420', 'Boca Lemur', 'Microsoft Print to PDF'])
  })

  it('trims whitespace and filters blank lines', async () => {
    mocks.exec.mockResolvedValueOnce({ stdout: '  Printer A  \n\n  Printer B  \n', stderr: '' })
    const result = await listPrinters()
    expect(result).toEqual(['Printer A', 'Printer B'])
  })

  it('returns an empty array when exec throws', async () => {
    mocks.exec.mockRejectedValueOnce(new Error('Access denied'))
    const result = await listPrinters()
    expect(result).toEqual([])
  })

  it('calls powershell Get-Printer command', async () => {
    mocks.exec.mockResolvedValueOnce({ stdout: 'My Printer\n', stderr: '' })
    await listPrinters()
    const execCall = mocks.exec.mock.calls[0][0] as string
    expect(execCall).toContain('Get-Printer')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// printRaw
// ─────────────────────────────────────────────────────────────────────────────
describe('printRaw', () => {
  it('returns success result with bytesWritten when stdout matches OK:<n>', async () => {
    mocks.exec.mockResolvedValueOnce({ stdout: 'OK:1234', stderr: '' })
    const result = await printRaw('Boca Lemur', '<HEAT 10><NF><p>')
    expect(result).toEqual({ success: true, bytesWritten: 1234 })
  })

  it('writes the FGL data to a temp file with ascii encoding', async () => {
    mocks.exec.mockResolvedValueOnce({ stdout: 'OK:99', stderr: '' })
    await printRaw('Boca Lemur', '<HEAT 10><NF><p>')
    expect(mocks.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('.fgl'),
      '<HEAT 10><NF><p>',
      'ascii'
    )
  })

  it('returns error result when stderr is non-empty', async () => {
    mocks.exec.mockResolvedValueOnce({ stdout: '', stderr: 'Out of paper' })
    const result = await printRaw('Boca Lemur', '<HEAT 10><NF><p>')
    expect(result).toEqual({ success: false, error: 'Out of paper' })
  })

  it('returns error result when exec rejects', async () => {
    mocks.exec.mockRejectedValueOnce(new Error('PowerShell not found'))
    const result = await printRaw('Boca Lemur', '<HEAT 10><NF><p>')
    expect(result).toEqual({ success: false, error: 'PowerShell not found' })
  })

  it('returns error when stdout does not match OK:<n> and stderr is empty', async () => {
    mocks.exec.mockResolvedValueOnce({ stdout: 'UNEXPECTED OUTPUT', stderr: '' })
    const result = await printRaw('Boca Lemur', '<HEAT 10><NF><p>')
    expect(result.success).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('always calls unlink on the temp file after success', async () => {
    mocks.exec.mockResolvedValueOnce({ stdout: 'OK:42', stderr: '' })
    await printRaw('Boca Lemur', '<HEAT 10><NF><p>')
    expect(mocks.unlink).toHaveBeenCalledWith(expect.stringContaining('.fgl'))
  })

  it('always calls unlink on the temp file after stderr error', async () => {
    mocks.exec.mockResolvedValueOnce({ stdout: '', stderr: 'Some error' })
    await printRaw('Boca Lemur', '<HEAT 10><NF><p>')
    expect(mocks.unlink).toHaveBeenCalledWith(expect.stringContaining('.fgl'))
  })

  it('always calls unlink on the temp file when exec throws', async () => {
    mocks.exec.mockRejectedValueOnce(new Error('crash'))
    await printRaw('Boca Lemur', '<HEAT 10><NF><p>')
    expect(mocks.unlink).toHaveBeenCalledWith(expect.stringContaining('.fgl'))
  })

  it('uses the script path from app.getAppPath() when not packaged', async () => {
    mocks.exec.mockResolvedValueOnce({ stdout: 'OK:1', stderr: '' })
    await printRaw('Boca Lemur', '<HEAT 10><NF><p>')
    const execCall = mocks.exec.mock.calls[0][0] as string
    expect(execCall).toContain('print-raw.ps1')
  })

  it('passes printer name and data path to the powershell script', async () => {
    mocks.exec.mockResolvedValueOnce({ stdout: 'OK:10', stderr: '' })
    await printRaw('My Printer', '<NF><p>')
    const execCall = mocks.exec.mock.calls[0][0] as string
    expect(execCall).toContain('-PrinterName "My Printer"')
    expect(execCall).toContain('-DataPath')
  })

  it('returns generic error message when stdout is empty and no stderr', async () => {
    mocks.exec.mockResolvedValueOnce({ stdout: '', stderr: '' })
    const result = await printRaw('Boca Lemur', '<HEAT 10><NF><p>')
    expect(result.success).toBe(false)
    expect(result.error).toBe('Unexpected output from print script')
  })

  it('returns the exec error message when exec throws a non-Error', async () => {
    mocks.exec.mockRejectedValueOnce('plain string error')
    const result = await printRaw('Boca Lemur', '<HEAT 10><NF><p>')
    expect(result.success).toBe(false)
    expect(result.error).toBe('plain string error')
  })
})
