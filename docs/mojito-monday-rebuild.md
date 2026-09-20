# Mojito Monday — Mint Lounge

Replaces Cocktail Night Flyer (`kpop_pastel_led`) in Square and Story, using the user-supplied `mojito-monday-square.jpg` and `mojito-monday-story.jpg`. The original registry is archived byte-for-byte under `recipe-file-backups/mojito-monday-rebuild/`, with SHA-256.

## Editable source and outputs

- Master: `public/generated-flyers/mojito-monday-master.html`
- Compiler adapter: `scripts/build-mojito-monday-master.mjs`
- Portable project: `public/generated-flyers/mojito-monday.nflyer`
- Gallery data: `lib/template-data/mojito-monday-v2.json`
- Actual editor previews: `public/generated-flyers/mojito-monday-{square,story}-preview.png`

Seventeen independent text owners including the initially empty details label. Venue, address, service captions, date, mood, description and QR caption remain editable. Native QR supports upload/reset. Story places the headline and event information below the glass; Square uses the dark left column.

## Mojito Serif PNG

Built from the supplied `assets/png-glyphs/mojito.png` using `scripts/build-mojito-serif-font.py mojito-serif`. Thirty-seven bitmap glyphs packaged in `public/fonts/MojitoSerifPNG.woff2`, with metrics/source hash under `assets/png-glyphs/mojito-serif/`. The shared family appears in both headline font menus and PNG lettering pickers.

Uppercase `O` (Shift+O or Caps Lock) maps to the original gold leaf O. Lowercase `o` maps to a plain white capital-shaped O, reconstructed from the source ring contours without the interior leaf. Other lowercase letters alias their uppercase shapes. The supplied decorative zero is preserved. The default headline is intentionally stored as `MOJITo` to match the target's first gold O and final white O. Preserve that case when editing.

Full alphabet, digits and O/o comparison: `public/generated-flyers/mojito-font-preview.html` / `.png`.

## Validation

Both editor previews visually inspected. Import checks cover every text owner, both shared font/PNG menus, headline editing, details label clear/retype, alignment, QR upload/default, independent format tracking, and save/reopen. Effects checks cover size, spacing, leading, live shadows, layer controls and format save/reopen. Dedicated `NF_CASE_ONLY=1` mode checks literal Shift+O typing alongside lowercase o. Two structural tests and focused ESLint pass. No paid PNG export, commit or deployment performed.

Use the accepted-save guard; preserve newer user saves rather than rebuilding over them.

User spacing refinement: headline tracking increased from −0.02em to +0.025em in both formats to separate the M and leaf O and loosen the remaining letters.

Further user refinement: M advance increased by 90 font units (0.09em) to create clear optical space before the leaf O, including in existing headlines. Font URL version 4 refreshes the cached family.
