/// <reference types="vite/client" />

import type { IpcPrinterApi, IpcLayoutApi } from '../../shared/types'

declare global {
  interface Window {
    printerApi: IpcPrinterApi
    layoutApi: IpcLayoutApi
  }
}
