using System;
using System.Drawing;
using System.IO;
using System.IO.Ports;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;
using BocaSystems.Sdk;
using BocaSystems.Sdk.Connection;
using BocaSystems.Sdk.Models;

namespace BocaSystems.Sdk.Sample
{
    public partial class MainForm : Form
    {
        private BocaPrinter? _printer;
        private Bitmap? _loadedImage;
        private CancellationTokenSource? _readLoopCts;

        public MainForm()
        {
            InitializeComponent();
            tabControl.SelectedIndexChanged += tabControl_SelectedIndexChanged;
        }

        // ────────────────────────────────────────────────────────────────
        // Helpers
        // ────────────────────────────────────────────────────────────────

        private void Log(string message)
        {
            string line = $"[{DateTime.Now:HH:mm:ss}] {message}{Environment.NewLine}";
            if (txtLog.InvokeRequired)
                txtLog.Invoke(() => txtLog.AppendText(line));
            else
                txtLog.AppendText(line);
        }

        private void LogTx(string command)
        {
            Log($"TX >> {command}");
        }

        private void LogRx(byte[] data)
        {
            if (data.Length == 0) return;

            string hex = BitConverter.ToString(data).Replace("-", " ");
            Log($"RX << [{hex}]");

            if (data.Length <= 2)
            {
                var status = PrinterStatus.FromByte(data[0]);
                Log($"       {status.Description}");
                UpdateStatus(status);
            }
            else
            {
                string ascii = Encoding.ASCII.GetString(data).TrimEnd('\0');
                if (ascii.Length > 0 && ascii[0] >= 0x20)
                    Log($"       \"{ascii}\"");
                else
                    Log($"       {data.Length} bytes binary data");
            }
        }

        private void UpdateStatus(PrinterStatus status)
        {
            void DoUpdate()
            {
                lblStatus.Text = $"{status.Description} (0x{status.RawByte:X2})";
                lblStatus.ForeColor = status.IsReady ? Color.Green :
                    (status.TicketJam || status.CutterJam || status.OutOfTickets) ? Color.Red :
                    Color.Orange;
            }

            if (lblStatus.InvokeRequired)
                lblStatus.Invoke(DoUpdate);
            else
                DoUpdate();
        }

        private void StartReadLoop()
        {
            _readLoopCts?.Cancel();
            _readLoopCts = new CancellationTokenSource();
            var ct = _readLoopCts.Token;

            Task.Run(async () =>
            {
                while (!ct.IsCancellationRequested && _printer != null && _printer.IsConnected)
                {
                    try
                    {
                        byte[] data = await _printer.ReadAsync(64, ct);
                        if (data.Length > 0)
                            LogRx(data);
                    }
                    catch (OperationCanceledException) { break; }
                    catch (ObjectDisposedException) { break; }
                    catch (Exception ex)
                    {
                        Log($"RX error: {ex.Message}");
                        break;
                    }
                }
            }, ct);
        }

        private void StopReadLoop()
        {
            _readLoopCts?.Cancel();
            _readLoopCts?.Dispose();
            _readLoopCts = null;
        }

        private bool EnsureConnected()
        {
            if (_printer != null && _printer.IsConnected)
                return true;

            MessageBox.Show("Connect to a printer first.", "Not Connected",
                MessageBoxButtons.OK, MessageBoxIcon.Warning);
            return false;
        }

        // Maps the ticket width dropdown to inches
        private static readonly double[] TicketWidths = { 2.0, 2.125, 2.5, 2.7, 3.25, 4.0, 8.0 };

        private int SelectedDpi => cmbDpi.SelectedIndex switch
        {
            0 => 200,
            1 => 300,
            2 => 600,
            _ => 300
        };

        /// <summary>
        /// Printable width in dots, calculated from the selected ticket width and DPI.
        /// </summary>
        private int TicketWidthDots
        {
            get
            {
                double inches = TicketWidths[cmbTicketWidth.SelectedIndex];
                return (int)(inches * SelectedDpi);
            }
        }

        /// <summary>
        /// Printable length in dots, calculated from the selected ticket length and DPI.
        /// </summary>
        private int TicketLengthDots
        {
            get
            {
                double inches = (double)nudTicketLength.Value;
                return (int)(inches * SelectedDpi);
            }
        }

        private DitherAlgorithm SelectedDitherAlgorithm => cmbDither.SelectedIndex switch
        {
            0 => DitherAlgorithm.OrderedBayer,
            1 => DitherAlgorithm.FloydSteinberg,
            2 => DitherAlgorithm.Stucki,
            3 => DitherAlgorithm.ClusteredDot,
            4 => DitherAlgorithm.BlueNoise,
            5 => DitherAlgorithm.RiemersmaHilbert,
            _ => DitherAlgorithm.RiemersmaHilbert
        };

        private Rotation SelectedRotation => cmbRotation.SelectedIndex switch
        {
            0 => Rotation.Normal,
            1 => Rotation.Right,
            2 => Rotation.Inverted,
            3 => Rotation.Left,
            _ => Rotation.Normal
        };

        // ────────────────────────────────────────────────────────────────
        // Connection tab
        // ────────────────────────────────────────────────────────────────

        private void ConnectionType_CheckedChanged(object? sender, EventArgs e)
        {
            pnlSerial.Visible = rbSerial.Checked;
            pnlTcp.Visible = rbTcp.Checked;
            pnlHid.Visible = rbHid.Checked;
        }

        private void btnScanHid_Click(object? sender, EventArgs e)
        {
            cmbHidDevices.Items.Clear();
            var devices = BocaSystems.Sdk.Connection.HidTransport.ListBocaDevices();
            if (devices.Count == 0)
            {
                MessageBox.Show(
                    "No Boca HID devices found.\n\n" +
                    "Make sure the printer is:\n" +
                    "  • Powered on and connected via USB\n" +
                    "  • Set to HID mode (send <usbh> via TCP or Serial first)",
                    "Scan HID", MessageBoxButtons.OK, MessageBoxIcon.Information);
                return;
            }
            foreach (var path in devices)
                cmbHidDevices.Items.Add(path);
            cmbHidDevices.SelectedIndex = 0;
            Log($"Found {devices.Count} Boca HID device(s)");
        }

        private void btnScanPorts_Click(object? sender, EventArgs e)
        {
            cmbPorts.Items.Clear();
            string[] ports = SerialPort.GetPortNames();
            if (ports.Length == 0)
            {
                MessageBox.Show("No serial ports found.", "Scan Ports",
                    MessageBoxButtons.OK, MessageBoxIcon.Information);
                return;
            }
            cmbPorts.Items.AddRange(ports);
            cmbPorts.SelectedIndex = 0;
            Log($"Found {ports.Length} serial port(s): {string.Join(", ", ports)}");
        }

        private void btnSetUsbHid_Click(object? sender, EventArgs e)
        {
            if (!EnsureConnected()) return;
            _printer!.SetUsbDeviceType(UsbDeviceType.Hid);
            LogTx("Set USB HID Mode (<usbh>)");
            Log("Printer resetting to HID mode. Reconnect after reset.");
        }

        private void btnSetUsbSerial_Click(object? sender, EventArgs e)
        {
            if (!EnsureConnected()) return;
            _printer!.SetUsbDeviceType(UsbDeviceType.VirtualSerial);
            LogTx("Set USB Virtual Serial Mode (<usbs>)");
            Log("Printer resetting to Virtual Serial mode. Reconnect after reset.");
        }

        private void btnBluetoothOn_Click(object? sender, EventArgs e)
        {
            if (!EnsureConnected()) return;
            _printer!.EnableBluetooth();
            LogTx("Bluetooth Enable (<bll>)");
            Log("Bluetooth enabled. Pair via Windows Bluetooth settings — creates a virtual COM port.");
        }

        private void btnBluetoothOff_Click(object? sender, EventArgs e)
        {
            if (!EnsureConnected()) return;
            _printer!.DisableBluetooth();
            LogTx("Bluetooth Disable (<bld>)");
        }

        private void btnWifi_Click(object? sender, EventArgs e)
        {
            MessageBox.Show(
                "WiFi / Wireless Setup\n\n" +
                "WiFi must be configured via your printer control panel or the " +
                "Boca Configuration Program (download at bocasystems.com).\n\n" +
                "Once enabled:\n" +
                "  1. Print a Boca Test Print to find your printer's IP address\n" +
                "  2. Or scan for the device using the TCP connection Scan button\n" +
                "  3. Or find it from a terminal:\n" +
                "       ping BOCA<serial#>   (e.g. ping BOCA141414)\n" +
                "       If DHCP is active, check your router's client list\n\n" +
                "Then select TCP connection type and enter the IP address.",
                "WiFi Setup",
                MessageBoxButtons.OK,
                MessageBoxIcon.Information);
        }

        private void btnTestTicket_Click(object? sender, EventArgs e)
        {
            if (!EnsureConnected()) return;
            _printer!.PrintTestTicket(0);
            LogTx("Boca Test Ticket (<TST0>)");
        }

        private async void btnStopPurge_Click(object? sender, EventArgs e)
        {
            if (!EnsureConnected()) return;

            // 1. Disable permanent purge mode
            _printer!.DisablePermanentPurge();
            LogTx("Disable Purge (<ppd>)");

            // 2. Send form feed to cut any stock sitting at the head
            _printer.PrintAndCut();
            LogTx("Form Feed (<p>) — cut to clear stock");

            // 3. Brief delay for the cutter cycle to complete
            await Task.Delay(1500);

            // 4. Print built-in test ticket to realign the stock
            _printer.PrintTestTicket(0);
            LogTx("Test Ticket (<TST0>) — realign stock");
            Log("Purge stopped. Stock should be realigned after test ticket prints.");
        }

        private async void btnScanTcp_Click(object? sender, EventArgs e)
        {
            btnScanTcp.Enabled = false;
            btnScanTcp.Text = "Scanning...";
            cmbTcpDevices.Items.Clear();
            int port = (int)nudPort.Value;

            try
            {
                var printers = await TcpTransport.ScanForPrintersAsync(
                    port: port,
                    timeoutMs: 300,
                    progress: msg => Log(msg));

                if (printers.Count == 0)
                {
                    Log($"No printers found on port {port}. Check network and printer power.");
                }
                else
                {
                    foreach (var p in printers)
                        cmbTcpDevices.Items.Add(p);
                    cmbTcpDevices.SelectedIndex = 0;
                    Log($"Found {printers.Count} printer(s) on port {port}");
                }
            }
            catch (Exception ex)
            {
                Log($"TCP scan failed: {ex.Message}");
            }
            finally
            {
                btnScanTcp.Text = "Scan";
                btnScanTcp.Enabled = true;
            }
        }

        private void cmbTcpDevices_SelectedIndexChanged(object? sender, EventArgs e)
        {
            if (cmbTcpDevices.SelectedItem == null) return;
            string entry = cmbTcpDevices.SelectedItem.ToString()!;
            // Format is "IP:port"
            string[] parts = entry.Split(':');
            if (parts.Length >= 2)
            {
                txtIpAddress.Text = parts[0];
                if (int.TryParse(parts[1], out int port))
                    nudPort.Value = port;
            }
        }

        private void btnConnect_Click(object? sender, EventArgs e)
        {
            if (_printer != null)
            {
                MessageBox.Show("Already connected. Disconnect first.", "Connection",
                    MessageBoxButtons.OK, MessageBoxIcon.Information);
                return;
            }

            try
            {
                if (rbSerial.Checked)
                {
                    if (cmbPorts.SelectedItem == null)
                    {
                        MessageBox.Show("Select a serial port first.", "Connection",
                            MessageBoxButtons.OK, MessageBoxIcon.Warning);
                        return;
                    }
                    string port = cmbPorts.SelectedItem.ToString()!;
                    int baud = (int)nudBaud.Value;
                    _printer = BocaPrinter.ConnectSerial(port, baud);
                    Log($"Connected via Serial ({port} @ {baud} baud)");
                }
                else if (rbTcp.Checked)
                {
                    string ip = txtIpAddress.Text.Trim();
                    int port = (int)nudPort.Value;
                    _printer = BocaPrinter.ConnectTcp(ip, port);
                    Log($"Connected via TCP ({ip}:{port})");
                }
                else if (rbHid.Checked)
                {
                    if (cmbHidDevices.SelectedItem == null)
                    {
                        MessageBox.Show("Scan for HID devices first and select one.", "Connection",
                            MessageBoxButtons.OK, MessageBoxIcon.Warning);
                        return;
                    }
                    string path = cmbHidDevices.SelectedItem.ToString()!;
                    _printer = BocaPrinter.ConnectHid(path);
                    Log($"Connected via HID");
                }

                lblConnectionStatus.Text = "Connected";
                lblConnectionStatus.ForeColor = Color.Green;
                btnConnect.Enabled = false;
                btnDisconnect.Enabled = true;
                StartReadLoop();
                UpdateGraphicsTabState();
            }
            catch (Exception ex)
            {
                Log($"Connection failed: {ex.Message}");
                MessageBox.Show($"Connection failed:\n{ex.Message}", "Error",
                    MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void btnDisconnect_Click(object? sender, EventArgs e)
        {
            if (_printer == null) return;

            StopReadLoop();
            try
            {
                _printer.Dispose();
            }
            catch { /* swallow on disconnect */ }
            _printer = null;

            lblConnectionStatus.Text = "Not connected";
            lblConnectionStatus.ForeColor = Color.Gray;
            btnConnect.Enabled = true;
            btnDisconnect.Enabled = false;
            Log("Disconnected");
            UpdateGraphicsTabState();
        }

        // ────────────────────────────────────────────────────────────────
        // Text & Barcodes tab
        // ────────────────────────────────────────────────────────────────

        private void btnPrintText_Click(object? sender, EventArgs e)
        {
            if (!EnsureConnected()) return;

            try
            {
                int row = (int)nudRow.Value;
                int col = (int)nudCol.Value;
                int fontNum = cmbFont.SelectedIndex + 1;
                int height = (int)nudHeight.Value;
                int width = (int)nudWidth.Value;

                _printer!.SetRowColumn(row, col);
                _printer.SetFont(fontNum);
                _printer.SetHeightWidth(height, width);
                _printer.SetRotation(SelectedRotation);
                _printer.PrintText(txtContent.Text);
                _printer.PrintAndCut();

                Log($"Printed text at ({row},{col}) font={fontNum} size={height}x{width}");
            }
            catch (Exception ex)
            {
                Log($"Print text failed: {ex.Message}");
                MessageBox.Show(ex.Message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void btnPrintBarcode_Click(object? sender, EventArgs e)
        {
            if (!EnsureConnected()) return;

            try
            {
                string data = txtBarcodeData.Text;
                int row = (int)nudRow.Value;
                int col = (int)nudCol.Value;
                int dpi = SelectedDpi;
                int expansion = dpi >= 300 ? 3 : 2;

                _printer!.SetRowColumn(row, col);

                bool is2D = cmbBarcodeType.SelectedIndex >= 6;

                // Expansion and interpretation are 1D-only commands;
                // 2D barcodes control size via font number.
                if (!is2D)
                {
                    _printer.SetBarcodeExpansion(expansion);
                    if (chkInterpretation.Checked)
                        _printer.EnableBarcodeInterpretation();
                }

                switch (cmbBarcodeType.SelectedIndex)
                {
                    case 0: // Code 128
                        _printer.PrintCode128(data, BarcodeOrientation.PicketFence, 8);
                        break;
                    case 1: // Code 39
                        _printer.PrintCode39(data, BarcodeOrientation.PicketFence, 8);
                        break;
                    case 2: // I2of5
                        _printer.PrintInterleaved2of5(data, BarcodeOrientation.PicketFence, 8);
                        break;
                    case 3: // UPC-A
                        _printer.PrintUpcA(data, BarcodeOrientation.PicketFence, 8);
                        break;
                    case 4: // EAN-13
                        _printer.PrintEan13(data, BarcodeOrientation.PicketFence, 8);
                        break;
                    case 5: // Codabar
                        _printer.PrintCodabar(data, BarcodeOrientation.PicketFence, 8);
                        break;
                    case 6: // QR Code
                        _printer.PrintQrCode(data);
                        break;
                    case 7: // Data Matrix
                        _printer.PrintDataMatrix(data);
                        break;
                    case 8: // PDF-417
                        _printer.PrintPdf417(data);
                        break;
                    case 9: // Aztec
                        _printer.PrintAztec(data);
                        break;
                }

                _printer.PrintAndCut();
                Log($"Printed {cmbBarcodeType.SelectedItem} barcode: {data}");
            }
            catch (Exception ex)
            {
                Log($"Print barcode failed: {ex.Message}");
                MessageBox.Show(ex.Message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void cmbBarcodeType_SelectedIndexChanged(object? sender, EventArgs e)
        {
            txtBarcodeData.Text = cmbBarcodeType.SelectedIndex switch
            {
                0 => "BOCA-2026-001234",     // Code 128: any ASCII
                1 => "BOCA2026",              // Code 39: A-Z, 0-9, -./$/+/%
                2 => "123456",                // I2of5: even number of digits
                3 => "401234567893",          // UPC-A: exactly 12 digits
                4 => "9014561780128",         // EAN-13: exactly 13 digits
                5 => "A123456B",              // Codabar: start/end with A-D
                6 => "BOCA-2026-QR-TEST",       // QR
                7 => "BOCA-SYSTEMS-DMX",      // Data Matrix
                8 => "BOCA-SYSTEMS-PDF417",   // PDF-417
                9 => "BOCA-SYSTEMS-AZTEC",    // Aztec
                _ => "BOCA-2026-001234"
            };
        }

        private void btnTestAllFonts_Click(object? sender, EventArgs e)
        {
            if (!EnsureConnected()) return;

            try
            {
                _printer!.ClearBuffer();
                _printer.SetRotation(Rotation.Normal);
                _printer.SetHeightWidth(1, 1);

                int row = 10;
                for (int font = 1; font <= 13; font++)
                {
                    _printer.SetFont(font);
                    _printer.SetRowColumn(row, 20);
                    _printer.PrintText($"Font {font}: ABCDEFG 0123456789");
                    row += 35;
                }

                _printer.PrintAndCut();
                Log("Printed all 13 fonts on one ticket");
            }
            catch (Exception ex)
            {
                Log($"Test all fonts failed: {ex.Message}");
                MessageBox.Show(ex.Message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void btnPrintDemoTicket_Click(object? sender, EventArgs e)
        {
            if (!EnsureConnected()) return;

            try
            {
                // FGL coordinate system:
                //   Row  = across ticket WIDTH  (short edge, e.g. 2" = 400 dots)
                //   Col  = along ticket LENGTH  (long edge, e.g. 5.5" = 1100 dots)
                int maxRow = TicketWidthDots;
                int maxCol = TicketLengthDots;
                int dpi = SelectedDpi;

                int rowMargin = Math.Max(12, (int)(maxRow * 0.03));
                int colMargin = Math.Max(20, (int)(maxCol * 0.02));
                int usableRows = maxRow - rowMargin * 2;
                int usableCols = maxCol - colMargin * 2;
                int contentCol = colMargin + (int)(usableCols * 0.03);
                int barcodeExpansion = dpi >= 300 ? 3 : 2;

                _printer!.ClearBuffer();
                _printer.SetRotation(Rotation.Normal);
                _printer.SetHeightWidth(1, 1);

                // outer border
                _printer.DrawBoxAt(rowMargin, colMargin, usableRows, usableCols, 3);

                // header: company name (font 6: 56-dot tall box)
                int row = rowMargin + (int)(usableRows * 0.02);
                _printer.SetFont(6);
                _printer.SetRowColumn(row, contentCol);
                _printer.PrintText("BOCA SYSTEMS");

                // header divider
                row = rowMargin + (int)(usableRows * 0.16);
                _printer.DrawHorizontalLineAt(row, colMargin + 3, usableCols - 6, 2);

                // subtitle — inside the box, below the divider
                row = rowMargin + (int)(usableRows * 0.19);
                _printer.SetFont(3);
                _printer.SetRowColumn(row, contentCol);
                _printer.PrintText("SDK Demo Ticket");

                // event title — double size
                row = rowMargin + (int)(usableRows * 0.30);
                _printer.SetFont(3);
                _printer.SetHeightWidth(2, 2);
                _printer.SetRowColumn(row, contentCol);
                _printer.PrintText("GENERAL ADMISSION");
                _printer.SetHeightWidth(1, 1);

                // thin rule under title
                row = rowMargin + (int)(usableRows * 0.48);
                _printer.DrawHorizontalLineAt(row, contentCol, usableCols - (int)(usableCols * 0.06), 1);

                // details (font 3: 33-dot tall box)
                int lineStep = (int)(usableRows * 0.09);
                row = rowMargin + (int)(usableRows * 0.52);

                _printer.SetFont(3);
                _printer.SetRowColumn(row, contentCol);
                _printer.PrintText("Section: 101   Row: A   Seat: 12");

                row += lineStep;
                _printer.SetRowColumn(row, contentCol);
                _printer.PrintText("Date:  2026-06-15   7:30 PM");

                row += lineStep;
                _printer.SetRowColumn(row, contentCol);
                _printer.PrintText("Venue: Main Arena");

                row += lineStep;
                _printer.SetRowColumn(row, contentCol);
                _printer.PrintText("Gate:  North Entrance");

                // heavy divider before barcode
                row += (int)(lineStep * 1.1);
                _printer.DrawHorizontalLineAt(row, colMargin + 3, usableCols - 6, 3);

                // barcode — centered in the bottom box, picket fence so it reads left-to-right
                int barcodeDivRow = row;
                int bottomBoxHeight = (rowMargin + usableRows) - barcodeDivRow;
                row = barcodeDivRow + (int)(bottomBoxHeight * 0.25);
                int barcodeCol = colMargin + (int)(usableCols * 0.10);
                _printer.SetRowColumn(row, barcodeCol);
                _printer.SetBarcodeExpansion(barcodeExpansion);
                _printer.EnableBarcodeInterpretation();
                _printer.PrintCode128("BOCA-2026-001234", BarcodeOrientation.PicketFence, 6);

                _printer.PrintAndCut();
                Log($"Printed demo ticket ({maxRow}x{maxCol} dots, {dpi} dpi)");
            }
            catch (Exception ex)
            {
                Log($"Demo ticket failed: {ex.Message}");
                MessageBox.Show(ex.Message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        // ────────────────────────────────────────────────────────────────
        // Graphics tab
        // ────────────────────────────────────────────────────────────────

        private void tabControl_SelectedIndexChanged(object? sender, EventArgs e)
        {
            UpdateGraphicsTabState();
        }

        private void UpdateGraphicsTabState()
        {
            bool isHid = _printer != null && _printer.IsHidConnection;

            btnPrintImage.Enabled = true;
            btnDownloadToMemory.Enabled = true;
            btnBrowseImage.Enabled = true;
            cmbDither.Enabled = true;
            lblHidGraphicsWarning.Visible = isHid;
            if (isHid) lblHidGraphicsWarning.BringToFront();
        }

        private void btnBrowseImage_Click(object? sender, EventArgs e)
        {
            using var dlg = new OpenFileDialog
            {
                Filter = "Image Files|*.png;*.jpg;*.jpeg;*.bmp;*.gif;*.tiff|All Files|*.*",
                Title = "Select an image"
            };

            if (dlg.ShowDialog() != DialogResult.OK) return;

            try
            {
                _loadedImage?.Dispose();
                _loadedImage = new Bitmap(dlg.FileName);
                picPreview.Image = _loadedImage;
                lblImagePath.Text = Path.GetFileName(dlg.FileName);
                lblImagePath.ForeColor = Color.Black;
                Log($"Loaded image: {dlg.FileName} ({_loadedImage.Width}x{_loadedImage.Height})");
                UpdateDitherPreview();
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Failed to load image:\n{ex.Message}", "Error",
                    MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void UpdateDitherPreview()
        {
            if (_loadedImage == null) return;

            try
            {
                byte[] pngBytes = BocaSystems.Sdk.Imaging.Dither.Apply(
                    _loadedImage, SelectedDitherAlgorithm);
                using var ms = new MemoryStream(pngBytes);
                var oldPreview = picDitherPreview.Image;
                picDitherPreview.Image = new Bitmap(ms);
                if (oldPreview != null && oldPreview != _loadedImage)
                    oldPreview.Dispose();
            }
            catch (Exception ex)
            {
                Log($"Dither preview failed: {ex.Message}");
            }
        }

        private void cmbDither_SelectedIndexChanged(object? sender, EventArgs e)
        {
            UpdateDitherPreview();
        }

        private void btnPrintImage_Click(object? sender, EventArgs e)
        {
            if (!EnsureConnected()) return;
            if (_loadedImage == null)
            {
                MessageBox.Show("Load an image first.", "No Image",
                    MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            try
            {
                _printer!.PrintImage(_loadedImage, SelectedDitherAlgorithm);
                Log($"Printed image with {cmbDither.SelectedItem} dithering");
            }
            catch (Exception ex)
            {
                Log($"Print image failed: {ex.Message}");
                MessageBox.Show(ex.Message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void btnDownloadToMemory_Click(object? sender, EventArgs e)
        {
            if (!EnsureConnected()) return;
            if (_loadedImage == null)
            {
                MessageBox.Show("Load an image first.", "No Image",
                    MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            try
            {
                // Dither down to 1-bit, then save as PNG bytes for download
                byte[] pngBytes = BocaSystems.Sdk.Imaging.Dither.Apply(
                    _loadedImage, SelectedDitherAlgorithm);
                _printer!.DownloadGraphicToMemory(pngBytes, GraphicFormat.Png);
                Log($"Downloaded image to printer memory ({pngBytes.Length} bytes)");
            }
            catch (Exception ex)
            {
                Log($"Download to memory failed: {ex.Message}");
                MessageBox.Show(ex.Message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        // ────────────────────────────────────────────────────────────────
        // Diagnostics tab
        // ────────────────────────────────────────────────────────────────

        private void btnQueryStatus_Click(object? sender, EventArgs e)
        {
            if (!EnsureConnected()) return;
            _printer!.SendCommand("<S92>");
            LogTx("Query Solicited Status (<S92>)");
        }

        private void btnQueryFirmware_Click(object? sender, EventArgs e)
        {
            if (!EnsureConnected()) return;
            _printer!.SendCommand("<S2>");
            LogTx("Query Firmware Version (<S2>)");
        }

        private void btnQuerySpace_Click(object? sender, EventArgs e)
        {
            if (!EnsureConnected()) return;
            _printer!.SendCommand("<S7>");
            LogTx("Query Download Space (<S7>)");
        }

        private void btnSendRaw_Click(object? sender, EventArgs e)
        {
            if (!EnsureConnected()) return;

            try
            {
                string cmd = txtRawFgl.Text;
                _printer!.SendCommand(cmd);
                LogTx(cmd);
            }
            catch (Exception ex)
            {
                Log($"Send raw failed: {ex.Message}");
            }
        }

        private void btnClearLog_Click(object? sender, EventArgs e)
        {
            txtLog.Clear();
        }

        private void btnClearMemory_Click(object? sender, EventArgs e)
        {
            if (!EnsureConnected()) return;

            var result = MessageBox.Show(
                "This will erase all downloaded logos and fonts from the printer.\n\nContinue?",
                "Clear Memory", MessageBoxButtons.YesNo, MessageBoxIcon.Warning);

            if (result != DialogResult.Yes) return;

            try
            {
                _printer!.ClearDownloadMemory();
                Log("Cleared printer download memory");
            }
            catch (Exception ex)
            {
                Log($"Clear memory failed: {ex.Message}");
                MessageBox.Show(ex.Message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void btnPurge_Click(object? sender, EventArgs e)
        {
            if (!EnsureConnected()) return;

            var result = MessageBox.Show(
                "This will continuously feed and cut stock until you press Stop Purge.\n\nContinue?",
                "Purge Tickets", MessageBoxButtons.YesNo, MessageBoxIcon.Warning);

            if (result != DialogResult.Yes) return;

            try
            {
                _printer!.EnablePermanentPurge();
                _printer.PrintAndCut();
                LogTx("Enable Permanent Purge (<ppe>) + Form Feed (<p>)");
                Log("Purging... press Stop Purge + Align when done.");
            }
            catch (Exception ex)
            {
                Log($"Purge failed: {ex.Message}");
                MessageBox.Show(ex.Message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        // ────────────────────────────────────────────────────────────────
        // Cleanup
        // ────────────────────────────────────────────────────────────────

        protected override void OnFormClosing(FormClosingEventArgs e)
        {
            StopReadLoop();
            _loadedImage?.Dispose();
            _printer?.Dispose();
            base.OnFormClosing(e);
        }
    }
}
