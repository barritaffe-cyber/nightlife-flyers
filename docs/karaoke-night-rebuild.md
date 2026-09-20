# Karaoke Night — Neon Lounge

Replaces **Karaoke — Neon Mic Night** (`karaokee`) at the user's request. Uses supplied `assets/karaoke-square.jpg` and `assets/karaoke-story.jpg`. The prior registry is archived with SHA-256 in `recipe-file-backups/karaoke-night-rebuild/`.

## Editable assets

Master: `public/generated-flyers/karaoke-night-master.html`. Adapter: `scripts/build-karaoke-night-master.mjs`. Portable project: `public/generated-flyers/karaoke-night.nflyer`. Gallery sessions: `lib/template-data/karaoke-night-v2.json`. Source and editor previews use the same prefix.

Fourteen independent text owners, including an initially empty details label. KARAOKE uses condensed **Didot Bold**, 300px with scaleX .34 in Square; Story255px with scaleX .59. Night uses existing **Brittany Signature**, with scale(1.05,.72); Square145px, Story150px. Story title starts at68%, subtitle79.5%, followed by the tagline89.5%. Supporting text uses LEMONMILK-Light; age badge uses Bebas Neue. Separate date, hours, venue/address, mood, perks and QR caption. Native QR supports upload/replacement. Local SVG location/social art and a21+ outline badge.

No new font. Preserve newer accepted user saves; the builder guards `karaoke-night-saved-source.json`. Preserve unrelated repository changes. No commit or deployment.

## Verification

Both source and actual editor previews visually inspected. `verify-karaoke-night-import.mjs` passed text selection/editing, labels, alignment, QR upload/reset, format independence and save/reopen. `verify-karaoke-night-effects.mjs` passed size, spacing, leading, shadows and layers in both formats. Both structural tests in `tests/coco-karaoke-night-rebuild.test.ts` and focused ESLint passed. Compiler reports no warnings or unsupported objects. Logs: `/tmp/karaoke-{build,import,effects,test,lint}.log`.
