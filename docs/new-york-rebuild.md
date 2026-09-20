# New York — Manhattan Nights

Rebuilds existing gallery ID `new-york` from the supplied reference. Uses the
supplied `assets/new-york-square.png` and `assets/new-york-story.jpg` directly,
with separate 1080×1080 and 1080×1920 layouts. No regenerated backgrounds.

- CSS master: `public/generated-flyers/new-york-master.html`
- Editable project: `public/generated-flyers/new-york.nflyer`
- Gallery sessions: `lib/template-data/new-york-v2.json`
- Builder: `scripts/build-new-york-master.mjs`
- CSS renders: `scripts/render-new-york-study.mjs`
- Editor verification: `scripts/verify-new-york-import.mjs`

Both formats contain 39 compiled objects, including 25 independently bound text
objects. Serif gold-gradient headline (Didot), Dear Script subtitle, Lemon Milk
supporting copy. Three code-native outline SVG icons and separate gold rules.
Didot uses the existing local font mapping; identical font availability on
other operating systems is not established.

Date fragments open Date, NEW YORK opens Presenter, the two companion DJ names
open DJ Lineup, and independent service captions (including admission) open Details. No new floating
controls. Layout positions account for the supplied subjects in each format.

The existing New York gallery ID is updated; no Coco recipe registry entry was
added. Future user saves supersede this construction master and must be
preserved rather than overwritten by a rebuild. The builder checks for
`lib/template-data/new-york-saved-source.json` before rebuilding.

Compilation: zero unsupported objects or warnings in either format. Two focused
artifact tests pass. Full TypeScript retains existing unrelated diagnostics;
none in `lib/templates.ts` or the New York test.

The existing port 3000 server was unresponsive during verification. An isolated
Next development server uses port 3001 and `.next/new-york-review` output.
Both browser scripts accept `NF_BASE_URL`, for example:
`NF_BASE_URL=http://localhost:3001 node scripts/verify-new-york-import.mjs`.

## Verified editor result

Both imported formats passed all 25 actual-pointer text selections (50 total),
with no floating text controls or browser errors. DJ NOVA and DJ ELLE were edited
and restored separately in each format, while DJ KAY remained unchanged.
Final clean editor captures were visually inspected:
`public/generated-flyers/new-york-{square,story}-preview.png`.

The builder explicitly disables unused Subtag and Price to prevent inherited
COCKTAILS copy and an extra ENTRY label. Admission uses an independent Details
binding. A reusable `mappedExistingPanelFields` correction in `app/page.tsx`
connects companion DJ values to the main DJs field, family, size, tracking,
leading, rotation and color while retaining existing label-only mappings.
Full save/download/reload and mobile controls were not separately exercised.

## Accepted save — September 9

User save `2026-09-09T05:55:30.828Z` is authoritative. Original bytes archived at
`public/generated-flyers/new-york-submitted-1b20174dc057.nflyer`.
Corrected source and byte-identical `new-york-updated.nflyer` retain all saved
edits. Only root and both sessions' `bgUrl` / `backgroundUrl` were changed to a
transparent base: the finished Square preview had incorrectly been used as a
background. The independently authored city background objects remain intact.
A nonempty transparent URL prevents gallery fallback to `template.preview`.
Gallery sessions match the corrected accepted save exactly. Provenance:
`lib/template-data/new-york-saved-source.json`. The CSS builder is now guarded.
Use `scripts/sync-new-york-saved.mjs` for saved updates; it archives input bytes
and strips only the known New York preview-background references.
Three focused tests verify the archive differs only by those six background
fields, the corrected backup is identical, and gallery sessions match.

Corrected accepted Square and Story imports/previews passed on port 3000 with no
browser errors; both captures visually inspected, including saved QR/layout edits.
