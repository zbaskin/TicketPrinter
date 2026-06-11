namespace BocaSystems.Sdk.Models
{
    /// <summary>Text rotation.</summary>
    public enum Rotation
    {
        Normal,
        Right,
        Inverted,
        Left
    }

    /// <summary>Barcode print orientation.</summary>
    public enum BarcodeOrientation
    {
        /// <summary>Bars run across the ticket width (horizontal bars).</summary>
        Ladder,
        /// <summary>Bars run along the ticket length (vertical bars).</summary>
        PicketFence
    }

    /// <summary>USB device mode for the printer's USB port.</summary>
    public enum UsbDeviceType
    {
        Hid,
        VirtualSerial
    }

    /// <summary>Image format for graphic data.</summary>
    public enum GraphicFormat
    {
        Png,
        Bmp,
        Pcx
    }

    /// <summary>Dithering algorithm for converting images to 1-bit.</summary>
    public enum DitherAlgorithm
    {
        OrderedBayer,
        FloydSteinberg,
        Stucki,
        ClusteredDot,
        BlueNoise,
        RiemersmaHilbert
    }
}
