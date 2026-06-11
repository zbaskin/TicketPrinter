using BocaSystems.Sdk;
using BocaSystems.Sdk.Models;
using Xunit;

namespace BocaSystems.Sdk.Tests
{
    public class TextCommandTests
    {
        private readonly MockTransport _mock = new();
        private BocaPrinter CreatePrinter() => new(_mock);

        [Fact]
        public void SetRowColumn_sends_RC_command()
        {
            using var p = CreatePrinter();
            p.SetRowColumn(100, 250);
            Assert.Equal("<RC100,250>", _mock.LastCommand);
        }

        [Fact]
        public void SetStartPoint_sends_SP_command()
        {
            using var p = CreatePrinter();
            p.SetStartPoint(50, 75);
            Assert.Equal("<SP50,75>", _mock.LastCommand);
        }

        [Theory]
        [InlineData(1, "<F1>")]
        [InlineData(3, "<F3>")]
        [InlineData(12, "<F12>")]
        [InlineData(16, "<F16>")]
        public void SetFont_sends_correct_font_command(int font, string expected)
        {
            using var p = CreatePrinter();
            p.SetFont(font);
            Assert.Equal(expected, _mock.LastCommand);
        }

        [Fact]
        public void SetFont_rejects_out_of_range()
        {
            using var p = CreatePrinter();
            Assert.Throws<BocaPrinterException>(() => p.SetFont(0));
            Assert.Throws<BocaPrinterException>(() => p.SetFont(17));
        }

        [Fact]
        public void SetTrueTypeFont_sends_RTF_command()
        {
            using var p = CreatePrinter();
            p.SetTrueTypeFont(3, 24);
            Assert.Equal("<RTF3,24>", _mock.LastCommand);
        }

        [Fact]
        public void SetHeightWidth_sends_HW_command()
        {
            using var p = CreatePrinter();
            p.SetHeightWidth(2, 3);
            Assert.Equal("<HW2,3>", _mock.LastCommand);
        }

        [Fact]
        public void SetBoxSize_sends_BS_command()
        {
            using var p = CreatePrinter();
            p.SetBoxSize(22, 35);
            Assert.Equal("<BS22,35>", _mock.LastCommand);
        }

        [Fact]
        public void SetScaleDown_sends_SD_command()
        {
            using var p = CreatePrinter();
            p.SetScaleDown(3);
            Assert.Equal("<SD3>", _mock.LastCommand);
        }

        [Theory]
        [InlineData(Rotation.Normal, "<NR>")]
        [InlineData(Rotation.Right, "<RR>")]
        [InlineData(Rotation.Inverted, "<RU>")]
        [InlineData(Rotation.Left, "<RL>")]
        public void SetRotation_sends_correct_command(Rotation rot, string expected)
        {
            using var p = CreatePrinter();
            p.SetRotation(rot);
            Assert.Equal(expected, _mock.LastCommand);
        }

        [Fact]
        public void EnableInverse_and_DisableInverse()
        {
            using var p = CreatePrinter();
            p.EnableInverse();
            Assert.Equal("<EI>", _mock.SentStrings[0]);
            p.DisableInverse();
            Assert.Equal("<DI>", _mock.SentStrings[1]);
        }

        [Fact]
        public void PrintCenteredText_sends_CTR_with_tilde_delimiters()
        {
            using var p = CreatePrinter();
            p.PrintCenteredText(1000, "Centered Text");
            Assert.Equal("<CTR1000>~Centered Text~", _mock.LastCommand);
        }

        [Fact]
        public void PrintRightJustifiedText_sends_RTJ_with_tilde_delimiters()
        {
            using var p = CreatePrinter();
            p.PrintRightJustifiedText(300, "Testing");
            Assert.Equal("<RTJ300>~Testing~", _mock.LastCommand);
        }

        [Fact]
        public void PrintText_sends_literal_text()
        {
            using var p = CreatePrinter();
            p.PrintText("HELLO WORLD");
            Assert.Equal("HELLO WORLD", _mock.LastCommand);
        }

        [Fact]
        public void PrintTextAt_combines_position_font_and_text()
        {
            using var p = CreatePrinter();
            p.PrintTextAt(100, 200, "ADMIT ONE", font: 6);
            Assert.Equal("<RC100,200><F6>ADMIT ONE", _mock.LastCommand);
        }

        [Fact]
        public void PrintTextAt_with_rotation_and_size()
        {
            using var p = CreatePrinter();
            p.PrintTextAt(50, 30, "VIP", font: 3, Rotation.Right, heightMultiplier: 2, widthMultiplier: 2);
            Assert.Equal("<RC50,30><RR><HW2,2><F3>VIP", _mock.LastCommand);
        }
    }
}
