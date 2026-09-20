# Reggae Jams — supplied target replacement

## Version 5 — supplied Story refinement (2026-09-13)

The later Desktop `reggae.nflyer` Story session is now active. Its hash is
`fe904befb5ffe5c43b30a82fc8fbbfce971fc11111feb3fccbd6fc3c0ece6b37`.
The accepted version 4 Square remains unchanged at
`f9aa2a9a0eee0bf9cffbc8ca13055287d71641c07b0de75c7cc2b3de3efae86b`.
Use `scripts/promote-reggae-jams-story.mjs` to repeat this format-isolated merge.

## Version 4 — supplied Square-only refinement (2026-09-13)

The active recipe now takes `state.session.square` exactly from the supplied
Desktop `reggae.nflyer`. Its Story session was rejected by the user and was not
promoted: active Story retains the version 3 session hash
`2bfd35fd7090a833930f92abbe273d2f28afd1a3993da62f53c30079cff275be`.
The promotion is repeatable through `scripts/promote-reggae-jams-square.mjs` and
is guarded by `tests/coco-reggae-jams-square-update.test.ts`. Root-level format
maps replace only their Square members, preventing Story layout/cache leakage.

## Version 3 — tropical lounge target (2026-09-13)

The active `reggae-jams` recipe now uses the newly supplied target, independent
Square/Story lounge backgrounds, and supplied transparent woman subject. The
previous accepted v2 project remains byte-identical under
`public/generated-flyers/archive/reggae-jams-v2-accepted/`; the active portable
master is `public/generated-flyers/reggae-jams.nflyer`.

`REGGAE` stays live Anton text. Its red → orange/gold → yellow → green color
travel, fine stucco grain, gentle highlight and dark depth are separated into
`assets/reggae-jams-stucco.svg`, then mapped through the live per-glyph SVG mask
renderer with `paint.textEffect = reggae-stucco-v1`. This avoids a flattened
title and preserves editing, typography and per-letter shadows.

The supplied `assets/png-glyphs/reggae script.png` becomes the template-scoped
`Reggae Jams Script PNG` family. `scripts/build-reggae-jams-font.py` preserves
the source cream/gold RGBA pixels, packages 62 uppercase/lowercase/digit glyphs
into `public/fonts/ReggaeJamsScriptPNG.woff2`, and records source hash, bounds,
baselines and kerning in `assets/png-glyphs/reggae-jams-script/metrics.json`.
It is intentionally excluded from public font menus and used by editable `Jams`.
The uppercase `J` descender crosses the alphabet sheet's first-row boundary, so
the font builder seeds the glyph inside that row and follows only its connected
paint into the inter-row space. Do not restore a hard crop at y=252: it removes
the curled tail visible in the target. The corrected browser asset uses the
`?v=2` font URL revision so an earlier cached bitmap cannot survive the rebuild.

Both formats compile 27 objects with 20 editable text owners and zero warnings
or unsupported objects. The dress code uses its own compiled binding so subject
layout automation cannot pull it off the cream brush strip. The final actual
editor previews are `reggae-jams-square-preview.png` and
`reggae-jams-story-preview.png`. Full editor acceptance passed live material
masks, four independent Jams bitmap glyphs, both formats, every text selection,
and browser error checks. Four focused recipe/font tests and the 60-recipe
gallery registration tests pass. PNG export was not exercised.

## Version 1–2 history

Image 1 is the target. Image 2 is the subject; image 3 is the Story background;
image 4 is the Square background. Sources remain unchanged:
- assets/reggae-target.jpg
- assets/reggae-subject.png (already transparent)
- assets/reggae-bg-storyjpg.jpg
- assets/reggae-bg-square.png

Project: public/generated-flyers/reggae-jams.nflyer
CSS master: public/generated-flyers/reggae-jams-master.html

Each format contains 20 editable text objects plus a locked background,
independent subject, and independent footer fade. All images are embedded as
WebP in the portable file; the subject retains alpha. The fade comes from a
separate code-authored SVG. Anton approximates the target's condensed display
lettering; the exact stylized title font is not reproduced. REGGAE retains its
red/gold/green text runs. Square has its own adapted layout.

Mappings: headline REGGAE, subheadline JAMS, presenter NIGHTLIFE/PRESENTS,
entry Price, time/date pieces Date & Time, dress code Subtag, music label and
DJs DJ Lineup, hypemen label and MCs Event Details, attractions Footer Details,
venue/address Venue, reservation label/contact RSVP.

Build: scripts/build-reggae-jams-master.mjs
Render: scripts/render-reggae-jams.mjs
Editor verification: scripts/verify-reggae-jams-import.mjs
Focused file checks: tests/coco-reggae-jams-compile.test.ts (3 passing).
Both compiler reports: 23 objects, zero warnings/unsupported objects.
All 40 real-pointer text-selection checks pass across Square and Story, with
no browser errors. Clean preview capture checks assert the actual REGGAE title. Both clean editor
previews passed and were visually inspected, with no browser errors.

Accepted save registered as recipe v2 from assets/reggae-jams.nflyer.
Portable master: reggae-jams-updated.nflyer (byte-identical to the supplied save).
18 Square and 12 Story object overrides retained; provenance in
reggae-jams-accepted-save.json. Active recipe count is now 22.
Initial build artifacts remain separate; do not rebuild over the accepted save.
