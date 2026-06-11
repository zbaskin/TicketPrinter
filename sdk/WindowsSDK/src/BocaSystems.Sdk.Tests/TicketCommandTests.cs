using BocaSystems.Sdk;
using Xunit;

namespace BocaSystems.Sdk.Tests
{
    public class TicketCommandTests
    {
        private readonly MockTransport _mock = new();
        private BocaPrinter CreatePrinter() => new(_mock);

        [Fact]
        public void PrintAndCut_sends_p()
        {
            using var p = CreatePrinter();
            p.PrintAndCut();
            Assert.Equal("<p>", _mock.LastCommand);
        }

        [Fact]
        public void PrintNoCut_sends_q()
        {
            using var p = CreatePrinter();
            p.PrintNoCut();
            Assert.Equal("<q>", _mock.LastCommand);
        }

        [Fact]
        public void PrintAndEject_sends_z()
        {
            using var p = CreatePrinter();
            p.PrintAndEject();
            Assert.Equal("<z>", _mock.LastCommand);
        }

        [Fact]
        public void PrintAndHold_sends_h()
        {
            using var p = CreatePrinter();
            p.PrintAndHold();
            Assert.Equal("<h>", _mock.LastCommand);
        }

        [Fact]
        public void SetRepeatCount_sends_RE_command()
        {
            using var p = CreatePrinter();
            p.SetRepeatCount(4);
            Assert.Equal("<RE4>", _mock.LastCommand);
        }

        [Fact]
        public void SetRepeatCount_rejects_zero()
        {
            using var p = CreatePrinter();
            Assert.Throws<BocaPrinterException>(() => p.SetRepeatCount(0));
        }

        [Fact]
        public void SetPrintLength_sends_PL_command()
        {
            using var p = CreatePrinter();
            p.SetPrintLength(1050);
            Assert.Equal("<PL1050>", _mock.LastCommand);
        }

        [Fact]
        public void LoadTicketCount_pads_to_seven_digits()
        {
            using var p = CreatePrinter();
            p.LoadTicketCount(42);
            Assert.Equal("<TC0000042>", _mock.LastCommand);
        }

        [Fact]
        public void PrintTicketCount_sends_PC()
        {
            using var p = CreatePrinter();
            p.PrintTicketCount();
            Assert.Equal("<PC>", _mock.LastCommand);
        }

        [Fact]
        public void ClearBuffer_sends_CB()
        {
            using var p = CreatePrinter();
            p.ClearBuffer();
            Assert.Equal("<CB>", _mock.LastCommand);
        }

        [Fact]
        public void ClearDownloadMemory_sends_ESC_c()
        {
            using var p = CreatePrinter();
            p.ClearDownloadMemory();
            Assert.Equal("\x1Bc", _mock.LastCommand);
        }

        [Fact]
        public void Full_ticket_workflow_generates_correct_sequence()
        {
            using var p = CreatePrinter();

            // Build a simple ticket
            p.SetFont(6);
            p.SetRowColumn(50, 100);
            p.PrintText("GENERAL ADMISSION");
            p.SetRowColumn(150, 100);
            p.SetFont(3);
            p.PrintText("Section 101 Row A Seat 12");
            p.SetRowColumn(250, 100);
            p.SetBarcodeExpansion(2);
            p.EnableBarcodeInterpretation();
            p.PrintCode128("GA-2024-001234");
            p.PrintAndCut();

            string expected =
                "<F6>" +
                "<RC50,100>" +
                "GENERAL ADMISSION" +
                "<RC150,100>" +
                "<F3>" +
                "Section 101 Row A Seat 12" +
                "<RC250,100>" +
                "<X2>" +
                "<BI>" +
                "<oL4>^GA-2024-001234^" +
                "<p>";

            Assert.Equal(expected, _mock.AllCommands);
        }
    }
}
