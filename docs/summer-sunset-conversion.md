# Summer Sunset editable draft

Accepted update: registered as v2 from the user-supplied save, preserved exactly
at `public/generated-flyers/summer-sunset-updated.nflyer`. Story includes the
user-added QR and changed presenter. Both v2 previews passed and were visually
inspected. Active count: 25. See `summer-sunset-accepted-save.json`. Draft notes
below are historical; never rebuild over the accepted save.

User supplied image 1 as the target, image 2 for Square and image 3 for Story.
Project: `public/generated-flyers/summer-sunset.nflyer`.
Original `assets/sunset-square.png` and `assets/sunset-story.png` are embedded
byte-for-byte. Story uses a 1080×1920 canvas with the supplied portrait image
cover-fitted; Square is 1080×1080. No raster editing was applied.

The two-line SUM / MER headline is one editable text object, with separate white
and yellow text runs preserving both yellow M accents. Fonts use bundled
LEMONMILK-Regular and LEMONMILK-Bold. The striped frame and four zigzag ornaments
are independent authored SVG assets; the date badge and website backing are
separate shapes. 19 objects per format include 11 editable text blocks.

Club name maps to Presenter; entry to Entry; start time/day/month to Date;
contact label and number to RSVP; DJs to DJ Lineup; website to Address;
SUNSET to Subtag. Desktop selection uses the existing sidebars.
Unused native text is explicitly blank/disabled, and master grading is neutral.
No generic template copy, QR, or stock watermark is included.

Master: `public/generated-flyers/summer-sunset-master.html`.
Build: `node --experimental-strip-types scripts/build-summer-sunset-master.mjs`.
CSS preview: `node scripts/render-summer-sunset.mjs`.
Editor verification: `node scripts/verify-summer-sunset-import.mjs`.
Artifact checks: `node --test tests/coco-summer-sunset-compile.test.ts`.

This is a draft awaiting the user's refined save before registration. Active
recipe count remains 24. Never rebuild over a future user-accepted save.

Verification: both artifact tests and all 22 pointer text selections passed.
Final editor previews passed title/aspect checks with the restored, verified tracking;
both were visually inspected, with no inherited copy or browser errors.

The editor currently wraps/mispositions this multiline colored headline with
very wide tracking. The final draft uses .19em Square / .2em Story to keep both
rows stable. Its horizontal letter spacing is narrower than the reference.

User follow-up: frame extended downward by 3 percentage points in each format,
with the top fixed (Square 25%–77%, Story 28%–75%). Text positions unchanged.

Authored headline bounds, size and tracking are stored as compiled overrides to
prevent format callbacks from shifting the title. They remain editable through
the existing headline controls.

Renderer correction: native painted-text containment now skips compiled document
text after clearing its containment scale/translation. Multiline hit surfaces
were otherwise measured as ink and moved the Story headline left. The existing
compiled artwork bounds remain authoritative. Six focused tests pass.
