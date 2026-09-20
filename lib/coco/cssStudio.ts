export const COMPOSITION_REFINEMENT_RULES = `
Aim for a close-enough, readable reproduction, NOT pixel-perfect font matching.
Compare the original reference to the supplied screenshot of the CURRENT draft.
Inventory visible elements: text blocks, thin rules, dividers, underlines, venue
frames, ticket boxes, border strokes, color panels and simple decorative shapes.
Report missing or misplaced elements before revising. Recreate simple decorations
as independent absolutely positioned CSS elements with data-region,
data-coco-object, data-coco-kind="shape" and data-coco-editable="true".
Never invent a QR code, sponsor, image, or wording. Missing raster artwork belongs
in unresolved notes; don't silently replace it with unrelated decorations.
Keep working placements, wording, IDs, supplied images, crop and layer order.
Change only demonstrably problematic parts: missing decorations, unreadable text,
clipping, unintended overlaps, weak hierarchy, incorrect size/weight or fill.
Preserve deliberate headline/script overlaps from the reference. Minor font
differences are acceptable. Lost text, missing prominent rules/frames and
unreadable blocks are not. Do not redesign the flyer or shrink every text block.
Keep canvas dimensions and __EXISTING_RESOURCE_N__ tokens unchanged.
Return JSON {"html":string,"notes":string,"changes":string[],"unresolved":string[]}.
Changes describe specific repairs; unresolved lists compromises and needed assets.
You see the BEFORE screenshot, not a render of your proposed revision: never
claim the revision passed visual comparison. The user must review its render.
`;

export const TYPOGRAPHY_REPRODUCTION_RULES = `
Typography is a separate visual reconstruction task, not merely text placement.
For every text object, inspect: actual visible ink width and height relative to canvas,
font category/condensation, regular vs bold weight, case, line breaks, tracking,
line height, italic/slant, and fill (solid or gradient). Match those relationships.
Do not make all text bold. Use regular/light faces for reference utility copy and
bold faces only where the reference is bold. Explicitly reset heading defaults:
margin:0; font-weight:400; then apply the observed weight per object.
Use the actual local regular/bold font files, e.g. LEMONMILK-Regular and
LEMONMILK-Bold. Declare each static @font-face with its actual weight, not a
100-900 range, and do not fake a bold face by applying weight 700 to a regular file.
Container width is not glyph width. Choose font-size from visible cap height and
adjust font choice, letter-spacing and line-height to match the reference's ink
width and height. Do not shrink the hero headline to fit an arbitrary small box.
Preserve large headline-to-body size ratios, thin/thick stroke contrast, and
different weights within a date or label/value block. Use separately styled spans
or independent semantic objects where appropriate. Avoid clipping ascenders,
descenders, and script swashes. Choose the closest font silhouette first; restrained
scaleY may match tall reference lettering once the full word fits horizontally.
Use transform-origin:center top and recheck clipping; never transform the image.
When reference letters visibly transition between colors, reproduce a CSS text
gradient with sampled approximate colors, direction and stops:
background-image:linear-gradient(110deg,#b68030 10%,#88591c 55%,#302505 90%);
background-clip:text;-webkit-background-clip:text;color:transparent;
-webkit-text-fill-color:transparent;background-repeat:no-repeat;
The example colors are NOT defaults: derive each gradient from the reference.
Apply gradient only to the appropriate text element, never its whole section.
Solid reference text must remain solid. Keep text editable; never rasterize it.
Before returning, recheck each text object's size, weight and fill against the
reference. Notes must identify approximated font matches and any unresolved
typographic differences, not claim a visual pass.
`;

export function previewDocument(source: string, origin: string) {
  // A scriptless, opaque-origin iframe: generated markup cannot access the editor.
  const policy = `default-src 'none'; img-src data: blob:; style-src 'unsafe-inline'; font-src data: ${origin}; base-uri 'none'; form-action 'none'`;
  return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${policy}"><style>html,body{margin:0}*{box-sizing:border-box}</style></head><body>${source}</body></html>`;
}

export function validateCssDraft(html: string): string[] {
  const errors: string[] = [];
  if (!html.includes('data-coco-canvas')) errors.push('Missing data-coco-canvas container.');
  if (!html.includes('data-coco-role')) errors.push('Missing editable semantic text roles.');
  if (/<(?:script|iframe|object|embed|form|base|link)\b|\son\w+\s*=/i.test(html)) errors.push('Scripts, embedded pages, forms, and event handlers are not supported.');
  if (/(?:src|href)\s*=\s*["']\s*(?:https?:|\/\/)|@import\b/i.test(html)) errors.push('External assets are not allowed; use the supplied assets.');
  if (/__ASSET_\d+__/.test(html)) errors.push('An asset reference was not resolved.');
  return errors;
}
