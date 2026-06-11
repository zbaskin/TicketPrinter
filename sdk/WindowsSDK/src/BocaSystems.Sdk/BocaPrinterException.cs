using System;

namespace BocaSystems.Sdk
{
    /// <summary>
    /// Thrown when a printer operation fails. Check the inner exception
    /// for transport-level details when available.
    /// </summary>
    public class BocaPrinterException : Exception
    {
        public BocaPrinterException(string message) : base(message) { }
        public BocaPrinterException(string message, Exception inner) : base(message, inner) { }
    }
}
