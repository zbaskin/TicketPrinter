import { ipcMain } from 'electron'
import { listPrinters, printRaw, queryPrinter } from './printer'
import { printRawTcp, queryPrinterTcp } from './tcpPrinter'
import { saveLayout, openLayout } from './layout'
import type { PrinterConnection } from '../shared/types'
import type { TicketDocument } from '../fgl/types'

export function registerIpcHandlers(): void {
  ipcMain.handle('printer:list', async (): Promise<string[]> => {
    return listPrinters()
  })

  ipcMain.handle(
    'printer:print',
    async (_, connection: PrinterConnection, fglData: string) => {
      if (connection.type === 'usb') return printRaw(connection.printerName, fglData)
      return printRawTcp(connection.host, connection.port, fglData)
    }
  )

  ipcMain.handle(
    'printer:query',
    async (_, connection: PrinterConnection, command: string) => {
      if (connection.type === 'usb') return queryPrinter(connection.printerName, command)
      return queryPrinterTcp(connection.host, connection.port, command)
    }
  )

  ipcMain.handle('layout:save', async (_, document: TicketDocument) => {
    return saveLayout(document)
  })

  ipcMain.handle('layout:open', async () => {
    return openLayout()
  })
}
