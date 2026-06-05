# TicketPrinter

Electron desktop app for designing and printing tickets to a **Boca Lemur** printer using FGL (Font Graphics Language).

## Features

- **Visual editor** — drag-and-drop canvas with text, horizontal/vertical lines, boxes, QR codes, and barcodes
- **Raw FGL editor** — type FGL directly when you need full control
- **Multiple stock sizes** — CONCERT (2" × 5.5"), CINEMA (3.25" × 2"), or custom dimensions
- **Print dialog** — send one or multiple copies with per-copy status feedback
- **Batch print** — import a CSV or JSON file and print a personalized ticket for each row
- **Printer Console** — send FGL status queries (`<S1>`, `<S8>`, `<S11>`, `<S99>`) and see decoded responses
- **USB and Ethernet connections** — USB uses the Windows print spooler; Ethernet connects directly via TCP socket (port 9100) enabling bidirectional status queries
- **Save / Open layouts** — export the current design to a `.json` file and reload it later

## Requirements

- **Windows** (the USB path uses the Windows print spooler API)
- **Node.js** 18+
- **Python 3** with `pywin32` installed (`pip install pywin32`) — required for USB printing
- A **Boca Lemur** printer connected via USB or Ethernet

> Bidirectional status queries (`<S1>`, `<S99>`, etc.) only work over Ethernet. USB connections are write-only through the Windows spooler.

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
```

Starts Electron with hot reload via electron-vite.

## Build

```bash
npm run build
```

Outputs a production build to `out/`.

## Tests

```bash
npm test           # run all tests once
npm run test:watch # watch mode
```

346 tests across the FGL compiler, IPC layer, and all React components. Tests run in Node (main process) and jsdom (renderer) environments via Vitest.

## Printer Setup

### USB
1. Connect the Boca Lemur via USB and install it as a Windows printer.
2. Open the **Printer Setup** tab, select **USB**, choose the printer from the dropdown, and click **Test Connection**.

### Ethernet
1. Connect the printer to the same network switch as your PC (a basic unmanaged switch works).
2. Find the printer's IP address (printed on startup or via the printer's config menu).
3. Set a static IP or DHCP reservation on your router so the address doesn't change.
4. Open the **Printer Setup** tab, select **Ethernet**, enter the IP and port (`9100`), and click **Test Connection**.

## FGL

FGL (Font Graphics Language) is the command language used by Boca Systems printers. Each ticket is a sequence of commands like `<NF>` (new form / feed), `<RC row,col>` (row/column position), `<F font>` (font select), and `<p>` (print). The visual editor generates FGL automatically; the raw FGL editor lets you write it directly.

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop shell | Electron 42 |
| UI | React 19, TypeScript, Tailwind CSS 4 |
| Bundler | electron-vite / Vite 7 |
| USB printing | Python + pywin32 (Windows spooler) |
| Ethernet printing | Node.js `net.Socket` (TCP port 9100) |
| QR codes | `qrcode` npm package |
| Testing | Vitest 4, Testing Library |
