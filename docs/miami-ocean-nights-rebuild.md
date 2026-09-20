# Miami Nights — Ocean Drive

New gallery template **miami_ocean_nights**, explicitly requested by user. This is separate from the existing `miami2` / Miami Nights — Sunset Sessions template. Uses supplied `assets/miami-square.jpg` and `assets/miami-story.jpg`.

Master: `public/generated-flyers/miami-ocean-nights-master.html`. Adapter: `scripts/build-miami-ocean-nights-master.mjs`. Portable project: `public/generated-flyers/miami-ocean-nights.nflyer`. Gallery sessions: `lib/template-data/miami-ocean-nights-v2.json`. Source/editor previews use the same prefix.

Sixteen independent text owners including an initially empty details label. Cream MIAMI uses **Didot Bold**; gold Nights uses **Dear Script (Demo_Font)**. Genre row, date and age use **Bebas Neue**; supporting copy uses **LEMONMILK-Light**. No new font. Square headline215px/scaleX.78 and subtitle210px/scale(.92,.87); Story225px/scaleX1.05 and subtitle195px/scale(1.05,.75). Square date block moved higher to clear the supplied portrait's face. Story title sits below the portrait. Open-bar offer, description, venue/address, age/dress caption and native replaceable ticket QR have separate editable owners. Location/social icons are local SVGs.

Preserve newer accepted user saves; builder guards `miami-ocean-nights-saved-source.json`. Preserve unrelated repository changes. No commit or deployment.

## Verification

Both source/editor layouts inspected. All text selection/editing, labels, alignment, QR upload/reset, format independence and save/reopen passed in `verify-miami-ocean-nights-import.mjs`. Typography/effects/layers passed in `verify-miami-ocean-nights-effects.mjs`. Both structural tests and focused ESLint passed. Final Square divider moved above SAT after interaction checks; compiler and actual editor previews refreshed. Logs: `/tmp/miami-ocean-{build,import,effects,test,lint,preview}.log`.
