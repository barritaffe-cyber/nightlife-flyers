# Brunch Sundays

Square (1080×1080) and Story (1080×1920) template based on the supplied pink brunch target. Girl Code was completed and verified before this template was started.

## Sources

- Supplied photographs: `public/generated-flyers/assets/brunch-square.jpg` and `brunch-story.jpg`. Dimensions identify the formats; the second attachment was Story.
- Reference: `public/generated-flyers/redesigns/brunch.png`.
- Authored layout: `public/generated-flyers/brunch-sundays-master.html`.
- Adapter: `scripts/build-brunch-sundays-master.mjs`.
- Portable project: `public/generated-flyers/brunch-sundays.nflyer`.
- Session cache: `lib/template-data/brunch-sundays-v1.json`.
- Themes: Brunch, Tropical, R&B / Lounge. The supplied photographs already include the subject.

The existing Brunch Vibes and Brunch Saturday templates are preserved. The builder refuses to overwrite a future accepted `brunch-sundays-saved-source.json`. Once the user saves refinements, promote those actual sessions instead of rebuilding the construction HTML.

## Editing

Brunch is live Whimsical SVG text with clean ivory fill and teal depth. It uses the existing shared glyph and collision-aware flourish system; no raster headline or runtime AI is required. The static HTML wordmark is synchronized with `node --experimental-strip-types scripts/sync-brunch-sundays-wordmark.mjs`. The glass is a separate native SVG decoration.

Both formats have 22 independent text owners, including an initially blank details label. Presenter, date, three DJs, brunch offer, meal inclusion, drinks package, venue, venue description, address, reservations and age are mapped separately. The year calculates weekday without appearing on the flyer. DJ separators hide when their corresponding names are empty. Atmospheric side copy and mug lettering remain authored copy and can be edited from their own controls.

Square and Story have separate compositions; the title ribbon clears the face, and the external glass remains separate from the script flourishes.

## Verification

- `node --experimental-strip-types --test tests/coco-brunch-sundays.test.ts tests/coco-girl-code.test.ts`
- `npm run coco:recipe -- audit brunch-sundays`
- `NF_BRUNCH_SUNDAYS_EXPORT_ACCESS_FIXTURE=1 NF_BRUNCH_SUNDAYS_PUBLISH_PREVIEWS=1 node scripts/verify-brunch-sundays.mjs`
- `node scripts/verify-brunch-sundays-discovery.mjs`

The browser fixture replaces only the local starter-render quota response. PNGs are produced by the real export UI/renderer; account entitlement enforcement is outside this test. Reports, editor screenshots and exports are in `/tmp/brunch-sundays`; discovery captures are in `/tmp/brunch-sundays-discovery`.

## Acceptance results

- Compiler: 32 objects per format, no unsupported or approximated objects; adapter audit passes.
- Full editor verification: 42 visible text edits, two details-label checks, four PNG exports (2160×2160 / 2160×3840), two save/reopen checks and independent format shadow persistence. No browser errors.
- Actual editor, original exports, and edited/reopened exports were visually reviewed. Gallery previews use the original editor captures. Full report: `/tmp/brunch-sundays/full-controls-results.json`.
- Final rebuild only changes the mug semantic metadata from mood to designCopy plus the save timestamp; artwork and control bindings are identical to the fully tested project.
- Focused Brunch, Girl Code and provenance tests: 13/13 pass.
- Coco discovery passes through Brunch recommendations, both personalized previews and the details form.
- TypeScript remains at the existing 298 diagnostics; none are in the new template or changed registration/contracts.
