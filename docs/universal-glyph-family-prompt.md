# Universal glyph-family generation prompt

Attach the original lettering reference and paste the prompt below. Generate one
sheet per response, then request the next sheet using the same reference,
typographic scale, material and lighting. Download original PNG files rather
than screenshots or reduced chat previews.

```text
Create a complete glyph family that closely matches the attached lettering reference.

Match its letter shapes, stroke contrast, proportions, terminals, serifs or brushwork, texture, colors, bevels, depth, and lighting. Preserve the reference's distinctive style consistently across the family.

These glyphs will be extracted individually and assembled into editable headlines. Complete shapes, clean transparency, consistent typography, and genuine source resolution are essential.

OUTPUT
Generate FOUR SEPARATE square PNG sheets, ONE SHEET PER RESPONSE.
Use the highest native resolution available, preferably 4096 × 4096 pixels per sheet.
Do not combine the sheets, resize a small image and call it high resolution, or claim dimensions the output does not have.

Use an invisible 4-column × 4-row grid. No grid lines, labels, captions, or extra artwork.

SHEET 1
A B C D
E F G H
I J K L
M N O P

SHEET 2
Q R S T
U V W X
Y Z a b
c d e f

SHEET 3
g h i j
k l m n
o p q r
s t u v

SHEET 4
w x y z
0 1 2 3
4 5 6 7
8 9 [empty] [empty]

ISOLATION AND PADDING
• Exactly one specified character per cell.
• Keep every stroke, dot, serif, flourish, ascender, and descender complete.
• Leave at least 10% clear padding on every side of each cell, including around highlights and flourishes.
• No glyph or effect may touch another glyph or cross a cell boundary.
• Keep dots with their letters inside the same cell.
• Never crop or truncate characters to make them fit.

TYPOGRAPHIC CONSISTENCY
• Use the same typographic scale across all four sheets.
• Capitals share a cap height; lowercase letters share an x-height.
• Align characters to consistent row baselines, allowing descenders below.
• Preserve natural widths: narrow letters stay narrow, wide letters stay wide.
• Do not stretch each character to fill its cell.
• Preserve the reference's intrinsic italic slant, if present, but use level baselines without additional rotation, perspective, or word-level skew.
• For script lettering, provide complete standalone glyphs with short, intact connection strokes. Do not join adjacent cells.

MATERIAL AND EDGES
• Match the reference's material, texture scale, light direction, and depth consistently.
• Preserve fine surface detail and smooth antialiased edges.
• Use genuine transparency, including inside enclosed letter spaces.
• No background, checkerboard artwork, colored matte, broad glow, detached speckles, or baked-in drop shadow.
• Retain only restrained highlights or glints belonging to the letter itself, fully contained within its padding.

CHECK BEFORE DELIVERY
Confirm the character sequence is correct and complete.
Check for clipped strokes, missing dots, neighboring fragments, inconsistent scale, and contaminated edges.
Deliver the original downloadable PNG and state its actual pixel dimensions.

Generate SHEET 1 ONLY now. Keep its style and typography consistent when I request the remaining sheets.
```

## Resolution and intake

Prompting does not guarantee a generator's output dimensions. Inspect the actual
files. If native output is limited to roughly 1024–1536 pixels square, request one
glyph per image, or fewer glyphs per sheet, to allocate more source pixels to each
letter. A 4K flyer export and a 4K source sheet are different things; enlarging
the export or the bitmap font cannot recreate missing engraving or edge detail.

The earlier single-sheet option was 8192×8192 with an 8×8 grid; four 4096×4096
sheets are easier to inspect and isolate. These are desired source specifications,
not claims about available generation capabilities.

Verify all 62 characters, case mapping, unique crops, alpha edges and complete
strokes before packaging. Inspect a contact sheet and edited words in the live
renderer. Keep native crops and source hashes; normalize typographic metrics
without distorting each character to fit its cell. Script glyphs may still need
pair-specific spacing or contextual forms to join naturally; this prompt alone
does not create a fully shaped script font.
