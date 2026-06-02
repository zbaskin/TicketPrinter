# query-printer.ps1
# Sends raw bytes to a Windows printer and reads back the response.
# Outputs:
#   SENT:<hex of bytes written>
#   RESP:<hex of bytes read>     (empty if nothing read or on read error)
#   READERR:<win32 error code>   (only on ReadPrinter failure)
param(
  [Parameter(Mandatory = $true)][string]$PrinterName,
  [Parameter(Mandatory = $true)][string]$DataPath,
  [int]$ReadTimeoutMs = 400,
  [int]$ReadBufferSize = 256
)

$ErrorActionPreference = 'Stop'

$bytes = [System.IO.File]::ReadAllBytes($DataPath)

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;

public static class Winspool {
  [DllImport("winspool.drv", CharSet = CharSet.Auto, SetLastError = true)]
  public static extern bool OpenPrinter(string pPrinterName, out IntPtr phPrinter, IntPtr pDefault);

  [DllImport("winspool.drv", SetLastError = true)]
  public static extern bool ClosePrinter(IntPtr hPrinter);

  [DllImport("winspool.drv", CharSet = CharSet.Auto, SetLastError = true)]
  public static extern int StartDocPrinter(IntPtr hPrinter, int Level, ref DocInfo1 pDocInfo);

  [DllImport("winspool.drv", SetLastError = true)]
  public static extern bool EndDocPrinter(IntPtr hPrinter);

  [DllImport("winspool.drv", SetLastError = true)]
  public static extern bool StartPagePrinter(IntPtr hPrinter);

  [DllImport("winspool.drv", SetLastError = true)]
  public static extern bool EndPagePrinter(IntPtr hPrinter);

  [DllImport("winspool.drv", SetLastError = true)]
  public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBuf, int cbBuf, out int pcWritten);

  [DllImport("winspool.drv", SetLastError = true)]
  public static extern bool ReadPrinter(IntPtr hPrinter, IntPtr pBuf, int cbBuf, out int pNoBytesRead);

  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Auto)]
  public struct DocInfo1 {
    public string pDocName;
    public string pOutputFile;
    public string pDatatype;
  }
}
"@

$handle = [IntPtr]::Zero
if (-not [Winspool]::OpenPrinter($PrinterName, [ref]$handle, [IntPtr]::Zero)) {
  $err = [System.Runtime.InteropServices.Marshal]::GetLastWin32Error()
  throw "OpenPrinter failed for '$PrinterName' (Win32 error $err)"
}

$writePtr = [IntPtr]::Zero
$readPtr  = [IntPtr]::Zero

try {
  $doc = New-Object Winspool+DocInfo1
  $doc.pDocName    = 'TicketPrinterQuery'
  $doc.pOutputFile = $null
  $doc.pDatatype   = 'RAW'

  $docId = [Winspool]::StartDocPrinter($handle, 1, [ref]$doc)
  if ($docId -le 0) {
    throw "StartDocPrinter failed (returned $docId)"
  }

  [Winspool]::StartPagePrinter($handle) | Out-Null

  # ── Write command ──────────────────────────────────────────────────────────
  $writePtr = [System.Runtime.InteropServices.Marshal]::AllocHGlobal($bytes.Length)
  [System.Runtime.InteropServices.Marshal]::Copy($bytes, 0, $writePtr, $bytes.Length)

  $written = 0
  $writeOk = [Winspool]::WritePrinter($handle, $writePtr, $bytes.Length, [ref]$written)
  if (-not $writeOk) {
    $err = [System.Runtime.InteropServices.Marshal]::GetLastWin32Error()
    throw "WritePrinter failed (Win32 error $err)"
  }

  [Winspool]::EndPagePrinter($handle) | Out-Null
  [Winspool]::EndDocPrinter($handle)  | Out-Null

  # ── Wait for printer to process and respond ────────────────────────────────
  Start-Sleep -Milliseconds $ReadTimeoutMs

  # ── Read response ──────────────────────────────────────────────────────────
  $readPtr      = [System.Runtime.InteropServices.Marshal]::AllocHGlobal($ReadBufferSize)
  $responseBytes = [System.Collections.Generic.List[byte]]::new()
  $readErr      = $false
  $readErrCode  = 0

  while ($true) {
    $nRead = 0
    $readOk = [Winspool]::ReadPrinter($handle, $readPtr, $ReadBufferSize, [ref]$nRead)
    if (-not $readOk) {
      $readErr     = $true
      $readErrCode = [System.Runtime.InteropServices.Marshal]::GetLastWin32Error()
      break
    }
    if ($nRead -eq 0) { break }
    $chunk = New-Object byte[] $nRead
    [System.Runtime.InteropServices.Marshal]::Copy($readPtr, $chunk, 0, $nRead)
    $responseBytes.AddRange($chunk)
  }

  # ── Output ─────────────────────────────────────────────────────────────────
  $sentHex = ($bytes | ForEach-Object { $_.ToString('X2') }) -join ''
  Write-Output "SENT:$sentHex"

  if ($readErr) {
    Write-Output "RESP:"
    Write-Output "READERR:$readErrCode"
  } else {
    $respHex = ($responseBytes | ForEach-Object { $_.ToString('X2') }) -join ''
    Write-Output "RESP:$respHex"
  }

} finally {
  if ($writePtr -ne [IntPtr]::Zero) {
    [System.Runtime.InteropServices.Marshal]::FreeHGlobal($writePtr)
  }
  if ($readPtr -ne [IntPtr]::Zero) {
    [System.Runtime.InteropServices.Marshal]::FreeHGlobal($readPtr)
  }
  [Winspool]::ClosePrinter($handle) | Out-Null
}
