# Martini Night — Velvet Room

Replaces the existing `martini` (Martini Luxe Night) gallery entry at the user's request. Uses the supplied `assets/martini-square.jpg` and `assets/martini-story.jpg`, with explicit 1080×1080 and 1080×1920 layouts. The supplied target is reference artwork only.

The editable title uses condensed Didot; Night uses Dear Script (Demo_Font) in gold. Ten visible text objects and an initially empty, independently editable details label have unique bindings. Six gold rules remain independent decorations. No QR appears in this design.

Authoritative construction: `public/generated-flyers/martini-night-master.html`, compiled through `scripts/build-martini-night-master.mjs` into `martini-night.nflyer` and `lib/template-data/martini-night-v2.json`. The original gallery registry was archived byte for byte with SHA-256 in `recipe-file-backups/martini-night-rebuild/` before replacement. Preserve any newer user save over this construction master.

Validation completed:
- Both masters compiled with zero unsupported elements or warnings.
- Actual Square/Story editor previews visually inspected; title wrapping and Story script overlap corrected in the master.
- All visible text selection, text editing, label type/clear/retype, spacing, and project save/reopen passed (`verify-martini-night-import.mjs`).
- Headline/subtitle typography, shadows, layers, independent format settings and save/reopen passed (`verify-martini-night-effects.mjs`).
- Two structural tests passed (`tests/coco-martini-night-rebuild.test.ts`).

Accepted previews: `public/generated-flyers/martini-night-square-preview.png` and `martini-night-story-preview.png`. Paid PNG export was not exercised; these previews are captured from the actual editor. No deployment performed.
