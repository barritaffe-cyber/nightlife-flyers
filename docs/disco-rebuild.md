# Disco / Y2K

Accepted user update (2026-09-09T12:38:48.902Z): `disco.nflyer` is preserved
byte-for-byte, archived at `disco-submitted-a8706ba8c3d5.nflyer`, and promoted
to the gallery. `disco-saved-source.json` prevents construction rebuilds.
User layouts, Creamer headline, subtitle styling, removed copy, and overrides
are authoritative.

Runtime fixes: mapped sidebar controls read saved binding values and per-object
overrides; native Disco objects participate in this mapping, and MUSIC BY's
font/leading/rotation/tracking controls edit that label independently of DJs.
Disco hit targets are constrained vertically to actual font ink bounds to keep
script-font ascent boxes from blocking the presenter text above the headline.
Glint anchoring rasterizes the current K, chooses its upper painted edge, and
waits for the requested font to load. It follows weight/style/size/font changes.

Validation of the accepted save: all visible text targets select in Square and
Story; intentionally empty saved objects are skipped. Both outer DJs edit and
restore independently. MUSIC BY text and size edits leave DJ KAY unchanged in
both formats. Font-switch tests passed for Creamer, Billion Dreams, Dopestyle,
Northwell, and Lemon Milk Bold. Three artifact tests pass, including exact
accepted-source preservation. Full TypeScript still has unrelated existing
diagnostics; no diagnostics in the changed page or glint component.

Latest correction: the user's circled original identifies a small star-like
specular glint on the K's top serif. `HeadlineGlint.tsx` now anchors a crisp
white-gold core and fine rays to the live final glyph, with a faint halo.
Reduced the broad text glow. No bevel. Font loading and live font/text changes
recompute its position. The effect is part of the export SVG.

Headline lighting correction: user explicitly rejected bevels and requested
specular highlights and edge glow like the glass headline preset. Removed all
offset edge/shadow passes and surface-height lighting. `gold-specular-v1` now
uses only a masked diagonal reflection and a soft warm glyph glow.
The effect scales with live font size and is enabled only on the Y2K
headline. The pre-effect project is archived as `disco-before-specular.nflyer`.
Both editor previews were inspected with the lighting applied. A regression
check ensures the saved project differs only in headline paint metadata.

Rebuilds the existing `disco_mirrorball` gallery entry from the user's Y2K Disco
target. Square uses `generated-flyers/assets/disco-square.png`; Story uses
`generated-flyers/assets/disco-story.jpg`. Both supplied photographs are used
directly, with a separate dark wash and a transparent base to avoid a finished
flyer appearing as an extra background.

The Square layout follows the target's left title and information column. Story
uses the photograph's upper negative space for the title and keeps the subject
clear. Native gold gradients, Didot, Northwell brush lettering, Lemon Milk
captions, and six thin gold rules form the editable overlay.

There are 28 objects and 20 independently editable text bindings per format.
PRESENTS maps to Presenter; day/month map to Date; tagline, mood and admission
copy map to Details; outer DJ names map independently to DJ Lineup; NIGHTCLUB
maps to Venue's companion field. The middle DJ remains independent.

Artifacts:

- `public/generated-flyers/disco.nflyer`: both editable sessions.
- `lib/template-data/disco-v2.json`: matching gallery sessions.
- `public/generated-flyers/disco-master.html`: construction source.
- `scripts/build-disco-master.mjs`: compile and package both formats.
- `scripts/render-disco-study.mjs`: source renders.
- `scripts/verify-disco-import.mjs`: real editor import/selection/edit checks.

Compilation reports zero approximations, unsupported objects, or warnings.
`node --test tests/coco-disco-rebuild.test.ts` passes both artifact tests.
Didot relies on the existing local font mapping; identical availability on
other operating systems is not established.

Future accepted user saves supersede the construction source. The builder
refuses to run when `lib/template-data/disco-saved-source.json` exists. No
Coco recipe registry entry was added. Avoid source edits during editor browser
verification because hot reload can reset the imported canvas.

Actual editor validation passed both imports, all 40 pointer selections, and
independent edit/restore of DJ NOVA and DJ ELLE in both formats with no browser
errors. A final spacing adjustment raises the script clear of the tagline and
subject. Both final editor previews were refreshed using `NF_PREVIEW_ONLY=1`
and visually inspected. The focused artifact tests also pass on the final build.
