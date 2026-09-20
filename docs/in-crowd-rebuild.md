# The In Crowd — Peachtree Rooftop

Replaces ATL Skyline (`atlanta`) at the user's explicit request. Previous registry
archived byte-for-byte with SHA-256 under `recipe-file-backups/in-crowd-rebuild/`.
Uses the supplied clean Square/Story backgrounds and target. Only **IN** uses
**Classic Gold Serif PNG**. THE and CROWD are separate editable Didot text objects;
Lemon Milk Light supplies supporting copy. Icons and typography approximate the
reference. Square preserves the left title stack; Story moves it lower to keep
the subject's face clear. A dark translucent right rail supports the amenities.

- Backgrounds: `public/generated-flyers/assets/in-crowd-square.jpg` and `in-crowd-story.jpg`.
- Master: `public/generated-flyers/in-crowd-master.html`.
- Build: `node --experimental-strip-types scripts/build-in-crowd-master.mjs`.
- Source renders: `node scripts/render-in-crowd-study.mjs`.
- Project: `public/generated-flyers/in-crowd.nflyer`.
- Gallery variants: `lib/template-data/in-crowd-v2.json`.
- Actual editor previews: `public/generated-flyers/in-crowd-square-preview.png` and `in-crowd-story-preview.png`.

Established semantic CSS compiler/materializer, editorTextScale=.5; explicit
1080×1080 and 1080×1920 compositions. Twenty-eight objects and seventeen independent
editable text bindings per format, including empty details label. Zero compiler
warnings. Native uploadable QR placeholder with independently editable caption.
Reservation copy uses a custom role; Square rotation becomes horizontal in Story.
No shared renderer changes.

Checks: `tests/coco-in-crowd-rebuild.test.ts` verifies fonts, title ownership,
bindings, supplied backgrounds and project/gallery equality (two passing tests).
Editor validation scripts: `scripts/verify-in-crowd-import.mjs` and
`scripts/verify-in-crowd-effects.mjs`. Logs `/tmp/in-crowd-import.log`,
`/tmp/in-crowd-effects.log`, `/tmp/in-crowd-preview.log`. Focused lint and full
TypeScript logs `/tmp/in-crowd-lint.log`, `/tmp/in-crowd-tsc.log`.

All sixteen visible text objects pass selection; headline/subtitle typing, label
clear/retype, details/address alignment, QR upload/default, format switching and
project save/reopen pass (`/tmp/in-crowd-import.log`).

Actual Square and Story editor previews visually inspected. Typography, effects,
per-glyph shadows, layer order, independent format settings and effect save/reopen
checks pass. Focused lint passes. Full TypeScript retains unrelated existing
diagnostics; none reference this template or `lib/templates.ts`.

Full paid PNG export and cross-platform local Didot fidelity remain unverified.
No commit or deployment.
