export interface PrintResult {
  success: boolean
  bytesWritten?: number
  error?: string
}

export interface IpcPrinterApi {
  listPrinters: () => Promise<string[]>
  print: (printerName: string, fglData: string) => Promise<PrintResult>
}
