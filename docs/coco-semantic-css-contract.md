# Coco Semantic CSS Recipe Contracts

The CSS-to-`.nflyer` pipeline has two adapter contracts. New visual masters use
the rendered Chromium contract; the embedded-geometry contract remains for
legacy adapters. Neither shared compiler contains design-family IDs, object
meanings, fonts, colors, or asset artwork.

## Rendered Chromium master (preferred)

The preferred compiler measures computed CSS from a real annotated HTML canvas.
The master must switch `data-format` and aspect ratio from the `?format=square`
or `?format=story` query. Square and Story must be separately authored, not two
labels for one portrait layout.

Every editable text object needs one stable region/object identity and one
semantic role:

```html
<div
  data-region="headline"
  data-coco-object="headline"
  data-coco-kind="text"
  data-coco-role="headline"
  data-coco-editable="true"
>Event name</div>
```

Every image or Coco-native shape needs a stable asset identity:

```html
<img
  data-region="subject"
  data-coco-object="subject"
  data-coco-asset="subject"
  data-coco-kind="image"
  data-coco-role="subject"
  data-coco-editable="true"
  src="/scene-assets/my-subject.png"
/>
```

The adapter exports `cocoCssMasterAdapter` with a role map. Differently styled
communication objects must never share a semantic role or state field.

For a details block with an independently editable label, author that label as
its own text object even when initially empty. Its body binding can declare
`labelObjectId` to route the panel's label field to that object. Bind the label's
text, size and color explicitly. `pixelHitBounds: true` opts a compiled text
binding into visible-glyph hit bounds, avoiding invisible ascent-area collisions.

```js
export const cocoCssMasterAdapter = {
  id: "my-recipe",
  recipe,
  masterPath,
  outputPath,
  publicRoot,
  requiredRoles: ["headline", "subject"],
  requiredFonts: ["MyLocalDisplay"],
  semanticRoles: {
    headline: { semanticRole: "headline", label: "Headline" },
    subject: { semanticRole: "subject", label: "Subject" },
  },
  fontMap: { headline: "Runtime Display" },
  eventBrief,
};
```

By default this compiler rejects the wrong rendered format/aspect ratio, remote
resources, browser request warnings, unloaded images, missing required fonts,
missing roles, repeated required roles, unsupported objects, and duplicate
editable state bindings. A successful build writes independent Square and Story
sessions with the complete Chromium IR and source hash.

## Legacy embedded-geometry master

### CSS master

Each editable communication object needs one unique element with:

```html
<section data-region="headline" data-coco-object="headline">Event name</section>
```

Each Coco-native or replaceable asset needs a semantic asset marker:

```html
<svg data-region="frame" data-coco-asset="frame">...</svg>
```

The master must embed a JSON geometry script containing separately authored
Square and Story zones and the denied generic uses:

```html
<script type="application/json" id="my-recipe-geometry">
{
  "formats": {
    "square": { "canvas": { "width": 1080, "height": 1080 }, "zones": {} },
    "story": { "canvas": { "width": 1080, "height": 1920 }, "zones": {} }
  },
  "deniedUses": ["generic layout replacement"]
}
</script>
```

### Adapter

An adapter exports `cocoCssRecipeAdapter` (or a default object):

```js
export const cocoCssRecipeAdapter = {
  id: "my-recipe",
  recipe,
  masterPath,
  outputPath,
  geometryScriptId: "my-recipe-geometry",
  objectMap: {
    headline: { stateField: "headline", zone: "headline" }
  },
  semanticKeywordRules: [],
  semanticBindingRules: {},
  coordinateBindings: [],
  materializeFormat(format, compileContext) {
    return materializeMyRecipe(format, compileContext);
  }
};
```

`materializeFormat` must return a real editable Coco state carrying the adapter
recipe ID/version, composition pattern, format-specific assets, and a stable
`cocoCenterLayoutOptionId`. The compiler builds clean root, Square, Story, and
layout-session state from those two variants.

Semantic label/value splitting belongs in `semanticBindingRules`, not in the
shared compiler. Design artwork and defaults belong in the adapter.

## Commands

Adapters named `scripts/build-<recipe-id>-master.mjs` compile by convention:

```bash
npm run coco:compile-recipe -- my-recipe
```

An adapter can also live anywhere:

```bash
npm run coco:compile-recipe -- \
  --adapter scripts/recipes/my-recipe.mjs \
  --master public/generated-flyers/my-master.html \
  --output public/generated-flyers/my-master.nflyer
```

## Approved Coco refinements

If an adapter declares `refinementPath`, promote an approved editable project
with:

```bash
npm run coco:promote-refinements -- my-recipe path/to/approved.nflyer
```

Promotion compares the approved Square and Story sessions with a clean adapter
build and records only changed compiler-owned fields. Subsequent compilation
reapplies those version-checked refinements. Provenance and session containers
cannot be overridden. `coordinateBindings` synchronizes refined object
positions with renderer geometry so saved sessions do not disagree with the
canvas composition map.

The base adapter is validated before refinements, allowing an approved user
project to hide, replace, or add an optional design asset without weakening the
CSS master contract.
