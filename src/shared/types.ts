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

export interface IpcPrinterApi {
  listPrinters: () => Promise<string[]>
  print: (printerName: string, fglData: string) => Promise<PrintResult>
  query: (printerName: string, command: string) => Promise<QueryResult>
}
