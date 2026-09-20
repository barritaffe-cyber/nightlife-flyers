# Nocturne — Midnight Muse

Added as a new gallery entry at the user's explicit request. ID:
`nocturne_midnight_muse`. Existing Ladies Night / Nocturne entries are preserved.

Sources: supplied `assets/nockturn-square.jpg` and `assets/nockturn-story.jpg`.
Explicit 1080×1080 and 1080×1920 master:
`public/generated-flyers/nocturne-muse-master.html`.
Build with `node --experimental-strip-types scripts/build-nocturne-muse-master.mjs`.
Output: `public/generated-flyers/nocturne-muse.nflyer` and
`lib/template-data/nocturne-muse-v2.json`.

Uses the existing CSS extractor, semantic binder and portable materializer at
editor scale 0.5. NOCTURNE remains editable Didot with rose gradient paint;
Midnight Muse uses Dear Script. The flower over O and delicate swash are
independent vector ornaments, not a baked title image. The flower is a vector
interpretation of the target's photographic bloom. Supporting icons use pink
strokes, and all 19 texts have independent bindings, including VIBE, date parts,
services, venue/address, age and hours. The source has 32 owners; QR is converted
from the reference placeholder into the editor's native uploadable QR overlay.
Supporting shadows default off; the authored VIBE label has explicit style state.

Story uses the supplied portrait background, with title/footer placed in the
lower dark area and separate side information. Square follows the wide title
and side-column arrangement. Both actual editor previews were visually checked.

Verification scripts:
- `scripts/render-nocturne-muse-study.mjs`: HTML source previews.
- `scripts/verify-nocturne-muse-import.mjs`: actual editor previews, selection,
  text edits, labels, alignment, native QR upload/default, format and save/reopen.
- `scripts/verify-nocturne-muse-effects.mjs`: size, tracking, leading, shadows,
  layers and separate Square/Story state after save/reopen. Gradient shadows
  are inspected on SVG glyph paint as well as text spans.
- `tests/coco-nocturne-muse-rebuild.test.ts`: source backgrounds, unique bindings,
  typography, gallery identity and portable session equality.

Compiler: no warnings/unsupported objects. Focused lint and structural tests.
Full paid export and cross-platform local Didot availability remain unverified.
No shared renderer changes, commit or deployment.
