import { exec } from 'child_process'
import { writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { app } from 'electron'
import { promisify } from 'util'
import type { PrintResult, QueryResult } from '../shared/types'

const execAsync = promisify(exec)

export async function listPrinters(): Promise<string[]> {
  try {
    const { stdout } = await execAsync(
      'powershell -NoProfile -Command "Get-Printer | Select-Object -ExpandProperty Name"'
    )
    return stdout.split('\n').map((s) => s.trim()).filter(Boolean)
  } catch {
    return []
  }
}

/**
 * Converts a hex string to its printable ASCII representation.
 * Non-printable bytes (outside 0x20–0x7E) are shown as '.'.
 */
function hexToDisplayText(hex: string): string {
  if (!hex) return ''
  const text: string[] = []
  for (let i = 0; i + 1 < hex.length; i += 2) {
    const byte = parseInt(hex.slice(i, i + 2), 16)
    text.push(byte >= 0x20 && byte <= 0x7e ? String.fromCharCode(byte) : '.')
  }
  return text.join('')
}

export async function queryPrinter(printerName: string, command: string): Promise<QueryResult> {
  const tmpFile = join(tmpdir(), `tp-${Date.now()}.fgl`)
  const scriptPath = app.isPackaged
    ? join(process.resourcesPath, 'query-printer.ps1')
    : join(app.getAppPath(), 'resources', 'query-printer.ps1')

  try {
    await writeFile(tmpFile, command, 'ascii')
    const { stdout } = await execAsync(
      `powershell -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}" -PrinterName "${printerName}" -DataPath "${tmpFile}"`
    )

    let sent = ''
    let responseHex = ''
    let error: string | undefined

    for (const line of stdout.split('\n')) {
      const trimmed = line.trim()
      if (trimmed.startsWith('SENT:')) {
        sent = trimmed.slice('SENT:'.length)
      } else if (trimmed.startsWith('RESP:')) {
        responseHex = trimmed.slice('RESP:'.length)
      } else if (trimmed.startsWith('READERR:')) {
        error = trimmed.slice('READERR:'.length)
      }
    }

    return {
      sent,
      responseHex,
      responseText: hexToDisplayText(responseHex),
      ...(error !== undefined ? { error } : {})
    }
  } catch (err) {
    return {
      sent: '',
      responseHex: '',
      responseText: '',
      error: err instanceof Error ? err.message : String(err)
    }
  } finally {
    await unlink(tmpFile).catch(() => undefined)
  }
}

export async function printRaw(printerName: string, fglData: string): Promise<PrintResult> {
  const tmpFile = join(tmpdir(), `tp-${Date.now()}.fgl`)
  const scriptPath = app.isPackaged
    ? join(process.resourcesPath, 'print-raw.ps1')
    : join(app.getAppPath(), 'resources', 'print-raw.ps1')

  try {
    await writeFile(tmpFile, fglData, 'ascii')
    const { stdout, stderr } = await execAsync(
      `powershell -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}" -PrinterName "${printerName}" -DataPath "${tmpFile}"`
    )
    if (stderr.trim()) {
      return { success: false, error: stderr.trim() }
    }
    const match = stdout.match(/OK:(\d+)/)
    if (match) {
      return { success: true, bytesWritten: parseInt(match[1], 10) }
    }
    return { success: false, error: stdout.trim() || 'Unexpected output from print script' }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  } finally {
    await unlink(tmpFile).catch(() => undefined)
  }
}
