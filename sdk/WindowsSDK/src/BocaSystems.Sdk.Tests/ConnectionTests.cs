using System;
using BocaSystems.Sdk;
using Xunit;

namespace BocaSystems.Sdk.Tests
{
    public class ConnectionTests
    {
        [Fact]
        public void Constructor_requires_non_null_transport()
        {
            Assert.Throws<ArgumentNullException>(() => new BocaPrinter(null!));
        }

        [Fact]
        public void IsConnected_reflects_transport_state()
        {
            var mock = new MockTransport();
            using var p = new BocaPrinter(mock);

            Assert.True(p.IsConnected);
            mock.SimulateDisconnect();
            Assert.False(p.IsConnected);
        }

        [Fact]
        public void Disconnect_disposes_transport()
        {
            var mock = new MockTransport();
            var p = new BocaPrinter(mock);

            p.Disconnect();

            Assert.False(p.IsConnected);
            Assert.Throws<ObjectDisposedException>(() => p.SendCommand("test"));
        }

        [Fact]
        public void Double_dispose_does_not_throw()
        {
            var mock = new MockTransport();
            var p = new BocaPrinter(mock);
            p.Dispose();
            p.Dispose(); // should not throw
        }

        [Fact]
        public void SendCommand_after_dispose_throws()
        {
            var mock = new MockTransport();
            var p = new BocaPrinter(mock);
            p.Dispose();

            Assert.Throws<ObjectDisposedException>(() => p.SendCommand("<p>"));
        }

        [Fact]
        public void SendRawBytes_works()
        {
            var mock = new MockTransport();
            using var p = new BocaPrinter(mock);

            byte[] data = { 0x01, 0x02, 0xFF, 0x80 };
            p.SendRawBytes(data, 0, data.Length);

            Assert.Single(mock.SentBytes);
            Assert.Equal(data, mock.SentBytes[0]);
        }

        [Fact]
        public void SendRawBytes_preserves_high_bytes()
        {
            // This is the regression test for the old SDK's binary corruption bug.
            // Bytes > 127 must survive the round-trip through the transport.
            var mock = new MockTransport();
            using var p = new BocaPrinter(mock);

            byte[] data = new byte[256];
            for (int i = 0; i < 256; i++) data[i] = (byte)i;

            p.SendRawBytes(data, 0, data.Length);

            Assert.Equal(256, mock.SentBytes[0].Length);
            for (int i = 0; i < 256; i++)
                Assert.Equal((byte)i, mock.SentBytes[0][i]);
        }
    }
}
