namespace BocaSystems.Sdk.Sample
{
    partial class MainForm
    {
        private System.ComponentModel.IContainer components = null;

        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
                components.Dispose();
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        private void InitializeComponent()
        {
            this.tabControl = new System.Windows.Forms.TabControl();
            this.tabConnection = new System.Windows.Forms.TabPage();
            this.tabText = new System.Windows.Forms.TabPage();
            this.tabGraphics = new System.Windows.Forms.TabPage();
            // ── Connection tab controls ────────────────────────────────
            this.grpConnectionType = new System.Windows.Forms.GroupBox();
            this.rbSerial = new System.Windows.Forms.RadioButton();
            this.rbTcp = new System.Windows.Forms.RadioButton();
            this.rbHid = new System.Windows.Forms.RadioButton();

            this.pnlSerial = new System.Windows.Forms.Panel();
            this.cmbPorts = new System.Windows.Forms.ComboBox();
            this.btnScanPorts = new System.Windows.Forms.Button();
            this.nudBaud = new System.Windows.Forms.NumericUpDown();
            this.lblBaud = new System.Windows.Forms.Label();
            this.lblPort = new System.Windows.Forms.Label();

            this.pnlTcp = new System.Windows.Forms.Panel();
            this.txtIpAddress = new System.Windows.Forms.TextBox();
            this.nudPort = new System.Windows.Forms.NumericUpDown();
            this.lblIpAddress = new System.Windows.Forms.Label();
            this.lblTcpPort = new System.Windows.Forms.Label();

            this.pnlHid = new System.Windows.Forms.Panel();
            this.cmbHidDevices = new System.Windows.Forms.ComboBox();
            this.btnScanHid = new System.Windows.Forms.Button();
            this.lblDevicePath = new System.Windows.Forms.Label();

            this.btnConnect = new System.Windows.Forms.Button();
            this.btnDisconnect = new System.Windows.Forms.Button();
            this.lblConnectionStatus = new System.Windows.Forms.Label();

            this.grpTicketSettings = new System.Windows.Forms.GroupBox();
            this.lblTicketWidth = new System.Windows.Forms.Label();
            this.cmbTicketWidth = new System.Windows.Forms.ComboBox();
            this.lblTicketLength = new System.Windows.Forms.Label();
            this.nudTicketLength = new System.Windows.Forms.NumericUpDown();
            this.lblDpi = new System.Windows.Forms.Label();
            this.cmbDpi = new System.Windows.Forms.ComboBox();
            this.lblTicketInfo = new System.Windows.Forms.Label();

            // ── Text tab controls ──────────────────────────────────────
            this.lblRow = new System.Windows.Forms.Label();
            this.lblCol = new System.Windows.Forms.Label();
            this.nudRow = new System.Windows.Forms.NumericUpDown();
            this.nudCol = new System.Windows.Forms.NumericUpDown();
            this.lblFont = new System.Windows.Forms.Label();
            this.cmbFont = new System.Windows.Forms.ComboBox();
            this.lblHeight = new System.Windows.Forms.Label();
            this.lblWidth = new System.Windows.Forms.Label();
            this.nudHeight = new System.Windows.Forms.NumericUpDown();
            this.nudWidth = new System.Windows.Forms.NumericUpDown();
            this.lblRotation = new System.Windows.Forms.Label();
            this.cmbRotation = new System.Windows.Forms.ComboBox();
            this.txtContent = new System.Windows.Forms.TextBox();
            this.btnPrintText = new System.Windows.Forms.Button();

            this.grpBarcodes = new System.Windows.Forms.GroupBox();
            this.lblBarcodeType = new System.Windows.Forms.Label();
            this.cmbBarcodeType = new System.Windows.Forms.ComboBox();
            this.lblBarcodeData = new System.Windows.Forms.Label();
            this.txtBarcodeData = new System.Windows.Forms.TextBox();
            this.chkInterpretation = new System.Windows.Forms.CheckBox();
            this.btnPrintBarcode = new System.Windows.Forms.Button();

            this.btnPrintDemoTicket = new System.Windows.Forms.Button();
            this.btnTestAllFonts = new System.Windows.Forms.Button();

            // ── Printer Settings controls ──────────────────────────────
            this.grpPrinterSettings = new System.Windows.Forms.GroupBox();
            this.btnSetUsbHid = new System.Windows.Forms.Button();
            this.btnSetUsbSerial = new System.Windows.Forms.Button();
            this.btnBluetoothOn = new System.Windows.Forms.Button();
            this.btnBluetoothOff = new System.Windows.Forms.Button();
            this.btnWifi = new System.Windows.Forms.Button();
            this.btnTestTicket = new System.Windows.Forms.Button();
            this.btnStopPurge = new System.Windows.Forms.Button();
            this.lblUsbModeNote = new System.Windows.Forms.Label();

            // ── Graphics tab controls ──────────────────────────────────
            this.btnBrowseImage = new System.Windows.Forms.Button();
            this.lblImagePath = new System.Windows.Forms.Label();
            this.lblDither = new System.Windows.Forms.Label();
            this.cmbDither = new System.Windows.Forms.ComboBox();
            this.picPreview = new System.Windows.Forms.PictureBox();
            this.picDitherPreview = new System.Windows.Forms.PictureBox();
            this.lblDitherPreview = new System.Windows.Forms.Label();
            this.btnPrintImage = new System.Windows.Forms.Button();
            this.btnDownloadToMemory = new System.Windows.Forms.Button();
            this.lblHidGraphicsWarning = new System.Windows.Forms.Label();

            // ── Diagnostics panel (visible on all tabs) ─────────────────
            this.grpDiagnostics = new System.Windows.Forms.GroupBox();
            this.btnQueryStatus = new System.Windows.Forms.Button();
            this.btnQueryFirmware = new System.Windows.Forms.Button();
            this.btnQuerySpace = new System.Windows.Forms.Button();
            this.lblStatus = new System.Windows.Forms.Label();
            this.lblRawFgl = new System.Windows.Forms.Label();
            this.txtRawFgl = new System.Windows.Forms.TextBox();
            this.btnSendRaw = new System.Windows.Forms.Button();
            this.txtLog = new System.Windows.Forms.TextBox();
            this.btnClearMemory = new System.Windows.Forms.Button();
            this.btnPurge = new System.Windows.Forms.Button();
            this.btnClearLog = new System.Windows.Forms.Button();

            this.SuspendLayout();
            this.tabControl.SuspendLayout();
            this.tabConnection.SuspendLayout();
            this.tabText.SuspendLayout();
            this.tabGraphics.SuspendLayout();
            this.grpDiagnostics.SuspendLayout();
            this.grpConnectionType.SuspendLayout();
            this.grpPrinterSettings.SuspendLayout();
            this.pnlSerial.SuspendLayout();
            this.pnlTcp.SuspendLayout();
            this.pnlHid.SuspendLayout();
            this.grpTicketSettings.SuspendLayout();
            this.grpBarcodes.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)this.nudBaud).BeginInit();
            ((System.ComponentModel.ISupportInitialize)this.nudTicketLength).BeginInit();
            ((System.ComponentModel.ISupportInitialize)this.nudPort).BeginInit();
            ((System.ComponentModel.ISupportInitialize)this.nudRow).BeginInit();
            ((System.ComponentModel.ISupportInitialize)this.nudCol).BeginInit();
            ((System.ComponentModel.ISupportInitialize)this.nudHeight).BeginInit();
            ((System.ComponentModel.ISupportInitialize)this.nudWidth).BeginInit();
            ((System.ComponentModel.ISupportInitialize)this.picPreview).BeginInit();
            ((System.ComponentModel.ISupportInitialize)this.picDitherPreview).BeginInit();

            // ================================================================
            // tabControl
            // ================================================================
            this.tabControl.Controls.Add(this.tabConnection);
            this.tabControl.Controls.Add(this.tabText);
            this.tabControl.Controls.Add(this.tabGraphics);
            this.tabControl.Location = new System.Drawing.Point(12, 12);
            this.tabControl.Name = "tabControl";
            this.tabControl.SelectedIndex = 0;
            this.tabControl.Size = new System.Drawing.Size(810, 460);
            this.tabControl.TabIndex = 0;

            // ================================================================
            // tabConnection
            // ================================================================
            this.tabConnection.Controls.Add(this.grpConnectionType);
            this.tabConnection.Controls.Add(this.pnlSerial);
            this.tabConnection.Controls.Add(this.pnlTcp);
            this.tabConnection.Controls.Add(this.pnlHid);
            this.tabConnection.Controls.Add(this.grpTicketSettings);
            this.tabConnection.Controls.Add(this.grpPrinterSettings);
            this.tabConnection.Controls.Add(this.btnConnect);
            this.tabConnection.Controls.Add(this.btnDisconnect);
            this.tabConnection.Controls.Add(this.lblConnectionStatus);
            this.tabConnection.Location = new System.Drawing.Point(4, 24);
            this.tabConnection.Name = "tabConnection";
            this.tabConnection.Padding = new System.Windows.Forms.Padding(10);
            this.tabConnection.Size = new System.Drawing.Size(802, 432);
            this.tabConnection.TabIndex = 0;
            this.tabConnection.Text = "Connection";
            this.tabConnection.UseVisualStyleBackColor = true;

            // grpConnectionType
            this.grpConnectionType.Controls.Add(this.rbSerial);
            this.grpConnectionType.Controls.Add(this.rbTcp);
            this.grpConnectionType.Controls.Add(this.rbHid);
            this.grpConnectionType.Location = new System.Drawing.Point(15, 15);
            this.grpConnectionType.Name = "grpConnectionType";
            this.grpConnectionType.Size = new System.Drawing.Size(350, 60);
            this.grpConnectionType.TabIndex = 0;
            this.grpConnectionType.TabStop = false;
            this.grpConnectionType.Text = "Connection Type";

            // rbSerial
            this.rbSerial.AutoSize = true;
            this.rbSerial.Checked = true;
            this.rbSerial.Location = new System.Drawing.Point(15, 25);
            this.rbSerial.Name = "rbSerial";
            this.rbSerial.Size = new System.Drawing.Size(54, 19);
            this.rbSerial.TabIndex = 0;
            this.rbSerial.TabStop = true;
            this.rbSerial.Text = "Serial";
            this.rbSerial.CheckedChanged += new System.EventHandler(this.ConnectionType_CheckedChanged);

            // rbTcp
            this.rbTcp.AutoSize = true;
            this.rbTcp.Location = new System.Drawing.Point(90, 25);
            this.rbTcp.Name = "rbTcp";
            this.rbTcp.Size = new System.Drawing.Size(46, 19);
            this.rbTcp.TabIndex = 1;
            this.rbTcp.Text = "TCP";
            this.rbTcp.CheckedChanged += new System.EventHandler(this.ConnectionType_CheckedChanged);

            // rbHid
            this.rbHid.AutoSize = true;
            this.rbHid.Location = new System.Drawing.Point(165, 25);
            this.rbHid.Name = "rbHid";
            this.rbHid.Size = new System.Drawing.Size(45, 19);
            this.rbHid.TabIndex = 2;
            this.rbHid.Text = "HID";
            this.rbHid.CheckedChanged += new System.EventHandler(this.ConnectionType_CheckedChanged);

            // ── pnlSerial ──────────────────────────────────────────────
            this.pnlSerial.Controls.Add(this.lblPort);
            this.pnlSerial.Controls.Add(this.cmbPorts);
            this.pnlSerial.Controls.Add(this.btnScanPorts);
            this.pnlSerial.Controls.Add(this.lblBaud);
            this.pnlSerial.Controls.Add(this.nudBaud);
            this.pnlSerial.Location = new System.Drawing.Point(15, 90);
            this.pnlSerial.Name = "pnlSerial";
            this.pnlSerial.Size = new System.Drawing.Size(500, 50);
            this.pnlSerial.TabIndex = 2;
            this.pnlSerial.Visible = true;

            this.lblPort.AutoSize = true;
            this.lblPort.Location = new System.Drawing.Point(0, 8);
            this.lblPort.Text = "Port:";
            this.cmbPorts.Location = new System.Drawing.Point(40, 5);
            this.cmbPorts.Size = new System.Drawing.Size(100, 23);
            this.cmbPorts.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.btnScanPorts.Location = new System.Drawing.Point(150, 4);
            this.btnScanPorts.Size = new System.Drawing.Size(75, 25);
            this.btnScanPorts.Text = "Scan";
            this.btnScanPorts.Click += new System.EventHandler(this.btnScanPorts_Click);

            this.lblBaud.AutoSize = true;
            this.lblBaud.Location = new System.Drawing.Point(240, 8);
            this.lblBaud.Text = "Baud:";
            this.nudBaud.Location = new System.Drawing.Point(285, 5);
            this.nudBaud.Size = new System.Drawing.Size(100, 23);
            this.nudBaud.Maximum = 921600;
            this.nudBaud.Minimum = 9600;
            this.nudBaud.Value = 115200;

            // ── pnlTcp ─────────────────────────────────────────────────
            this.btnScanTcp = new System.Windows.Forms.Button();
            this.cmbTcpDevices = new System.Windows.Forms.ComboBox();
            this.pnlTcp.Controls.Add(this.lblIpAddress);
            this.pnlTcp.Controls.Add(this.txtIpAddress);
            this.pnlTcp.Controls.Add(this.lblTcpPort);
            this.pnlTcp.Controls.Add(this.nudPort);
            this.pnlTcp.Controls.Add(this.btnScanTcp);
            this.pnlTcp.Controls.Add(this.cmbTcpDevices);
            this.pnlTcp.Location = new System.Drawing.Point(15, 90);
            this.pnlTcp.Name = "pnlTcp";
            this.pnlTcp.Size = new System.Drawing.Size(760, 50);
            this.pnlTcp.TabIndex = 3;
            this.pnlTcp.Visible = false;

            this.lblIpAddress.AutoSize = true;
            this.lblIpAddress.Location = new System.Drawing.Point(0, 8);
            this.lblIpAddress.Text = "IP Address:";
            this.txtIpAddress.Location = new System.Drawing.Point(80, 5);
            this.txtIpAddress.Size = new System.Drawing.Size(140, 23);
            this.txtIpAddress.Text = "10.0.0.192";

            this.lblTcpPort.AutoSize = true;
            this.lblTcpPort.Location = new System.Drawing.Point(240, 8);
            this.lblTcpPort.Text = "Port:";
            this.nudPort.Location = new System.Drawing.Point(280, 5);
            this.nudPort.Size = new System.Drawing.Size(80, 23);
            this.nudPort.Maximum = 65535;
            this.nudPort.Minimum = 1;
            this.nudPort.Value = 9100;

            this.btnScanTcp.Location = new System.Drawing.Point(380, 4);
            this.btnScanTcp.Size = new System.Drawing.Size(80, 25);
            this.btnScanTcp.Text = "Scan";
            this.btnScanTcp.Click += new System.EventHandler(this.btnScanTcp_Click);

            this.cmbTcpDevices.Location = new System.Drawing.Point(470, 5);
            this.cmbTcpDevices.Size = new System.Drawing.Size(270, 23);
            this.cmbTcpDevices.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.cmbTcpDevices.SelectedIndexChanged += new System.EventHandler(this.cmbTcpDevices_SelectedIndexChanged);

            // ── pnlHid ─────────────────────────────────────────────────
            this.pnlHid.Controls.Add(this.lblDevicePath);
            this.pnlHid.Controls.Add(this.cmbHidDevices);
            this.pnlHid.Controls.Add(this.btnScanHid);
            this.pnlHid.Location = new System.Drawing.Point(15, 90);
            this.pnlHid.Name = "pnlHid";
            this.pnlHid.Size = new System.Drawing.Size(500, 50);
            this.pnlHid.TabIndex = 4;
            this.pnlHid.Visible = false;

            this.lblDevicePath.AutoSize = true;
            this.lblDevicePath.Location = new System.Drawing.Point(0, 8);
            this.lblDevicePath.Text = "Device:";
            this.cmbHidDevices.Location = new System.Drawing.Point(55, 5);
            this.cmbHidDevices.Size = new System.Drawing.Size(340, 23);
            this.cmbHidDevices.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.btnScanHid.Location = new System.Drawing.Point(400, 4);
            this.btnScanHid.Size = new System.Drawing.Size(80, 25);
            this.btnScanHid.Text = "Scan";
            this.btnScanHid.Click += new System.EventHandler(this.btnScanHid_Click);

            // btnConnect / btnDisconnect
            this.btnConnect.Location = new System.Drawing.Point(15, 160);
            this.btnConnect.Size = new System.Drawing.Size(100, 30);
            this.btnConnect.Text = "Connect";
            this.btnConnect.Click += new System.EventHandler(this.btnConnect_Click);

            this.btnDisconnect.Location = new System.Drawing.Point(125, 160);
            this.btnDisconnect.Size = new System.Drawing.Size(100, 30);
            this.btnDisconnect.Text = "Disconnect";
            this.btnDisconnect.Enabled = false;
            this.btnDisconnect.Click += new System.EventHandler(this.btnDisconnect_Click);

            // lblConnectionStatus
            this.lblConnectionStatus.AutoSize = true;
            this.lblConnectionStatus.Location = new System.Drawing.Point(240, 168);
            this.lblConnectionStatus.ForeColor = System.Drawing.Color.Gray;
            this.lblConnectionStatus.Text = "Not connected";
            this.lblConnectionStatus.Font = new System.Drawing.Font("Segoe UI", 9F, System.Drawing.FontStyle.Bold);

            // ── grpTicketSettings ───────────────────────────────────────
            this.grpTicketSettings.Controls.Add(this.lblTicketWidth);
            this.grpTicketSettings.Controls.Add(this.cmbTicketWidth);
            this.grpTicketSettings.Controls.Add(this.lblTicketLength);
            this.grpTicketSettings.Controls.Add(this.nudTicketLength);
            this.grpTicketSettings.Controls.Add(this.lblDpi);
            this.grpTicketSettings.Controls.Add(this.cmbDpi);
            this.grpTicketSettings.Controls.Add(this.lblTicketInfo);
            this.grpTicketSettings.Location = new System.Drawing.Point(15, 210);
            this.grpTicketSettings.Name = "grpTicketSettings";
            this.grpTicketSettings.Size = new System.Drawing.Size(760, 100);
            this.grpTicketSettings.TabIndex = 10;
            this.grpTicketSettings.TabStop = false;
            this.grpTicketSettings.Text = "Ticket Settings (for demo prints)";

            this.lblTicketWidth.AutoSize = true;
            this.lblTicketWidth.Location = new System.Drawing.Point(15, 30);
            this.lblTicketWidth.Text = "Width:";

            this.cmbTicketWidth.Location = new System.Drawing.Point(60, 27);
            this.cmbTicketWidth.Size = new System.Drawing.Size(120, 23);
            this.cmbTicketWidth.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.cmbTicketWidth.Items.AddRange(new object[] {
                "2\"", "2.125\"", "2.5\"", "2.7\"", "3.25\"", "4\"", "8\""
            });
            this.cmbTicketWidth.SelectedIndex = 4; // 3.25" default

            this.lblTicketLength.AutoSize = true;
            this.lblTicketLength.Location = new System.Drawing.Point(200, 30);
            this.lblTicketLength.Text = "Length:";

            this.nudTicketLength.Location = new System.Drawing.Point(250, 27);
            this.nudTicketLength.Size = new System.Drawing.Size(70, 23);
            this.nudTicketLength.DecimalPlaces = 1;
            this.nudTicketLength.Increment = 0.5M;
            this.nudTicketLength.Minimum = 1;
            this.nudTicketLength.Maximum = 24;
            this.nudTicketLength.Value = 8;

            this.lblDpi.AutoSize = true;
            this.lblDpi.Location = new System.Drawing.Point(340, 30);
            this.lblDpi.Text = "DPI:";

            this.cmbDpi.Location = new System.Drawing.Point(375, 27);
            this.cmbDpi.Size = new System.Drawing.Size(80, 23);
            this.cmbDpi.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.cmbDpi.Items.AddRange(new object[] { "200", "300", "600" });
            this.cmbDpi.SelectedIndex = 1; // 300 dpi default

            this.lblTicketInfo.AutoSize = true;
            this.lblTicketInfo.Location = new System.Drawing.Point(15, 65);
            this.lblTicketInfo.ForeColor = System.Drawing.Color.DimGray;
            this.lblTicketInfo.Text = "Set these to match your ticket stock. Demo tickets and layout demos scale to these dimensions.";

            // ── grpPrinterSettings ─────────────────────────────────────
            this.grpPrinterSettings.Controls.Add(this.btnSetUsbHid);
            this.grpPrinterSettings.Controls.Add(this.btnSetUsbSerial);
            this.grpPrinterSettings.Controls.Add(this.btnBluetoothOn);
            this.grpPrinterSettings.Controls.Add(this.btnBluetoothOff);
            this.grpPrinterSettings.Controls.Add(this.btnWifi);

            this.grpPrinterSettings.Controls.Add(this.lblUsbModeNote);
            this.grpPrinterSettings.Location = new System.Drawing.Point(15, 320);
            this.grpPrinterSettings.Name = "grpPrinterSettings";
            this.grpPrinterSettings.Size = new System.Drawing.Size(760, 70);
            this.grpPrinterSettings.TabIndex = 11;
            this.grpPrinterSettings.TabStop = false;
            this.grpPrinterSettings.Text = "Printer Controls";

            // Row 1: USB modes, Bluetooth, WiFi
            this.btnSetUsbHid.Location = new System.Drawing.Point(15, 22);
            this.btnSetUsbHid.Size = new System.Drawing.Size(95, 26);
            this.btnSetUsbHid.Text = "Set HID Mode";
            this.btnSetUsbHid.Click += new System.EventHandler(this.btnSetUsbHid_Click);

            this.btnSetUsbSerial.Location = new System.Drawing.Point(115, 22);
            this.btnSetUsbSerial.Size = new System.Drawing.Size(105, 26);
            this.btnSetUsbSerial.Text = "Set USB Serial";
            this.btnSetUsbSerial.Click += new System.EventHandler(this.btnSetUsbSerial_Click);

            this.btnBluetoothOn.Location = new System.Drawing.Point(230, 22);
            this.btnBluetoothOn.Size = new System.Drawing.Size(95, 26);
            this.btnBluetoothOn.Text = "Bluetooth On";
            this.btnBluetoothOn.Click += new System.EventHandler(this.btnBluetoothOn_Click);

            this.btnBluetoothOff.Location = new System.Drawing.Point(330, 22);
            this.btnBluetoothOff.Size = new System.Drawing.Size(95, 26);
            this.btnBluetoothOff.Text = "Bluetooth Off";
            this.btnBluetoothOff.Click += new System.EventHandler(this.btnBluetoothOff_Click);

            this.btnWifi.Location = new System.Drawing.Point(435, 22);
            this.btnWifi.Size = new System.Drawing.Size(80, 26);
            this.btnWifi.Text = "WiFi Setup";
            this.btnWifi.Click += new System.EventHandler(this.btnWifi_Click);

            // Row 2: Operations
            this.btnTestTicket.Location = new System.Drawing.Point(15, 54);
            this.btnTestTicket.Size = new System.Drawing.Size(105, 26);
            this.btnTestTicket.Text = "Boca Test Print";
            this.btnTestTicket.Click += new System.EventHandler(this.btnTestTicket_Click);


            this.lblUsbModeNote.AutoSize = true;
            this.lblUsbModeNote.Location = new System.Drawing.Point(15, 50);
            this.lblUsbModeNote.ForeColor = System.Drawing.Color.DimGray;
            this.lblUsbModeNote.Text = "Mode changes are stored in flash. The printer will reset and you will need to reconnect.";

            // ================================================================
            // tabText
            // ================================================================
            this.tabText.Controls.Add(this.lblRow);
            this.tabText.Controls.Add(this.nudRow);
            this.tabText.Controls.Add(this.lblCol);
            this.tabText.Controls.Add(this.nudCol);
            this.tabText.Controls.Add(this.lblFont);
            this.tabText.Controls.Add(this.cmbFont);
            this.tabText.Controls.Add(this.lblHeight);
            this.tabText.Controls.Add(this.nudHeight);
            this.tabText.Controls.Add(this.lblWidth);
            this.tabText.Controls.Add(this.nudWidth);
            this.tabText.Controls.Add(this.lblRotation);
            this.tabText.Controls.Add(this.cmbRotation);
            this.tabText.Controls.Add(this.txtContent);
            this.tabText.Controls.Add(this.btnPrintText);
            this.tabText.Controls.Add(this.grpBarcodes);
            this.tabText.Controls.Add(this.btnPrintDemoTicket);
            this.tabText.Controls.Add(this.btnTestAllFonts);
            this.tabText.Location = new System.Drawing.Point(4, 24);
            this.tabText.Name = "tabText";
            this.tabText.Padding = new System.Windows.Forms.Padding(10);
            this.tabText.Size = new System.Drawing.Size(802, 432);
            this.tabText.TabIndex = 1;
            this.tabText.Text = "Text && Barcodes";
            this.tabText.UseVisualStyleBackColor = true;

            // Row / Column
            this.lblRow.AutoSize = true;
            this.lblRow.Location = new System.Drawing.Point(15, 18);
            this.lblRow.Text = "Row:";
            this.nudRow.Location = new System.Drawing.Point(55, 15);
            this.nudRow.Size = new System.Drawing.Size(70, 23);
            this.nudRow.Maximum = 9999;

            this.lblCol.AutoSize = true;
            this.lblCol.Location = new System.Drawing.Point(140, 18);
            this.lblCol.Text = "Col:";
            this.nudCol.Location = new System.Drawing.Point(170, 15);
            this.nudCol.Size = new System.Drawing.Size(70, 23);
            this.nudCol.Maximum = 9999;

            // Font
            this.lblFont.AutoSize = true;
            this.lblFont.Location = new System.Drawing.Point(260, 18);
            this.lblFont.Text = "Font:";
            this.cmbFont.Location = new System.Drawing.Point(300, 15);
            this.cmbFont.Size = new System.Drawing.Size(90, 23);
            this.cmbFont.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.cmbFont.Items.AddRange(new object[] {
                "Font 1", "Font 2", "Font 3", "Font 4", "Font 5", "Font 6",
                "Font 7", "Font 8", "Font 9", "Font 10", "Font 11", "Font 12", "Font 13"
            });
            this.cmbFont.SelectedIndex = 2; // Font 3 default

            // Height / Width multiplier
            this.lblHeight.AutoSize = true;
            this.lblHeight.Location = new System.Drawing.Point(410, 18);
            this.lblHeight.Text = "H:";
            this.nudHeight.Location = new System.Drawing.Point(430, 15);
            this.nudHeight.Size = new System.Drawing.Size(50, 23);
            this.nudHeight.Minimum = 1;
            this.nudHeight.Maximum = 16;
            this.nudHeight.Value = 1;

            this.lblWidth.AutoSize = true;
            this.lblWidth.Location = new System.Drawing.Point(495, 18);
            this.lblWidth.Text = "W:";
            this.nudWidth.Location = new System.Drawing.Point(518, 15);
            this.nudWidth.Size = new System.Drawing.Size(50, 23);
            this.nudWidth.Minimum = 1;
            this.nudWidth.Maximum = 16;
            this.nudWidth.Value = 1;

            // Rotation
            this.lblRotation.AutoSize = true;
            this.lblRotation.Location = new System.Drawing.Point(585, 18);
            this.lblRotation.Text = "Rotation:";
            this.cmbRotation.Location = new System.Drawing.Point(645, 15);
            this.cmbRotation.Size = new System.Drawing.Size(90, 23);
            this.cmbRotation.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.cmbRotation.Items.AddRange(new object[] { "Normal", "Right", "Inverted", "Left" });
            this.cmbRotation.SelectedIndex = 0;

            // Text content
            this.txtContent.Location = new System.Drawing.Point(15, 50);
            this.txtContent.Size = new System.Drawing.Size(620, 80);
            this.txtContent.Multiline = true;
            this.txtContent.ScrollBars = System.Windows.Forms.ScrollBars.Vertical;
            this.txtContent.Text = "Hello from Boca SDK!";

            // btnPrintText
            this.btnPrintText.Location = new System.Drawing.Point(650, 50);
            this.btnPrintText.Size = new System.Drawing.Size(120, 35);
            this.btnPrintText.Text = "Print Text";
            this.btnPrintText.Click += new System.EventHandler(this.btnPrintText_Click);

            // ── Barcodes GroupBox ───────────────────────────────────────
            this.grpBarcodes.Controls.Add(this.lblBarcodeType);
            this.grpBarcodes.Controls.Add(this.cmbBarcodeType);
            this.grpBarcodes.Controls.Add(this.lblBarcodeData);
            this.grpBarcodes.Controls.Add(this.txtBarcodeData);
            this.grpBarcodes.Controls.Add(this.chkInterpretation);
            this.grpBarcodes.Controls.Add(this.btnPrintBarcode);
            this.grpBarcodes.Location = new System.Drawing.Point(15, 145);
            this.grpBarcodes.Size = new System.Drawing.Size(755, 120);
            this.grpBarcodes.Text = "Barcodes";

            this.lblBarcodeType.AutoSize = true;
            this.lblBarcodeType.Location = new System.Drawing.Point(15, 28);
            this.lblBarcodeType.Text = "Type:";
            this.cmbBarcodeType.Location = new System.Drawing.Point(60, 25);
            this.cmbBarcodeType.Size = new System.Drawing.Size(140, 23);
            this.cmbBarcodeType.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.cmbBarcodeType.Items.AddRange(new object[] {
                "Code 128", "Code 39", "I2of5", "UPC-A", "EAN-13",
                "Codabar", "QR Code", "Data Matrix", "PDF-417", "Aztec"
            });
            this.cmbBarcodeType.SelectedIndex = 0;
            this.cmbBarcodeType.SelectedIndexChanged += new System.EventHandler(this.cmbBarcodeType_SelectedIndexChanged);

            this.lblBarcodeData.AutoSize = true;
            this.lblBarcodeData.Location = new System.Drawing.Point(220, 28);
            this.lblBarcodeData.Text = "Data:";
            this.txtBarcodeData.Location = new System.Drawing.Point(260, 25);
            this.txtBarcodeData.Size = new System.Drawing.Size(260, 23);
            this.txtBarcodeData.Text = "BOCA-2026-001234";

            this.chkInterpretation.AutoSize = true;
            this.chkInterpretation.Location = new System.Drawing.Point(15, 65);
            this.chkInterpretation.Text = "Show interpretation line";
            this.chkInterpretation.Checked = true;

            this.btnPrintBarcode.Location = new System.Drawing.Point(540, 25);
            this.btnPrintBarcode.Size = new System.Drawing.Size(120, 35);
            this.btnPrintBarcode.Text = "Print Barcode";
            this.btnPrintBarcode.Click += new System.EventHandler(this.btnPrintBarcode_Click);

            // btnPrintDemoTicket
            this.btnPrintDemoTicket.Location = new System.Drawing.Point(15, 285);
            this.btnPrintDemoTicket.Size = new System.Drawing.Size(160, 40);
            this.btnPrintDemoTicket.Text = "Print Demo Ticket";
            this.btnPrintDemoTicket.Font = new System.Drawing.Font("Segoe UI", 9F, System.Drawing.FontStyle.Bold);
            this.btnPrintDemoTicket.Click += new System.EventHandler(this.btnPrintDemoTicket_Click);

            // btnTestAllFonts
            this.btnTestAllFonts.Location = new System.Drawing.Point(190, 285);
            this.btnTestAllFonts.Size = new System.Drawing.Size(160, 40);
            this.btnTestAllFonts.Text = "Test All Fonts";
            this.btnTestAllFonts.Font = new System.Drawing.Font("Segoe UI", 9F, System.Drawing.FontStyle.Bold);
            this.btnTestAllFonts.Click += new System.EventHandler(this.btnTestAllFonts_Click);


            // ================================================================
            // tabGraphics
            // ================================================================
            this.tabGraphics.Controls.Add(this.btnBrowseImage);
            this.tabGraphics.Controls.Add(this.lblImagePath);
            this.tabGraphics.Controls.Add(this.lblDither);
            this.tabGraphics.Controls.Add(this.cmbDither);
            this.tabGraphics.Controls.Add(this.picPreview);
            this.tabGraphics.Controls.Add(this.lblDitherPreview);
            this.tabGraphics.Controls.Add(this.picDitherPreview);
            this.tabGraphics.Controls.Add(this.btnPrintImage);
            this.tabGraphics.Controls.Add(this.btnDownloadToMemory);
            this.tabGraphics.Controls.Add(this.lblHidGraphicsWarning);
            this.tabGraphics.Location = new System.Drawing.Point(4, 24);
            this.tabGraphics.Name = "tabGraphics";
            this.tabGraphics.Padding = new System.Windows.Forms.Padding(10);
            this.tabGraphics.Size = new System.Drawing.Size(802, 432);
            this.tabGraphics.TabIndex = 2;
            this.tabGraphics.Text = "Graphics";
            this.tabGraphics.UseVisualStyleBackColor = true;

            this.btnBrowseImage.Location = new System.Drawing.Point(15, 15);
            this.btnBrowseImage.Size = new System.Drawing.Size(100, 28);
            this.btnBrowseImage.Text = "Browse...";
            this.btnBrowseImage.Click += new System.EventHandler(this.btnBrowseImage_Click);

            this.lblImagePath.AutoSize = true;
            this.lblImagePath.Location = new System.Drawing.Point(125, 21);
            this.lblImagePath.Text = "(no image selected)";
            this.lblImagePath.ForeColor = System.Drawing.Color.Gray;

            this.lblDither.AutoSize = true;
            this.lblDither.Location = new System.Drawing.Point(15, 55);
            this.lblDither.Text = "Dither Algorithm:";
            this.cmbDither.Location = new System.Drawing.Point(125, 52);
            this.cmbDither.Size = new System.Drawing.Size(180, 23);
            this.cmbDither.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.cmbDither.Items.AddRange(new object[] {
                "Ordered Bayer", "Floyd-Steinberg", "Stucki",
                "Clustered Dot", "Blue Noise", "Riemersma-Hilbert"
            });
            this.cmbDither.SelectedIndex = 5; // default to Riemersma-Hilbert

            this.lblOriginalPreview = new System.Windows.Forms.Label();
            this.lblOriginalPreview.AutoSize = true;
            this.lblOriginalPreview.Location = new System.Drawing.Point(15, 92);
            this.lblOriginalPreview.Text = "Original:";
            this.tabGraphics.Controls.Add(this.lblOriginalPreview);

            this.picPreview.Location = new System.Drawing.Point(15, 110);
            this.picPreview.Size = new System.Drawing.Size(300, 300);
            this.picPreview.SizeMode = System.Windows.Forms.PictureBoxSizeMode.Zoom;
            this.picPreview.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;

            this.lblDitherPreview.AutoSize = true;
            this.lblDitherPreview.Location = new System.Drawing.Point(330, 92);
            this.lblDitherPreview.Text = "Dithered Preview:";

            this.picDitherPreview.Location = new System.Drawing.Point(330, 110);
            this.picDitherPreview.Size = new System.Drawing.Size(300, 300);
            this.picDitherPreview.SizeMode = System.Windows.Forms.PictureBoxSizeMode.Zoom;
            this.picDitherPreview.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;

            this.cmbDither.SelectedIndexChanged += new System.EventHandler(this.cmbDither_SelectedIndexChanged);

            this.btnPrintImage.Location = new System.Drawing.Point(645, 110);
            this.btnPrintImage.Size = new System.Drawing.Size(140, 35);
            this.btnPrintImage.Text = "Print Image";
            this.btnPrintImage.Click += new System.EventHandler(this.btnPrintImage_Click);

            this.btnDownloadToMemory.Location = new System.Drawing.Point(645, 155);
            this.btnDownloadToMemory.Size = new System.Drawing.Size(140, 35);
            this.btnDownloadToMemory.Text = "Download to Memory";
            this.btnDownloadToMemory.Click += new System.EventHandler(this.btnDownloadToMemory_Click);

            this.lblHidGraphicsWarning.Location = new System.Drawing.Point(320, 52);
            this.lblHidGraphicsWarning.AutoSize = true;
            this.lblHidGraphicsWarning.MaximumSize = new System.Drawing.Size(470, 0);
            this.lblHidGraphicsWarning.Text = "HID mode: Graphics will be slower due to 32-byte packet chunking. " +
                "Use compressed formats (PCX/PNG) for best results. TCP or Serial is faster for large images.";
            this.lblHidGraphicsWarning.ForeColor = System.Drawing.Color.DarkGoldenrod;
            this.lblHidGraphicsWarning.Font = new System.Drawing.Font("Segoe UI", 9F, System.Drawing.FontStyle.Italic);
            this.lblHidGraphicsWarning.Visible = false;

            // ================================================================
            // grpDiagnostics — always-visible panel below the tabs
            // ================================================================
            this.grpDiagnostics.Controls.Add(this.btnQueryStatus);
            this.grpDiagnostics.Controls.Add(this.btnQueryFirmware);
            this.grpDiagnostics.Controls.Add(this.btnQuerySpace);
            this.grpDiagnostics.Controls.Add(this.lblStatus);
            this.grpDiagnostics.Controls.Add(this.lblRawFgl);
            this.grpDiagnostics.Controls.Add(this.txtRawFgl);
            this.grpDiagnostics.Controls.Add(this.btnSendRaw);
            this.grpDiagnostics.Controls.Add(this.txtLog);
            this.grpDiagnostics.Controls.Add(this.btnClearMemory);
            this.grpDiagnostics.Controls.Add(this.btnTestTicket);
            this.grpDiagnostics.Controls.Add(this.btnPurge);
            this.grpDiagnostics.Controls.Add(this.btnStopPurge);
            this.grpDiagnostics.Controls.Add(this.btnClearLog);
            this.grpDiagnostics.Location = new System.Drawing.Point(12, 478);
            this.grpDiagnostics.Name = "grpDiagnostics";
            this.grpDiagnostics.Size = new System.Drawing.Size(810, 280);
            this.grpDiagnostics.TabIndex = 1;
            this.grpDiagnostics.TabStop = false;
            this.grpDiagnostics.Text = "Diagnostics";

            this.btnQueryStatus.Location = new System.Drawing.Point(10, 22);
            this.btnQueryStatus.Size = new System.Drawing.Size(95, 26);
            this.btnQueryStatus.Text = "Query Status";
            this.btnQueryStatus.Click += new System.EventHandler(this.btnQueryStatus_Click);

            this.btnQueryFirmware.Location = new System.Drawing.Point(112, 22);
            this.btnQueryFirmware.Size = new System.Drawing.Size(105, 26);
            this.btnQueryFirmware.Text = "Query Firmware";
            this.btnQueryFirmware.Click += new System.EventHandler(this.btnQueryFirmware_Click);

            this.btnQuerySpace.Location = new System.Drawing.Point(224, 22);
            this.btnQuerySpace.Size = new System.Drawing.Size(95, 26);
            this.btnQuerySpace.Text = "Query Space";
            this.btnQuerySpace.Click += new System.EventHandler(this.btnQuerySpace_Click);

            this.btnClearMemory.Location = new System.Drawing.Point(326, 22);
            this.btnClearMemory.Size = new System.Drawing.Size(100, 26);
            this.btnClearMemory.Text = "Clear Memory";
            this.btnClearMemory.Click += new System.EventHandler(this.btnClearMemory_Click);

            this.btnTestTicket.Location = new System.Drawing.Point(433, 22);
            this.btnTestTicket.Size = new System.Drawing.Size(95, 26);
            this.btnTestTicket.Text = "Boca Test Print";
            this.btnTestTicket.Click += new System.EventHandler(this.btnTestTicket_Click);

            this.btnPurge.Location = new System.Drawing.Point(533, 22);
            this.btnPurge.Size = new System.Drawing.Size(90, 26);
            this.btnPurge.Text = "Purge";
            this.btnPurge.Click += new System.EventHandler(this.btnPurge_Click);

            this.btnStopPurge.Location = new System.Drawing.Point(628, 22);
            this.btnStopPurge.Size = new System.Drawing.Size(120, 26);
            this.btnStopPurge.Text = "Stop Purge + Align";
            this.btnStopPurge.Click += new System.EventHandler(this.btnStopPurge_Click);

            this.lblStatus.AutoSize = true;
            this.lblStatus.Location = new System.Drawing.Point(10, 56);
            this.lblStatus.Text = "";
            this.lblStatus.Font = new System.Drawing.Font("Segoe UI", 9F, System.Drawing.FontStyle.Bold);

            // Raw FGL
            this.lblRawFgl.AutoSize = true;
            this.lblRawFgl.Location = new System.Drawing.Point(10, 78);
            this.lblRawFgl.Text = "Raw FGL:";
            this.txtRawFgl.Location = new System.Drawing.Point(75, 75);
            this.txtRawFgl.Size = new System.Drawing.Size(540, 23);
            this.txtRawFgl.Text = "<S1>";

            this.btnSendRaw.Location = new System.Drawing.Point(622, 73);
            this.btnSendRaw.Size = new System.Drawing.Size(60, 26);
            this.btnSendRaw.Text = "Send";
            this.btnSendRaw.Click += new System.EventHandler(this.btnSendRaw_Click);

            this.btnClearLog.Location = new System.Drawing.Point(690, 73);
            this.btnClearLog.Size = new System.Drawing.Size(70, 26);
            this.btnClearLog.Text = "Clear Log";
            this.btnClearLog.Click += new System.EventHandler(this.btnClearLog_Click);

            // Log area
            this.txtLog.Location = new System.Drawing.Point(10, 104);
            this.txtLog.Size = new System.Drawing.Size(790, 168);
            this.txtLog.Multiline = true;
            this.txtLog.ReadOnly = true;
            this.txtLog.ScrollBars = System.Windows.Forms.ScrollBars.Vertical;
            this.txtLog.Font = new System.Drawing.Font("Consolas", 8.5F);
            this.txtLog.BackColor = System.Drawing.Color.Black;
            this.txtLog.ForeColor = System.Drawing.Color.LightGreen;

            // ================================================================
            // MainForm
            // ================================================================
            this.AutoScaleDimensions = new System.Drawing.SizeF(7F, 15F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(834, 768);
            this.Controls.Add(this.tabControl);
            this.Controls.Add(this.grpDiagnostics);
            this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedSingle;
            this.MaximizeBox = false;
            this.Name = "MainForm";
            this.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
            this.Text = "Boca Systems SDK Sample";

            this.tabControl.ResumeLayout(false);
            this.tabConnection.ResumeLayout(false);
            this.tabConnection.PerformLayout();
            this.tabText.ResumeLayout(false);
            this.tabText.PerformLayout();
            this.tabGraphics.ResumeLayout(false);
            this.tabGraphics.PerformLayout();
            this.grpDiagnostics.ResumeLayout(false);
            this.grpDiagnostics.PerformLayout();
            this.grpConnectionType.ResumeLayout(false);
            this.grpConnectionType.PerformLayout();
            this.grpPrinterSettings.ResumeLayout(false);
            this.grpPrinterSettings.PerformLayout();
            this.pnlSerial.ResumeLayout(false);
            this.pnlSerial.PerformLayout();
            this.pnlTcp.ResumeLayout(false);
            this.pnlTcp.PerformLayout();
            this.pnlHid.ResumeLayout(false);
            this.pnlHid.PerformLayout();
            this.grpTicketSettings.ResumeLayout(false);
            this.grpTicketSettings.PerformLayout();
            this.grpBarcodes.ResumeLayout(false);
            this.grpBarcodes.PerformLayout();
            ((System.ComponentModel.ISupportInitialize)this.nudBaud).EndInit();
            ((System.ComponentModel.ISupportInitialize)this.nudTicketLength).EndInit();
            ((System.ComponentModel.ISupportInitialize)this.nudPort).EndInit();
            ((System.ComponentModel.ISupportInitialize)this.nudRow).EndInit();
            ((System.ComponentModel.ISupportInitialize)this.nudCol).EndInit();
            ((System.ComponentModel.ISupportInitialize)this.nudHeight).EndInit();
            ((System.ComponentModel.ISupportInitialize)this.nudWidth).EndInit();
            ((System.ComponentModel.ISupportInitialize)this.picPreview).EndInit();
            ((System.ComponentModel.ISupportInitialize)this.picDitherPreview).EndInit();
            this.ResumeLayout(false);
        }

        #endregion

        private System.Windows.Forms.TabControl tabControl;
        private System.Windows.Forms.TabPage tabConnection;
        private System.Windows.Forms.TabPage tabText;
        private System.Windows.Forms.TabPage tabGraphics;
        // Connection
        private System.Windows.Forms.GroupBox grpConnectionType;
        private System.Windows.Forms.RadioButton rbSerial;
        private System.Windows.Forms.RadioButton rbTcp;
        private System.Windows.Forms.RadioButton rbHid;

        private System.Windows.Forms.Panel pnlSerial;
        private System.Windows.Forms.ComboBox cmbPorts;
        private System.Windows.Forms.Button btnScanPorts;
        private System.Windows.Forms.NumericUpDown nudBaud;
        private System.Windows.Forms.Label lblBaud;
        private System.Windows.Forms.Label lblPort;

        private System.Windows.Forms.Panel pnlTcp;
        private System.Windows.Forms.TextBox txtIpAddress;
        private System.Windows.Forms.NumericUpDown nudPort;
        private System.Windows.Forms.Label lblIpAddress;
        private System.Windows.Forms.Label lblTcpPort;
        private System.Windows.Forms.Button btnScanTcp;
        private System.Windows.Forms.ComboBox cmbTcpDevices;

        private System.Windows.Forms.Panel pnlHid;
        private System.Windows.Forms.ComboBox cmbHidDevices;
        private System.Windows.Forms.Button btnScanHid;
        private System.Windows.Forms.Label lblDevicePath;

        private System.Windows.Forms.Button btnConnect;
        private System.Windows.Forms.Button btnDisconnect;
        private System.Windows.Forms.Label lblConnectionStatus;

        // Ticket Settings
        private System.Windows.Forms.GroupBox grpTicketSettings;
        private System.Windows.Forms.Label lblTicketWidth;
        private System.Windows.Forms.ComboBox cmbTicketWidth;
        private System.Windows.Forms.Label lblTicketLength;
        private System.Windows.Forms.NumericUpDown nudTicketLength;
        private System.Windows.Forms.Label lblDpi;
        private System.Windows.Forms.ComboBox cmbDpi;
        private System.Windows.Forms.Label lblTicketInfo;

        // Printer Settings
        private System.Windows.Forms.GroupBox grpPrinterSettings;
        private System.Windows.Forms.Button btnSetUsbHid;
        private System.Windows.Forms.Button btnSetUsbSerial;
        private System.Windows.Forms.Button btnBluetoothOn;
        private System.Windows.Forms.Button btnBluetoothOff;
        private System.Windows.Forms.Button btnWifi;
        private System.Windows.Forms.Button btnTestTicket;
        private System.Windows.Forms.Button btnStopPurge;
        private System.Windows.Forms.Label lblUsbModeNote;

        // Text & Barcodes
        private System.Windows.Forms.Label lblRow;
        private System.Windows.Forms.Label lblCol;
        private System.Windows.Forms.NumericUpDown nudRow;
        private System.Windows.Forms.NumericUpDown nudCol;
        private System.Windows.Forms.Label lblFont;
        private System.Windows.Forms.ComboBox cmbFont;
        private System.Windows.Forms.Label lblHeight;
        private System.Windows.Forms.Label lblWidth;
        private System.Windows.Forms.NumericUpDown nudHeight;
        private System.Windows.Forms.NumericUpDown nudWidth;
        private System.Windows.Forms.Label lblRotation;
        private System.Windows.Forms.ComboBox cmbRotation;
        private System.Windows.Forms.TextBox txtContent;
        private System.Windows.Forms.Button btnPrintText;

        private System.Windows.Forms.GroupBox grpBarcodes;
        private System.Windows.Forms.Label lblBarcodeType;
        private System.Windows.Forms.ComboBox cmbBarcodeType;
        private System.Windows.Forms.Label lblBarcodeData;
        private System.Windows.Forms.TextBox txtBarcodeData;
        private System.Windows.Forms.CheckBox chkInterpretation;
        private System.Windows.Forms.Button btnPrintBarcode;

        private System.Windows.Forms.Button btnPrintDemoTicket;
        private System.Windows.Forms.Button btnTestAllFonts;

        // Graphics
        private System.Windows.Forms.Button btnBrowseImage;
        private System.Windows.Forms.Label lblImagePath;
        private System.Windows.Forms.Label lblDither;
        private System.Windows.Forms.ComboBox cmbDither;
        private System.Windows.Forms.PictureBox picPreview;
        private System.Windows.Forms.Label lblOriginalPreview;
        private System.Windows.Forms.Label lblDitherPreview;
        private System.Windows.Forms.PictureBox picDitherPreview;
        private System.Windows.Forms.Button btnPrintImage;
        private System.Windows.Forms.Button btnDownloadToMemory;
        private System.Windows.Forms.Label lblHidGraphicsWarning;

        // Diagnostics panel
        private System.Windows.Forms.GroupBox grpDiagnostics;
        private System.Windows.Forms.Button btnQueryStatus;
        private System.Windows.Forms.Button btnQueryFirmware;
        private System.Windows.Forms.Button btnQuerySpace;
        private System.Windows.Forms.Label lblStatus;
        private System.Windows.Forms.Label lblRawFgl;
        private System.Windows.Forms.TextBox txtRawFgl;
        private System.Windows.Forms.Button btnSendRaw;
        private System.Windows.Forms.TextBox txtLog;
        private System.Windows.Forms.Button btnClearMemory;
        private System.Windows.Forms.Button btnPurge;
        private System.Windows.Forms.Button btnClearLog;
    }
}
