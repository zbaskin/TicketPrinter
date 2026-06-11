using BocaSystems.Sdk.Models;

namespace BocaSystems.Sdk
{
    public partial class BocaPrinter
    {
        /// <summary>
        /// Set bar width expansion. Each bar is normally 1 dot; expansion 2
        /// doubles every bar. Use 2 for 200 dpi, 3 for 300 dpi. Max 9.
        /// </summary>
        public void SetBarcodeExpansion(int factor)
        {
            if (factor < 1 || factor > 9)
                throw new BocaPrinterException("Bar code expansion must be 1-9.");
            SendCommand($"<X{factor}>");
        }

        /// <summary>
        /// Enable the human-readable text below the next barcode.
        /// Auto-resets after one barcode — call before each one that needs it.
        /// </summary>
        public void EnableBarcodeInterpretation() => SendCommand("<BI>");

        // 1D barcodes use lowercase selectors so rotation commands apply.
        // Size is in units — each unit = 8 dots of bar height.

        /// <summary>Print a Code 128 barcode. Adds ^ delimiters if missing.</summary>
        public void PrintCode128(string data,
            BarcodeOrientation orientation = BarcodeOrientation.Ladder, int size = 4)
        {
            string o = orientation == BarcodeOrientation.Ladder ? "L" : "P";
            if (!data.StartsWith('^')) data = "^" + data;
            if (!data.EndsWith('^'))   data = data + "^";
            SendCommand($"<o{o}{size}>{data}");
        }

        /// <summary>Print a Code 39 barcode. Adds * delimiters if missing.</summary>
        public void PrintCode39(string data,
            BarcodeOrientation orientation = BarcodeOrientation.Ladder, int size = 4)
        {
            string o = orientation == BarcodeOrientation.Ladder ? "L" : "P";
            if (!data.StartsWith('*')) data = "*" + data;
            if (!data.EndsWith('*'))   data = data + "*";
            SendCommand($"<n{o}{size}>{data}");
        }

        /// <summary>
        /// Print an Interleaved 2-of-5 barcode. Data must be an even number
        /// of digits. Adds colon delimiters if missing.
        /// </summary>
        public void PrintInterleaved2of5(string data,
            BarcodeOrientation orientation = BarcodeOrientation.Ladder, int size = 4)
        {
            string o = orientation == BarcodeOrientation.Ladder ? "L" : "P";
            if (!data.StartsWith(':')) data = ":" + data;
            if (!data.EndsWith(':'))   data = data + ":";
            SendCommand($"<f{o}{size}>{data}");
        }

        /// <summary>
        /// Print a UPC-A barcode. Pass 12 digits including check digit.
        /// Guard characters (J/K/L) are added automatically.
        /// </summary>
        public void PrintUpcA(string digits,
            BarcodeOrientation orientation = BarcodeOrientation.Ladder, int size = 5)
        {
            string o = orientation == BarcodeOrientation.Ladder ? "L" : "P";
            if (digits.Length == 12)
                digits = $"J{digits[..6]}K{digits[6..]}L";
            SendCommand($"<u{o}{size}>{digits}");
        }

        /// <summary>
        /// Print an EAN-13 barcode. Pass 13 digits — first digit is the
        /// parity flag. Guard characters added automatically.
        /// </summary>
        public void PrintEan13(string digits,
            BarcodeOrientation orientation = BarcodeOrientation.Ladder, int size = 5)
        {
            string o = orientation == BarcodeOrientation.Ladder ? "L" : "P";
            if (digits.Length == 13)
                digits = $"{digits[0]}J{digits[1..7]}K{digits[7..]}L";
            SendCommand($"<e{o}{size}>{digits}");
        }

        /// <summary>Print an EAN-8 barcode. Pass 8 digits.</summary>
        public void PrintEan8(string digits,
            BarcodeOrientation orientation = BarcodeOrientation.Ladder, int size = 5)
        {
            string o = orientation == BarcodeOrientation.Ladder ? "L" : "P";
            if (digits.Length == 8)
                digits = $"J{digits[..4]}K{digits[4..]}L";
            SendCommand($"<u{o}{size}>{digits}");
        }

        /// <summary>
        /// Print a Codabar barcode. Data must start and end with A, B, C, or D.
        /// </summary>
        public void PrintCodabar(string data,
            BarcodeOrientation orientation = BarcodeOrientation.Ladder, int size = 4)
        {
            string o = orientation == BarcodeOrientation.Ladder ? "L" : "P";
            SendCommand($"<c{o}{size}>{data}");
        }

        // 2D barcodes use FGL font numbers to control module/cell size.

        /// <summary>
        /// Print a QR code. Font 65-78 controls module size (3-16pt).
        /// Uses the QR command — data is wrapped in curly braces per FGL spec.
        /// Needs firmware FGL46G36+ and font file SB03+.
        /// </summary>
        public void PrintQrCode(string data, int fontNumber = 68)
        {
            SendCommand($"<F{fontNumber}><QR>{{{data}}}");
        }

        /// <summary>Print a QR code at a specific position.</summary>
        public void PrintQrCodeAt(int row, int column, string data, int fontNumber = 68)
        {
            SendCommand($"<RC{row},{column}><F{fontNumber}><QR>{{{data}}}");
        }

        /// <summary>
        /// Set the QR barcode version (density). Default is version 7.
        /// Version 2 = least dense, 15 = most dense. Stored until power-off.
        /// </summary>
        public void SetQrVersion(int version)
        {
            if (version != 2 && version != 7 && version != 11 && version != 15)
                throw new BocaPrinterException("QR version must be 2, 7, 11, or 15.");
            SendCommand($"<QRV{version}>");
        }

        /// <summary>
        /// Print a Data Matrix barcode. Font 51-60 controls cell size (2-14pt).
        /// Uses the DTM command — data is wrapped in curly braces per FGL spec.
        /// Needs firmware FGL46E6+ and font file SB01+.
        /// </summary>
        public void PrintDataMatrix(string data, int fontNumber = 54)
        {
            SendCommand($"<F{fontNumber}><DTM>{{{data}}}");
        }

        /// <summary>
        /// Print a PDF-417 barcode. Font 30-50 controls size and error correction.
        /// Uses the PDF command — data is wrapped in curly braces per FGL spec.
        /// Needs firmware FGL46E6+ and font file SB01+.
        /// </summary>
        public void PrintPdf417(string data, int fontNumber = 33)
        {
            SendCommand($"<F{fontNumber}><PDF>{{{data}}}");
        }

        /// <summary>
        /// Print an Aztec barcode. Font 80-93 controls module size (4-24pt).
        /// Uses the AZ command — data is wrapped in curly braces per FGL spec.
        /// Needs firmware FGL46G44+ and font file SB04+.
        /// </summary>
        public void PrintAztec(string data, int fontNumber = 82)
        {
            SendCommand($"<F{fontNumber}><AZ>{{{data}}}");
        }

        /// <summary>Print an Aztec barcode at a specific position.</summary>
        public void PrintAztecAt(int row, int column, string data, int fontNumber = 82)
        {
            SendCommand($"<RC{row},{column}><F{fontNumber}><AZ>{{{data}}}");
        }
    }
}
