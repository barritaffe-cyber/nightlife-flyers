# Coco recipe workflow

For closest visual adaptation—especially text size, weight, and placement—start
with [CSS → Coco fidelity rules](css-to-coco-fidelity.md). These record the actual
Brunch corrections and remaining limitations. The CLI audit below is structural,
not proof that the editor matches the CSS; diagnostic builds are not releases.

New recipes use one repeatable gate instead of being considered complete when the flyer merely looks correct.

Every selectable gallery template must have one `recipeId`, one authoritative `VisualRecipe`, one portable Square/Story project URL, and one generated registered-recipe entry. The shared mappings for converted legacy gallery templates live in `lib/recipes/galleryTemplateRecipes.ts`; do not create recipe entries for backup, submitted, or superseded project files.

The [editor acceptance requirements](template-editor-acceptance.md) apply to
every new template, imported update, and shared editor change. They incorporate
the Disco mapping, label, alignment, shadow, font, and highlight regressions.

## 1. Scaffold

```bash
npm run coco:recipe -- init upcoming-card --name "Upcoming Card"
```

This creates the recipe module, CSS master, and build adapter without overwriting existing work.

## 2. Author

For textured lettering, follow the saved
[texture-preservation process](complex-text-materials.md#default-texture-preservation-process--soft-life-pattern).
Keep the material inside live editable text, use a permanent asset URL and
verify continuity, complete letters, save/reopen and both actual PNG exports.
That guide also covers custom masks and gradients when needed.

- Put supplied assets under `public/generated-flyers/assets/`.
- Build the visual in the generated HTML master.
- Give every user-facing object a unique `data-coco-object` and `data-coco-role`.
- Set `data-coco-editable="true"` on editable text.
- Map every object in the adapter's `semanticRoles`.
- Define required roles, font substitutions, representative event copy, and Square/Story geometry.
- Register the recipe in the visual recipe registry, art-direction library, preview registry, and portable loader.

## 3. Audit

```bash
npm run coco:recipe -- audit upcoming-card
```

The audit renders and compiles both formats and fails on missing roles, duplicate semantic ownership, missing bindings, missing fonts, missing integration points, non-editable semantic text, or an invalid master.

After adding or removing gallery recipes, rebuild and verify the complete registration bundle:

```bash
node --experimental-strip-types scripts/build-registered-recipe-templates.mjs
node --test tests/registered-recipe-templates.test.ts tests/coco-authored-recipe-only.test.ts tests/coco-recipe-provenance.test.ts
```

These checks require the central registry, portable loader, and generated template bundle to contain the same recipe IDs, and materialize both formats for every recipe.

## 4. Build

```bash
npm run coco:recipe -- build upcoming-card
```

Build runs the same audit first, then writes the distributable `.nflyer`. A recipe that does not pass the gate cannot be built through this workflow.

## 5. Visual acceptance

Open the generated project in Coco and verify selection, editing, persistence, Square/Story switching, and export. Save that refined `.nflyer` as the accepted source of truth for promotion.

Run `npm run coco:verify-editor` against the running local server after changes
to shared editor behavior. This runs the accepted Disco regression fixture; it
does not replace exercising the new template itself against the acceptance
requirements. A structural audit alone is insufficient for delivery.
