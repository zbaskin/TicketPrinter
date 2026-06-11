namespace BocaSystems.Sdk
{
    public partial class BocaPrinter
    {
        /// <summary>Print and cut the ticket.</summary>
        public void PrintAndCut() => SendCommand("<p>");

        /// <summary>Print without cutting. For multi-part continuous stock.</summary>
        public void PrintNoCut() => SendCommand("<q>");

        /// <summary>
        /// Print, cut, and eject. Only works on presenter models.
        /// Don't use mid-run — the printer ignores it there.
        /// </summary>
        public void PrintAndEject() => SendCommand("<z>");

        /// <summary>
        /// Print and cut, but keep the image in the buffer. Subsequent tickets
        /// only need to send changed fields. Send PrintAndCut to release.
        /// Not supported with soft fonts or dual/mag printers.
        /// </summary>
        public void PrintAndHold() => SendCommand("<h>");

        /// <summary>Like PrintAndHold but without cutting.</summary>
        public void PrintNoCutAndHold() => SendCommand("<r>");

        /// <summary>
        /// Print extra copies. The count is *additional* — SetRepeatCount(4)
        /// prints 5 total. Must be sent before the print command.
        /// </summary>
        public void SetRepeatCount(int additionalCopies)
        {
            if (additionalCopies < 1)
                throw new BocaPrinterException("Repeat count must be >= 1.");
            SendCommand($"<RE{additionalCopies}>");
        }

        /// <summary>
        /// Override the printable area length in dot columns. The printer
        /// normally auto-measures from black mark spacing.
        /// </summary>
        public void SetPrintLength(int dotColumns) => SendCommand($"<PL{dotColumns}>");

        /// <summary>
        /// Store the printing length in flash. Skips auto-measure on power-up.
        /// Useful for label stock where reverse-and-measure peels labels.
        /// </summary>
        public void SetPermanentPrintLength(int dotColumns) => SendCommand($"<pl{dotColumns}>");

        /// <summary>
        /// Store the ticket length in flash. Only needed when ticket length
        /// differs from print length (e.g. labels with a gap).
        /// Must be sent before SetPermanentPrintLength.
        /// </summary>
        public void SetPermanentTicketLength(int dotColumns) => SendCommand($"<tl{dotColumns}>");

        /// <summary>Delete permanent length settings, re-enable auto-measure.</summary>
        public void DeletePermanentLength() => SendCommand("<dpl>");

        /// <summary>Print the internal ticket count at the current cursor position.</summary>
        public void PrintTicketCount() => SendCommand("<PC>");

        /// <summary>
        /// Preload the 7-digit ticket counter. Next ticket gets this number,
        /// then auto-increments. Resets on power-off.
        /// </summary>
        public void LoadTicketCount(int count)
        {
            string padded = count.ToString("D7");
            SendCommand($"<TC{padded}>");
        }

        /// <summary>Reset the re-settable ticket counter on the given path.</summary>
        public void ResetTicketCount(int pathNumber = 1) => SendCommand($"<rtc{pathNumber}>");

        /// <summary>
        /// Clear the ticket buffer. The printer does this automatically after
        /// each ticket, so this is rarely needed.
        /// </summary>
        public void ClearBuffer() => SendCommand("<CB>");

        /// <summary>
        /// Wipe all downloaded logos, fonts, and graphics from printer storage.
        /// On flash-equipped printers, data survives power-off — you need this
        /// command (not just a reboot) to reclaim space.
        /// </summary>
        public void ClearDownloadMemory()
        {
            SendCommand("\x1Bc");
        }
    }
}
