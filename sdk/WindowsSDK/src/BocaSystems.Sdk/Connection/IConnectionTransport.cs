using System;
using System.Threading;
using System.Threading.Tasks;

namespace BocaSystems.Sdk.Connection
{
    /// <summary>
    /// Common interface for all printer connections (Serial, TCP, HID).
    /// Implement this for custom transports.
    /// </summary>
    public interface IConnectionTransport : IDisposable
    {
        bool IsConnected { get; }
        void WriteString(string data);
        void WriteBytes(byte[] data, int offset, int count);
        Task<byte[]> ReadBytesAsync(int bufferSize, CancellationToken ct = default);
        void Close();
    }
}
