import { contextBridge, ipcRenderer } from 'electron'
import type { IpcPrinterApi, PrintResult } from '../shared/types'

contextBridge.exposeInMainWorld('printerApi', {
  listPrinters: (): Promise<string[]> => ipcRenderer.invoke('printer:list'),
  print: (printerName: string, fglData: string): Promise<PrintResult> =>
    ipcRenderer.invoke('printer:print', printerName, fglData)
} satisfies IpcPrinterApi)
