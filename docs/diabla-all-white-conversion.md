# Diabla All White target conversion

Accepted update: the user supplied the edited save, now registered as v2 at
`public/generated-flyers/diabla-all-white-updated.nflyer`, byte-identical to the
accepted source. 24 active recipes. Both v2 previews are verified and visually
inspected. See `diabla-all-white-accepted-save.json`. Initial draft notes below
are historical; never rebuild over the accepted save.

User supplied image 1 as the Square reference, image 2 as Story background,
and image 3 as Square background. Editable draft:
`public/generated-flyers/diabla-all-white.nflyer`.
This is separate from the accepted Zona de Perreo / Diabla recipe.
Do not register until the user supplies their updated/accepted save.
Current active recipe count remains 23.

## Assets and typography

Both original backgrounds are embedded byte-for-byte, with the woman already
in each composition. No subject extraction or raster editing was applied.
Sources: `assets/all-white-square.png` and `assets/all-white-story.jpg` under
`public/generated-flyers/`. The crown is an independent authored SVG approximation
of the reference crown (`assets/diabla-crown.svg`). Five divider lines are
independent shapes. Each format has 17 compiled objects, including 10 text fields.

DIABLA uses Didot regular, scaled vertically to retain the tall reference
proportions. Didot is a local system font, not embedded; another machine without
it may render a fallback. All White uses the repository's Dear Script (Demo_Font).
Reflective gold gradients, fine strokes and directional shadows approximate the
reference's metallic type. The script and crown are approximations, not exact
tracings. Coco's existing SVG gradient renderer may differ from native CSS in
baseline and reflection direction. No new app renderer was needed.

Square follows the reference's lower title placement. Story places the title
above the model, using the supplied background's architectural negative space.
Both retain all reference copy and have independently authored positions.
The project explicitly disables absent labels and uses neutral master grading
(contrast 1/0.9 compensates the editor's gamma=1 contrast multiplier of 0.9).

## Controls

| Object | Existing panel |
| --- | --- |
| DIABLA | Headline |
| All White | Sub Headline |
| SAT / OCT / 05 | Date |
| Music genres | Event Details |
| Good Music Beautiful People | DJ Lineup |
| All White Affair | Entry |
| Latin Night | Subtag |
| Baila / Conecta / Disfruta | Right rail |

## Reproduction and verification

- Master: `public/generated-flyers/diabla-all-white-master.html`.
- Build: `node --experimental-strip-types scripts/build-diabla-all-white-master.mjs`.
- CSS previews: `node scripts/render-diabla-all-white.mjs`.
- Editor import: `node scripts/verify-diabla-all-white-import.mjs`.
  `NF_PREVIEW_ONLY=1` skips pointer-selection checks when refreshing previews.
- Artifact checks: `node --test tests/coco-diabla-all-white-compile.test.ts`.

Both format compilations report 17 objects, no unsupported objects and no
warnings. Three artifact tests pass, including exact background bytes, control
bindings and independent format placement. All 20 actual-pointer text selections
passed with the existing sidebars and without floating text controls. Final
Square/Story previews passed title/aspect checks after the last Story spacing /
neutral grading adjustment. Both were visually inspected; no browser errors.

Do not rebuild over a future user-refined save; preserve that save as authority.
