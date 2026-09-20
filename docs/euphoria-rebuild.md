# Euphoria — The Underground

Replaces **Rave / EDM Flyer** (`edm_tunnel`) at the user's request. Uses the supplied `euphoria-square.jpg` and `euphoria-story.jpg` backgrounds and `png-glyphs/euphoria.png` lettering sheet. The previous registry is archived byte-for-byte with SHA-256 in `recipe-file-backups/euphoria-rebuild/`.

## Editable assets

- Source master: `public/generated-flyers/euphoria-master.html`
- Adapter: `scripts/build-euphoria-master.mjs`
- Portable project: `public/generated-flyers/euphoria.nflyer`
- Gallery sessions: `lib/template-data/euphoria-v2.json`
- Editor previews: `public/generated-flyers/euphoria-{square,story}-preview.png`

Eighteen independent text owners, including an initially empty details label. Separate artist names, featuring label, date, hours, mood, ticket caption, venue and address. No QR. The title uses a horizontal scale of 0.75 to match the target's condensed lettering. Date retains a blue/purple gradient. Lower captions use dark ink for contrast on the supplied bright backgrounds. Story places the full title below the sculpture, followed by lineup and venue details.

## Shared Euphoria Chrome PNG

`scripts/build-euphoria-chrome-font.py euphoria-chrome` extracts 36 uppercase/numeral glyphs into `assets/png-glyphs/euphoria-chrome/`, including the original star O and zero. Lowercase aliases uppercase. Low-alpha background residue is removed while preserving chrome colors. Glyph metrics, kerning count and source hash are recorded alongside the PNGs. Packaged as `public/fonts/EuphoriaChromePNG.woff2` and registered in both shared font menus and PNG lettering pickers.

Alphabet/numeral proof: `public/generated-flyers/euphoria-font-preview.html` / `.png`.

## Verification

Square and Story source/editor previews visually inspected. `verify-euphoria-import.mjs` covers every text owner, shared font and PNG pickers, headline/subtitle editing, details-label clear/retype, alignment, format-specific tracking and save/reopen. `verify-euphoria-effects.mjs` covers size, spacing, leading, live shadows, layer ordering and format save/reopen. Two structural tests in `tests/coco-euphoria-rebuild.test.ts`; focused ESLint passes. No paid export, commit or deployment.

Preserve any newer accepted user save rather than regenerating over it.
