# Complex text textures and gradients

This is the reusable workflow established during the Cana corrections and the
Soft Life texture-preservation pass. On 2026-09-16 the user explicitly requested
that this process be saved for future work. Use it when adapting textured type
from a supplied target. The quality target is the supplied reference at readable
size. A passing compiler or working text controls do not establish a visual
match. Keep typography editable; do not flatten the finished reference word into
the flyer.

## Choose the paint method

| Material | Starting implementation | Key requirement |
| --- | --- | --- |
| Solid or smooth multistop gradient | Native text paint or the existing compiled SVG-gradient renderer | Preserve authored stops and direction until the user edits them. |
| Simple repeating texture | `TexturedGlyphShadowText` with CSS text clipping | Offset every glyph back to the shared word origin; do not restart the texture per letter. |
| Complex foil, metal, fabric or natural surface | A textless material image through the existing CSS text-clipping path; use live SVG glyph masks when custom ink fitting or layered material/depth requires them | Preserve the material's continuous color and light travel across the whole word. |
| Supplied bitmap alphabet | Existing PNG-font workflow in [png-lettering.md](png-lettering.md) | Preserve the supplied glyph shapes and alpha; this is different from a material applied to live font shapes. |

Use SVG/code for controllable gradients, masks and restrained edge lighting. Use supplied material imagery when available. When a procedural approximation repeatedly misses the reference's natural surface, use the imagegen skill to create a material map from the reference instead of endlessly adjusting noise. Generate only the material: no letters, scene, borders, lettering shadows or perspective. Copy the selected asset into the workspace and record the exact prompt, reference, generation method and source path.

## Default texture-preservation process — Soft Life pattern

Use this existing compiled-text path first when an image can carry the face
finish. Soft Life needed no new shared renderer or custom effect ID.

1. **Read the surface from the target.** Inspect the actual letters at a readable
   scale: color range and direction, dark areas, grain size, broad reflections
   and narrow highlights. Match the font silhouette separately. A photograph of
   nearby petals is not automatically the same material as the lettering.
2. **Make a reusable textless material.** Prefer a supplied texture. If a new
   bitmap is needed, use the imagegen skill with the target as a material
   reference. Describe the letter-face finish and ask for a continuous,
   full-bleed surface with no words, people, scene or margins. Soft Life's
   [exact prompt and provenance](soft-life-crimson-material-generation.md) are a
   worked example; adapt the material description to the next target instead
   of applying its crimson palette to every template. A generated material is a
   reference-based recreation, not an exact extraction of the original pixels.
3. **Save the asset permanently.** Copy the chosen output into
   `public/generated-flyers/assets/` with a descriptive, versioned filename.
   Preserve the tool's original output and record its path, prompt, reference
   and generation mode. Do not replace the supplied background or bake the
   finished word into it.
4. **Clip the material to live type.** Author a single editable text owner with
   a stable binding and font. Use one `url(...)` background image, a stable
   opaque fallback `color`, text clipping and transparent WebKit text fill.
   Set texture size and position deliberately for each format. For example:

   ```css
   .headline {
     color: #ac0028;
     background-image: url('/generated-flyers/assets/soft-life-crimson-material-v2.png');
     background-size: 1100px 470px;
     background-position: 0 0;
     background-clip: text;
     -webkit-background-clip: text;
     -webkit-text-fill-color: transparent;
   }
   ```

   These dimensions and color are the Soft Life Square example, not universal
   defaults. Its Story texture size is authored separately. The compiled
   renderer scales pixel background sizes from document units into editor units.
5. **Preserve the compiled paint and binding.** Keep `paint.backgroundImage`,
   `backgroundSize`, `backgroundPosition`, clipping and repeat settings intact
   through compilation and save/reopen. Normalize only the compiler's temporary
   local origin to the permanent public asset URL; do not save an ephemeral
   `localhost:<compiler-port>` resource. Keep the initial bound color consistent
   with the authored fallback: the current CSS texture path uses equality with
   `binding.initial.color` to retain transparent fill. An explicit user color
   change intentionally paints a solid fill. Do not accidentally create that
   override during import or template defaults.
6. **Keep one continuous surface across the word.** The existing
   [TexturedGlyphShadowText](../components/text/GlyphShadowText.tsx) offsets each
   glyph back to the word origin and realigns after font loading and resizing.
   Preserve its full glyph paint boxes and margin-based tracking; negative
   letter-spacing on the individual clipped boxes can cut letter edges. Keep
   per-glyph shadows on the actual letters. Do not restart the image in every
   letter or substitute a solid fill/ordinary gradient for the texture.
7. **Preserve every required letter.** Check the full word, especially its final
   glyph, in both formats. Avoid tight owner bounds, clipped paint boxes and
   foreground cutouts that hide letters. The explicit Soft Life requirement is
   that the entire T remain visible; keep that requirement in future revisions.
8. **Verify the finished material end to end.** Wait for fonts and decode the
   material itself; checking HTML `<img>` tags alone does not verify a CSS
   background image. Open Square and Story editor renders and actual PNG
   exports, inspect the letter finish and full layout, then test live text
   edits, shadows, format switching and save/reopen. Confirm the asset URL and
   paint still persist. Refresh gallery previews only from the accepted,
   unedited template, and record evidence separately from test results.

The current compiled texture dispatch recognizes a background beginning with
`url(`. Do not assume a `linear-gradient(...), url(...)` stack will follow this
same path. Put the needed color/reflections in the material image or use an
existing appropriate custom effect and verify it. Likewise, do not claim Grad
A/B recolors a fixed raster texture without implementing that behavior.

Working sources: [Soft Life HTML](../public/generated-flyers/soft-life-master.html),
[adapter](../scripts/build-soft-life-master.mjs),
[material](../public/generated-flyers/assets/soft-life-crimson-material-v2.png)
and [verified editor/export workflow](soft-life-template.md). Preserve a future
accepted user save over this original construction source.

## Separate color, surface and depth

1. Inspect the reference close-up. Identify color travel, local highlights, fine grain, broad roughness, bevel thickness and shadow direction separately. Also distinguish font-shape differences from material differences.
2. Establish a smooth base gradient that already looks right without texture. For Cana, the direction is warm golden yellow through amber into soft burnt orange; avoid a flat lemon-yellow fill or an abrupt red band.
3. Add the natural surface over that base. A material image may already contain color, highlights and roughness. Do not automatically stack the old diffuse/noise/sheen filters over it.
4. Adjust texture contribution against the base, not against transparent black. Cana v6 uses the image at 70%; this is a template-specific balance, not a universal preset. Judge at full-size crop and thumbnail scale.
5. Keep the bevel and depth secondary to the face. Thick bright rims and dark extrusion made Cana look plastic. Use small directional offsets and gentle highlights; expose additional live shadow through the existing text controls.

## Map the material to live letters

- Preserve semantic text ownership and the sidebar binding. The visible mask text must follow text edits, family, size, tracking, leading and alignment.
- Measure after font loading, and remeasure when the font or layout changes. Cana uses DOM baseline markers and canvas glyph ink metrics; it does not use the generic gradient renderer's estimated baseline.
- Fit the material to the **visible ink bounds**, excluding empty line-box space. A map sized to an oversized text box washed out Cana's orange falloff and diluted the texture.
- Use one coordinate system per rendered line for the material. Individual masks reveal each letter from that same surface; the image must not restart inside each glyph. Changing the line's width or height stretches the material, so check grain scale and color distribution after copy or typography edits.
- Paint each glyph's depth, face and live shadow together in text order. A single whole-word shadow changes overlap behavior. Preserve manual line breaks through the existing compiled line wrappers.
- Treat transparent authored fill as the material carrier, not a solid-color override. The earlier mistake hid the material face and left only brown depth. An actual opaque color choice can intentionally replace the material.
- Apply user skew to the outer text owner so the material, glyphs and depth transform together. Up/down line shear uses `skewY`; `skewX` slants letter stems sideways. Preserve authored transforms and old saved behavior separately from new user adjustments.
- Keep masks and filter IDs unique. Wait for both fonts and material images before screenshots or export checks; SVG `<image>` loading is not covered by checking HTML `<img>` elements alone.

## Gradient controls versus fixed material

The general compiled gradient path in `app/page.tsx` preserves original CSS stops until `textFx.compiledGradientEdited` is set by Grad A/B. The visible SVG then reads the edited endpoints. Its Solid Fill behavior and per-glyph shadow wiring are described in [CSS → Coco fidelity](css-to-coco-fidelity.md#5-preserve-paint-and-connect-controls-to-the-visible-layer).

Cana's material gradient is currently authored in `SunsetFoilMaskText.tsx` and the material image. It is **not** driven by the general Grad A/B controls. Live text, typography, opaque color override and shadow bindings are separate from material authoring. Subtitle shadows default to off; the existing live shadow controls remain available. Do not claim arbitrary gradient endpoint editing for this effect without implementing and testing that connection.

## Failure modes from Cana

| Symptom | Cause or check | Correction |
| --- | --- | --- |
| Wood-like horizontal streaks | Strongly anisotropic noise stretched across the letter faces | Use more natural/isotropic grain or a reference-based material image. |
| Flat yellow, weak orange travel | Full-strength diffuse wash, bright base, or map fitted beyond the ink | Separate the color base from lighting; fit the map to visible letters. |
| Only brown letters/depth appear | Transparent compiled text color treated as an opaque override | Inspect the face fill first; exclude transparent defaults from solid overrides. |
| Uniformly harsh foil wrinkles | Surface contribution too strong at final size | Blend it over a matching smooth gradient; inspect again at full size and thumbnail size. |
| Plastic rim | Bevel/extrusion too thick or too bright | Reduce edge and depth instead of adding more global lighting. |
| Source and Coco differ | CSS fallback, SVG blend behavior, units, font metrics or different visible paint paths | Inspect the actual paint DOM and isolate the failing layer; do not compensate by moving unrelated text. |

Preserve user-supplied SVG code after removing Markdown escaping. The normalized original remains source evidence. If compositing needs a compatibility adaptation, preserve the intended stops/layers and document the adaptation. A valid SVG or an error-free browser does not prove the intended blend is visible.

## Verify and save

1. Compare the target, native source and actual Coco output at comparable scale. For a custom mask effect, distinguish the CSS fallback from the authoritative Coco material/bevel render.
2. Inspect a high-resolution material close-up and the whole flyer in **both Square and Story**. Check grain, highlight depth, color transition, seams, crop, clipping and legibility.
3. Select visible glyphs and edit the word. Verify the actual SVG mask contents change, then restore. Check clear/retype, size, spacing, leading, alignment, layer order and per-letter shadow on/off and strength.
4. Save/reopen and switch formats. Confirm the material URL/effect ID, text and independent format settings persist. Verify image decoding, not just the presence of `<image>` nodes.
5. Run relevant template, gallery and shared-renderer checks. Record visual review separately from test results. The user's acceptance requirement is to produce and open actual Square and Story PNG exports, including material close-ups, before declaring verification complete. Do not infer export success from editor screenshots, file creation or an old quota-blocked report. Follow the access-fixture disclosure rule in [template editor acceptance](template-editor-acceptance.md#required-visual-review-before-acceptance) when testing the local renderer independently of account quota.
6. Archive the prior project and affected source with hashes. Update both sessions, recipe version, portable URL/cache revision and the existing gallery entry. Confirm other entries and accepted user saves remain unchanged. Refresh previews and session context.

## Cana-specific implementation and evidence

- Active Punta recipe/session version: **6**, using effect revision **v2**: `paint.textEffect = "sunset-foil-mask-v2"` and `paint.backgroundImage = url("/generated-flyers/assets/cana-metallic-surface-v6.png")`. Recipe and effect version numbers are separate.
- Renderer: [SunsetFoilMaskText.tsx](../components/text/SunsetFoilMaskText.tsx), with narrow dispatch in [app/page.tsx](../app/page.tsx). The older `sunset-foil-mask-v1` remains for previous saves; generic textured recipes keep their existing renderer.
- Material: [cana-metallic-surface-v6.png](../public/generated-flyers/assets/cana-metallic-surface-v6.png). [Generation prompt and provenance](cana-metallic-material-v6-generation.md).
- Builder: [build-punta-cana-master.mjs](../scripts/build-punta-cana-master.mjs). Project: [punta-cana.nflyer](../public/generated-flyers/punta-cana.nflyer). Full history and validation: [punta-cana-rebuild.md](punta-cana-rebuild.md).
- Browser checks: `scripts/verify-punta-cana-import.mjs` and `scripts/verify-punta-cana-effects.mjs`. High-resolution preview mode: `NF_PREVIEW_ONLY=1 NF_ACCEPTED_PREVIEW=1 NF_DEVICE_SCALE=2 NF_MASK_DETAIL=1 node scripts/verify-punta-cana-import.mjs`. This preview-only mode does **not** run the full edit/save cycle; run the import verifier without those preview flags for acceptance.
- Current evidence: eight focused tests passed; both formats passed live text/mask edits, selection, alignment, typography, per-letter shadows, layers and save/reopen. PNG export remains unverified. The result is a reference-based material recreation, not an exact extraction of the reference's lettering.
