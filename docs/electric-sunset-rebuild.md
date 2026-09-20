# Electric Sunset — Golden Sky

Replaces **LA — Luxe Afterhours** (`la-lux`) at the user's request. Supplied backgrounds are `assets/la-luxe-square.jpg` and `assets/la-luxe-story.jpg`. Previous registry and both saved LA Luxe layouts are archived with SHA-256 hashes in `recipe-file-backups/electric-sunset-rebuild/`.

## Editable layout

Source: `public/generated-flyers/electric-sunset-master.html`. Adapter: `scripts/build-electric-sunset-master.mjs`. Portable project: `public/generated-flyers/electric-sunset.nflyer`. Gallery sessions: `lib/template-data/electric-sunset-v2.json`. Source and actual editor previews use the same prefix.

Fifteen independent text owners, including an initially empty details label. SUN / SET is one editable multiline headline storing `SUN\nSET`, using **Galaxia Personal Used**, which the user identified in **Tech / Futuristic Display**. This existing family matches the reference's curved cuts; no new font was added. Gold gradient, line height .72, Square 230px at left27/top20; Story 300px at left15/top27. ELECTRIC is the independent subtitle in LEMONMILK-Light. Date uses Bebas Neue; venue uses italic Didot. Native QR supports replacement, with an independent guest-list caption. Power symbol and social icons are local SVGs.

Preserve newer accepted user saves; the builder guards `electric-sunset-saved-source.json`. Preserve unrelated repository changes. No commit or deployment.

## Verification

Both final editor and source previews inspected. All text selection/editing, empty-label clear/retype, alignment, QR upload/reset, format independence and save/reopen passed in `verify-electric-sunset-import.mjs`. Typography, live effects and layer checks passed in `verify-electric-sunset-effects.mjs`. Three focused tests in `tests/coco-electric-sunset-rebuild.test.ts` pass, including existing font-category registration; focused ESLint passes. Compiler reports no warnings or unsupported objects. Logs: `/tmp/electric-{build,import,effects,test,lint}.log`.
