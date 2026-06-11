import { describe, it, expect } from 'vitest'
import { compile, compileBatch, compileWithCopies } from '../compiler'
import type { TicketDocument } from '../types'

const base: TicketDocument = { stock: 'CONCERT', elements: [] }

describe('compile', () => {
  it('wraps output in NF and p, no HEAT command', () => {
    const result = compile(base)
    expect(result).toContain('<NF>')
    expect(result).toContain('<p>')
    expect(result).not.toContain('<HEAT')
    expect(result.indexOf('<NF>')).toBeLessThan(result.indexOf('<p>'))
  })

  it('CONCERT compile emits form-length command FL3300 immediately after NF', () => {
    const result = compile(base)
    expect(result).toContain('<NF><FL3300>')
  })

  it('returns rawFglOverride verbatim when set', () => {
    const result = compile({ ...base, rawFglOverride: '<NF>CUSTOM<p>' })
    expect(result).toBe('<NF>CUSTOM<p>')
  })

  it('compiles a text element using RC positioning', () => {
    const result = compile({
      ...base,
      elements: [{ type: 'text', row: 100, col: 200, font: 3, content: 'Hello' }]
    })
    expect(result).toContain('<F3>')
    expect(result).toContain('<RC100,200>')
    expect(result).toContain('Hello')
    // Must NOT use the old <r####> or <c####> format
    expect(result).not.toMatch(/<r\d{4}>/)
    expect(result).not.toMatch(/<c\d{4}>/)
  })

  it('emits HW with height first, width second (FGL spec order)', () => {
    // hwScale = [widthMult, heightMult] internally → FGL outputs <HW heightMult,widthMult>
    const result = compile({
      ...base,
      elements: [{ type: 'text', row: 50, col: 50, font: 1, hwScale: [2, 4], content: 'X' }]
    })
    expect(result).toContain('<HW4,2>') // height=4, width=2
  })

  it('emits symmetric HW unchanged', () => {
    const result = compile({
      ...base,
      elements: [{ type: 'text', row: 50, col: 50, font: 3, hwScale: [3, 3], content: 'Y' }]
    })
    expect(result).toContain('<HW3,3>')
  })

  it('compiles a horizontal line with LH and col_end (not length)', () => {
    const result = compile({
      ...base,
      elements: [{ type: 'hline', row: 200, col: 100, length: 500, thickness: 1 }]
    })
    // <LH row,colStart,colEnd,thickness>  colEnd = 100+500 = 600
    expect(result).toContain('<LH200,100,600,1>')
  })

  it('compiles a thick horizontal line as LH with larger thickness', () => {
    const result = compile({
      ...base,
      elements: [{ type: 'hline', row: 200, col: 100, length: 500, thickness: 4 }]
    })
    expect(result).toContain('<LH200,100,600,4>')
  })

  it('compiles a vertical line with LV (col is first parameter)', () => {
    const result = compile({
      ...base,
      elements: [{ type: 'vline', row: 100, col: 300, height: 400, thickness: 1 }]
    })
    // <LV col,rowStart,rowEnd,thickness>  rowEnd = 100+400 = 500
    expect(result).toContain('<LV300,100,500,1>')
  })

  it('compiles an outline box with BX (corner coordinates)', () => {
    const result = compile({
      ...base,
      elements: [{ type: 'box', row: 50, col: 50, width: 200, height: 100, thickness: 3 }]
    })
    // <BX row1,col1,row2,col2>  row2=50+100=150, col2=50+200=250
    expect(result).toContain('<BX50,50,150,250>')
  })

  it('compiles a filled box as a thick LH line', () => {
    const result = compile({
      ...base,
      elements: [{ type: 'box', row: 50, col: 50, width: 200, height: 100, thickness: 1, fill: true }]
    })
    // <LH row,colStart,colEnd,height>  colEnd=50+200=250, height=100 as thickness
    expect(result).toContain('<LH50,50,250,100>')
  })

  it('compiles QR as LH commands (one per dark module)', () => {
    const result = compile({
      ...base,
      elements: [{ type: 'qr', row: 100, col: 100, content: 'https://example.com', dotSize: 6 }]
    })
    // Each QR dot = <LH row,col,col+6,6>
    expect(result).toMatch(/<LH\d+,\d+,\d+,6>/)
    expect(result).not.toContain('<bf')
  })

  it('compiles rotation using per-ticket commands and resets with NR', () => {
    const result = compile({
      ...base,
      elements: [{ type: 'text', row: 100, col: 100, font: 3, rotation: 90, content: 'Rotated' }]
    })
    expect(result).toContain('<RR>')
    expect(result).toContain('<NR>')
    expect(result).not.toContain('<rte>')
  })
})

const cinema: TicketDocument = { stock: 'CINEMA', elements: [] }

describe('compile CINEMA coordinate swap', () => {
  // CINEMA physical: FGL row = horizontal (3.25" = 0-1950), FGL col = vertical (2" = 0-1200).
  // Canvas: col = horizontal (el.col), row = vertical (el.row).
  // Empirically confirmed: FGL col=0 is at the physical BOTTOM; increasing col moves UPWARD.
  // Transform: FGL_row = canvas_col, FGL_col = 1200 - canvas_row (inverted).
  // Text gains 270° CCW rotation (<RL>) so characters advance left-to-right on landscape ticket.

  it('swaps text position and inverts col, adds CCW rotation (<RL>)', () => {
    // (row=100, col=200) → FGL_row=200, FGL_col=1200-100=1100; rotation 0→270 (<RL>)
    const result = compile({
      ...cinema,
      elements: [{ type: 'text', row: 100, col: 200, font: 1, content: 'Hello' }]
    })
    expect(result).toContain('<RC200,1100>')
    expect(result).toContain('<RL>')
    expect(result).toContain('<NR>')
    expect(result).not.toContain('<RR>')
  })

  it('combines text rotation correctly: 90 + 270 = 0 (no rotation cmd)', () => {
    // 90 + 270 = 360 = 0 → no rotation command emitted
    // (row=50, col=100) → FGL_row=100, FGL_col=1200-50=1150
    const result = compile({
      ...cinema,
      elements: [{ type: 'text', row: 50, col: 100, font: 2, rotation: 90, content: 'X' }]
    })
    expect(result).toContain('<RC100,1150>')
    expect(result).not.toContain('<RR>')
    expect(result).not.toContain('<RL>')
    expect(result).not.toContain('<NR>')
  })

  it('transforms hline into vline with inverted col', () => {
    // hline (row=200, col=100, length=500) → vline(row=100, col=1200-200=1000, height=500)
    // VLine FGL: <LV col, rowStart, rowEnd, thickness> = <LV1000,100,600,1>
    const result = compile({
      ...cinema,
      elements: [{ type: 'hline', row: 200, col: 100, length: 500, thickness: 1 }]
    })
    expect(result).toContain('<LV1000,100,600,1>')
  })

  it('transforms vline into hline with inverted col range', () => {
    // vline (row=100, col=300, height=400):
    //   FGL_row (fixed) = canvas_col = 300
    //   FGL_col range lower = 1200 - 100 - 400 = 700, upper = 700+400 = 1100
    // HLine FGL: <LH row, colStart, colEnd, thickness> = <LH300,700,1100,1>
    const result = compile({
      ...cinema,
      elements: [{ type: 'vline', row: 100, col: 300, height: 400, thickness: 1 }]
    })
    expect(result).toContain('<LH300,700,1100,1>')
  })

  it('transforms outline box: swaps axes and inverts col corner', () => {
    // box (row=50, col=50, width=200, height=100):
    //   FGL_row = canvas_col = 50, FGL_col = 1200-50-100 = 1050
    //   new width=100 (canvas height), new height=200 (canvas width)
    // BX: <BX row,col,row+height,col+width> = <BX50,1050,250,1150>
    const result = compile({
      ...cinema,
      elements: [{ type: 'box', row: 50, col: 50, width: 200, height: 100, thickness: 1 }]
    })
    expect(result).toContain('<BX50,1050,250,1150>')
  })

  it('transforms filled box: swaps axes and inverts col corner', () => {
    // box fill=true (row=50, col=50, width=200, height=100):
    //   FGL_row=50, FGL_col=1050, width=100, height=200
    // LH: <LH row,col,col+width,height> = <LH50,1050,1150,200>
    const result = compile({
      ...cinema,
      elements: [{ type: 'box', row: 50, col: 50, width: 200, height: 100, thickness: 1, fill: true }]
    })
    expect(result).toContain('<LH50,1050,1150,200>')
  })

  it('transforms QR dot positions: row param from canvas col (multiples of dotSize)', () => {
    // QR at (row=0, col=0, dotSize=6): dot (r,c) → LH at (c*6, inverted_col_start, inverted_col_end, 6)
    // First LH param = physCol = canvas_col based (multiples of dotSize from el.col=0)
    const result = compile({
      ...cinema,
      elements: [{ type: 'qr', row: 0, col: 0, content: 'A', dotSize: 6 }]
    })
    const lhMatches = [...result.matchAll(/<LH(\d+),(\d+),(\d+),6>/g)]
    expect(lhMatches.length).toBeGreaterThan(0)
    for (const m of lhMatches) {
      // First param = physCol = c*dotSize → always a multiple of 6
      expect(parseInt(m[1]) % 6).toBe(0)
    }
  })

  it('CINEMA compile emits form-length command FL1200 immediately after NF', () => {
    const result = compile(cinema)
    expect(result).toContain('<NF><FL1200>')
  })

  it('does not affect CONCERT elements', () => {
    const result = compile({
      ...base,
      elements: [{ type: 'text', row: 100, col: 200, font: 1, content: 'Test' }]
    })
    expect(result).toContain('<RC100,200>')
    expect(result).not.toContain('<RR>')
    expect(result).not.toContain('<RL>')
    expect(result).not.toContain('<NR>')
  })
})

describe('compileBatch', () => {
  it('returns empty string for empty array', () => {
    expect(compileBatch([])).toBe('')
  })

  it('single doc matches compile(doc)', () => {
    expect(compileBatch([base])).toBe(compile(base))
  })

  it('two docs: first ticket is compile(doc), second starts immediately after without NF', () => {
    const first = compile(base)
    const result = compileBatch([base, base])
    expect(result.startsWith(first)).toBe(true)
    // Second ticket must have FL and p but no NF
    const second = result.slice(first.length)
    expect(second).toContain('<FL')
    expect(second).toContain('<p>')
    expect(second).not.toContain('<NF>')
  })

  it('two docs contain NF exactly once (only the first ticket)', () => {
    const result = compileBatch([base, base])
    expect((result.match(/<NF>/g) ?? []).length).toBe(1)
  })

  it('subsequent tickets in the batch do not start with NF', () => {
    const single = compile(base)
    const result = compileBatch([base, base])
    // After the first ticket's closing <p>, the remainder must not contain <NF>
    const afterFirstTicket = result.slice(single.length)
    expect(afterFirstTicket).not.toContain('<NF>')
  })

  it('two docs contain p exactly twice', () => {
    const result = compileBatch([base, base])
    expect((result.match(/<p>/g) ?? []).length).toBe(2)
  })

  it('preserves per-ticket element content', () => {
    const doc1: TicketDocument = { ...base, elements: [{ type: 'text', row: 100, col: 100, font: 1, content: 'TicketOne' }] }
    const doc2: TicketDocument = { ...base, elements: [{ type: 'text', row: 100, col: 100, font: 1, content: 'TicketTwo' }] }
    const result = compileBatch([doc1, doc2])
    expect(result).toContain('TicketOne')
    expect(result).toContain('TicketTwo')
  })

  it('handles mixed stock types in the same batch', () => {
    const result = compileBatch([base, { stock: 'CINEMA', elements: [] }])
    expect(result).toContain('<FL3300>')
    expect(result).toContain('<FL1200>')
  })
})

// ─── compileWithCopies ────────────────────────────────────────────────────────

describe('compileWithCopies', () => {
  it('copies=1 produces same output as compile(doc)', () => {
    expect(compileWithCopies(base, 1)).toBe(compile(base))
  })

  it('copies=1 does not emit <RE> command', () => {
    expect(compileWithCopies(base, 1)).not.toContain('<RE')
  })

  it('copies=3 emits <RE2> immediately before <p>', () => {
    const result = compileWithCopies(base, 3)
    expect(result).toContain('<RE2>')
    expect(result.indexOf('<RE2>')).toBeLessThan(result.indexOf('<p>'))
  })

  it('copies=5 emits <RE4>', () => {
    expect(compileWithCopies(base, 5)).toContain('<RE4>')
  })

  it('copies>1 has exactly one <p>', () => {
    const result = compileWithCopies(base, 5)
    expect((result.match(/<p>/g) ?? []).length).toBe(1)
  })

  it('copies>1 has exactly one <NF>', () => {
    const result = compileWithCopies(base, 3)
    expect((result.match(/<NF>/g) ?? []).length).toBe(1)
  })

  it('rawFglOverride is returned verbatim regardless of copies', () => {
    const doc: TicketDocument = { ...base, rawFglOverride: '<NF>CUSTOM<p>' }
    expect(compileWithCopies(doc, 5)).toBe('<NF>CUSTOM<p>')
  })

  it('preserves element content with copies>1', () => {
    const doc: TicketDocument = {
      ...base,
      elements: [{ type: 'text', row: 100, col: 100, font: 1, content: 'Hello' }]
    }
    const result = compileWithCopies(doc, 3)
    expect(result).toContain('Hello')
    expect(result).toContain('<RE2>')
  })
})

// ─── barcode delimiter wrapping ───────────────────────────────────────────────

describe('barcode content delimiter auto-wrapping', () => {
  it('code128 wraps bare content in ^ delimiters', () => {
    const result = compile({
      ...base,
      elements: [{ type: 'barcode', barcodeType: 'code128', row: 100, col: 100, height: 40, content: 'HELLO' }]
    })
    expect(result).toContain('^HELLO^')
  })

  it('code128 does not double-wrap already-delimited content', () => {
    const result = compile({
      ...base,
      elements: [{ type: 'barcode', barcodeType: 'code128', row: 100, col: 100, height: 40, content: '^HELLO^' }]
    })
    expect(result).toContain('^HELLO^')
    expect(result).not.toContain('^^')
  })

  it('code39 wraps content in * delimiters', () => {
    const result = compile({
      ...base,
      elements: [{ type: 'barcode', barcodeType: 'code39', row: 100, col: 100, height: 40, content: 'ABC123' }]
    })
    expect(result).toContain('*ABC123*')
  })

  it('code39 does not double-wrap already-delimited content', () => {
    const result = compile({
      ...base,
      elements: [{ type: 'barcode', barcodeType: 'code39', row: 100, col: 100, height: 40, content: '*ABC123*' }]
    })
    expect(result).toContain('*ABC123*')
    expect(result).not.toContain('**')
  })

  it('interleaved25 wraps content in : delimiters', () => {
    const result = compile({
      ...base,
      elements: [{ type: 'barcode', barcodeType: 'interleaved25', row: 100, col: 100, height: 40, content: '12345678' }]
    })
    expect(result).toContain(':12345678:')
  })

  it('upc-a with 12 digits gets J/K/L guard characters', () => {
    const result = compile({
      ...base,
      elements: [{ type: 'barcode', barcodeType: 'upc-a', row: 100, col: 100, height: 40, content: '012345678905' }]
    })
    expect(result).toContain('J012345K678905L')
  })

  it('upc-a already with J guard is left unchanged', () => {
    const result = compile({
      ...base,
      elements: [{ type: 'barcode', barcodeType: 'upc-a', row: 100, col: 100, height: 40, content: 'J012345K678905L' }]
    })
    expect(result).toContain('J012345K678905L')
    expect(result).not.toContain('JJ')
  })

  it('ean13 with 13 digits gets parity + J/K/L guard characters', () => {
    const result = compile({
      ...base,
      elements: [{ type: 'barcode', barcodeType: 'ean13', row: 100, col: 100, height: 40, content: '5901234123457' }]
    })
    expect(result).toContain('5J901234K123457L')
  })
})

// ─── barcode showText (<BI>) ──────────────────────────────────────────────────

describe('barcode showText (human-readable interpretation)', () => {
  it('emits <BI> before the barcode command when showText=true', () => {
    const result = compile({
      ...base,
      elements: [{ type: 'barcode', barcodeType: 'code128', row: 100, col: 100, height: 40, content: 'HELLO', showText: true }]
    })
    expect(result).toContain('<BI>')
    expect(result.indexOf('<BI>')).toBeLessThan(result.indexOf('<bc'))
  })

  it('does not emit <BI> when showText is absent', () => {
    const result = compile({
      ...base,
      elements: [{ type: 'barcode', barcodeType: 'code128', row: 100, col: 100, height: 40, content: 'HELLO' }]
    })
    expect(result).not.toContain('<BI>')
  })

  it('does not emit <BI> when showText=false', () => {
    const result = compile({
      ...base,
      elements: [{ type: 'barcode', barcodeType: 'code128', row: 100, col: 100, height: 40, content: 'HELLO', showText: false }]
    })
    expect(result).not.toContain('<BI>')
  })
})

// ─── text alignment (CTR / RTJ) ───────────────────────────────────────────────

describe('text alignment', () => {
  it('align=center with fieldWidth emits <CTR{width}>~text~', () => {
    const result = compile({
      ...base,
      elements: [{ type: 'text', row: 100, col: 100, font: 3, content: 'Hello', align: 'center', fieldWidth: 500 }]
    })
    expect(result).toContain('<CTR500>~Hello~')
  })

  it('align=right with fieldWidth emits <RTJ{width}>~text~', () => {
    const result = compile({
      ...base,
      elements: [{ type: 'text', row: 100, col: 100, font: 3, content: 'Hello', align: 'right', fieldWidth: 500 }]
    })
    expect(result).toContain('<RTJ500>~Hello~')
  })

  it('no align emits content directly without CTR or RTJ', () => {
    const result = compile({
      ...base,
      elements: [{ type: 'text', row: 100, col: 100, font: 3, content: 'Hello' }]
    })
    expect(result).not.toContain('<CTR')
    expect(result).not.toContain('<RTJ')
    expect(result).toContain('Hello')
  })

  it('centered text still includes RC positioning and font', () => {
    const result = compile({
      ...base,
      elements: [{ type: 'text', row: 100, col: 200, font: 5, content: 'Test', align: 'center', fieldWidth: 400 }]
    })
    expect(result).toContain('<F5>')
    expect(result).toContain('<RC100,200>')
    expect(result).toContain('<CTR400>~Test~')
  })
})

// ─── inverse text (<EI>/<DI>) ─────────────────────────────────────────────────

describe('inverse text', () => {
  it('inverse=true wraps content between <EI> and <DI>', () => {
    const result = compile({
      ...base,
      elements: [{ type: 'text', row: 100, col: 100, font: 3, content: 'Hello', inverse: true }]
    })
    expect(result).toContain('<EI>')
    expect(result).toContain('<DI>')
    expect(result.indexOf('<EI>')).toBeLessThan(result.indexOf('Hello'))
    expect(result.indexOf('Hello')).toBeLessThan(result.indexOf('<DI>'))
  })

  it('inverse=false does not emit EI or DI', () => {
    const result = compile({
      ...base,
      elements: [{ type: 'text', row: 100, col: 100, font: 3, content: 'Hello', inverse: false }]
    })
    expect(result).not.toContain('<EI>')
    expect(result).not.toContain('<DI>')
  })

  it('no inverse property does not emit EI or DI', () => {
    const result = compile({
      ...base,
      elements: [{ type: 'text', row: 100, col: 100, font: 3, content: 'Hello' }]
    })
    expect(result).not.toContain('<EI>')
    expect(result).not.toContain('<DI>')
  })

  it('inverse=true combined with rotation emits EI/DI inside rotation commands', () => {
    const result = compile({
      ...base,
      elements: [{ type: 'text', row: 100, col: 100, font: 3, content: 'Hello', inverse: true, rotation: 90 }]
    })
    expect(result).toContain('<RR>')
    expect(result).toContain('<EI>')
    expect(result).toContain('<DI>')
    expect(result).toContain('<NR>')
  })
})

// ─── native QR code (<QR> command) ───────────────────────────────────────────

describe('native QR code', () => {
  it('nativeQR=true emits <QR>{data} instead of LH commands', () => {
    const result = compile({
      ...base,
      elements: [{ type: 'qr', row: 100, col: 200, content: 'https://example.com', nativeQR: true }]
    })
    expect(result).toContain('<QR>')
    expect(result).toContain('{https://example.com}')
    expect(result).not.toMatch(/<LH\d+,\d+,\d+,\d+>/)
  })

  it('nativeQR=true defaults to font F68', () => {
    const result = compile({
      ...base,
      elements: [{ type: 'qr', row: 100, col: 200, content: 'TEST', nativeQR: true }]
    })
    expect(result).toContain('<F68>')
  })

  it('nativeQR=true uses provided fontNumber', () => {
    const result = compile({
      ...base,
      elements: [{ type: 'qr', row: 100, col: 200, content: 'TEST', nativeQR: true, fontNumber: 72 }]
    })
    expect(result).toContain('<F72>')
  })

  it('nativeQR=true uses <RC{row},{col}> for position', () => {
    const result = compile({
      ...base,
      elements: [{ type: 'qr', row: 100, col: 200, content: 'TEST', nativeQR: true }]
    })
    expect(result).toContain('<RC100,200>')
  })

  it('nativeQR CINEMA applies coordinate transform', () => {
    const result = compile({
      ...cinema,
      elements: [{ type: 'qr', row: 100, col: 200, content: 'TEST', nativeQR: true }]
    })
    // FGL_row = canvas_col = 200, FGL_col = 1200 - canvas_row = 1100
    expect(result).toContain('<RC200,1100>')
    expect(result).toContain('<QR>')
    expect(result).toContain('{TEST}')
  })

  it('nativeQR=false still uses LH matrix approach', () => {
    const result = compile({
      ...base,
      elements: [{ type: 'qr', row: 100, col: 100, content: 'A', nativeQR: false }]
    })
    expect(result).toMatch(/<LH\d+,\d+,\d+,6>/)
    expect(result).not.toContain('<QR>')
  })
})
