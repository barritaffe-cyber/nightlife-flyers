# Aura — Elevated Nightlife

User-requested replacement of DJ Night (`square_center_hero_nightlife`), using
supplied Square/Story backgrounds and **Gold Flourish PNG** headline with
**−0.39 em spacing** in both formats. The prior registry is archived byte-for-byte
with SHA-256 under `recipe-file-backups/aura-rebuild/`.

The headline uses the existing transparent bitmap glyphs, preserving their full
swashes. Size/position were adapted to avoid clipping; tracking remains −0.39.
Separate Square and Story placement keeps the supplied subject visible. Didot
and Lemon Milk Light supply supporting copy; social icons approximate the target.
The QR is the editor's native uploadable placeholder, with an editable caption.

- Source backgrounds: `public/generated-flyers/assets/dj-night-square.jpg` and `dj-night-story.jpg`.
- Master: `public/generated-flyers/aura-master.html`.
- Build: `node --experimental-strip-types scripts/build-aura-master.mjs`.
- Render source: `node scripts/render-aura-study.mjs`.
- Portable project: `public/generated-flyers/aura.nflyer`.
- Gallery sessions: `lib/template-data/aura-v2.json`.
- Editor previews: `public/generated-flyers/aura-square-preview.png` and `aura-story-preview.png`.

Established CSS compiler/materializer with editorTextScale=.5; explicit
1080×1080 and 1080×1920 canvases. Twenty-six compiled objects, eighteen independent
editable text bindings (including the initially empty details label), no compiler
warnings. RSVP uses the custom `reservationInfo` role so it does not inherit the
legacy left-rail enabled flag. No shared renderer changes.

Validation:

- Two tests pass: `node --experimental-strip-types --test tests/coco-aura-rebuild.test.ts` (backgrounds, bindings/enabled flags, font/spacing and project/gallery equality).
- Both actual editor previews visually inspected for swashes, clipping, placement and font loading.
- `scripts/verify-aura-import.mjs`: visible-text selection, headline/subtitle typing, details label clear/retype, alignment, QR upload/default, Square/Story, and save/reopen. Final log `/tmp/aura-final.log` includes −0.39 spacing checks before and after save/reopen.
- `scripts/verify-aura-effects.mjs`: size, spacing, leading, per-glyph shadows, layers and independent Square/Story settings plus save/reopen passed (`/tmp/aura-effects.log`).
- Focused lint passes. Full TypeScript retains pre-existing unrelated diagnostics; log `/tmp/aura-tsc.log`.

Full paid PNG export and cross-platform local Didot fidelity remain unverified.
No commit or deployment.
