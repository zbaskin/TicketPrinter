namespace BocaSystems.Sdk.Models
{
    /// <summary>
    /// Parsed printer status response from a status query (S1, S92, etc).
    /// </summary>
    public class PrinterStatus
    {
        public byte RawByte { get; init; }
        public string Description { get; init; } = "";
        public bool IsReady { get; init; }
        public bool TicketAcknowledged { get; init; }
        public bool OutOfTickets { get; init; }
        public bool TicketJam { get; init; }
        public bool CutterJam { get; init; }
        public bool PowerOn { get; init; }

        /// <summary>Parse a single status byte from the printer.</summary>
        public static PrinterStatus FromByte(byte b)
        {
            return b switch
            {
                0x01 => new PrinterStatus { RawByte = b, Description = "Reject bin warning" },
                0x02 => new PrinterStatus { RawByte = b, Description = "Reject bin error" },
                0x03 => new PrinterStatus { RawByte = b, Description = "Paper jam path 1",   TicketJam = true },
                0x04 => new PrinterStatus { RawByte = b, Description = "Paper jam path 2",   TicketJam = true },
                0x05 => new PrinterStatus { RawByte = b, Description = "Test ticket ACK",    TicketAcknowledged = true, IsReady = true },
                0x06 => new PrinterStatus { RawByte = b, Description = "Ticket ACK",         TicketAcknowledged = true, IsReady = true },
                0x07 => new PrinterStatus { RawByte = b, Description = "Wrong file identifier" },
                0x08 => new PrinterStatus { RawByte = b, Description = "Invalid checksum" },
                0x09 => new PrinterStatus { RawByte = b, Description = "Valid checksum",     IsReady = true },
                0x0A => new PrinterStatus { RawByte = b, Description = "Out of paper path 1", OutOfTickets = true },
                0x0B => new PrinterStatus { RawByte = b, Description = "Out of paper path 2", OutOfTickets = true },
                0x0C => new PrinterStatus { RawByte = b, Description = "Paper loaded path 1", IsReady = true },
                0x0D => new PrinterStatus { RawByte = b, Description = "Paper loaded path 2", IsReady = true },
                0x0E => new PrinterStatus { RawByte = b, Description = "Escrow jam",         TicketJam = true },
                0x0F => new PrinterStatus { RawByte = b, Description = "Low paper" },
                0x10 => new PrinterStatus { RawByte = b, Description = "Out of tickets",     OutOfTickets = true },
                0x11 => new PrinterStatus { RawByte = b, Description = "X-On (ready)",       IsReady = true },
                0x12 => new PrinterStatus { RawByte = b, Description = "Power on",           PowerOn = true, IsReady = true },
                0x13 => new PrinterStatus { RawByte = b, Description = "X-Off (busy)" },
                0x14 => new PrinterStatus { RawByte = b, Description = "Bad flash memory" },
                0x15 => new PrinterStatus { RawByte = b, Description = "Ticket NAK" },
                0x16 => new PrinterStatus { RawByte = b, Description = "Ticket taken",       IsReady = true },
                0x17 => new PrinterStatus { RawByte = b, Description = "Ticket waiting" },
                0x18 => new PrinterStatus { RawByte = b, Description = "Ticket jam",         TicketJam = true },
                0x19 => new PrinterStatus { RawByte = b, Description = "Illegal data" },
                0x1A => new PrinterStatus { RawByte = b, Description = "Powerup problem" },
                0x1C => new PrinterStatus { RawByte = b, Description = "Download error" },
                0x1D => new PrinterStatus { RawByte = b, Description = "Cutter jam",         CutterJam = true },
                0x1E => new PrinterStatus { RawByte = b, Description = "Stuck ticket",       TicketJam = true },
                0x1F => new PrinterStatus { RawByte = b, Description = "Cutter jam path 2",  CutterJam = true },
                // 0x41 is the S92 "all good" response — must be checked before the printable ASCII fallback
                0x41 => new PrinterStatus { RawByte = b, Description = "Good status (X-On)",  IsReady = true },
                _ when b >= 0x20 => new PrinterStatus { RawByte = b, Description = ((char)b).ToString() },
                _    => new PrinterStatus { RawByte = b, Description = $"Unknown (0x{b:X2})" }
            };
        }
    }
}
