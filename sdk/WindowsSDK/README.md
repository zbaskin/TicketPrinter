# Boca Systems .NET SDK

A .NET 8 SDK for Boca Systems Ghostwriter thermal printers. Speaks the FGL (Friendly Ghost Language) protocol over Serial, TCP, and USB-HID.

## Quick Start

```csharp
using BocaSystems.Sdk;

using var printer = BocaPrinter.ConnectTcp("192.168.1.100");

printer.SetFont(6);
printer.SetRowColumn(50, 100);
printer.PrintText("GENERAL ADMISSION");

printer.SetFont(3);
printer.SetRowColumn(150, 100);
printer.PrintText("Section 101  Row A  Seat 12");

printer.SetRowColumn(250, 100);
printer.SetBarcodeExpansion(2);
printer.EnableBarcodeInterpretation();
printer.PrintCode128("GA-2026-001234");

printer.PrintAndCut();
```

## Connection Types

```csharp
// Serial
using var printer = BocaPrinter.ConnectSerial("COM3");
using var printer = BocaPrinter.ConnectSerial("COM3", baudRate: 9600);

// TCP
using var printer = BocaPrinter.ConnectTcp("192.168.1.100");
using var printer = BocaPrinter.ConnectTcp("192.168.1.100", 9100);

// USB HID (printer must be in HID mode)
using var printer = BocaPrinter.ConnectHid(@"\\?\hid#vid_0a43...");
```

You can also inject your own transport:

```csharp
var transport = new TcpTransport("10.0.0.50", 9100);
using var printer = new BocaPrinter(transport);
```

## API Overview

### Text

```csharp
printer.SetFont(3);                              // built-in fonts 1-16
printer.SetTrueTypeFont(1, 24);                  // TrueType font #1 at 24pt
printer.SetRowColumn(100, 50);                    // position cursor (dots)
printer.SetHeightWidth(2, 2);                     // double size
printer.SetRotation(Rotation.Right);              // rotate 90 CW
printer.EnableInverse();                          // white on black
printer.PrintText("HELLO");
printer.DisableInverse();

// all-in-one convenience
printer.PrintTextAt(100, 50, "VIP PASS", font: 6, Rotation.Right, heightMultiplier: 2, widthMultiplier: 2);
```

### Barcodes

**1D** — data delimiters are added automatically:

```csharp
printer.SetBarcodeExpansion(2);                   // 2x bar width (200 dpi)
printer.EnableBarcodeInterpretation();            // human-readable line

printer.PrintCode128("TICKET-001");
printer.PrintCode39("CODE39");
printer.PrintInterleaved2of5("123456");
printer.PrintUpcA("401234567893");
printer.PrintEan13("9014561780128");
printer.PrintCodabar("A123456B");
```

**2D** — font number controls module size:

```csharp
printer.PrintQrCodeAt(100, 200, "https://bocasystems.com", fontNumber: 70);
printer.PrintDataMatrix("DMX-DATA", fontNumber: 54);
printer.PrintPdf417("PDF417-DATA", fontNumber: 33);
printer.PrintAztecAt(100, 200, "Aztec data", fontNumber: 84);
```

### Drawing

```csharp
printer.DrawBoxAt(10, 20, height: 200, width: 400, thickness: 3);
printer.DrawHorizontalLineAt(120, 20, length: 400, thickness: 2);
printer.DrawVerticalLineAt(10, 220, length: 200);

printer.SetShadingPattern(5);
printer.SetShadingBackground();
printer.EnableShading();
printer.PrintText("SHADED TEXT");
printer.DisableShading();
```

### Graphics

```csharp
// print a pre-formatted 1-bit image
printer.PrintGraphicFile("ticket.png", GraphicFormat.Png);

// dither and print any image
using var img = new Bitmap("photo.jpg");
printer.PrintImage(img, DitherAlgorithm.FloydSteinberg);

// position an image on the ticket (no auto-cut)
printer.PrintImageAt(50, 50, img, DitherAlgorithm.RiemersmaHilbert);
printer.PrintAndCut();

// download a logo for fast re-use
printer.DownloadGraphicToMemory("logo.png", GraphicFormat.Png);
printer.PrintLogo(logoId: 1, row: 10, column: 10);
```

Dithering algorithms: `OrderedBayer`, `FloydSteinberg`, `Stucki`, `ClusteredDot`, `BlueNoise`, `RiemersmaHilbert` (default).

### Status

```csharp
var status = await printer.QuerySolicitedStatusAsync();
if (status.IsReady)       Console.WriteLine("Ready");
if (status.OutOfTickets)  Console.WriteLine("Load stock");
if (status.TicketJam)     Console.WriteLine("Clear jam");

string firmware = await printer.QueryFirmwareVersionAsync();
long freeBytes  = await printer.QueryDownloadSpaceAsync();
```

### Ticket Lifecycle

```csharp
printer.PrintAndCut();
printer.PrintNoCut();
printer.PrintAndEject();          // presenter models
printer.PrintAndHold();           // keep image for next ticket

printer.SetRepeatCount(4);        // 5 total (1 + 4 repeats)
printer.LoadTicketCount(1000);
printer.PrintTicketCount();

printer.ClearBuffer();
printer.ClearDownloadMemory();
```

### Configuration

```csharp
printer.SetPath(1);                               // dual-printer path
printer.SetPrintIntensity(2);                     // darken (+2 of +/-5)
printer.SetTopAdjustment(-1);                     // nudge print position
printer.SetUsbDeviceType(UsbDeviceType.Hid);      // switch USB mode
printer.FireCashDrawerA();
printer.PurgeRemainingTickets();
printer.UnloadStock();
printer.EnableDiagnosticMode();                    // raw byte dump

printer.SetFileId(1);
printer.SetFilePermanent();
printer.DeleteLogo(3);                               // delete logo #3
printer.DeleteSoftFont(2);                            // delete soft font #2
printer.DeleteAllFiles();                             // wipe all downloads
printer.ReclaimFlash();

printer.EnableOverwrite();
printer.PrintTextAt(10, 10, "replacement");
printer.DisableOverwrite();
```

### Raw FGL

```csharp
printer.SendCommand("<RC0,0><F3>RAW FGL COMMAND<p>");
```

## Ticket Sizing

Boca printers work in dot coordinates. Multiply inches by DPI to get dot values.

| Ticket Size | 200 DPI | 300 DPI | 600 DPI |
|---|---|---|---|
| 2" x 5.5" | 400 x 1100 | 600 x 1650 | 1200 x 3300 |
| 3.25" x 8" | 650 x 1600 | 975 x 2400 | 1950 x 4800 |
| 4" x 8" | 800 x 1600 | 1200 x 2400 | 2400 x 4800 |

Standard Boca ticket widths: 2", 2.125", 2.5", 2.7", 3.25", 4", 8"

Row 0, Column 0 is the top-left corner. Row increases downward, column increases right.

Tips:
- Leave 10-20 dots of margin on all edges
- Barcode expansion should match DPI: 2 for 200, 3 for 300, 5-6 for 600
- Calculate positions as percentages of (width x DPI) for resolution independence
- The sample app's Connection tab has ticket size and DPI selectors

## Project Structure

```
BocaSystems.sln
src/
  BocaSystems.Sdk/              # the SDK
    Connection/                 # transport layer (Serial, TCP, HID)
    Models/                     # enums, PrinterStatus
    Imaging/                    # dithering algorithms
    BocaPrinter.cs              # core class
    BocaPrinter.*.cs            # command groups (Text, Barcode, Drawing, etc)

  BocaSystems.Sdk.Sample/      # WinForms demo app
  BocaSystems.Sdk.Tests/        # unit tests (xUnit)
```

## Building

```bash
dotnet build BocaSystems.sln
dotnet test
dotnet run --project src/BocaSystems.Sdk.Sample
```

## Requirements

- .NET 8.0 SDK
- Windows (WinForms for sample app, System.Drawing for imaging)
- Serial: standard COM port or USB-to-serial adapter

## FGL Reference

The `docs/` folder has the FGL46 Rev 16.7 programming guide. The SDK wraps most common commands, but you can send raw FGL via `SendCommand()` for anything not covered.

## Architecture

- **Transport abstraction**: all connection types implement `IConnectionTransport`. You can also implement it for custom transports (mocks, proxies, etc).
- **Thread safety**: `SendCommand` and `SendRawBytes` are protected by a semaphore with a 30-second timeout.
- **Stateless**: each Set* method sends its FGL command immediately. The SDK doesn't cache printer state — the printer is the source of truth.
- **Binary safety**: `SendRawBytes` sends data directly without encoding conversion. Bytes above 127 are preserved for PNG/BMP graphic data.
