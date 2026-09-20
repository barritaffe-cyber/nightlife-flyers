# Elite Monday conversion

Active request: conversation image 1 is the Elite Monday target; image 2 is the
asset sheet. This follows completed We Outside work and is unrelated to Grey Rave.

Files:
- `public/generated-flyers/elite-monday-master.html` — semantic CSS master, `?format=square` or `?format=story`.
- `public/generated-flyers/elite-monday.nflyer` — portable editable Square and Story project.
- `public/generated-flyers/elite-monday-{square,story}-css-preview.png` — native-size CSS previews.
- `scripts/build-elite-monday-master.mjs` — preparation and compilation.
- `scripts/render-elite-monday.mjs` — CSS preview rendering.
- `scripts/verify-elite-monday-import.mjs` — Coco import and text-selection verification.

The existing Elite Monday draft and subject bitmap were found in the workspace.
The bitmap's checkerboard was baked into RGB pixels. An imagegen-authored
black/white mask now supplies the silhouette through an SVG luminance mask;
the original bitmap is preserved. The generated mask is an approximation.
Background SVGs crop the supplied sheet without modifying the original bitmap.
The SVG compositions are rendered and embedded as compressed WebP images in the
portable project. `assets/elite-monday-subject-cutout.png` is also available with
real alpha transparency. The original bitmap and generated mask remain intact.

Each format contains 20 objects, including 15 independently editable text fields.
Text uses existing sidebar panels. Square is an explicit adaptation of the
portrait reference. Branding and DJ lettering are editable type approximations,
not exact reproductions of the supplied logos. The subject artwork differs from
the target's pose/details. Do not describe the flyer as a pixel-exact recreation.

Compiler reports zero unsupported/approximated objects and zero warnings in both
formats. Structural checks confirmed all 30 text bindings have existing panels,
all images are embedded, and canvas dimensions are correct. CSS previews were
rendered and visually inspected. All 30 actual-pointer text-selection checks passed in the real editor, with
existing sidebar activation verified, no page errors, and no desktop floating
inspector. Square editor output was visually inspected. The Story editor
screenshot caught a transient preparation overlay and is not valid final
visual evidence; its CSS preview was inspected and all text selections passed.
Editing values, save/reload, and app export were not exercised. The initial conversion was not registered. The updated editor save below
now supersedes it as the registered recipe master.

## Accepted updated editor save

Registered as version 2 from `assets/elite-monday.nflyer`, copied unchanged to
`public/generated-flyers/elite-monday-updated.nflyer`. This is now authoritative.
Do not recompile over it. The older CSS master and compiled draft are historical.
Preserves 15 Square and 13 Story object overrides. Recipe previews use the
`elite-monday-{square,story}-v2.png` files under `public/coco-references/recipe-exports`.
Ten focused registry, saved-design preservation and ordinal-date tests pass.
Both updated recipe previews rendered in the real editor without page errors
and were visually inspected. Source and registered master checksums still match.
