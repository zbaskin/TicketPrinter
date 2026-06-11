using BocaSystems.Sdk;
using BocaSystems.Sdk.Models;
using Xunit;

namespace BocaSystems.Sdk.Tests
{
    public class ConfigCommandTests
    {
        private readonly MockTransport _mock = new();
        private BocaPrinter CreatePrinter() => new(_mock);

        [Theory]
        [InlineData(1, "<P1>")]
        [InlineData(2, "<P2>")]
        public void SetPath_sends_correct_command(int path, string expected)
        {
            using var p = CreatePrinter();
            p.SetPath(path);
            Assert.Equal(expected, _mock.LastCommand);
        }

        [Fact]
        public void SetPath_rejects_invalid()
        {
            using var p = CreatePrinter();
            Assert.Throws<BocaPrinterException>(() => p.SetPath(3));
        }

        [Theory]
        [InlineData(-5, "<lve-5>")]
        [InlineData(0, "<lve0>")]
        [InlineData(5, "<lve5>")]
        public void SetPrintIntensity_sends_lve(int level, string expected)
        {
            using var p = CreatePrinter();
            p.SetPrintIntensity(level);
            Assert.Equal(expected, _mock.LastCommand);
        }

        [Fact]
        public void SetPrintIntensity_rejects_out_of_range()
        {
            using var p = CreatePrinter();
            Assert.Throws<BocaPrinterException>(() => p.SetPrintIntensity(-6));
            Assert.Throws<BocaPrinterException>(() => p.SetPrintIntensity(6));
        }

        [Fact]
        public void SetTopAdjustment_sends_taj()
        {
            using var p = CreatePrinter();
            p.SetTopAdjustment(-1);
            Assert.Equal("<taj-1>", _mock.LastCommand);
        }

        [Theory]
        [InlineData(UsbDeviceType.Hid, "<usbh>")]
        [InlineData(UsbDeviceType.VirtualSerial, "<usbs>")]
        public void SetUsbDeviceType_sends_correct_command(UsbDeviceType type, string expected)
        {
            using var p = CreatePrinter();
            p.SetUsbDeviceType(type);
            Assert.Equal(expected, _mock.LastCommand);
        }

        [Fact]
        public void EnableDiagnosticMode_sends_DM()
        {
            using var p = CreatePrinter();
            p.EnableDiagnosticMode();
            Assert.Equal("<DM>", _mock.LastCommand);
        }

        [Fact]
        public void PurgeRemainingTickets_sends_PP()
        {
            using var p = CreatePrinter();
            p.PurgeRemainingTickets();
            Assert.Equal("<PP>", _mock.LastCommand);
        }

        [Fact]
        public void UnloadStock_sends_US()
        {
            using var p = CreatePrinter();
            p.UnloadStock();
            Assert.Equal("<US>", _mock.LastCommand);
        }

        [Fact]
        public void CashDrawer_commands()
        {
            using var p = CreatePrinter();
            p.FireCashDrawerA();
            Assert.Equal("<DA>", _mock.SentStrings[0]);
            p.FireCashDrawerB();
            Assert.Equal("<DB>", _mock.SentStrings[1]);
        }

        [Fact]
        public void File_management_commands()
        {
            using var p = CreatePrinter();
            p.SetFileId(5);
            p.SetFilePermanent();
            p.SetFileTemporary();
            p.ReclaimFlash();

            Assert.Equal("<ID5><PF><TF><DF9>", _mock.AllCommands);
        }

        [Fact]
        public void DeleteAllFiles_sends_DF1()
        {
            using var p = CreatePrinter();
            p.DeleteAllFiles();
            Assert.Equal("<DF1>", _mock.LastCommand);
        }

        [Fact]
        public void DeleteAllTemporaryFiles_sends_DF2()
        {
            using var p = CreatePrinter();
            p.DeleteAllTemporaryFiles();
            Assert.Equal("<DF2>", _mock.LastCommand);
        }

        [Fact]
        public void DeleteLogo_sends_ID_then_DF8()
        {
            using var p = CreatePrinter();
            p.DeleteLogo(3);
            Assert.Equal("<ID3><DF8>", _mock.LastCommand);
        }

        [Fact]
        public void DeleteSoftFont_sends_ID_then_DF7()
        {
            using var p = CreatePrinter();
            p.DeleteSoftFont(2);
            Assert.Equal("<ID2><DF7>", _mock.LastCommand);
        }

        [Fact]
        public void DeleteTrueTypeFont_sends_ID_then_DF11()
        {
            using var p = CreatePrinter();
            p.DeleteTrueTypeFont(1);
            Assert.Equal("<ID1><DF11>", _mock.LastCommand);
        }

        [Fact]
        public void Overwrite_commands()
        {
            using var p = CreatePrinter();
            p.EnableOverwrite();
            p.PrintText("replacement");
            p.DisableOverwrite();
            Assert.Equal("<OWE>replacement<OWD>", _mock.AllCommands);
        }
    }
}
