using BocaSystems.Sdk.Models;

namespace BocaSystems.Sdk
{
    // Most commands here write to flash — use them during setup, not on every
    // ticket. Excessive flash writes shorten the chip's life.
    public partial class BocaPrinter
    {
        /// <summary>Select the active ticket path (1 or 2) on dual-path printers.</summary>
        public void SetPath(int pathNumber)
        {
            if (pathNumber < 1 || pathNumber > 2)
                throw new BocaPrinterException("Path number must be 1 or 2.");
            SendCommand($"<P{pathNumber}>");
        }

        /// <summary>Enable standard dual-printer mode. Stored in flash.</summary>
        public void EnableDualMode() => SendCommand("<pb>");

        /// <summary>Enable dual-supply mode. Stored in flash.</summary>
        public void EnableDualSupplyMode() => SendCommand("<pb2>");

        /// <summary>
        /// Adjust print darkness (-5 to +5, 0 is factory default).
        /// Each step is about 10% more or less energy. Stored in flash.
        /// </summary>
        public void SetPrintIntensity(int level)
        {
            if (level < -5 || level > 5)
                throw new BocaPrinterException("Print intensity must be -5 to +5.");
            SendCommand($"<lve{level}>");
        }

        /// <summary>
        /// Nudge vertical print position. Each unit = 8 dots.
        /// Negative = up, positive = down. Stored in flash.
        /// </summary>
        public void SetTopAdjustment(int units) => SendCommand($"<taj{units}>");

        /// <summary>
        /// Change how the USB port presents itself to the host.
        /// Takes effect on next USB enumeration. Stored in flash.
        /// </summary>
        public void SetUsbDeviceType(UsbDeviceType type)
        {
            string cmd = type switch
            {
                UsbDeviceType.Hid          => "<usbh>",
                UsbDeviceType.VirtualSerial => "<usbs>",
                _ => "<usbh>"
            };
            SendCommand(cmd);
        }

        /// <summary>Enable Bluetooth Classic interface. Stored in flash.</summary>
        public void EnableBluetooth() => SendCommand("<bll>");

        /// <summary>Disable Bluetooth interface. Stored in flash.</summary>
        public void DisableBluetooth() => SendCommand("<bld>");


        /// <summary>
        /// Print the printer's built-in test ticket without pressing the physical
        /// test button. The type selects the layout:
        /// 0 = standard, 1 = config (1"), 2 = config (2"), 3 = config (3"),
        /// 4 = config (4"), 6 = continuous test tickets.
        /// </summary>
        public void PrintTestTicket(int type = 0)
        {
            if (type < 0 || type > 6 || type == 5)
                throw new BocaPrinterException("Test ticket type must be 0-4 or 6.");
            SendCommand($"<TST{type}>");
        }

        /// <summary>
        /// Diagnostic mode: all received data is printed raw, nothing is
        /// interpreted as FGL. Active until power-off.
        /// </summary>
        public void EnableDiagnosticMode() => SendCommand("<DM>");

        /// <summary>
        /// Discard unprinted tickets from the buffer. Also resets ticket count.
        /// Active until power-off.
        /// </summary>
        public void PurgeRemainingTickets() => SendCommand("<PP>");

        /// <summary>Permanently enable purge mode (survives power cycle).</summary>
        public void EnablePermanentPurge() => SendCommand("<ppe>");

        /// <summary>Disable permanent purge mode.</summary>
        public void DisablePermanentPurge() => SendCommand("<ppd>");

        /// <summary>
        /// Park the ticket at the print position instead of the cutter.
        /// Prevents curling on thick stock. Active until power-off.
        /// </summary>
        public void ParkTicket() => SendCommand("<PT>");

        /// <summary>Permanently enable parking. Stored in flash.</summary>
        public void EnablePermanentParking() => SendCommand("<pt>");

        /// <summary>Delete the permanent parking setting.</summary>
        public void DisablePermanentParking() => SendCommand("<dpt>");

        /// <summary>Reverse the paper to unload stock without lifting the head.</summary>
        public void UnloadStock() => SendCommand("<US>");

        /// <summary>Pulse cash drawer A (50ms signal).</summary>
        public void FireCashDrawerA() => SendCommand("<DA>");

        /// <summary>Pulse cash drawer B. Needs dual-drawer wiring.</summary>
        public void FireCashDrawerB() => SendCommand("<DB>");

        /// <summary>Disable the physical test button. Stored in flash.</summary>
        public void DisableTestButton() => SendCommand("<td>");

        /// <summary>Re-enable the physical test button. Stored in flash.</summary>
        public void EnableTestButton() => SendCommand("<te>");

        /// <summary>Enable ASCII error messages on the CRT port.</summary>
        public void EnableCrtMessages() => SendCommand("<ME>");

        /// <summary>Disable CRT error messages (default).</summary>
        public void DisableCrtMessages() => SendCommand("<MD>");

        /// <summary>
        /// Overwrite mode: subsequent data replaces what's in the buffer
        /// instead of OR-ing. Useful for placing text on top of graphics.
        /// </summary>
        public void EnableOverwrite() => SendCommand("<OWE>");

        /// <summary>Disable overwrite mode (back to OR-ing).</summary>
        public void DisableOverwrite() => SendCommand("<OWD>");

        /// <summary>Tag the next download with an ID for individual deletion.</summary>
        public void SetFileId(int id) => SendCommand($"<ID{id}>");

        /// <summary>Mark the next download as permanent (flash).</summary>
        public void SetFilePermanent() => SendCommand("<PF>");

        /// <summary>Mark the next download as temporary (RAM, lost on power-off).</summary>
        public void SetFileTemporary() => SendCommand("<TF>");

        /// <summary>Delete all permanent and temporary files (logos, fonts, TrueType).</summary>
        public void DeleteAllFiles() => SendCommand("<DF1>");

        /// <summary>Delete all temporary files only.</summary>
        public void DeleteAllTemporaryFiles() => SendCommand("<DF2>");

        /// <summary>Delete all soft fonts (permanent and temporary).</summary>
        public void DeleteAllSoftFonts() => SendCommand("<DF3>");

        /// <summary>Delete all logos (permanent and temporary).</summary>
        public void DeleteAllLogos() => SendCommand("<DF5>");

        /// <summary>Delete all TrueType font files.</summary>
        public void DeleteAllTrueTypeFonts() => SendCommand("<DF10>");

        /// <summary>Delete a single soft font by its ID number.</summary>
        public void DeleteSoftFont(int id) => SendCommand($"<ID{id}><DF7>");

        /// <summary>Delete a single logo by its ID number.</summary>
        public void DeleteLogo(int id) => SendCommand($"<ID{id}><DF8>");

        /// <summary>Delete a single TrueType font by its ID number.</summary>
        public void DeleteTrueTypeFont(int id) => SendCommand($"<ID{id}><DF11>");

        /// <summary>
        /// Reclaim deleted flash space. Can take several seconds on large
        /// flash chips — the printer goes busy and resets during the operation.
        /// Wait for a power-on (0x12) status before sending more data.
        /// </summary>
        public void ReclaimFlash() => SendCommand("<DF9>");
    }
}
