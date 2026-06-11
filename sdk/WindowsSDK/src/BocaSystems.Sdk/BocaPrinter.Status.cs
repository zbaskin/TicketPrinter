using System;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using BocaSystems.Sdk.Models;

namespace BocaSystems.Sdk
{
    public partial class BocaPrinter
    {
        /// <summary>
        /// Single-ticket status mode. Only sends ACK, low paper, and power-on.
        /// Best for poll-after-each-ticket workflows. Stored in flash.
        /// </summary>
        public void SetStatusModeSingleTicket() => SendCommand("<s90>");

        /// <summary>
        /// Solicited status mode (factory default). Disables unsolicited
        /// messages except ACK, low paper, and power-on. Stored in flash.
        /// </summary>
        public void SetStatusModeSolicited() => SendCommand("<s91>");

        /// <summary>Clear all permanent status settings from flash.</summary>
        public void ClearStatusSettings() => SendCommand("<cs>");

        /// <summary>
        /// Basic status request. Returns one byte — parse with PrinterStatus.FromByte.
        /// May not respond in legacy mode if the printer is busy.
        /// </summary>
        public async Task<PrinterStatus> QueryStatusAsync(CancellationToken ct = default)
        {
            SendCommand("<S1>");
            byte[] response = await ReadWithTimeoutAsync(64, ct);
            if (response.Length == 0)
                return new PrinterStatus { Description = "No response (printer may be busy)" };

            return PrinterStatus.FromByte(response[0]);
        }

        /// <summary>
        /// Solicited status request. Works in both s90 and s91 modes and can
        /// respond even during some error states. Returns 0x41 when OK.
        /// </summary>
        public async Task<PrinterStatus> QuerySolicitedStatusAsync(CancellationToken ct = default)
        {
            SendCommand("<S92>");
            byte[] response = await ReadWithTimeoutAsync(64, ct);
            if (response.Length == 0)
                return new PrinterStatus { Description = "No response (printer may be X-Off)" };

            return PrinterStatus.FromByte(response[0]);
        }

        /// <summary>
        /// Get firmware version and cumulative ticket count.
        /// Response looks like "0004616 PROM = FGL46R10".
        /// </summary>
        public async Task<string> QueryFirmwareVersionAsync(CancellationToken ct = default)
        {
            SendCommand("<S2>");
            byte[] response = await ReadWithTimeoutAsync(256, ct);
            return Encoding.ASCII.GetString(response).Trim();
        }

        /// <summary>
        /// Query free bytes in the printer's download memory.
        /// Check before downloading logos or fonts.
        /// </summary>
        public async Task<long> QueryDownloadSpaceAsync(CancellationToken ct = default)
        {
            SendCommand("<S7>");
            byte[] response = await ReadWithTimeoutAsync(64, ct);
            string hex = Encoding.ASCII.GetString(response).Trim();
            if (long.TryParse(hex, System.Globalization.NumberStyles.HexNumber, null, out long bytes))
                return bytes;
            return -1;
        }

        /// <summary>
        /// Query dirty (deleted but not reclaimed) bytes in flash.
        /// Use ReclaimFlash() to recover this space.
        /// </summary>
        public async Task<long> QueryDirtyBytesAsync(CancellationToken ct = default)
        {
            SendCommand("<S9>");
            byte[] response = await ReadWithTimeoutAsync(64, ct);
            string hex = Encoding.ASCII.GetString(response).Trim();
            if (long.TryParse(hex, System.Globalization.NumberStyles.HexNumber, null, out long bytes))
                return bytes;
            return -1;
        }

        /// <summary>Disable all status messages (except x-on/off flow control).</summary>
        public void DisableStatus() => SendCommand("<S5>");

        /// <summary>
        /// Add 0x30 to status bytes so they're printable ASCII.
        /// For hosts that can't handle control characters.
        /// </summary>
        public void EnableAsciiStatus() => SendCommand("<S6>");

        /// <summary>Decode a raw status byte into a description string.</summary>
        public static string DecodeStatusByte(byte b) => PrinterStatus.FromByte(b).Description;

        private async Task<byte[]> ReadWithTimeoutAsync(int bufferSize, CancellationToken ct)
        {
            using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
            cts.CancelAfter(TimeSpan.FromSeconds(3));
            try
            {
                return await ReadAsync(bufferSize, cts.Token);
            }
            catch (OperationCanceledException)
            {
                return Array.Empty<byte>();
            }
        }
    }
}
