# print-raw.ps1
# Sends raw bytes to a Windows printer using the Winspool API.
# Outputs "OK:<bytesWritten>" on success, throws on failure.
param(
  [Parameter(Mandatory = $true)][string]$PrinterName,
  [Parameter(Mandatory = $true)][string]$DataPath
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

try {
  $doc = New-Object Winspool+DocInfo1
  $doc.pDocName  = 'TicketPrinter'
  $doc.pOutputFile = $null
  $doc.pDatatype = 'RAW'

  $docId = [Winspool]::StartDocPrinter($handle, 1, [ref]$doc)
  if ($docId -le 0) {
    throw "StartDocPrinter failed (returned $docId)"
  }

  [Winspool]::StartPagePrinter($handle) | Out-Null

  $ptr = [System.Runtime.InteropServices.Marshal]::AllocHGlobal($bytes.Length)
  try {
    [System.Runtime.InteropServices.Marshal]::Copy($bytes, 0, $ptr, $bytes.Length)
    $written = 0
    $ok = [Winspool]::WritePrinter($handle, $ptr, $bytes.Length, [ref]$written)
    if (-not $ok) {
      $err = [System.Runtime.InteropServices.Marshal]::GetLastWin32Error()
      throw "WritePrinter failed (Win32 error $err)"
    }
    Write-Output "OK:$written"
  } finally {
    [System.Runtime.InteropServices.Marshal]::FreeHGlobal($ptr)
  }

  [Winspool]::EndPagePrinter($handle) | Out-Null
  [Winspool]::EndDocPrinter($handle) | Out-Null
} finally {
  [Winspool]::ClosePrinter($handle) | Out-Null
}
