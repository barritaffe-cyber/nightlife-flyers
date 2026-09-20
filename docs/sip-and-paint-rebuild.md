# Sip and Paint — The Social Lounge

New gallery template `sip_and_paint`, using supplied `paint-sip-square.jpg` and `paint-sip-story.jpg`. Square follows the target stack; Story positions the lettering below the painted portrait. Nineteen independently editable text owners include an initially empty details label. Separate price, inclusion text, date, venue, address and corner captions; no QR.

Source: `public/generated-flyers/sip-and-paint-master.html`. Compiler: `scripts/build-sip-and-paint-master.mjs`. Gallery data: `lib/template-data/sip-and-paint-v2.json`. Portable project: `public/generated-flyers/sip-and-paint.nflyer`. Actual editor previews use the same prefix.

## Shared lettering

- PAINT: **Paint Splash Serif PNG**, extracted from `png-glyphs/paint-sip.png` by `scripts/build-paint-serif-font.py paint-serif`.
- SIP: **Sunset Paint Brush PNG**, extracted from `png-glyphs/paint-sip2.png` by `scripts/build-sip-brush-font.py sip-brush`. Component ownership removes fragments from neighboring source rows; font URL v2.

Each includes 26 uppercase letters, ten digits and lowercase aliases. Both are available in normal font menus and PNG lettering pickers. Source hashes and metrics accompany extracted glyphs. Full alphabet proof: `sip-and-paint-font-preview.html` / `.png`.

## Verification

Both actual editor layouts and alphabet proofs inspected. Import checks cover all text selection/editing, both shared families in headline and subtitle menus, labels, alignment, format independence and save/reopen. Effects checks cover typography, shadows and layer order. Two structural tests and focused ESLint pass. Final glyph cleanup followed by recompilation and fresh editor previews.

Preserve newer accepted user saves. No deployment or commit.
