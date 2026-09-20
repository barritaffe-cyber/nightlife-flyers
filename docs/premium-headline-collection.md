# Headline collection overhaul

The public collection is defined once in `headline-presets/collection.ts`.
Desktop and mobile both use Clean, Glass, Metal, 3D, Neon, Outline, and Stroke.
Halftone and Kinetic are specialty choices. Neon contains Soft and Tube
variations; the old Flat 3D/Pure 3D choices are consolidated into 3D with depth
and viewing-angle controls. Doodle and Miami Heat are no longer picker choices.
Their renderers and stored settings remain available to old documents.

## Palette ownership

`mapHeadlinePalette` is the single mapping for new collection selections:

| Core role | Material role |
| --- | --- |
| Primary | Face / main pigment |
| Accent | Edge / emission |
| Secondary | Depth / secondary pigment |
| Neutral | Highlight |
| Background start | Shadow |

Lighter/darker material shades mix these roles. Stroke uses the same role colors
in its segments. No per-preset color collections are introduced. Changing the
core palette updates the selected collection material. Local effect-color
controls are read-only for collection selections; old saves keep their editors.

## Behavior and compatibility

New selections carry an optional `headPremiumPreset` marker through snapshots,
undo/restore, per-format state, and save/import. Missing markers mean legacy
behavior; merely opening an old document does not activate the new mapping.
Existing .nflyer files and accepted recipe masters are not rewritten.

Material selection preserves the chosen font and uses the existing coordinate
preservation wrapper. Clean has no decorative effect. Outline is a continuous,
transparent contour. Metal has a thin edge, low roughness/texture and stronger
shine; metallic color comes from the core palette. Metal also has five circular
specular catches clipped to a thin glyph-contour mask, followed by a soft bloom.
Metal Shine ranges from 0–5 (default 0.75). Above 1, an alpha-gain pass
amplifies the catches and bloom instead of saturating the group opacity.
The existing Shine control adjusts both the catches and edge glow; radius stays
fixed as intensity changes. Legacy Gold Block rendering is unchanged. 3D has adjustable extrusion
and view. Neon has lower bloom by default. Stroke retains its segmented shape
and adds an optional glow control. Halftone uses smaller dots; Kinetic uses
smaller slice offsets and a lighter shadow. Glass retains the current nine-pass
renderer and intensity/blur controls. Mobile Glass still uses its existing
Acrylic renderer.

## Verification

`tests/headline-collection.test.ts` verifies collection membership, palette roles,
short hex handling and incomplete palette fallback. Existing R&B glass tests
continue to verify accepted-save compatibility. `scripts/verify-premium-headlines.mjs`
checks the real desktop picker and captures every selection in
`public/generated-flyers/premium-headlines/`.

Final check: all nine desktop selections rendered with Anton; six focused tests
passed. Full TypeScript checking reports existing unrelated errors, with none
in the changed files. Mobile picker uses the shared registry; mobile rendering
and save/reload were not part of this verification.

Metal reference refinement: the opaque face now alternates palette-derived bright
and dark reflection bands. Fine diagonal brush marks replace the legacy noise
filter for premium Metal. A gradient-lit contour is clipped inside each glyph
for a wider internal bevel; the external rim remains thin. Texture/Roughness
adjust brush visibility, Bevel adjusts the internal bevel, and Shine retains
its 0–5 edge-light range. Fonts and core palette selection remain user-controlled.

Metal Interior blur: desktop/mobile slider 0–28 in 0.5 steps, default 0.
`headMetalBlur` is serialized with material state and restored for undo/import/format
changes (missing legacy value defaults to 0). The size-scaled SVG blur applies
to reflections and brush texture before glyph clipping; bevel and edge light
remain outside the blur pass.
