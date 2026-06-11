namespace BocaSystems.Sdk
{
    public partial class BocaPrinter
    {
        /// <summary>
        /// Set line thickness (in dots) for the next draw command.
        /// Resets to 1 after each draw. Must be called right before the draw.
        /// </summary>
        public void SetLineThickness(int dots)
        {
            if (dots < 1)
                throw new BocaPrinterException("Line thickness must be >= 1.");
            SendCommand($"<LT{dots}>");
        }

        /// <summary>Draw a box at the current cursor position.</summary>
        public void DrawBox(int height, int width)
        {
            SendCommand($"<BX{height},{width}>");
        }

        /// <summary>Draw a box at a specific position.</summary>
        public void DrawBoxAt(int row, int column, int height, int width, int thickness = 1)
        {
            SetRowColumn(row, column);
            if (thickness > 1) SetLineThickness(thickness);
            DrawBox(height, width);
        }

        /// <summary>Draw a vertical line downward from the current position.</summary>
        public void DrawVerticalLine(int length)
        {
            SendCommand($"<VX{length}>");
        }

        /// <summary>Draw a horizontal line to the right from the current position.</summary>
        public void DrawHorizontalLine(int length)
        {
            SendCommand($"<HX{length}>");
        }

        /// <summary>Draw a vertical line at a specific position.</summary>
        public void DrawVerticalLineAt(int row, int column, int length, int thickness = 1)
        {
            SetRowColumn(row, column);
            if (thickness > 1) SetLineThickness(thickness);
            DrawVerticalLine(length);
        }

        /// <summary>Draw a horizontal line at a specific position.</summary>
        public void DrawHorizontalLineAt(int row, int column, int length, int thickness = 1)
        {
            SetRowColumn(row, column);
            if (thickness > 1) SetLineThickness(thickness);
            DrawHorizontalLine(length);
        }

        /// <summary>Select a shading pattern by number.</summary>
        public void SetShadingPattern(int patternNumber)
        {
            SendCommand($"<PA{patternNumber}>");
        }

        /// <summary>Apply shading in the foreground (on top of content).</summary>
        public void SetShadingForeground() => SendCommand("<PAF>");

        /// <summary>Apply shading in the background (behind content).</summary>
        public void SetShadingBackground() => SendCommand("<PAB>");

        /// <summary>Start shading all subsequent content.</summary>
        public void EnableShading() => SendCommand("<ES>");

        /// <summary>Stop shading.</summary>
        public void DisableShading() => SendCommand("<DS>");
    }
}
