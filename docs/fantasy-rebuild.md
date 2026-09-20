# Fantasy — Euphoria

Rebuild of gallery ID `fantasy` from the supplied Euphoria reference, with
separate Square (1080×1080) and Story (1080×1920) compositions.

Square uses the existing matching clean photograph `/templates/fantasy-editor.jpg`.
Story uses the supplied `/generated-flyers/assets/fantassy-story.png` directly.
The photographic assets are not regenerated. A separate editable teal gradient
wash supports the footer. The base background is explicitly transparent to avoid
falling back to a finished flyer preview.

Artifacts:
- `public/generated-flyers/fantasy-master.html`
- `public/generated-flyers/fantasy.nflyer`
- `lib/template-data/fantasy-v2.json`
- `scripts/build-fantasy-master.mjs`
- `scripts/render-fantasy-study.mjs`
- `scripts/verify-fantasy-import.mjs`

Both formats contain 40 compiled objects and 24 independently bound text objects.
Didot supplies the gold-gradient headline, date, subtitle, genre list and venue;
Lemon Milk supplies presenter and small service captions. Didot uses the existing
local font mapping, so identical availability on other operating systems is not
established. The target is adapted with native gradient/shadow paint; the rejected
New York specular-overlay implementation is not used.

Date fragments open Date, PRESENTS opens Presenter, admission/service captions
open Details, the outer DJ names open DJ Lineup, and NEW YORK opens Venue's
companion text control. All labels and values are independently editable. The
two outer DJ names use the reusable mapping added during the New York rebuild.

The existing Fantasy gallery entry is replaced; no Coco recipe registry entry is
added. A future user save supersedes the construction HTML. The builder refuses
to run once `lib/template-data/fantasy-saved-source.json` exists.

Compilation: zero unsupported objects and warnings in both formats. Two focused
artifact tests pass (`node --test tests/coco-fantasy-rebuild.test.ts`). Browser
verification uses the existing local Playwright fallback and supports
`NF_BASE_URL`, `NF_STARTUP_MS`, and `NF_PREVIEW_ONLY`. Do not edit source while it
runs because HMR resets the test canvas.

Actual editor validation passed both imports, all 48 pointer selections, and
independent edit/restore of the two outer DJ names in each format, with zero
browser errors. Clean previews were refreshed separately with
`NF_PREVIEW_ONLY=1 node scripts/verify-fantasy-import.mjs` to avoid carrying an
active text selection between formats. Both previews were visually inspected.
Full TypeScript remains blocked by existing unrelated diagnostics; no diagnostics
were reported for the Fantasy test, gallery wiring, or `app/page.tsx`.
