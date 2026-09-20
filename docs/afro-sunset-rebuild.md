# Afro Sunset — Skyline Rooftop

Replaces **VIP Lounge Flyer** (`luxe`) at the user's request. Uses supplied `afro-sunset-square.jpg` and `afro-sunset-story.jpg` backgrounds. The original registry and both Luxe saved layout JSON files are archived byte-for-byte with SHA-256 in `recipe-file-backups/afro-sunset-rebuild/`.

## Editable source and outputs

- Master: `public/generated-flyers/afro-sunset-master.html`
- Adapter: `scripts/build-afro-sunset-master.mjs`
- Portable project: `public/generated-flyers/afro-sunset.nflyer`
- Gallery sessions: `lib/template-data/afro-sunset-v2.json`
- Actual editor previews: `public/generated-flyers/afro-sunset-{square,story}-preview.png`

Sixteen independent text owners including the initially empty details label. AFRO and SUNSET are separate editable Didot Bold (700) headings in cream and gold; supporting text uses LEMONMILK-Light. No new font family. Source title size is 190px in Square, with horizontal scale 0.95 / 0.9. Story uses 210px / 200px, with a clear gap between the title lines and the tagline. Separate presenter/date/hours, genres, description, venue/address, mood, motto, QR caption and 21+ badge text. Native QR supports upload/reset. Supplied backgrounds are preserved as-is.

## Verification

Source and actual editor previews reviewed in both formats. Import suite covers all visible text owners, headline/subtitle edits, details-label clear/retype, alignment, QR replacement/reset, independent format tracking and project save/reopen. Effects suite covers size, spacing, leading, shadows, layer order and format save/reopen. Two structural tests in `tests/coco-afro-sunset-rebuild.test.ts` and focused ESLint pass. No paid PNG export, commit or deployment. Cross-platform availability of local Didot is not newly verified.

Preserve newer accepted user saves before rebuilding.

User headline refinement: regular Didot was too light and compressed compared with the target. Both words now use the real Didot Bold face (700), with wider Square proportions.
