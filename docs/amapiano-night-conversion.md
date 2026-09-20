# Accepted Amapiano Night save — v2

User explicitly supplied public/generated-flyers/amapiano-night.nflyer as the
updated save. It is preserved byte-for-byte in amapiano-night-updated.nflyer.
Do not rebuild over either file. Retains 7 Square / 5 Story object overrides,
independent paper tear and footer backing. Provenance/checksum:
docs/amapiano-night-accepted-save.json.

Registered for Amapiano/Afrobeats briefs, with portable cache revision and v2
preview paths. Active recipe count: 21. Background replacement tests cover the
accepted paper/footer objects and overrides. Event-details brief copy targets
the side-attraction text, preserving the separate MC block.

Seventeen focused tests passed. Both accepted-file previews passed saved-title
checks and were visually inspected, with no browser errors.

## Historical initial conversion

# Amapiano Night conversion

User's image 1 is the target; images 2 and 3 are Square and Story backgrounds.
Original assets/amapiano-square.jpg and assets/amapiano-story.jpg are preserved
and embedded in the project as WebP. Portrait and outline are baked into the supplied backgrounds. The original
JPG torn edge is covered by a separate black footer backing and an independent
editable paperTear image from assets/amapiano-paper tear.png. The transparent
PNG is embedded in the project and survives replacement of the background. Story retains its white header, with dark
presenter lettering for legibility.

Master: public/generated-flyers/amapiano-night-master.html
Project: public/generated-flyers/amapiano-night.nflyer
Scripts: build-amapiano-night-master.mjs, render-amapiano-night.mjs,
verify-amapiano-night-import.mjs under scripts/.
Previews: amapiano-night-{square,story}-{css-preview,preview}.png.

Fifteen editable text objects per format, plus background, divider, and three orange label banners. Headline
uses Lacheyard Script with orange fill, white stroke and layered shadows; support
uses LEMONMILK-Bold. This approximates the custom target lettering and logos.
Music label/DJs use DJ Lineup. Host label/MCs and side-attraction label/offer
use independently selected Event Details label/body pairs. Enquiries caption and phone numbers use RSVP label/body controls. Main venue/address have separate native fields.

Both compiler reports have zero warnings/unsupported objects. Four focused
compile tests pass. Initial 30 actual-pointer selections passed with no browser
errors or floating text inspector; all 30 checks also passed after label routing
changes. The builder explicitly adds the headline stroke omitted by CSS
extraction, and label bars are editable shapes. Final clean editor previews
passed identity checks and were visually inspected.
Not yet registered: retain this original when the user supplies an accepted save.

Paper-layer update: 22 compiled objects each. Both editor previews verified.
Browser replacement-background checks confirm the retained footer in each format
(scripts/verify-amapiano-paper-tear.mjs). Original source images are unchanged.

Mapping revision: verify-amapiano-mapping.mjs passes live independent host and
side-attraction edits in both formats. Five compile/mapping tests pass. Compiled
headline/subheadline Skew now persists per-object overrides and renders skewX;
verify-compiled-title-skew.mjs passes positive/negative/reset in both formats.
