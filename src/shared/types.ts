export interface PrintResult {
  success: boolean
  bytesWritten?: number
  error?: string
}

export interface QueryResult {
  sent: string         // hex string of bytes sent
  responseHex: string  // hex string of bytes received (empty if none)
  responseText: string // printable ASCII of response, non-printable as '.'
  error?: string
}

export type PrinterConnection =
  | { type: 'usb'; printerName: string }
  | { type: 'ethernet'; host: string; port: number }

export function connectionLabel(c: PrinterConnection): string {
  return c.type === 'usb' ? c.printerName : `${c.host}:${c.port}`
}

export interface IpcPrinterApi {
  listPrinters: () => Promise<string[]>
  print: (connection: PrinterConnection, fglData: string) => Promise<PrintResult>
  query: (connection: PrinterConnection, command: string) => Promise<QueryResult>
}

export interface SaveLayoutResult {
  success: boolean
  path?: string
  error?: string
}

export interface OpenLayoutResult {
  success: boolean
  document?: import('../fgl/types').TicketDocument
  error?: string
}

export interface IpcLayoutApi {
  save: (document: import('../fgl/types').TicketDocument) => Promise<SaveLayoutResult>
  open: () => Promise<OpenLayoutResult>
}
