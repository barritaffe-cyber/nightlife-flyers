# Salsa Noche — La Fiesta

Replaces **Latin — Tropical Street** (`latin_street_tropical`) at the user's request. Uses supplied `assets/salsa-square.jpg` and `assets/salsa-story.jpg`, guided by `redesigns/salsa night.png`. Prior registry and both saved Latin Tropical layouts are archived with SHA-256 hashes in `recipe-file-backups/salsa-noche-rebuild/`.

## Editable layout

- Source: `public/generated-flyers/salsa-noche-master.html`
- Compiler adapter: `scripts/build-salsa-noche-master.mjs`
- Portable project: `public/generated-flyers/salsa-noche.nflyer`
- Gallery data: `lib/template-data/salsa-noche-v2.json`
- Actual editor previews: `public/generated-flyers/salsa-noche-{square,story}-preview.png`

Seventeen independent text owners, including an initially empty details label. Gold Salsa uses existing **Dear Script (Demo_Font)**; cream NOCHE and date use **Didot**. Day and lesson/door times use **Bebas Neue**; supporting copy uses **LEMONMILK-Light**. No new font. Square script has a wider left margin to preserve the S flourish; Story shifts the headline below the couple and separates the two title lines. Native QR supports upload/replacement, with a separate RSVP caption. Location and social icons are local SVG assets.

Builder refuses regeneration if a newer `salsa-noche-saved-source.json` exists. Preserve accepted user saves and unrelated repository changes. No commit or deployment.

## Verification

Both source and actual editor previews inspected. `verify-salsa-noche-import.mjs` passed all visible text selection/editing, initially empty label clear/retype, alignment, QR upload/reset, format independence and project save/reopen. `verify-salsa-noche-effects.mjs` passed size, spacing, leading, shadows, layer ordering and format roundtrip. Both structural tests in `tests/coco-salsa-noche-rebuild.test.ts` and focused ESLint passed. Compile reports zero unsupported objects and no warnings. Logs: `/tmp/salsa-{build,import,effects,test,lint}.log`.
