Fix two bugs in the FGL compiler for CINEMA stock (3.25" × 2") in the
  TicketPrinter Electron app (TypeScript + React). Primary file:
  src/fgl/compiler.ts. Tests: src/fgl/__tests__/compiler.test.ts.

  Do NOT look at test/output.jpeg or test/output_labelled.png — they are
  outdated. Do NOT change EditorCanvas.tsx or TicketEditor.tsx.

  ## Background

  CINEMA stock dimensions (src/fgl/stock.ts):
    widthDots: 1200  (2" axis)
    heightDots: 1950 (3.25" axis)
    exclusionZone: colStart=940, colEnd=1010 (perf band, stored in canvas col)

  The canvas always displays tickets in landscape:
    svgWidth  = stock.heightDots * s  (3.25" = horizontal, el.col = x-axis)
    svgHeight = stock.widthDots  * s  (2"    = vertical,   el.row = y-axis)

  The CINEMA coordinate swap already exists in compileElement/transformSwap:
    FGL_row = canvas_col (el.col, 3.25" axis, 0–1950)
    FGL_col = canvas_row (el.row, 2" axis,    0–1200)
    Text gets +270° rotation → <RL>

  The swap IS wired up. The bugs are WITHIN the CINEMA path.

  ## Bug 1 — Wrong print position (text prints halfway down the ticket)

  Observed: a text element placed at the canvas top-left prints approximately
  halfway down the physical CINEMA ticket. Elements from the canvas right side
  (high canvas_col values) overflow and appear on the PREVIOUS ticket.

  Possible root causes to investigate — do NOT assume one before checking:

    A. The swap direction is inverted: compiler sends canvas_col as FGL_row
       (current) but the physical printer interprets FGL_row as the 2" axis
       (not 3.25"). This would make canvas_col values (up to 1950) overflow
       the actual FGL_row max of 1200, causing wrapping.

    B. The swap direction is correct but the printer's "Top of Form" offset
       is configured to half the 2" ticket height (~600 dots), so FGL col=0
       physically lands in the middle of the ticket. This is a printer
       configuration issue, not a code bug.

    C. The text baseline positioning after rotation is wrong — the +270°
       rotation causes the text anchor to sit at the wrong point, making it
       visually appear offset.

  Diagnostic step (do first, before writing any fix):
    Read the FGL Source panel output (src/renderer/src/editor/FglSourcePanel.tsx
    renders the compiled FGL string). For a single text element at canvas
    (col=100, row=50), the compiled output should be:
      <RC100,50>  (FGL_row=100 on 3.25" axis ≈ 5%, FGL_col=50 on 2" axis ≈ 4%)
    Confirm this is what compiler.ts currently produces by running the existing
    CINEMA swap tests and verifying they pass. If the tests pass but the
    physical output is still wrong, root cause B is most likely — document it
    but do not change compiler code.
    If the tests FAIL, root cause A is present — fix the swap direction.

  ## Bug 2 — Visual elements (HLine, VLine, Box, Filled Box, QR) print blank

  Observed: all non-text visual elements produce no visible output on CINEMA
  stock. Text works.

  Possible root causes to investigate:

    A. After transformSwap, the resulting FGL coordinates are out of the
       CINEMA stock's printable range, so elements land on an adjacent form
       or outside the print area entirely.

    B. The transformSwap for HLine/VLine is correct (hline→vline swap) but
       the compiled FGL parameter order is wrong for this specific printer
       model (e.g., <LH> or <LV> expects a different argument sequence).

    C. Visual elements are printing somewhere on the ticket but at an
       unexpected position due to Bug 1's coordinate offset — they may not
       actually be "blank" but just misplaced.

  Diagnostic step:
    For a CINEMA HLine at (row=200, col=100, length=500, thickness=4),
    transformSwap converts it to a VLine (row=100, col=200, height=500).
    compileVLine then emits: <LV200,100,600,4>
    This means: vertical line at FGL_col=200 (17% of 2"), from FGL_row=100
    to FGL_row=600 (5–31% of 3.25" axis). Verify this is what compiler
    currently produces. If correct syntax but still blank, the elements may
    simply be printing at the wrong absolute position due to Bug 1.

  ## Workflow

  1. Run the existing CINEMA compiler tests first:
       npx vitest run src/fgl/__tests__/compiler.test.ts
     Document which tests pass and which fail. Do not proceed until you know
     the baseline state.

  2. Use /tdd — for each bug, write a failing test ONLY if you have identified
     a concrete code-level root cause (wrong coordinates or wrong FGL output).
     Do NOT write tests for printer-configuration causes.

     Example test to add if root cause A is confirmed for Bug 1:
       it('CINEMA text at (row=50, col=100) produces <RC100,50> not <RC50,100>', () => {
         const result = compile({ ...cinema, elements: [
           { type: 'text', row: 50, col: 100, font: 1, content: 'X' }
         ]})
         expect(result).toContain('<RC100,50>')  // FGL_row=canvas_col, FGL_col=canvas_row
         expect(result).not.toContain('<RC50,100>')
       })

     Example test to add if visual element Bug 2 is a code issue:
       it('CINEMA HLine (row=200,col=100,length=500) becomes VLine <LV200,100,600,4>', () => {
         const result = compile({ ...cinema, elements: [
           { type: 'hline', row: 200, col: 100, length: 500, thickness: 4 }
         ]})
         expect(result).toContain('<LV200,100,600,4>')
       })

  3. Fix compiler.ts only if a concrete code bug was identified and a failing
     test was written. If root cause is printer configuration, document the
     finding as a code comment in compiler.ts instead.

  4. After any fix: run the full compiler test suite to confirm zero regressions
     in both CINEMA and CONCERT paths.
       npx vitest run src/fgl/__tests__/compiler.test.ts

  5. Run /typescript-reviewer on any compiler.ts changes.

  6. Run /code-review on the diff.

  ## Acceptance Criteria

  - All existing CINEMA and CONCERT compiler tests pass.
  - If a code fix is applied, at least one new test covers the fixed behavior.
  - The FGL source panel for a CINEMA ticket with a single HLine at canvas
    (row=200, col=100, length=500) shows <LV200,100,600,4>.
  - If the position bug is confirmed as a printer-config issue, a clear comment
    is added to compiler.ts explaining the TOF offset and what the user must
    configure on the printer.

  ## Do NOT

  - Do not change stock.ts dimensions.
  - Do not change EditorCanvas.tsx or TicketEditor.tsx.
  - Do not change CONCERT compilation logic while fixing CINEMA.
  - Do not guess the fix — run diagnostics first.
  - Do not add form-length or TOF-offset FGL commands without confirming the
    printer model and its FGL spec.