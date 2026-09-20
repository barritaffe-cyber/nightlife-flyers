# Yacht Escape v2

Rebuilt existing gallery ID `yacht_escape` from the user's layout target and
separate assets `/generated-flyers/assets/yacht-square.png` and
`/generated-flyers/assets/yacht-story.jpg`. Sunset Yacht is a separate template.

CSS source: `public/generated-flyers/yacht-escape-master.html`.
Builder: `scripts/build-yacht-escape-master.mjs`.
Outputs: `public/generated-flyers/yacht-escape.nflyer` and
`lib/template-data/yacht-escape-v2.json`.

Gold-gradient Didot title, overlapping Dear Script subtitle, Lemon Milk details,
code-native SVG anchor, dedicated portrait positioning. Both images remain
uncut; the background is not generated or reconstructed. All 21 text objects
have independent bindings. Date fragments and time labels use the Date panel;
side copy uses Details; venue descriptor uses Venue's companion field. The
recipe palette contains navy, white and gold.

Compiler: 28 objects per format, zero unsupported objects/warnings. Test:
`node --experimental-strip-types --test tests/coco-yacht-escape.test.ts`.
Browser preview: `node scripts/render-yacht-study.mjs`.
Editor import/selection check: `node scripts/verify-yacht-import.mjs`.

Actual editor verification passed for square/story imports and 19 selectable
text objects per format, including all custom time/date labels and compliance.
No page errors. Existing unrelated TypeScript diagnostics remain; none in the
changed template/editor files.

## Authoritative saved revision

User save 2026-09-09T04:04:09.841Z supersedes the CSS baseline. SHA-256:
`ff1077cf2fa29451f7c94fa0e3a2b67cd59afc5f584c45a5f29d28fa6c47b02d`.
The updated .nflyer backup preserves exact bytes; gallery JSON preserves both
sessions exactly, including story QR and all overrides. Use
`node scripts/sync-yacht-saved.mjs` for subsequent saved updates. The CSS builder
is guarded against overwriting the accepted save; master HTML remains a
historical construction reference. Gallery uses the saved editor preview.
