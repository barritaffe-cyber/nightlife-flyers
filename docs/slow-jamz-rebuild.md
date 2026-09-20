# Slow Jamz — Velvet Room

User-requested replacement of `rnb_velvet` (R&B — Velvet & Smoke), using the
supplied target and clean Square/Story backgrounds. Existing registry and both
legacy variant files are archived byte-for-byte with SHA-256 hashes under
`recipe-file-backups/slow-jamz-rebuild/`.

Both SLOW and JAMZ use **Classic Gold Serif PNG** as editable text. Dear Script
supplies the subtitle, Didot the month/date/venue, and Lemon Milk Light the
supporting copy. The target's title texture is adapted to the requested existing
bitmap font. Square preserves the target's right-side text column; Story places
the title over the dark lower dress to keep both portraits clear.

- Master: `public/generated-flyers/slow-jamz-master.html`.
- Supplied assets: `public/generated-flyers/assets/r&b-lounge-square.jpg` and `r&b-lounge-story.jpg` (URL-encoded ampersands in the compiled image URLs).
- Builder: `node --experimental-strip-types scripts/build-slow-jamz-master.mjs`.
- Source renders: `node scripts/render-slow-jamz-study.mjs`.
- Project: `public/generated-flyers/slow-jamz.nflyer`.
- Gallery sessions: `lib/template-data/slow-jamz-v2.json`.
- Editor previews: `public/generated-flyers/slow-jamz-square-preview.png` and `slow-jamz-story-preview.png`.

Established semantic CSS compiler/materializer, explicit 1080×1080 and 1080×1920
layouts, editorTextScale=.5. Twenty objects and thirteen independent editable
text bindings in each format, including the initially empty details label.
No compiler warnings. No QR, matching the target. No shared renderer changes.

Validation: two structural/session tests pass in
`tests/coco-slow-jamz-rebuild.test.ts`. Both actual editor previews inspected for
font loading, subtitle clipping, subject visibility and typography placement.
Focused lint passes. Editor control logs: `/tmp/slow-jamz-import.log` and
`/tmp/slow-jamz-effects.log`; preview log `/tmp/slow-jamz-preview.log`.

All twelve visible text objects pass glyph selection in both formats. Headline/
subtitle typing, details-label clear/retype, details/address alignment and project
save/reopen pass, preserving distinct Square .18 / Story .20 details tracking.

Typography, per-glyph shadow, layers, independent format settings and effect
save/reopen checks passed. Full TypeScript retains unrelated existing errors;
none reference Slow Jamz or `lib/templates.ts` (`/tmp/slow-jamz-tsc.log`).

Full paid PNG export and cross-platform local Didot fidelity are unverified.
No commit or deployment.
