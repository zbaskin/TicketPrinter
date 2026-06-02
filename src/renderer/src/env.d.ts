/// <reference types="vite/client" />

import type { IpcPrinterApi } from '../../shared/types'

declare global {
  interface Window {
    printerApi: IpcPrinterApi
  }
}
