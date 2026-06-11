using System;
using System.Drawing;
using System.IO;
using System.Text;
using BocaSystems.Sdk.Imaging;
using BocaSystems.Sdk.Models;

namespace BocaSystems.Sdk
{
    public partial class BocaPrinter
    {
        /// <summary>
        /// Send a 1-bit image file to the printer for immediate printing.
        /// The file must be in a format the printer supports (1-bit PNG, BMP, or PCX).
        /// </summary>
        public void PrintGraphicFile(string filePath, GraphicFormat format, int copies = 1)
        {
            byte[] fileData = File.ReadAllBytes(filePath);
            PrintGraphicBytes(fileData, format, copies);
        }

        /// <summary>Send raw graphic bytes for immediate printing.</summary>
        public void PrintGraphicBytes(byte[] imageData, GraphicFormat format, int copies = 1)
        {
            string tag = FormatTag(format);
            string prefix = $"<{tag}><G{imageData.Length}>";
            byte[] prefixBytes = Encoding.ASCII.GetBytes(prefix);
            byte[] suffix = Encoding.ASCII.GetBytes("<p>");

            byte[] packet = new byte[prefixBytes.Length + imageData.Length + suffix.Length];
            Buffer.BlockCopy(prefixBytes, 0, packet, 0, prefixBytes.Length);
            Buffer.BlockCopy(imageData, 0, packet, prefixBytes.Length, imageData.Length);
            Buffer.BlockCopy(suffix, 0, packet, prefixBytes.Length + imageData.Length, suffix.Length);

            for (int i = 0; i < copies; i++)
                SendRawBytes(packet, 0, packet.Length);
        }

        /// <summary>Print a graphic at a specific position on the ticket.</summary>
        public void PrintGraphicFileAt(int row, int column, string filePath, GraphicFormat format)
        {
            SetRowColumn(row, column);
            byte[] fileData = File.ReadAllBytes(filePath);
            string tag = FormatTag(format);
            string prefix = $"<{tag}><G{fileData.Length}>";
            byte[] prefixBytes = Encoding.ASCII.GetBytes(prefix);

            byte[] packet = new byte[prefixBytes.Length + fileData.Length];
            Buffer.BlockCopy(prefixBytes, 0, packet, 0, prefixBytes.Length);
            Buffer.BlockCopy(fileData, 0, packet, prefixBytes.Length, fileData.Length);

            SendRawBytes(packet, 0, packet.Length);
        }

        /// <summary>
        /// Download a graphic file into printer memory for later recall
        /// with PrintLogo.
        /// </summary>
        public void DownloadGraphicToMemory(string filePath, GraphicFormat format)
        {
            byte[] fileData = File.ReadAllBytes(filePath);
            DownloadGraphicToMemory(fileData, format);
        }

        /// <summary>Download graphic bytes into printer memory.</summary>
        public void DownloadGraphicToMemory(byte[] imageData, GraphicFormat format)
        {
            const byte ESC = 0x1B;
            string tag = FormatTag(format);
            string header = $"\x1B<{tag}><G{imageData.Length}>";
            byte[] headerBytes = Encoding.ASCII.GetBytes(header);

            byte[] packet = new byte[headerBytes.Length + imageData.Length + 1];
            Buffer.BlockCopy(headerBytes, 0, packet, 0, headerBytes.Length);
            Buffer.BlockCopy(imageData, 0, packet, headerBytes.Length, imageData.Length);
            packet[^1] = ESC;

            SendRawBytes(packet, 0, packet.Length);
        }

        /// <summary>Print a previously downloaded logo by slot number.</summary>
        public void PrintLogo(int logoId, int row, int column)
        {
            SendCommand($"<SP{row},{column}><LD{logoId}>");
        }

        /// <summary>Print a factory-preloaded (resident) logo.</summary>
        public void PrintResidentLogo(int logoId, int row, int column)
        {
            SendCommand($"<SP{row},{column}><LO{logoId}>");
        }

        /// <summary>
        /// Dither a full-color image to 1-bit and print it as a PNG graphic.
        /// </summary>
        public void PrintImage(Bitmap image, DitherAlgorithm algorithm = DitherAlgorithm.RiemersmaHilbert, float brightness = 1.0f)
        {
            byte[] pngBytes = Dither.Apply(image, algorithm, brightness);
            PrintGraphicBytes(pngBytes, GraphicFormat.Png);
        }

        /// <summary>Dither and print an image at a specific position.</summary>
        public void PrintImageAt(int row, int column, Bitmap image,
            DitherAlgorithm algorithm = DitherAlgorithm.RiemersmaHilbert, float brightness = 1.0f)
        {
            SetRowColumn(row, column);
            byte[] pngBytes = Dither.Apply(image, algorithm, brightness);
            string prefix = $"<png><G{pngBytes.Length}>";
            byte[] prefixBytes = Encoding.ASCII.GetBytes(prefix);
            byte[] packet = new byte[prefixBytes.Length + pngBytes.Length];
            Buffer.BlockCopy(prefixBytes, 0, packet, 0, prefixBytes.Length);
            Buffer.BlockCopy(pngBytes, 0, packet, prefixBytes.Length, pngBytes.Length);
            SendRawBytes(packet, 0, packet.Length);
        }

        private static string FormatTag(GraphicFormat format) => format switch
        {
            GraphicFormat.Png => "png",
            GraphicFormat.Bmp => "bmp",
            GraphicFormat.Pcx => "pcx",
            _ => "png"
        };
    }
}
