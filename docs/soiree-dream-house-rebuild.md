# Soiree — Dream House

New gallery template **soiree_dream_house**, explicitly requested by user. Uses supplied `assets/soiree-square.jpg` and `assets/soiree-story.jpg`. Source/master, portable project, gallery data and previews use the `soiree-dream-house` prefix; builder is `scripts/build-soiree-dream-house-master.mjs`.

Eighteen independent text owners, including an initially empty details label. Soiree uses existing **Dear Script (Demo_Font)** with white lettering and layered teal text shadows. Square260px, Story270px, horizontal scale1.3. Subtitle uses Didot; date and age use Bebas Neue; supporting text uses LEMONMILK-Light. No new font. Separate DJ Envy/DJ Kash, dress code, doors time, ladies entry offer, venue/address, social caption, age badge and native replaceable QR. Background already contains the gold halo. Local social SVG, divider rules and18+ outline badge complete the composition.

Source: `public/generated-flyers/soiree-dream-house-master.html`. Portable project: `public/generated-flyers/soiree-dream-house.nflyer`. Gallery sessions: `lib/template-data/soiree-dream-house-v2.json`.

Preserve newer accepted user saves; builder guards `soiree-dream-house-saved-source.json`. Preserve unrelated repository changes. No commit or deployment.

## Verification

Both source and actual editor previews inspected. `verify-soiree-dream-house-import.mjs` passed every visible text owner, labels, alignment, QR upload/reset, format independence and save/reopen. `verify-soiree-dream-house-effects.mjs` passed size, spacing, leading, shadows and layers. Both structural tests in `tests/coco-soiree-dream-house-rebuild.test.ts` and focused ESLint passed. Compiler has no unsupported objects or warnings. Logs: `/tmp/soiree-{build,import,effects,test,lint}.log`.
