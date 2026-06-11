using System;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using BocaSystems.Sdk.Connection;

namespace BocaSystems.Sdk
{
    /// <summary>
    /// Controls a Boca Systems FGL thermal printer.
    ///
    /// Open a connection with one of the static Connect* methods, then call
    /// command methods to build and print tickets. Each method sends its FGL
    /// command immediately — nothing is buffered or reordered.
    ///
    /// Partial class files:
    ///   .Text.cs      — fonts, rotation, positioning
    ///   .Barcode.cs   — 1D and 2D barcodes
    ///   .Drawing.cs   — boxes, lines, shading
    ///   .Status.cs    — status queries
    ///   .Ticket.cs    — print, cut, repeat, hold
    ///   .Config.cs    — hardware settings
    ///   .Graphics.cs  — images and logo download
    /// </summary>
    public partial class BocaPrinter : IDisposable
    {
        private readonly IConnectionTransport _transport;
        private readonly SemaphoreSlim _writeLock = new(1, 1);
        private const int WriteLockTimeoutMs = 30_000;
        private bool _disposed;

        /// <summary>Wrap an already-opened transport.</summary>
        public BocaPrinter(IConnectionTransport transport)
        {
            _transport = transport ?? throw new ArgumentNullException(nameof(transport));
        }

        /// <summary>Connect over a serial (COM) port.</summary>
        public static BocaPrinter ConnectSerial(
            string portName,
            int baudRate = SerialTransport.DefaultBaudRate)
        {
            return new BocaPrinter(new SerialTransport(portName, baudRate));
        }

        /// <summary>Connect over TCP/Ethernet.</summary>
        public static BocaPrinter ConnectTcp(
            string ipAddress,
            int port = TcpTransport.DefaultPort)
        {
            return new BocaPrinter(new TcpTransport(ipAddress, port));
        }

        /// <summary>
        /// Connect to a printer in USB-HID mode. Auto-detects the first Boca
        /// HID device if no path is given.
        /// </summary>
        public static BocaPrinter ConnectHid(string? devicePath = null)
        {
            if (devicePath == null)
            {
                devicePath = HidTransport.FindBocaDevice();
                if (devicePath == null)
                    throw new BocaPrinterException(
                        "No Boca HID device found. Check that the printer is " +
                        "connected, powered on, and in HID mode (set with <usbh>).");
            }
            return new BocaPrinter(new HidTransport(devicePath));
        }

        /// <summary>Whether the transport is still connected.</summary>
        public bool IsConnected => !_disposed && _transport.IsConnected;

        /// <summary>Close the connection. Same as Dispose().</summary>
        public void Disconnect() => Dispose();

        /// <summary>
        /// Send an FGL command string. Thread-safe.
        /// </summary>
        public void SendCommand(string fglCommand)
        {
            ThrowIfDisposed();
            if (!_writeLock.Wait(WriteLockTimeoutMs))
                throw new BocaPrinterException(
                    "Timed out waiting for printer write lock. " +
                    "A previous operation may be stuck. Try resetting the printer.");
            try
            {
                _transport.WriteString(fglCommand);
            }
            finally
            {
                _writeLock.Release();
            }
        }

        /// <summary>
        /// Send raw bytes (graphic data, firmware blobs). Thread-safe.
        /// </summary>
        public void SendRawBytes(byte[] data, int offset, int count)
        {
            ThrowIfDisposed();
            if (!_writeLock.Wait(WriteLockTimeoutMs))
                throw new BocaPrinterException(
                    "Timed out waiting for printer write lock. " +
                    "A previous operation may be stuck. Try resetting the printer.");
            try
            {
                _transport.WriteBytes(data, offset, count);
            }
            finally
            {
                _writeLock.Release();
            }
        }

        /// <summary>Read raw bytes from the printer (status responses, etc).</summary>
        public Task<byte[]> ReadAsync(int bufferSize = 1024, CancellationToken ct = default)
        {
            ThrowIfDisposed();
            return _transport.ReadBytesAsync(bufferSize, ct);
        }

        public void Dispose()
        {
            if (_disposed) return;
            _disposed = true;
            _transport.Close();
            _transport.Dispose();
            _writeLock.Dispose();
            GC.SuppressFinalize(this);
        }

        /// <summary>True when connected via HID transport.</summary>
        public bool IsHidConnection => _transport is Connection.HidTransport;

        private void ThrowIfDisposed()
        {
            if (_disposed) throw new ObjectDisposedException(nameof(BocaPrinter));
        }
    }
}
