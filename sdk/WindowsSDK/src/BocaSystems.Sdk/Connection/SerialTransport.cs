using System;
using System.IO.Ports;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace BocaSystems.Sdk.Connection
{
    /// <summary>
    /// Serial (COM) port transport. Default config is 115200/8N1 — the
    /// Boca factory default.
    /// </summary>
    public sealed class SerialTransport : IConnectionTransport
    {
        public const int DefaultBaudRate = 115200;
        private const int ReadBufferSize = 4096;

        private readonly SerialPort _port;
        private bool _disposed;

        public SerialTransport(
            string portName,
            int baudRate = DefaultBaudRate,
            Parity parity = Parity.None,
            int dataBits = 8,
            StopBits stopBits = StopBits.One)
        {
            _port = new SerialPort(portName, baudRate, parity, dataBits, stopBits)
            {
                ReadTimeout  = 2000,
                WriteTimeout = 2000
            };

            try
            {
                _port.Open();
            }
            catch (Exception ex)
            {
                throw new BocaPrinterException(
                    $"Could not open serial port '{portName}': {ex.Message}", ex);
            }
        }

        public bool IsConnected => _port.IsOpen && !_disposed;

        public void WriteString(string data)
        {
            ThrowIfDisposed();
            if (!_port.IsOpen) throw new BocaPrinterException("Serial port is not open.");
            _port.Write(data);
        }

        public void WriteBytes(byte[] data, int offset, int count)
        {
            ThrowIfDisposed();
            if (!_port.IsOpen) throw new BocaPrinterException("Serial port is not open.");
            _port.Write(data, offset, count);
        }

        public async Task<byte[]> ReadBytesAsync(int bufferSize, CancellationToken ct = default)
        {
            ThrowIfDisposed();
            if (!_port.IsOpen) throw new BocaPrinterException("Serial port is not open.");

            byte[] buffer = new byte[Math.Min(bufferSize, ReadBufferSize)];
            int bytesRead = await _port.BaseStream.ReadAsync(buffer, 0, buffer.Length, ct);
            if (bytesRead < buffer.Length)
                Array.Resize(ref buffer, bytesRead);
            return buffer;
        }

        public void Close() => Dispose();

        public void Dispose()
        {
            if (_disposed) return;
            _disposed = true;
            if (_port.IsOpen)
                _port.Close();
            _port.Dispose();
            GC.SuppressFinalize(this);
        }

        private void ThrowIfDisposed()
        {
            if (_disposed) throw new ObjectDisposedException(nameof(SerialTransport));
        }
    }
}
