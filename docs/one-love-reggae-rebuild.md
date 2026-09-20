# One Love — Reggae Night

New gallery template `one_love_reggae`, explicitly confirmed by the user. Existing reggae templates are preserved. Separate Square and Story compositions use supplied `assets/one-L-square.jpg` and `assets/one-L-story.jpg`.

ONE and LOVE use existing Drift Brush SVG lettering, rotated upward by 8 degrees and horizontally scaled to .82. ONE retains independent green/gold/red text runs; LOVE is cream. Supporting copy uses LEMONMILK-Light and Bold. A local tricolor SVG underline and subtle radial title shade support the composition. No new fonts, raster-generated lettering, venue, presenter or QR.

Eight visible editable text owners plus empty details label: headline, subheadline, reggae-night caption, music styles, weekday, date, hours and footer. Explicitly disable inherited venue/presenter fields; otherwise an unrelated venue and duplicate date can appear below the compiler-owned content.

Files use `one-love-reggae` prefix: HTML master and portable project in `public/generated-flyers`, V2 data in `lib/template-data`, build/render/import/effects scripts in `scripts`. Builder protects accepted `one-love-reggae-saved-source.json` user saves.

Validation: no compiler warnings or unsupported objects. Both editor previews inspected. All eight visible text owners passed editing checks in both formats, including details-label and alignment controls. Headline/subheadline effects, typography, layers and format checks passed. Two structural tests and focused lint passed. Save/reopen check uses genres alignment because this template has no address object.

Final user refinement: tightened ONE tracking to `-.18em` in both formats; LOVE spacing unchanged. Recompiled and refreshed source/editor previews; structural tests passed after refinement. Save/reopen and format roundtrip passed before this spacing-only adjustment.

Additional user refinement: E alone has `margin-left: -.14em`, preserving the O–N gap and overall `-.18em` tracking. Shared text-run extraction/resolution/paint now preserves optional em-based left margins; edits replacing the original inline word discard those authored runs as before.

Screenshot follow-up: tightened LOVE V–E with an E-only `margin-left: -.20em`; LOV positions and all ONE spacing remain unchanged. Both formats rebuilt and previews refreshed.

Latest correction after user rejected the earlier V–E gap: LOVE E margin is now `-.40em` (supersedes -.20). Final Square editor preview directly compared with `redesigns/one love.png`; Story inspected too. Existing Drift Brush SVG approximates rather than exactly reproduces the target lettering. Both actual editor previews regenerated; registry preview URL uses `?v=4` to refresh cached gallery thumbnails. Existing open/imported designs retain their own saved text-run data; reopening the gallery template loads the revision.
