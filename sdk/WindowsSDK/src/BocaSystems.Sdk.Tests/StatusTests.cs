using System.Threading.Tasks;
using BocaSystems.Sdk;
using BocaSystems.Sdk.Models;
using Xunit;

namespace BocaSystems.Sdk.Tests
{
    public class StatusTests
    {
        private readonly MockTransport _mock = new();
        private BocaPrinter CreatePrinter() => new(_mock);

        [Theory]
        [InlineData(0x03, "Paper jam path 1", false, false, true)]
        [InlineData(0x05, "Test ticket ACK", true, false, false)]
        [InlineData(0x06, "Ticket ACK", true, false, false)]
        [InlineData(0x0A, "Out of paper path 1", false, true, false)]
        [InlineData(0x0C, "Paper loaded path 1", true, false, false)]
        [InlineData(0x10, "Out of tickets", false, true, false)]
        [InlineData(0x11, "X-On (ready)", true, false, false)]
        [InlineData(0x13, "X-Off (busy)", false, false, false)]
        [InlineData(0x18, "Ticket jam", false, false, true)]
        [InlineData(0x1D, "Cutter jam", false, false, false)]
        [InlineData(0x1E, "Stuck ticket", false, false, true)]
        [InlineData(0x41, "Good status (X-On)", true, false, false)]
        public void FromByte_parses_known_status_codes(
            byte input, string description, bool ready, bool outOfTickets, bool jam)
        {
            var status = PrinterStatus.FromByte(input);
            Assert.Equal(description, status.Description);
            Assert.Equal(ready, status.IsReady);
            Assert.Equal(outOfTickets, status.OutOfTickets);
            Assert.Equal(jam, status.TicketJam);
        }

        [Fact]
        public void DecodeStatusByte_returns_description()
        {
            Assert.Equal("Ticket ACK", BocaPrinter.DecodeStatusByte(0x06));
            Assert.Equal("Ticket jam", BocaPrinter.DecodeStatusByte(0x18));
        }

        [Fact]
        public async Task QueryStatusAsync_sends_S1_and_parses_response()
        {
            using var p = CreatePrinter();
            _mock.StageReadResponse(new byte[] { 0x06 });

            var status = await p.QueryStatusAsync();

            Assert.Contains("<S1>", _mock.AllCommands);
            Assert.True(status.TicketAcknowledged);
            Assert.True(status.IsReady);
        }

        [Fact]
        public async Task QuerySolicitedStatusAsync_sends_S92()
        {
            using var p = CreatePrinter();
            _mock.StageReadResponse(new byte[] { 0x41 });

            var status = await p.QuerySolicitedStatusAsync();

            Assert.Contains("<S92>", _mock.AllCommands);
            Assert.True(status.IsReady);
            Assert.Equal("Good status (X-On)", status.Description);
        }

        [Fact]
        public async Task QueryFirmwareVersionAsync_returns_string()
        {
            using var p = CreatePrinter();
            _mock.StageReadResponse("0004616 PROM = FGL46R10");

            string version = await p.QueryFirmwareVersionAsync();

            Assert.Contains("<S2>", _mock.AllCommands);
            Assert.Contains("FGL46R10", version);
        }

        [Fact]
        public async Task QueryDownloadSpaceAsync_parses_hex()
        {
            using var p = CreatePrinter();
            _mock.StageReadResponse("00019000");

            long bytes = await p.QueryDownloadSpaceAsync();

            Assert.Contains("<S7>", _mock.AllCommands);
            Assert.Equal(0x19000, bytes);
        }

        [Fact]
        public void SetStatusMode_commands()
        {
            using var p = CreatePrinter();
            p.SetStatusModeSingleTicket();
            Assert.Equal("<s90>", _mock.SentStrings[0]);
            p.SetStatusModeSolicited();
            Assert.Equal("<s91>", _mock.SentStrings[1]);
            p.ClearStatusSettings();
            Assert.Equal("<cs>", _mock.SentStrings[2]);
        }
    }
}
