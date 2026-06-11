using System;
using System.Collections.Generic;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using BocaSystems.Sdk.Connection;

namespace BocaSystems.Sdk.Tests
{
    /// <summary>
    /// Fake transport that captures sent data. Tests use this to verify FGL
    /// output without a physical printer.
    /// </summary>
    internal class MockTransport : IConnectionTransport
    {
        private readonly List<byte[]> _sentBytes = new();
        private readonly List<string> _sentStrings = new();
        private byte[] _nextReadResponse = Array.Empty<byte>();
        private bool _connected = true;
        private bool _disposed;

        public bool IsConnected => _connected && !_disposed;

        public IReadOnlyList<string> SentStrings => _sentStrings;
        public IReadOnlyList<byte[]> SentBytes => _sentBytes;

        public string LastCommand => _sentStrings.Count > 0
            ? _sentStrings[^1]
            : throw new InvalidOperationException("Nothing has been sent yet.");

        public string AllCommands => string.Join("", _sentStrings);

        public void StageReadResponse(byte[] data) => _nextReadResponse = data;
        public void StageReadResponse(string text)
            => _nextReadResponse = Encoding.ASCII.GetBytes(text);

        public void WriteString(string data)
        {
            ThrowIfDisposed();
            _sentStrings.Add(data);
            _sentBytes.Add(Encoding.ASCII.GetBytes(data));
        }

        public void WriteBytes(byte[] data, int offset, int count)
        {
            ThrowIfDisposed();
            byte[] copy = new byte[count];
            Buffer.BlockCopy(data, offset, copy, 0, count);
            _sentBytes.Add(copy);
        }

        public Task<byte[]> ReadBytesAsync(int bufferSize, CancellationToken ct = default)
        {
            ThrowIfDisposed();
            var result = _nextReadResponse;
            _nextReadResponse = Array.Empty<byte>();
            return Task.FromResult(result);
        }

        public void SimulateDisconnect() => _connected = false;

        public void Close() => Dispose();

        public void Dispose()
        {
            _disposed = true;
            _connected = false;
        }

        public void Reset()
        {
            _sentStrings.Clear();
            _sentBytes.Clear();
            _nextReadResponse = Array.Empty<byte>();
        }

        private void ThrowIfDisposed()
        {
            if (_disposed) throw new ObjectDisposedException(nameof(MockTransport));
        }
    }
}
