# Brunch Saturday CSS preview

Reference: `brunch-sat-final.jpg`, 1000×1000. Supplied asset sheet:
`brunch-sat.png`, 1536×1024 (flattened sheet, not separate PNG layers).

Deliverable: `brunch-saturday-master.html`, a native 1000×1000 square CSS master.
Render: `brunch-saturday-css-preview.png`.
Reproduce with `node scripts/render-brunch-saturday.mjs` while localhost:3000 runs.

All headline, script, date/time, presenter, offer prices and descriptions, band,
and address copy are HTML text. The ribbon and textured headline treatment are
CSS/SVG. The final flyer is not used as the rendered background.

The CSS was rendered and inspected in Chromium, with image decoding and font
loading awaited. Iterations corrected headline width/height, replaced the heavy
script with a closer signature font, compressed its vertical proportions, and
replaced the rough polygon overlap with an alpha-mask-based foreground.

This is a close adaptation, not an exact match or an approved Coco recipe.
Differences: signature lettering/font, generated scene detail, grain and glow.
The installed Dear Script font filename identifies it as a demo; confirm an
appropriate licensed font before commercial release. QR is visibly marked YOUR
QR because no destination was provided. No working ticket QR is implied.

## Prepared raster assets

Built-in image generation/editing was used for two project-local assets:

- `assets/brunch-saturday-scene.png`: text-free scene edited from the target.
- `assets/brunch-saturday-foreground.png`: alpha cutout used as a CSS mask; the
  visible foreground samples the same scene plate to avoid mismatched colors.

The foreground generation did not perfectly retain object scale. Its cocktail
mask is aligned explicitly in CSS. These masks need explicit support/validation
before any Coco compilation; do not discard them silently.

### Scene edit prompt

Edit this exact square flyer to create a text-free background plate for an
editable HTML/CSS reconstruction. Remove ALL letters, numbers, headline BRUNCH,
script Saturday, REDSANITY PRESENTS, corner date/time, entire red offer banner,
footer text and small QR code. Inpaint the areas naturally. Preserve original
composition exactly: 1000x1000 square framing, dark burnt orange amber bokeh
background, wooden tabletop horizon at 69% image height, central red hurricane
cocktail glass with straw mint pink umbrella lime and stem ending at 80% image
height, floating orange slice at left x12% y45%, kiwi at right x85% y30%, cropped
waffle on lower right x94% y78%. Keep objects in exact positions and scales.
Remove white script crossing the glass and restore natural glass/liquid. No new
text, symbols, logos, borders or new objects. Maintain lighting and original
aesthetic. Output only the cleaned square scene.

### Foreground edit prompt

Background extraction for HTML flyer compositing. From this square scene, isolate
ONLY the central red hurricane cocktail with all its straw, mint leaves, pink
umbrella, lime, glass and base, plus the floating orange slice at left, kiwi slice
at right, and cropped waffle at lower right. Remove ALL backdrop, tabletop,
bokeh, grain and surroundings. Output genuine transparent alpha background, no
checkerboard paint, no shadows outside objects, no white matte. Preserve the
EXACT square canvas, relative positions, scale and appearance of each object as
in input; no rearrangement and no cropping the canvas. Keep transparent glass
realistic and edges precise, particularly straw and mint. No text. This
transparent layer will overlay the same exact input image, so align each object
exactly.
