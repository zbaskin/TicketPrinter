using BocaSystems.Sdk;
using Xunit;

namespace BocaSystems.Sdk.Tests
{
    public class DrawingCommandTests
    {
        private readonly MockTransport _mock = new();
        private BocaPrinter CreatePrinter() => new(_mock);

        [Fact]
        public void SetLineThickness_sends_LT_command()
        {
            using var p = CreatePrinter();
            p.SetLineThickness(4);
            Assert.Equal("<LT4>", _mock.LastCommand);
        }

        [Fact]
        public void SetLineThickness_rejects_zero()
        {
            using var p = CreatePrinter();
            Assert.Throws<BocaPrinterException>(() => p.SetLineThickness(0));
        }

        [Fact]
        public void DrawBox_sends_BX_command()
        {
            using var p = CreatePrinter();
            p.DrawBox(100, 200);
            Assert.Equal("<BX100,200>", _mock.LastCommand);
        }

        [Fact]
        public void DrawBoxAt_sends_position_then_box()
        {
            using var p = CreatePrinter();
            p.DrawBoxAt(10, 20, 100, 200, thickness: 3);
            Assert.Equal("<RC10,20><LT3><BX100,200>", _mock.AllCommands);
        }

        [Fact]
        public void DrawVerticalLine_sends_VX_command()
        {
            using var p = CreatePrinter();
            p.DrawVerticalLine(150);
            Assert.Equal("<VX150>", _mock.LastCommand);
        }

        [Fact]
        public void DrawHorizontalLine_sends_HX_command()
        {
            using var p = CreatePrinter();
            p.DrawHorizontalLine(300);
            Assert.Equal("<HX300>", _mock.LastCommand);
        }

        [Fact]
        public void DrawVerticalLineAt_combines_position_thickness_and_line()
        {
            using var p = CreatePrinter();
            p.DrawVerticalLineAt(5, 10, 200, thickness: 2);
            Assert.Equal("<RC5,10><LT2><VX200>", _mock.AllCommands);
        }

        [Fact]
        public void Shading_commands()
        {
            using var p = CreatePrinter();
            p.SetShadingPattern(5);
            p.SetShadingForeground();
            p.EnableShading();
            p.PrintText("SHADED");
            p.DisableShading();

            Assert.Equal("<PA5><PAF><ES>SHADED<DS>", _mock.AllCommands);
        }
    }
}
