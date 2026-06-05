import { contextBridge, ipcRenderer } from 'electron'
import type { IpcPrinterApi, PrinterConnection, PrintResult, QueryResult } from '../shared/types'

contextBridge.exposeInMainWorld('printerApi', {
  listPrinters: (): Promise<string[]> => ipcRenderer.invoke('printer:list'),
  print: (connection: PrinterConnection, fglData: string): Promise<PrintResult> =>
    ipcRenderer.invoke('printer:print', connection, fglData),
  query: (connection: PrinterConnection, command: string): Promise<QueryResult> =>
    ipcRenderer.invoke('printer:query', connection, command)
} satisfies IpcPrinterApi)
