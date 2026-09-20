# Girl Code

Editable Square (1080×1080) and Story (1080×1920) template based on the supplied Girl Code target.

## Source and build

- Supplied photographs: `public/generated-flyers/assets/girl-code-square.jpg` and `girl-code-story.jpg`. The first attachment was Story; file dimensions determine format.
- Reference only: `public/generated-flyers/redesigns/girl-code.png`.
- Construction source: `public/generated-flyers/girl-code-master.html`.
- Adapter: `scripts/build-girl-code-master.mjs`.
- Portable project: `public/generated-flyers/girl-code.nflyer`.
- Session cache: `lib/template-data/girl-code-v1.json`.
- Registered themes: Tropical, Urban, R&B / Lounge. The photograph already includes the subject.

Run the construction adapter only before accepting a user save. It refuses to overwrite a `girl-code-saved-source.json` authority. After accepting a user save, promote its actual sessions instead of rebuilding this HTML.

## Typography and editing

GIRL uses the existing Drift Brush SVG vector font with a continuous gold paint image clipped inside live text. CODE uses the existing Bad Girls Brush PNG font. Both words remain editable and independent. The textless material is a close interpretation of the target's gold paint, not an extraction of its original lettering.

Twenty-one text owners have independent bindings, including the initially empty details label. DJs are three separate owners. Date fields include weekday/month/day; the form's year calculates weekday without printing a year. End time, venue description and reservation contact have separate form fields. Mood, motto and handwritten atmosphere are preserved authored copy and remain editable in the editor. DJ and reservation labels disappear when their associated form entries are blank. Crown and heart are gold SVG decorations.

No target text is baked into the background. Each format uses its own photograph and authored positions.

## Gold material generation

Built-in imagegen skill/tool used for `public/generated-flyers/assets/girl-code-gold-paint.png`; original retained in the Codex generated images directory. No AI calls are needed at template runtime. The supplied photographs were not regenerated.

Prompt:

> Use case: stylized-concept. Asset type: a textless metallic GOLD impasto paint material tile for clipping INSIDE editable brush lettering in an event flyer. Generate only the texture, full bleed rectangular 1536x1024. Rich luminous warm yellow gold thick acrylic paint brushed with irregular broad palette-knife ridges, dry bristle streaks and subtle metallic glints, realistic dimensional relief with warm shadow creases. Mostly bright gold with delicate cream highlights and ochre recesses. Macro top-down flat material texture, consistent scale across whole tile, no single focal object. Not a sheet of gold foil, no crumpled foil, no horizontal bands or regular stripes, no glitter. Absolutely NO letters, words, symbols, frames, objects, or background scene. This is a reusable paint surface map, intended to retain real paint depth when masked into brush letters.

## Verification

- `node --experimental-strip-types --test tests/coco-girl-code.test.ts`
- `NF_GIRL_CODE_EXPORT_ACCESS_FIXTURE=1 NF_GIRL_CODE_PUBLISH_PREVIEWS=1 node scripts/verify-girl-code.mjs`
- `node scripts/verify-girl-code-discovery.mjs`

The browser export fixture substitutes only the local starter-render quota response; the real PNG export renderer remains under test. It does not test account entitlement enforcement. Browser artifacts and report are written to `/tmp/girl-code`.

### Acceptance results

- Compiler: 30 objects per format (including the authored blank details label), zero unsupported or approximated objects.
- Full editor run: 40 visible text edits across both formats, six label checks, four real PNG exports, two save/reopen checks, no browser errors. Report: `/tmp/girl-code/full-controls-results.json`.
- Final artwork refinement replaces the rectangular shading with a soft radial vignette. The follow-up passed six title/venue edits, two details-label checks, per-format shadow persistence, two save/reopen checks and all four PNG exports, with zero browser errors. Final report: `/tmp/girl-code/results.json`. Actual Square/Story editor captures, edited/reopened captures and PNG exports were visually inspected.
- Coco discovery: Girl Code / Tropical reaches both personalized previews and the details form.
- Focused template + provenance tests: 9/9 pass.
- Broader registration/authored-recipe suite: 75/80 pass. Five failures concern stale portable registrations for the previously removed `rush-night-css`, `ladies-css-editorial`, `black-gold-party`, and `city-nights`; Girl Code tests pass. These unrelated registrations were not changed.
- TypeScript remains at the existing 298 diagnostics, with none referencing this template's new code or changed registration/contracts.
