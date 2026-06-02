import { exec } from 'child_process'
import { writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { app } from 'electron'
import { promisify } from 'util'
import type { PrintResult } from '../shared/types'

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
