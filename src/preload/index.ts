import { contextBridge, ipcRenderer } from 'electron'
import type { IpcPrinterApi, PrintResult, QueryResult } from '../shared/types'

contextBridge.exposeInMainWorld('printerApi', {
  listPrinters: (): Promise<string[]> => ipcRenderer.invoke('printer:list'),
  print: (printerName: string, fglData: string): Promise<PrintResult> =>
    ipcRenderer.invoke('printer:print', printerName, fglData),
  query: (printerName: string, command: string): Promise<QueryResult> =>
    ipcRenderer.invoke('printer:query', printerName, command)
} satisfies IpcPrinterApi)
