import { ipcMain } from 'electron'
import { listPrinters, printRaw } from './printer'

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
}
