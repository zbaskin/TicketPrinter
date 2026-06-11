using System;
using System.Collections.Generic;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Win32.SafeHandles;

namespace BocaSystems.Sdk.Connection
{
    /// <summary>
    /// USB-HID transport. Uses Win32 CreateFile against the HID device path.
    /// The printer must be in HID mode (set with the usbh command).
    ///
    /// Call FindBocaDevice() or ListBocaDevices() to auto-discover printers
    /// without needing to know the device path up front.
    /// </summary>
    public sealed class HidTransport : IConnectionTransport
    {
        public const int BocaVendorId = 0x0A43;

        // HID device interface class GUID
        private static readonly Guid HidGuid = new("4d1e55b2-f16f-11cf-88cb-001111000030");

        [DllImport("kernel32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        private static extern SafeFileHandle CreateFile(
            string lpFileName, uint dwDesiredAccess, uint dwShareMode,
            IntPtr lpSecurityAttributes, int dwCreationDisposition,
            uint dwFlagsAndAttributes, IntPtr hTemplateFile);

        private const uint GENERIC_READ       = 0x80000000;
        private const uint GENERIC_WRITE      = 0x40000000;
        private const uint FILE_SHARE_READ    = 0x00000001;
        private const uint FILE_SHARE_WRITE   = 0x00000002;
        private const int  OPEN_EXISTING      = 3;
        private const uint FILE_FLAG_OVERLAPPED = 0x40000000;

        private readonly SafeFileHandle _handle;
        private readonly FileStream _stream;
        private bool _disposed;

        // HID reports are fixed-size. Boca printers use 33-byte reports:
        // byte 0 = report ID (0x00), bytes 1-32 = payload.
        // Confirmed via raw HID capture: bytesRead=33 for all responses.
        private const int HidReportSize = 33;   // 1 report ID + 32 data
        private const int HidPayloadSize = 32;
        private const byte HidReportId = 0x00;

        public HidTransport(string devicePath)
        {
            _handle = CreateFile(
                devicePath,
                GENERIC_READ | GENERIC_WRITE,
                FILE_SHARE_READ | FILE_SHARE_WRITE,
                IntPtr.Zero, OPEN_EXISTING, FILE_FLAG_OVERLAPPED, IntPtr.Zero);

            if (_handle.IsInvalid)
                throw new BocaPrinterException(
                    $"Cannot open HID device at '{devicePath}'. " +
                    "Check that the printer is connected and in HID mode.");

            _stream = new FileStream(_handle, FileAccess.ReadWrite, bufferSize: HidReportSize, isAsync: true);
        }

        public bool IsConnected => !_handle.IsInvalid && !_disposed;

        public void WriteString(string data)
        {
            byte[] bytes = Encoding.ASCII.GetBytes(data);
            WriteBytes(bytes, 0, bytes.Length);
        }

        public void WriteBytes(byte[] data, int offset, int count)
        {
            ThrowIfDisposed();

            // HID output reports are fixed-size: 33 bytes per report.
            // Byte 0 = report ID (0x00), bytes 1-32 = payload.
            // The HID driver strips the report ID; printer receives 32 bytes.
            byte[] report = new byte[HidReportSize];
            while (count > 0)
            {
                int chunk = Math.Min(count, HidPayloadSize);
                Array.Clear(report, 0, report.Length);
                report[0] = HidReportId;
                Buffer.BlockCopy(data, offset, report, 1, chunk);
                _stream.Write(report, 0, report.Length);
                offset += chunk;
                count -= chunk;
            }
            _stream.Flush();
        }

        public async Task<byte[]> ReadBytesAsync(int bufferSize, CancellationToken ct = default)
        {
            ThrowIfDisposed();

            byte[] report = new byte[HidReportSize];
            int bytesRead = await _stream.ReadAsync(report, 0, HidReportSize, ct);
            if (bytesRead <= 1) return Array.Empty<byte>();

            // Byte 0 is always the report ID (0x00). Payload starts at byte 1.
            int dataEnd = bytesRead - 1;

            // Trim trailing zero padding from payload area
            while (dataEnd > 1 && report[dataEnd] == 0)
                dataEnd--;

            // If only the report ID remains, no meaningful data
            if (dataEnd < 1 || report[dataEnd] == 0) return Array.Empty<byte>();

            int payloadLen = dataEnd; // dataEnd is index; payload starts at 1, so length = dataEnd - 1 + 1 = dataEnd
            byte[] payload = new byte[payloadLen];
            Buffer.BlockCopy(report, 1, payload, 0, payloadLen);
            return payload;
        }

        public void Close() => Dispose();

        public void Dispose()
        {
            if (_disposed) return;
            _disposed = true;
            try { _stream?.Dispose(); } catch (IOException) { /* HID device may reject flush on close */ }
            _handle?.Dispose();
            GC.SuppressFinalize(this);
        }

        /// <summary>
        /// Find the first Boca HID device. Returns the device path or null.
        /// </summary>
        public static string? FindBocaDevice(int vendorId = BocaVendorId)
        {
            string vidFilter = $"vid_{vendorId:x4}";

            foreach (string path in EnumerateHidDevicePaths())
            {
                if (path.Contains(vidFilter, StringComparison.OrdinalIgnoreCase))
                    return path;
            }
            return null;
        }

        /// <summary>
        /// List all Boca HID devices found on the system. Returns device paths
        /// that can be passed to the constructor or ConnectHid().
        /// </summary>
        public static List<string> ListBocaDevices(int vendorId = BocaVendorId)
        {
            string vidFilter = $"vid_{vendorId:x4}";
            var results = new List<string>();

            foreach (string path in EnumerateHidDevicePaths())
            {
                if (path.Contains(vidFilter, StringComparison.OrdinalIgnoreCase))
                    results.Add(path);
            }
            return results;
        }

        private static IEnumerable<string> EnumerateHidDevicePaths()
        {
            Guid hidGuid = HidGuid;
            IntPtr devInfoSet = SetupDiGetClassDevs(
                ref hidGuid, null, IntPtr.Zero,
                DIGCF_PRESENT | DIGCF_DEVICEINTERFACE);

            if (devInfoSet == INVALID_HANDLE)
                yield break;

            try
            {
                var interfaceData = new SP_DEVICE_INTERFACE_DATA();
                interfaceData.cbSize = Marshal.SizeOf(interfaceData);

                for (int i = 0; SetupDiEnumDeviceInterfaces(
                    devInfoSet, IntPtr.Zero, ref hidGuid, i, ref interfaceData); i++)
                {
                    string? path = GetDeviceInterfacePath(devInfoSet, ref interfaceData);
                    if (path != null)
                        yield return path;
                }
            }
            finally
            {
                SetupDiDestroyDeviceInfoList(devInfoSet);
            }
        }

        private static string? GetDeviceInterfacePath(
            IntPtr devInfoSet, ref SP_DEVICE_INTERFACE_DATA interfaceData)
        {
            SetupDiGetDeviceInterfaceDetail(
                devInfoSet, ref interfaceData, IntPtr.Zero, 0, out int requiredSize, IntPtr.Zero);

            if (requiredSize <= 0) return null;

            IntPtr detailBuf = Marshal.AllocHGlobal(requiredSize);
            try
            {
                // cbSize of the fixed portion: 8 on 64-bit, 6 on 32-bit
                Marshal.WriteInt32(detailBuf, IntPtr.Size == 8 ? 8 : 6);

                if (!SetupDiGetDeviceInterfaceDetail(
                    devInfoSet, ref interfaceData, detailBuf, requiredSize, out _, IntPtr.Zero))
                    return null;

                // Device path starts at offset 4 (after cbSize)
                return Marshal.PtrToStringAuto(detailBuf + 4);
            }
            finally
            {
                Marshal.FreeHGlobal(detailBuf);
            }
        }

        private void ThrowIfDisposed()
        {
            if (_disposed) throw new ObjectDisposedException(nameof(HidTransport));
        }

        #region SetupDI P/Invoke

        private const int DIGCF_PRESENT = 0x02;
        private const int DIGCF_DEVICEINTERFACE = 0x10;
        private static readonly IntPtr INVALID_HANDLE = new(-1);

        [StructLayout(LayoutKind.Sequential)]
        private struct SP_DEVICE_INTERFACE_DATA
        {
            public int cbSize;
            public Guid InterfaceClassGuid;
            public int Flags;
            public IntPtr Reserved;
        }

        [DllImport("setupapi.dll", CharSet = CharSet.Auto, SetLastError = true)]
        private static extern IntPtr SetupDiGetClassDevs(
            ref Guid classGuid, string? enumerator, IntPtr hwndParent, int flags);

        [DllImport("setupapi.dll", SetLastError = true)]
        private static extern bool SetupDiEnumDeviceInterfaces(
            IntPtr deviceInfoSet, IntPtr deviceInfoData,
            ref Guid interfaceClassGuid, int memberIndex,
            ref SP_DEVICE_INTERFACE_DATA deviceInterfaceData);

        [DllImport("setupapi.dll", CharSet = CharSet.Auto, SetLastError = true)]
        private static extern bool SetupDiGetDeviceInterfaceDetail(
            IntPtr deviceInfoSet,
            ref SP_DEVICE_INTERFACE_DATA deviceInterfaceData,
            IntPtr deviceInterfaceDetailData,
            int deviceInterfaceDetailDataSize,
            out int requiredSize,
            IntPtr deviceInfoData);

        [DllImport("setupapi.dll", SetLastError = true)]
        private static extern bool SetupDiDestroyDeviceInfoList(IntPtr deviceInfoSet);

        #endregion
    }
}
