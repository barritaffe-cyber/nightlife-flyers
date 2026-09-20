# R&B Thursdays — editable conversion

Image 1 in the conversation is the target; image 2 is the Square background,
image 3 the subject, image 4 the Story background. All supplied assets remain unchanged:
- `public/generated-flyers/assets/r&b background-square.png`
- `public/generated-flyers/assets/r&b-subject.png`
- `public/generated-flyers/assets/r&b background-story.png`

Project: `public/generated-flyers/rnb-thursdays.nflyer`.
CSS master: `public/generated-flyers/rnb-thursdays-master.html`.
Build: `node scripts/build-rnb-thursdays-master.mjs`.
CSS previews: `node scripts/render-rnb-thursdays.mjs`.
Editor verification: `node scripts/verify-rnb-thursdays-import.mjs`.

Square and Story have individually authored layouts. Each has 14 editable text
objects, an independent subject, a locked background and the existing replaceable
native QR overlay. The subject is embedded as the exact supplied PNG bytes,
including its transparency. Backgrounds are embedded as quality-96 WebP.
No generated imagery or additional cutout processing was used.

Mappings: R&B → Headline; Thursdays → Sub Headline; month/day/hours → Date & Time;
recurrence → Event Details; free entry/ladies restriction → Entry Price/Label;
attractions → Footer Details; address → Venue Address; reservations caption/number
→ RSVP. Presenter uses the existing Presenter card. All text uses existing sidebar
controls rather than a separate desktop floating inspector.

The headline now uses the user-supplied layered glass CSS foundation as four live
text paint passes. See rnb-glass-headline.md. The Bodoni/Didot/Times font stack
uses system fonts, which are not embedded. Supporting fonts are existing bundled faces.
The native QR is a replaceable placeholder; no destination was supplied.

Both compiler reports: 16 compiled objects, zero unsupported objects or warnings.
Ten focused file/native-text/shadow tests pass, including exact PNG preservation
and panel bindings. ESLint reports zero errors and three existing warnings.

A narrow app/page.tsx correction prevents the compiled price object from injecting
an extra caption when another compiled text object already owns priceLabel.
The browser verifier asserts that the R&B caption renders once in each format.
Not registered as an active recipe; await the user's updated/accepted editor save.

Final editor verification passed all 28 real-pointer text-selection checks across
Square and Story, plus caption duplication checks. Both clean editor previews
passed headline/aspect identity checks and were visually inspected. No page or
maximum-update-depth errors in the final run. Initial interrupted/hot-reload
captures are superseded by these final previews. Save/reload and export UI were
not separately exercised.

## Accepted save supersedes the initial build

User registered the updated root rnb-thursdays.nflyer as the accepted recipe.
The byte-identical registered master is rnb-thursdays-updated.nflyer, recipe v2.
All 14 Square and 14 Story overrides are preserved. Active recipe count: 23.
See rnb-thursdays-accepted-save.json. Never rebuild over either accepted file.

Accepted v2 Square/Story previews exported and visually inspected with no browser
errors. The source and registered master remain byte-identical after verification.
