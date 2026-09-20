# Mind State — Arctic Metal

Replaces and restores the previously hidden `edm_stage_co2` (Techno / Afterhours)
gallery slot at the user's explicit request. The previous registry and Story data
are archived byte-for-byte with SHA-256 in `recipe-file-backups/mind-state-rebuild/`.
The other deleted gallery entries remain hidden.

Source backgrounds are the supplied `assets/techno-square.jpg` and
`assets/techno-story.jpg`. `public/generated-flyers/mind-state-master.html` authors
separate 1080×1080 and 1080×1920 compositions. Both MIND and STATE use the existing
Arctic Metal PNG font, with editable text. Supporting type uses Azonix, Lemon Milk
Light and Bebas Neue. The target's outline-only STATE is adapted to the requested
Arctic Metal family. Supporting fonts and small social icons approximate the target.

Build using `node --experimental-strip-types scripts/build-mind-state-master.mjs`.
The established CSS compiler/materializer uses editorTextScale=.5. Both formats
compile 25 objects with 16 independent editable text bindings and no warnings.
The empty details-label object is explicit. QR stays in the native editor overlay,
with its upload/default controls and an independently editable caption.

Output: `public/generated-flyers/mind-state.nflyer`, with identical gallery
sessions in `lib/template-data/mind-state-v2.json`. Preview files ending
`-square-preview.png` and `-story-preview.png` come from the actual editor.
The `-css-preview.png` files are the full-size source renders.

Validation:

- `node --experimental-strip-types --test tests/coco-mind-state-rebuild.test.ts`: two passing structural/session tests.
- `scripts/verify-mind-state-import.mjs`: both formats, glyph selection for all 15 visible texts, headline/subtitle editing, details/address alignment, empty-label type/clear/retype, QR upload/default and save/reopen passed. Log `/tmp/mind-state-editing.log`.
- `scripts/verify-mind-state-effects.mjs`: size, spacing, leading within supported ranges, per-glyph shadows, layers, different format effects/tracking, Square→Story→Square and save/reopen passed. Log `/tmp/mind-state-effects.log`.
- Actual Square and Story previews visually inspected for fonts, background, placement and overlap.

Focused lint passes. Full TypeScript retains unrelated existing diagnostics; none
reference Mind State or `lib/templates.ts` (`/tmp/mind-state-tsc.log`).

Full paid PNG export and cross-browser output are unverified. No shared renderer
changes, commit or deployment were made for this replacement.
