# Honey Nights

Editable Square (1080×1080) and Story (1080×1920) designs built from the supplied Honey Nights reference.

## Assets and editing

- Backgrounds: `public/generated-flyers/assets/honey-{square,story}.jpg`.
- Target reference: `public/generated-flyers/redesigns/honey.png`; not used as a flattened flyer.
- Master and builder: `public/generated-flyers/honey-nights-master.html`, `scripts/build-honey-nights-master.mjs`.
- Portable project: `public/generated-flyers/honey-nights.nflyer`; session cache: `lib/template-data/honey-nights-v1.json`.
- Both formats have 29 compiled objects, including 18 independently editable text owners. Presenter, date, time, DJ lineup, music, venue, address and age have separate guided-form destinations. The one-line DJ field accepts the two names separated by × as in the target.
- Presenter/DJ labels and time/age/DJ rules hide when their associated form fields are empty. Atmosphere copy remains editable on canvas.
- The builder refuses to overwrite a future accepted `honey-nights-saved-source.json`. Preserve user refinements through saved sessions instead of rebuilding that source.

## Reusable glyphs

**Honey Gold Serif** is available in **PNG Lettering** and **Luxury / Fashion Display**, including both headline pickers. All 62 supplied characters (A–Z, a–z, 0–9) retain their colored artwork, honey drips and highlights. Unprovided punctuation uses the editor's fallback font.

`scripts/build-honey-gold-serif-font.py` extracts `honey01.png`–`honey04.png` into `public/generated-flyers/assets/png-glyphs/honey-gold-serif/`, including source hashes and metrics, and builds `public/fonts/HoneyGoldSerifPNG.woff2`. The original sheets remain unchanged. Loose exterior haze is excluded while antialiasing and detached dots are retained. The application CSS explicitly declares the font face so initial template loading paints the actual glyphs.

The small bee header ornament is a separate native SVG. The central medallion is part of each supplied background.

## Verification

```sh
node --experimental-strip-types --test tests/coco-honey-nights.test.ts tests/coco-catalog-coverage.test.ts
node scripts/coco-recipe.mjs audit honey-nights
NF_HONEY_NIGHTS_EXPORT_ACCESS_FIXTURE=1 NF_HONEY_NIGHTS_PUBLISH_PREVIEWS=1 node scripts/verify-honey-nights.mjs
node scripts/verify-honey-gold-serif.mjs
node scripts/verify-honey-nights-discovery.mjs
```

Browser tests use isolated local Full Studio auth/allowance responses; they do not write real account or billing data. The PNG renderer, controls and saved project files are real. Test artifacts are under `/tmp/honey-nights`, `/tmp/honey-gold-serif-check` and `/tmp/honey-nights-discovery`.

Verified: 16 focused font/template/catalog tests; adapter compilation without unsupported or approximated objects; Coco → Honey Nights / Elegant → both personalized previews → details form. The supplied lettering works in both headline pickers with mixed case, digits, spacing, size, leading and shadow controls, including save/reopen and both actual PNG exports. Original template exports were also inspected at 2160×2160 and 2160×3840. TypeScript remains at the existing 298 diagnostics.

The presenter and PRESENTS layers sit above the bitmap headline's interaction geometry, preventing its invisible hit area from blocking those small labels.

Final editor verification: 34 visible text edits, six label checks, two saved-format round trips, and both reopened PNG exports pass with zero browser errors (`/tmp/honey-nights/results.json`). Original and reopened exports were visually inspected.
