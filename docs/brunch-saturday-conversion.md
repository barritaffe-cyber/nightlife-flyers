# Brunch Saturday conversion

Source: `public/generated-flyers/brunch-saturday-master.html`.
Output: `public/generated-flyers/brunch-saturday.nflyer`.

Rebuild with `node scripts/build-brunch-saturday-master.mjs` from the repository root. This prepares the conversion HTML, renders the existing CSS fruit masks as separate transparent image layers, compiles both formats, and embeds compressed image assets. It preserves the source master. Use this build script rather than the generic compiler command, which does not perform preparation or asset embedding.

Square preserves the 1000 × 1000 composition, with text scaled to Coco's 540-pixel artboard. Story fits the complete square in the center of a 9:16 dark amber canvas, without stretching or cropping. The QR remains the source's replaceable placeholder. All 16 event text objects have editable bindings; the remaining six objects are the background, three foreground layers, ribbon, and QR placeholder.

The editor needs the accompanying URL-texture rendering and font-preservation fixes in `app/page.tsx`. Fonts use the application's installed Anton, Dear Script (Demo_Font), and Arial faces. Image assets are embedded; fonts are supplied by the application.

Run `node scripts/verify-brunch-saturday-import.mjs` for editor verification. Set `NF_VERIFY_URL` to the local app URL (default `http://localhost:3001/?guest=1`). Screenshots are written to `/private/tmp/brunch-saturday-verification`.

Validation: both formats import and render without browser errors; format switching preserves Arial supporting copy and the Dear Script headline. Compiler checks find 22 objects and 16 editable text bindings in each format, with no warnings. The 14 existing compiled import, text-run, and shadow-control tests pass. Repository-wide TypeScript checking still reports unrelated existing errors in other components/tests; the changed `app/page.tsx` has no reported errors in the checked version.
