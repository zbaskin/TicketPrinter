using BocaSystems.Sdk.Models;

namespace BocaSystems.Sdk
{
    public partial class BocaPrinter
    {
        /// <summary>Move the cursor to an absolute row/column position (in dots).</summary>
        public void SetRowColumn(int row, int column)
        {
            SendCommand($"<RC{row},{column}>");
        }

        /// <summary>
        /// Set the starting point for a logo or graphic. Same coordinates as
        /// SetRowColumn but uses the SP command required before LD (print logo).
        /// </summary>
        public void SetStartPoint(int row, int column)
        {
            SendCommand($"<SP{row},{column}>");
        }

        /// <summary>Select a built-in FGL bitmap font (1-16).</summary>
        public void SetFont(int fontNumber)
        {
            if (fontNumber < 1 || fontNumber > 16)
                throw new BocaPrinterException($"Font number must be 1-16, got {fontNumber}.");
            SendCommand($"<F{fontNumber}>");
        }

        /// <summary>
        /// Select a resident TrueType font. Needs firmware FGL46D1+ and the
        /// matching SB font file on the printer.
        /// </summary>
        public void SetTrueTypeFont(int fontId, int pointSize)
        {
            if (fontId < 1 || fontId > 10)
                throw new BocaPrinterException($"TrueType font ID must be 1-10, got {fontId}.");
            SendCommand($"<RTF{fontId},{pointSize}>");
        }

        /// <summary>
        /// Multiply character height and width. (1,1) is normal.
        /// Max 16x16 for soft fonts.
        /// </summary>
        public void SetHeightWidth(int height, int width)
        {
            SendCommand($"<HW{height},{width}>");
        }

        /// <summary>
        /// Override the character cell size. The gap between characters is
        /// (box width - font width).
        /// </summary>
        public void SetBoxSize(int width, int height)
        {
            SendCommand($"<BS{width},{height}>");
        }

        /// <summary>
        /// Scale the font down by a divisor. Can combine with SetHeightWidth
        /// for fractional sizes — e.g. HW(2,2) then SD(3) gives 2/3 scale.
        /// </summary>
        public void SetScaleDown(int divisor)
        {
            if (divisor < 1)
                throw new BocaPrinterException("Scale-down divisor must be >= 1.");
            SendCommand($"<SD{divisor}>");
        }

        /// <summary>Set text rotation for all subsequent characters.</summary>
        public void SetRotation(Rotation rotation)
        {
            string cmd = rotation switch
            {
                Rotation.Normal   => "<NR>",
                Rotation.Right    => "<RR>",
                Rotation.Inverted => "<RU>",
                Rotation.Left     => "<RL>",
                _ => "<NR>"
            };
            SendCommand(cmd);
        }

        /// <summary>Enable white-on-black printing. Call DisableInverse to stop.</summary>
        public void EnableInverse()  => SendCommand("<EI>");

        /// <summary>Return to normal (black-on-white) printing.</summary>
        public void DisableInverse() => SendCommand("<DI>");

        /// <summary>
        /// Print text centered within a field of the given width (in dots).
        /// The text must be passed here — FGL requires it tilde-delimited
        /// immediately after the CTR command.
        /// </summary>
        public void PrintCenteredText(int fieldWidth, string text)
        {
            SendCommand($"<CTR{fieldWidth}>~{text}~");
        }

        /// <summary>
        /// Print text right-justified within a field of the given width (in dots).
        /// Needs firmware FGL44G77+ / FGL46G77+ / FGL46M59+ / FGL46N21+.
        /// </summary>
        public void PrintRightJustifiedText(int fieldWidth, string text)
        {
            SendCommand($"<RTJ{fieldWidth}>~{text}~");
        }

        /// <summary>Send literal text to the printer at the current cursor position.</summary>
        public void PrintText(string text)
        {
            SendCommand(text);
        }

        /// <summary>Position, font, and print text in one call.</summary>
        public void PrintTextAt(int row, int column, string text, int font = 3)
        {
            SendCommand($"<RC{row},{column}><F{font}>{text}");
        }

        /// <summary>Position, font, rotation, size, and text in one call.</summary>
        public void PrintTextAt(int row, int column, string text,
            int font, Rotation rotation, int heightMultiplier = 1, int widthMultiplier = 1)
        {
            string rot = rotation switch
            {
                Rotation.Normal   => "<NR>",
                Rotation.Right    => "<RR>",
                Rotation.Inverted => "<RU>",
                Rotation.Left     => "<RL>",
                _ => "<NR>"
            };
            SendCommand($"<RC{row},{column}>{rot}<HW{heightMultiplier},{widthMultiplier}><F{font}>{text}");
        }
    }
}
