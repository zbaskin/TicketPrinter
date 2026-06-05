import { contextBridge, ipcRenderer } from 'electron'
import type {
  IpcPrinterApi,
  IpcLayoutApi,
  PrinterConnection,
  PrintResult,
  QueryResult,
  SaveLayoutResult,
  OpenLayoutResult
} from '../shared/types'
import type { TicketDocument } from '../fgl/types'

contextBridge.exposeInMainWorld('printerApi', {
  listPrinters: (): Promise<string[]> => ipcRenderer.invoke('printer:list'),
  print: (connection: PrinterConnection, fglData: string): Promise<PrintResult> =>
    ipcRenderer.invoke('printer:print', connection, fglData),
  query: (connection: PrinterConnection, command: string): Promise<QueryResult> =>
    ipcRenderer.invoke('printer:query', connection, command)
} satisfies IpcPrinterApi)

contextBridge.exposeInMainWorld('layoutApi', {
  save: (document: TicketDocument): Promise<SaveLayoutResult> =>
    ipcRenderer.invoke('layout:save', document),
  open: (): Promise<OpenLayoutResult> =>
    ipcRenderer.invoke('layout:open')
} satisfies IpcLayoutApi)
