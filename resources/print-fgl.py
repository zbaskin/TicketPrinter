"""
print-fgl.py — Send raw FGL bytes to a Windows printer via win32print (pywin32).
Usage: python print-fgl.py <PrinterName> <DataFilePath>
Prints "OK:<bytesWritten>" on success, exits non-zero on failure.
"""
import sys
import win32print


def main() -> None:
    if len(sys.argv) != 3:
        print("Usage: print-fgl.py <PrinterName> <DataFilePath>", file=sys.stderr)
        sys.exit(1)

    printer_name = sys.argv[1]
    data_path = sys.argv[2]

    with open(data_path, "rb") as f:
        data = f.read()

    handle = win32print.OpenPrinter(printer_name)
    try:
        win32print.StartDocPrinter(handle, 1, ("TicketPrinter", None, "RAW"))
        try:
            win32print.StartPagePrinter(handle)
            written = win32print.WritePrinter(handle, data)
            win32print.EndPagePrinter(handle)
        finally:
            win32print.EndDocPrinter(handle)
    finally:
        win32print.ClosePrinter(handle)

    print(f"OK:{written}")


if __name__ == "__main__":
    main()
