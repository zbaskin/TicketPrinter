using BocaSystems.Sdk;
using BocaSystems.Sdk.Models;
using Xunit;

namespace BocaSystems.Sdk.Tests
{
    public class BarcodeCommandTests
    {
        private readonly MockTransport _mock = new();
        private BocaPrinter CreatePrinter() => new(_mock);

        [Fact]
        public void SetBarcodeExpansion_sends_X_command()
        {
            using var p = CreatePrinter();
            p.SetBarcodeExpansion(3);
            Assert.Equal("<X3>", _mock.LastCommand);
        }

        [Fact]
        public void SetBarcodeExpansion_rejects_out_of_range()
        {
            using var p = CreatePrinter();
            Assert.Throws<BocaPrinterException>(() => p.SetBarcodeExpansion(0));
            Assert.Throws<BocaPrinterException>(() => p.SetBarcodeExpansion(10));
        }

        [Fact]
        public void EnableBarcodeInterpretation_sends_BI()
        {
            using var p = CreatePrinter();
            p.EnableBarcodeInterpretation();
            Assert.Equal("<BI>", _mock.LastCommand);
        }

        [Fact]
        public void PrintCode128_wraps_data_with_carets()
        {
            using var p = CreatePrinter();
            p.PrintCode128("HELLO123", BarcodeOrientation.Ladder, 5);
            Assert.Equal("<oL5>^HELLO123^", _mock.LastCommand);
        }

        [Fact]
        public void PrintCode128_doesnt_double_wrap_carets()
        {
            using var p = CreatePrinter();
            p.PrintCode128("^ALREADY^");
            Assert.Equal("<oL4>^ALREADY^", _mock.LastCommand);
        }

        [Fact]
        public void PrintCode128_picket_fence()
        {
            using var p = CreatePrinter();
            p.PrintCode128("TEST", BarcodeOrientation.PicketFence, 6);
            Assert.Equal("<oP6>^TEST^", _mock.LastCommand);
        }

        [Fact]
        public void PrintCode39_wraps_data_with_asterisks()
        {
            using var p = CreatePrinter();
            p.PrintCode39("CODE39");
            Assert.Equal("<nL4>*CODE39*", _mock.LastCommand);
        }

        [Fact]
        public void PrintInterleaved2of5_wraps_data_with_colons()
        {
            using var p = CreatePrinter();
            p.PrintInterleaved2of5("123456");
            Assert.Equal("<fL4>:123456:", _mock.LastCommand);
        }

        [Fact]
        public void PrintUpcA_formats_guard_characters()
        {
            using var p = CreatePrinter();
            p.PrintUpcA("401234567893");
            Assert.Equal("<uL5>J401234K567893L", _mock.LastCommand);
        }

        [Fact]
        public void PrintEan13_formats_guard_characters()
        {
            using var p = CreatePrinter();
            p.PrintEan13("9014561780128");
            Assert.Equal("<eL5>9J014561K780128L", _mock.LastCommand);
        }

        [Fact]
        public void PrintCodabar_sends_raw_data()
        {
            using var p = CreatePrinter();
            p.PrintCodabar("A123456B", BarcodeOrientation.PicketFence);
            Assert.Equal("<cP4>A123456B", _mock.LastCommand);
        }

        [Fact]
        public void PrintQrCode_sends_QR_command_with_braces()
        {
            using var p = CreatePrinter();
            p.PrintQrCode("https://bocasystems.com", 70);
            Assert.Equal("<F70><QR>{https://bocasystems.com}", _mock.LastCommand);
        }

        [Fact]
        public void PrintQrCodeAt_includes_position()
        {
            using var p = CreatePrinter();
            p.PrintQrCodeAt(100, 200, "QR DATA", 68);
            Assert.Equal("<RC100,200><F68><QR>{QR DATA}", _mock.LastCommand);
        }

        [Fact]
        public void PrintDataMatrix_sends_DTM_command_with_braces()
        {
            using var p = CreatePrinter();
            p.PrintDataMatrix("DMX-DATA", 54);
            Assert.Equal("<F54><DTM>{DMX-DATA}", _mock.LastCommand);
        }

        [Fact]
        public void PrintPdf417_sends_PDF_command_with_braces()
        {
            using var p = CreatePrinter();
            p.PrintPdf417("PDF417-DATA", 33);
            Assert.Equal("<F33><PDF>{PDF417-DATA}", _mock.LastCommand);
        }

        [Fact]
        public void PrintAztec_sends_AZ_command_with_braces()
        {
            using var p = CreatePrinter();
            p.PrintAztec("Boca Systems");
            Assert.Equal("<F82><AZ>{Boca Systems}", _mock.LastCommand);
        }

        [Fact]
        public void SetQrVersion_sends_QRV_command()
        {
            using var p = CreatePrinter();
            p.SetQrVersion(2);
            Assert.Equal("<QRV2>", _mock.LastCommand);
        }

        [Fact]
        public void SetQrVersion_rejects_invalid()
        {
            using var p = CreatePrinter();
            Assert.Throws<BocaPrinterException>(() => p.SetQrVersion(5));
        }
    }
}
