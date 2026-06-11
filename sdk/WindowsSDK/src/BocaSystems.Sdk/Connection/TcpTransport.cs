using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.NetworkInformation;
using System.Net.Sockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace BocaSystems.Sdk.Connection
{
    /// <summary>
    /// TCP/Ethernet transport. Default port 9100 per FGL46 spec (raw TCP).
    /// </summary>
    public sealed class TcpTransport : IConnectionTransport
    {
        public const int DefaultPort = 9100;
        private const int ReadBufferSize = 4096;

        private readonly TcpClient _client;
        private readonly NetworkStream _stream;
        private bool _disposed;

        public TcpTransport(string ipAddress, int port = DefaultPort)
        {
            _client = new TcpClient();
            try
            {
                _client.Connect(ipAddress, port);
            }
            catch (Exception ex)
            {
                _client.Dispose();
                throw new BocaPrinterException(
                    $"Could not connect to printer at {ipAddress}:{port} — {ex.Message}", ex);
            }

            _stream = _client.GetStream();
            _stream.ReadTimeout  = 2000;
            _stream.WriteTimeout = 2000;
        }

        public bool IsConnected => _client.Connected && !_disposed;

        public void WriteString(string data)
        {
            byte[] bytes = Encoding.ASCII.GetBytes(data);
            WriteBytes(bytes, 0, bytes.Length);
        }

        public void WriteBytes(byte[] data, int offset, int count)
        {
            ThrowIfDisposed();
            if (!_client.Connected)
                throw new BocaPrinterException("TCP connection is closed.");
            _stream.Write(data, offset, count);
        }

        public async Task<byte[]> ReadBytesAsync(int bufferSize, CancellationToken ct = default)
        {
            ThrowIfDisposed();
            if (!_client.Connected)
                throw new BocaPrinterException("TCP connection is closed.");

            byte[] buffer = new byte[Math.Min(bufferSize, ReadBufferSize)];
            int bytesRead = await _stream.ReadAsync(buffer, 0, buffer.Length, ct);
            if (bytesRead < buffer.Length)
                Array.Resize(ref buffer, bytesRead);
            return buffer;
        }

        public void Close() => Dispose();

        public void Dispose()
        {
            if (_disposed) return;
            _disposed = true;
            _stream?.Dispose();
            _client?.Dispose();
            GC.SuppressFinalize(this);
        }

        private void ThrowIfDisposed()
        {
            if (_disposed) throw new ObjectDisposedException(nameof(TcpTransport));
        }

        /// <summary>
        /// Scan the local subnet(s) for Boca printers listening on the raw TCP port.
        /// Returns a list of "IP:port" strings for each printer found.
        /// </summary>
        public static async Task<List<string>> ScanForPrintersAsync(
            int port = DefaultPort,
            int timeoutMs = 200,
            CancellationToken ct = default,
            Action<string>? progress = null)
        {
            var results = new List<string>();
            var subnets = GetLocalSubnets();

            foreach (var (baseIp, mask) in subnets)
            {
                uint network = IpToUint(baseIp) & IpToUint(mask);
                uint broadcast = network | ~IpToUint(mask);
                int hostCount = (int)(broadcast - network - 1);

                // Skip subnets larger than /16 (65534 hosts) — too slow
                if (hostCount > 65534 || hostCount <= 0) continue;

                progress?.Invoke($"Scanning {baseIp}/{MaskToCidr(mask)} ({hostCount} hosts)...");

                // Scan in batches to avoid socket exhaustion
                const int batchSize = 64;
                for (int i = 0; i < hostCount && !ct.IsCancellationRequested; i += batchSize)
                {
                    var tasks = new List<Task<string?>>();
                    int end = Math.Min(i + batchSize, hostCount);

                    for (int j = i; j < end; j++)
                    {
                        uint hostIp = network + (uint)j + 1;
                        string ip = UintToIp(hostIp);
                        tasks.Add(ProbeAsync(ip, port, timeoutMs, ct));
                    }

                    var batch = await Task.WhenAll(tasks);
                    foreach (var r in batch)
                    {
                        if (r != null)
                            results.Add(r);
                    }
                }
            }

            return results;
        }

        private static async Task<string?> ProbeAsync(
            string ip, int port, int timeoutMs, CancellationToken ct)
        {
            try
            {
                using var client = new TcpClient();
                using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
                cts.CancelAfter(timeoutMs);
                await client.ConnectAsync(ip, port, cts.Token);
                return $"{ip}:{port}";
            }
            catch
            {
                return null;
            }
        }

        private static List<(string ip, string mask)> GetLocalSubnets()
        {
            var result = new List<(string, string)>();
            foreach (var nic in NetworkInterface.GetAllNetworkInterfaces())
            {
                if (nic.OperationalStatus != OperationalStatus.Up) continue;
                if (nic.NetworkInterfaceType == NetworkInterfaceType.Loopback) continue;

                foreach (var addr in nic.GetIPProperties().UnicastAddresses)
                {
                    if (addr.Address.AddressFamily != AddressFamily.InterNetwork) continue;
                    result.Add((addr.Address.ToString(), addr.IPv4Mask.ToString()));
                }
            }
            return result;
        }

        private static uint IpToUint(string ip)
        {
            byte[] b = IPAddress.Parse(ip).GetAddressBytes();
            return (uint)(b[0] << 24 | b[1] << 16 | b[2] << 8 | b[3]);
        }

        private static string UintToIp(uint ip) =>
            $"{(ip >> 24) & 0xFF}.{(ip >> 16) & 0xFF}.{(ip >> 8) & 0xFF}.{ip & 0xFF}";

        private static int MaskToCidr(string mask)
        {
            uint m = IpToUint(mask);
            int bits = 0;
            while ((m & 0x80000000) != 0) { bits++; m <<= 1; }
            return bits;
        }
    }
}
