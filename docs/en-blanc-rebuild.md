# En Blanc — The Rooftop

User-requested replacement of All White Minimal (`white_minimal`) using the
supplied target and clean Square/Story backgrounds. The prior registry is archived
byte-for-byte with SHA-256 under `recipe-file-backups/en-blanc-rebuild/`.

Square follows the target's left-hand typography column. Story places the
headline and event information in the supplied white fade below the portraits.
Editable Didot headline and date, Lemon Milk Light supporting text, Bebas Neue
genres, black line icons and a bordered invitation panel. Title and icon styling
approximate the reference; the headline is clean black rather than rasterized.

- Backgrounds: `public/generated-flyers/assets/white-minimal-square.jpg` and `white-minimal-story.jpg`.
- Master: `public/generated-flyers/en-blanc-master.html`.
- Builder: `node --experimental-strip-types scripts/build-en-blanc-master.mjs`.
- Source renders: `node scripts/render-en-blanc-study.mjs`.
- Project: `public/generated-flyers/en-blanc.nflyer`.
- Gallery sessions: `lib/template-data/en-blanc-v2.json`.
- Editor previews: `public/generated-flyers/en-blanc-square-preview.png` and `en-blanc-story-preview.png`.

Established CSS compiler/materializer, editorTextScale=.5, explicit 1080×1080
and 1080×1920 layouts. Thirty-one objects per format with nineteen independent
editable texts; no compiler warnings. THE VIBE label has explicit authored size,
color and font state. Supporting shadows are explicitly disabled for a clean
light-background finish. No QR, matching the target. No shared renderer changes.
The final gallery override runs after the legacy white-minimal Story adapter.

Validation: two structural/session tests pass (`tests/coco-en-blanc-rebuild.test.ts`),
including label styles and disabled inherited shadows. Focused lint passes.
Actual editor previews visually inspected in both formats. Import/editing log
`/tmp/en-blanc-import.log`; typography/effects/layers/independent-format log
`/tmp/en-blanc-effects.log`; preview log `/tmp/en-blanc-preview.log`.
Full TypeScript retains unrelated existing errors; none reference En Blanc or
`lib/templates.ts` (`/tmp/en-blanc-tsc.log`).

All nineteen visible text objects pass selection, including interior-stroke
clicks for thin Story genre glyphs. Headline/subtitle edits, THE VIBE label
clear/retype, details/address alignment, format switching and save/reopen pass.
Typography/effects/layers and distinct format shadows/tracking also pass.

Full paid PNG export and cross-platform local Didot fidelity remain unverified.
No commit or deployment.
