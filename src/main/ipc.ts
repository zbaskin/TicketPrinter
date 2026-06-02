import { ipcMain } from 'electron'
import { listPrinters, printRaw, queryPrinter } from './printer'

export function registerIpcHandlers(): void {
  ipcMain.handle('printer:list', async (): Promise<string[]> => {
    return listPrinters()
  })

  ipcMain.handle(
    'printer:print',
    async (_, printerName: string, fglData: string) => {
      return printRaw(printerName, fglData)
    }
  )

  ipcMain.handle(
    'printer:query',
    async (_, printerName: string, command: string) => {
      return queryPrinter(printerName, command)
    }
  )
}
