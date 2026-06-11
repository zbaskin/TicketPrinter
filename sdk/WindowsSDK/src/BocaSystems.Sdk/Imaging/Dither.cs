using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;
using BocaSystems.Sdk.Models;

namespace BocaSystems.Sdk.Imaging
{
    /// <summary>
    /// Image dithering for thermal printers. Converts a full-color Bitmap
    /// into a 1-bit (black and white) image suitable for FGL graphic commands.
    ///
    /// Thermal printers can only print black or not-print — there are no
    /// gray levels. Dithering simulates shading by varying the density
    /// of black dots. Different algorithms produce different visual effects;
    /// Riemersma/Hilbert is the default because it works well across a wide
    /// range of source images.
    /// </summary>
    public static class Dither
    {
        /// <summary>
        /// Apply the selected dithering algorithm and return the result
        /// as PNG bytes ready to send to the printer.
        /// </summary>
        public static byte[] Apply(Bitmap source, DitherAlgorithm algorithm, float brightness = 1.0f)
        {
            return algorithm switch
            {
                DitherAlgorithm.OrderedBayer     => GetOrderedBayerPngBytes(source, brightness),
                DitherAlgorithm.FloydSteinberg   => GetFloydSteinbergPngBytes(source, brightness),
                DitherAlgorithm.Stucki           => GetStuckiPngBytes(source, brightness),
                DitherAlgorithm.ClusteredDot     => GetClusteredDot4x4PngBytes(source, brightness),
                DitherAlgorithm.BlueNoise        => GetBlueNoisePngBytes(source),
                DitherAlgorithm.RiemersmaHilbert => GetRiemersmaHilbertPngBytes(source, brightness),
                _ => GetRiemersmaHilbertPngBytes(source, brightness)
            };
        }

        // ─────────────────────────────────────────────────────────────────
        // The dithering implementations below convert the source image to
        // a grayscale luminance buffer, apply the algorithm, then pack the
        // result into a 1-bpp indexed Bitmap and export as PNG bytes.
        // ─────────────────────────────────────────────────────────────────

        #region Luminance conversion

        private static float[,] ToLumaBuffer(Bitmap bmp, float brightnessScale = 1.0f)
        {
            int w = bmp.Width, h = bmp.Height;
            float[,] luma = new float[h, w];

            // Lock bits for fast pixel access.
            var rect = new Rectangle(0, 0, w, h);
            BitmapData? bmpData = null;
            try
            {
                bmpData = bmp.LockBits(rect, ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
                unsafe
                {
                    byte* scan0 = (byte*)bmpData.Scan0;
                    int stride = bmpData.Stride;
                    for (int y = 0; y < h; y++)
                    {
                        byte* row = scan0 + y * stride;
                        for (int x = 0; x < w; x++)
                        {
                            byte b = row[x * 4 + 0];
                            byte g = row[x * 4 + 1];
                            byte r = row[x * 4 + 2];
                            byte a = row[x * 4 + 3];

                            // Composite alpha onto white background.
                            float af = a / 255f;
                            float rb = r * af + 255 * (1 - af);
                            float gb = g * af + 255 * (1 - af);
                            float bb = b * af + 255 * (1 - af);

                            float l = 0.299f * rb + 0.587f * gb + 0.114f * bb;
                            luma[y, x] = Clamp255(l * brightnessScale);
                        }
                    }
                }
            }
            finally
            {
                if (bmpData != null) bmp.UnlockBits(bmpData);
            }
            return luma;
        }

        #endregion

        #region Pack to 1bpp

        private static Bitmap PackTo1Bpp(float[,] buf)
        {
            int h = buf.GetLength(0), w = buf.GetLength(1);
            var bmp = new Bitmap(w, h, PixelFormat.Format1bppIndexed);

            // Boca thermal printers treat bit=0 as "print a dot" in 1bpp images.
            // Palette index 0 = black (print), index 1 = white (paper).
            // Dark pixels (luma < 128) stay at bit=0; light pixels get bit=1.
            var pal = bmp.Palette;
            pal.Entries[0] = Color.Black;
            pal.Entries[1] = Color.White;
            bmp.Palette = pal;

            var rect = new Rectangle(0, 0, w, h);
            var data = bmp.LockBits(rect, ImageLockMode.WriteOnly, PixelFormat.Format1bppIndexed);
            try
            {
                unsafe
                {
                    byte* scan0 = (byte*)data.Scan0;
                    int stride = data.Stride;
                    for (int y = 0; y < h; y++)
                    {
                        byte* row = scan0 + y * stride;
                        for (int x = 0; x < w; x++)
                        {
                            // bit=0 → palette[0] (black/print), bit=1 → palette[1] (white/paper)
                            // Set bit for light pixels so they map to white (no print).
                            if (buf[y, x] >= 128f)
                                row[x >> 3] |= (byte)(0x80 >> (x & 7));
                        }
                    }
                }
            }
            finally
            {
                bmp.UnlockBits(data);
            }
            return bmp;
        }

        private static byte[] ToPngBytes(Bitmap bmp1bpp)
        {
            using var ms = new MemoryStream();
            bmp1bpp.Save(ms, ImageFormat.Png);
            return ms.ToArray();
        }

        #endregion

        #region Ordered Bayer dithering

        public static byte[] GetOrderedBayerPngBytes(Bitmap src, float brightness = 1.0f)
        {
            int size = 16;
            float[,] thresholds = GenerateBayerThresholds(size);
            float[,] luma = ToLumaBuffer(src, brightness);
            int h = luma.GetLength(0), w = luma.GetLength(1);

            float[,] result = new float[h, w];
            for (int y = 0; y < h; y++)
                for (int x = 0; x < w; x++)
                    result[y, x] = luma[y, x] > thresholds[y % size, x % size] ? 255f : 0f;

            using var bmp = PackTo1Bpp(result);
            return ToPngBytes(bmp);
        }

        private static float[,] GenerateBayerThresholds(int size)
        {
            int[,] indices = GenerateBayerIndex(size);
            float[,] thresholds = new float[size, size];
            int n2 = size * size;
            for (int y = 0; y < size; y++)
                for (int x = 0; x < size; x++)
                    thresholds[y, x] = (indices[y, x] + 0.5f) / n2 * 255f;
            return thresholds;
        }

        private static int[,] GenerateBayerIndex(int size)
        {
            if (size == 2)
                return new int[,] { { 0, 2 }, { 3, 1 } };

            int half = size / 2;
            int[,] smaller = GenerateBayerIndex(half);
            int[,] result = new int[size, size];
            for (int y = 0; y < size; y++)
                for (int x = 0; x < size; x++)
                {
                    int sy = y % half, sx = x % half;
                    int quadrant = (y / half) * 2 + (x / half);
                    int offset = quadrant switch { 0 => 0, 1 => 2, 2 => 3, _ => 1 };
                    result[y, x] = 4 * smaller[sy, sx] + offset;
                }
            return result;
        }

        #endregion

        #region Floyd-Steinberg dithering

        public static byte[] GetFloydSteinbergPngBytes(Bitmap src, float brightness = 1.0f, float threshold = 128f)
        {
            float[,] luma = ToLumaBuffer(src, brightness);
            int h = luma.GetLength(0), w = luma.GetLength(1);

            for (int y = 0; y < h; y++)
            {
                for (int x = 0; x < w; x++)
                {
                    float old = luma[y, x];
                    float val = old > threshold ? 255f : 0f;
                    float err = old - val;
                    luma[y, x] = val;

                    if (x + 1 < w)          luma[y, x + 1]     = Clamp255(luma[y, x + 1] + err * 7f / 16f);
                    if (y + 1 < h)
                    {
                        if (x - 1 >= 0)     luma[y + 1, x - 1] = Clamp255(luma[y + 1, x - 1] + err * 3f / 16f);
                                             luma[y + 1, x]     = Clamp255(luma[y + 1, x] + err * 5f / 16f);
                        if (x + 1 < w)      luma[y + 1, x + 1] = Clamp255(luma[y + 1, x + 1] + err * 1f / 16f);
                    }
                }
            }

            using var bmp = PackTo1Bpp(luma);
            return ToPngBytes(bmp);
        }

        #endregion

        #region Stucki dithering

        public static byte[] GetStuckiPngBytes(Bitmap src, float brightness = 1.0f, float threshold = 128f)
        {
            float[,] luma = ToLumaBuffer(src, brightness);
            int h = luma.GetLength(0), w = luma.GetLength(1);

            for (int y = 0; y < h; y++)
            {
                for (int x = 0; x < w; x++)
                {
                    float old = luma[y, x];
                    float val = old > threshold ? 255f : 0f;
                    float err = old - val;
                    luma[y, x] = val;

                    // Stucki 5x3 kernel (weights sum to 42)
                    void Spread(int dy, int dx, float weight)
                    {
                        int ny = y + dy, nx = x + dx;
                        if (ny >= 0 && ny < h && nx >= 0 && nx < w)
                            luma[ny, nx] = Clamp255(luma[ny, nx] + err * weight / 42f);
                    }

                    Spread(0, 1, 8); Spread(0, 2, 4);
                    Spread(1, -2, 2); Spread(1, -1, 4); Spread(1, 0, 8); Spread(1, 1, 4); Spread(1, 2, 2);
                    Spread(2, -2, 1); Spread(2, -1, 2); Spread(2, 0, 4); Spread(2, 1, 2); Spread(2, 2, 1);
                }
            }

            using var bmp = PackTo1Bpp(luma);
            return ToPngBytes(bmp);
        }

        #endregion

        #region Clustered dot 4x4

        private static readonly float[,] ClusteredDot4x4Matrix = {
            { 12, 5, 6, 13 },
            {  4, 0, 1,  7 },
            { 11, 3, 2,  8 },
            { 15,10, 9, 14 }
        };

        public static byte[] GetClusteredDot4x4PngBytes(Bitmap src, float brightness = 1.0f)
        {
            float[,] luma = ToLumaBuffer(src, brightness);
            int h = luma.GetLength(0), w = luma.GetLength(1);
            float[,] result = new float[h, w];

            for (int y = 0; y < h; y++)
                for (int x = 0; x < w; x++)
                {
                    float thr = (ClusteredDot4x4Matrix[y % 4, x % 4] + 0.5f) / 16f * 255f;
                    result[y, x] = luma[y, x] > thr ? 255f : 0f;
                }

            using var bmp = PackTo1Bpp(result);
            return ToPngBytes(bmp);
        }

        #endregion

        #region Blue noise

        private static readonly float[,] BlueNoise8x8 = {
            { 24, 10, 12, 26, 56, 42, 44, 58 },
            {  8,  0,  2, 14, 40, 32, 34, 46 },
            { 22,  6,  4, 16, 54, 38, 36, 48 },
            { 28, 20, 18, 30, 60, 52, 50, 62 },
            { 55, 41, 43, 57, 25, 11, 13, 27 },
            { 39, 31, 33, 45,  9,  1,  3, 15 },
            { 53, 37, 35, 47, 23,  7,  5, 17 },
            { 59, 51, 49, 61, 29, 21, 19, 31 }
        };

        public static byte[] GetBlueNoisePngBytes(Bitmap src)
        {
            float[,] luma = ToLumaBuffer(src);
            int h = luma.GetLength(0), w = luma.GetLength(1);
            float[,] result = new float[h, w];

            for (int y = 0; y < h; y++)
                for (int x = 0; x < w; x++)
                {
                    float thr = (BlueNoise8x8[y % 8, x % 8] + 0.5f) / 64f * 255f;
                    result[y, x] = luma[y, x] > thr ? 255f : 0f;
                }

            using var bmp = PackTo1Bpp(result);
            return ToPngBytes(bmp);
        }

        #endregion

        #region Riemersma (Hilbert curve) dithering

        public static byte[] GetRiemersmaHilbertPngBytes(Bitmap src, float brightness = 1.6f, float threshold = 128f)
        {
            float[,] luma = ToLumaBuffer(src, brightness);
            int h = luma.GetLength(0), w = luma.GetLength(1);

            // Determine Hilbert order: smallest power of 2 >= max(w,h)
            int order = 1;
            int size = 2;
            while (size < Math.Max(w, h)) { size *= 2; order++; }

            // Error queue for Riemersma diffusion along the curve
            const int QueueLen = 16;
            float[] weights = new float[QueueLen];
            float[] errors = new float[QueueLen];
            int head = 0;
            float wSum = 0;
            for (int i = 0; i < QueueLen; i++)
            {
                weights[i] = MathF.Exp(-i * 0.3f);
                wSum += weights[i];
            }
            for (int i = 0; i < QueueLen; i++)
                weights[i] /= wSum;

            void ProcessPixel(int x, int y)
            {
                if (x >= w || y >= h) return;
                float correction = 0;
                for (int i = 0; i < QueueLen; i++)
                    correction += errors[(head + i) % QueueLen] * weights[i];

                float old = Clamp255(luma[y, x] + correction);
                float val = old > threshold ? 255f : 0f;
                errors[head] = old - val;
                head = (head + 1) % QueueLen;
                luma[y, x] = val;
            }

            // Walk the Hilbert curve
            HilbertWalk(size, ProcessPixel);

            using var bmp = PackTo1Bpp(luma);
            return ToPngBytes(bmp);
        }

        private static void HilbertWalk(int size, Action<int, int> visit)
        {
            // Iterative Hilbert curve: maps distance d to (x,y) in [0, size).
            // Guarantees all coordinates are non-negative.
            long total = (long)size * size;
            for (long d = 0; d < total; d++)
            {
                int x = 0, y = 0;
                long t = d;
                for (int s = 1; s < size; s *= 2)
                {
                    int rx = 1 & (int)(t / 2);
                    int ry = 1 & ((int)t ^ rx);
                    if (ry == 0)
                    {
                        if (rx == 1) { x = s - 1 - x; y = s - 1 - y; }
                        int tmp = x; x = y; y = tmp;
                    }
                    x += s * rx;
                    y += s * ry;
                    t /= 4;
                }
                visit(x, y);
            }
        }

        #endregion

        private static float Clamp255(float v) => v < 0 ? 0 : v > 255 ? 255 : v;
    }
}
