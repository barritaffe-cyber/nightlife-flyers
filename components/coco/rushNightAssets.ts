import type { Emoji } from "../../app/types/emoji.ts";
import {
  getRushNightFormatRecipe,
  RUSH_NIGHT_RECIPE,
  type RushNightFormat,
} from "../../lib/recipes/rushNight.ts";

export type CocoRushNightFormat = RushNightFormat;

export type CocoRushNightAssetInput = {
  /** Near-black used by the authored photo grade and edge vignette. */
  baseColor?: string;
  /** Orange used by the neon tube, price block and venue divider. */
  primaryColor?: string;
  /** Warm white used by linework, frames and the script underline. */
  secondaryColor?: string;
  /** Pale warm highlight running through the neon tube. */
  neutralColor?: string;
  composition?: { patternId?: string | null } | null;
  format: CocoRushNightFormat;
  patternId?: string | null;
};

const recipePalette = RUSH_NIGHT_RECIPE.runtime.palette;

const normalizeHex = (value: string | undefined, fallback: string) => {
  const compact = String(value || "").trim().replace(/^#/, "");
  const expanded =
    compact.length === 3
      ? compact
          .split("")
          .map((part) => `${part}${part}`)
          .join("")
      : compact;
  return /^[0-9a-f]{6}$/i.test(expanded)
    ? `#${expanded.toUpperCase()}`
    : fallback;
};

const svgDataUrl = (svg: string) =>
  `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;

const materializeSvg = (template: string, color: string) =>
  template.replace(/\{\{COLOR\}\}/g, color);

const photoGradeTemplate = (baseColor: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256" preserveAspectRatio="none"><defs><radialGradient id="ambientVeil" cx="50%" cy="35%" r="48%"><stop offset="0%" stop-color="${baseColor}" stop-opacity=".72"/><stop offset="58%" stop-color="${baseColor}" stop-opacity=".56"/><stop offset="100%" stop-color="${baseColor}" stop-opacity=".08"/></radialGradient><radialGradient id="orangeBloom" cx="68%" cy="29%" r="33%"><stop offset="0%" stop-color="{{COLOR}}" stop-opacity=".23"/><stop offset="84%" stop-color="{{COLOR}}" stop-opacity=".04"/><stop offset="100%" stop-color="{{COLOR}}" stop-opacity="0"/></radialGradient><linearGradient id="sideControl" x1="0" y1=".5" x2="1" y2=".5"><stop offset="0%" stop-color="${baseColor}" stop-opacity=".82"/><stop offset="19%" stop-color="${baseColor}" stop-opacity=".52"/><stop offset="43%" stop-color="${baseColor}" stop-opacity=".05"/><stop offset="76%" stop-color="${baseColor}" stop-opacity=".13"/><stop offset="100%" stop-color="${baseColor}" stop-opacity=".62"/></linearGradient><linearGradient id="floorControl" x1=".5" y1="0" x2=".5" y2="1"><stop offset="0%" stop-color="${baseColor}" stop-opacity=".3"/><stop offset="17%" stop-color="${baseColor}" stop-opacity="0"/><stop offset="54%" stop-color="${baseColor}" stop-opacity="0"/><stop offset="66%" stop-color="${baseColor}" stop-opacity=".42"/><stop offset="84%" stop-color="${baseColor}" stop-opacity=".94"/><stop offset="100%" stop-color="${baseColor}" stop-opacity="1"/></linearGradient></defs><rect width="256" height="256" fill="url(#ambientVeil)"/><rect width="256" height="256" fill="url(#orangeBloom)"/><rect width="256" height="256" fill="url(#sideControl)"/><rect width="256" height="256" fill="url(#floorControl)"/></svg>`;

// Fixed paths plus a seeded noise field keep the wear repeatable in preview,
// Fine Tune and export without importing the CSS master's raster paint layer.
const wearTemplate =
  '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256" preserveAspectRatio="none"><defs><filter id="seededWear" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".72 .19" numOctaves="3" seed="37" result="noise"/><feColorMatrix in="noise" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .5 -.18" result="noiseAlpha"/><feComposite in="SourceGraphic" in2="noiseAlpha" operator="in"/></filter><pattern id="diagonalWear" width="41" height="41" patternUnits="userSpaceOnUse" patternTransform="rotate(-28)"><path d="M2 0V41M23 0V41" stroke="{{COLOR}}" stroke-width=".45" stroke-opacity=".12"/></pattern></defs><rect width="256" height="256" fill="{{COLOR}}" filter="url(#seededWear)" opacity=".42"/><rect width="256" height="256" fill="url(#diagonalWear)"/><g fill="none" stroke="{{COLOR}}" stroke-linecap="round" opacity=".2"><path d="M-18 34C42 27 84 38 142 31C184 26 225 17 278 23" stroke-width="1.1"/><path d="M-22 92C33 85 80 95 126 89C181 82 219 88 276 76" stroke-width=".65"/><path d="M-15 174C52 165 88 178 151 169C194 163 231 151 277 158" stroke-width=".9"/><path d="M-9 222C44 214 92 226 137 217C184 208 226 213 270 205" stroke-width=".55"/></g></svg>';

const edgeVignetteTemplate =
  '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256" preserveAspectRatio="none"><defs><radialGradient id="edge" cx="52%" cy="45%" r="72%"><stop offset="0%" stop-color="{{COLOR}}" stop-opacity="0"/><stop offset="52%" stop-color="{{COLOR}}" stop-opacity="0"/><stop offset="76%" stop-color="{{COLOR}}" stop-opacity=".2"/><stop offset="91%" stop-color="{{COLOR}}" stop-opacity=".62"/><stop offset="100%" stop-color="{{COLOR}}" stop-opacity=".96"/></radialGradient></defs><rect width="256" height="256" fill="url(#edge)"/></svg>';

const neonTriangleTemplate = ({
  coreStroke,
  glowBlur,
  glowStroke,
  highlightColor,
  highlightStroke,
}: {
  coreStroke: number;
  glowBlur: number;
  glowStroke: number;
  highlightColor: string;
  highlightStroke: number;
}) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900" viewBox="0 0 900 900"><defs><linearGradient id="tube" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="{{COLOR}}"/><stop offset="47%" stop-color="${highlightColor}"/><stop offset="58%" stop-color="{{COLOR}}"/><stop offset="100%" stop-color="{{COLOR}}"/></linearGradient><filter id="neonGlow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="${glowBlur.toFixed(3)}"/></filter></defs><path d="M610 62 L92 825 L866 825 Z" fill="none" stroke="{{COLOR}}" stroke-width="${glowStroke.toFixed(3)}" stroke-linejoin="round" stroke-opacity=".72" filter="url(#neonGlow)"/><path d="M610 62 L92 825 L866 825 Z" fill="none" stroke="{{COLOR}}" stroke-width="${glowStroke.toFixed(3)}" stroke-linejoin="round" stroke-opacity=".34"/><path d="M610 62 L92 825 L866 825 Z" fill="none" stroke="url(#tube)" stroke-width="${coreStroke.toFixed(3)}" stroke-linejoin="round"/><path d="M610 62 L92 825 L866 825 Z" fill="none" stroke="${highlightColor}" stroke-width="${highlightStroke.toFixed(3)}" stroke-linejoin="round" stroke-opacity=".96"/></svg>`;

const scriptUnderlineTemplate =
  '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="160" viewBox="0 0 800 160" preserveAspectRatio="none"><path d="M4 74 C162 82 322 82 477 75 C604 69 704 64 796 60 L796 80 C667 78 543 81 414 87 C252 95 111 94 4 94 Z" fill="{{COLOR}}"/></svg>';

// Four filled rules avoid non-uniform stroke scaling when Coco stretches the
// square editor object into a very wide, shallow information frame.
const frameTemplate =
  '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256" preserveAspectRatio="none"><path fill="{{COLOR}}" d="M0 0H256V8H0ZM0 248H256V256H0ZM0 0H.8V256H0ZM255.2 0H256V256H255.2Z"/></svg>';

// Only the upper 64% contains the bordered primary admission row. The native
// secondary admission copy remains below this independently editable object.
const entryFrameTemplate =
  '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256" preserveAspectRatio="none"><path fill="{{COLOR}}" d="M0 0H256V8H0ZM0 152H256V160H0ZM0 0H.8V160H0ZM255.2 0H256V160H255.2Z"/></svg>';

const solidRectTemplate =
  '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256" preserveAspectRatio="none"><rect width="256" height="256" fill="{{COLOR}}"/></svg>';

const rectCenter = (rect: {
  x: number;
  y: number;
  width: number;
  height: number;
}) => ({
  x: rect.x + rect.width / 2,
  y: rect.y + rect.height / 2,
});

/**
 * Materialize only the authored, code-native objects owned by the Rush Night
 * CSS recipe. All returned objects are ordinary unlocked Coco assets; the
 * replaceable user photo remains the extracted hero and no generic decoration
 * or generated background image is introduced.
 */
export function buildCocoRushNightAssets(input: CocoRushNightAssetInput): Emoji[] {
  const patternId = input.patternId ?? input.composition?.patternId;
  if (patternId !== RUSH_NIGHT_RECIPE.runtime.compositionPattern) return [];

  const formatRecipe = getRushNightFormatRecipe(input.format);
  const { width: canvasWidth, height: canvasHeight } = formatRecipe.canvas;
  const geometry = formatRecipe.assets;
  const baseColor = normalizeHex(input.baseColor, recipePalette.bgFrom);
  const primaryColor = normalizeHex(input.primaryColor, recipePalette.primary);
  const secondaryColor = normalizeHex(
    input.secondaryColor,
    recipePalette.secondary
  );
  const neutralColor = normalizeHex(input.neutralColor, recipePalette.neutral);

  const stretchedGeometry = (rect: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) => {
    const center = rectCenter(rect);
    const scale = (canvasHeight * rect.height) / 100 / 160;
    return {
      ...center,
      scale,
      shapeLength: (canvasWidth * rect.width) / 100 / scale,
    };
  };

  const photoGrade = stretchedGeometry(geometry.photoGrade);
  const texture = stretchedGeometry(geometry.texture);
  const edgeVignette = stretchedGeometry(geometry.edgeShadow);
  const triangle = stretchedGeometry(geometry.triangle);
  const scriptUnderlineCenter = rectCenter(geometry.scriptUnderline);
  // The measured underline is only about four canvas pixels thick. Give its
  // editor object a practical handle while keeping the visible path at the
  // authored thickness and the width exactly tied to recipe geometry.
  const scriptUnderlineScale = 0.2;
  const scriptUnderline = {
    ...scriptUnderlineCenter,
    scale: scriptUnderlineScale,
    shapeLength:
      ((canvasWidth * geometry.scriptUnderline.width) / 100) /
      scriptUnderlineScale,
  };
  const genreFrame = stretchedGeometry(geometry.genreFrame);
  const entryFrame = stretchedGeometry(geometry.entryFrame);
  const priceBlock = stretchedGeometry(geometry.pricePill);
  const venueDivider = stretchedGeometry(geometry.venueRule);

  const triangleWidthPx = (canvasWidth * geometry.triangle.width) / 100;
  const triangleHeightPx = (canvasHeight * geometry.triangle.height) / 100;
  const triangleViewBoxScale = Math.min(triangleWidthPx, triangleHeightPx) / 900;
  const triangleTemplate = neonTriangleTemplate({
    coreStroke: geometry.triangle.coreStrokePx / triangleViewBoxScale,
    glowBlur: geometry.triangle.glowStrokePx / triangleViewBoxScale / 2.6,
    glowStroke: geometry.triangle.glowStrokePx / triangleViewBoxScale,
    highlightColor: neutralColor,
    highlightStroke: geometry.triangle.highlightStrokePx / triangleViewBoxScale,
  });
  const gradeTemplate = photoGradeTemplate(baseColor);

  return [
    {
      id: `coco_rush_night_photo_grade_${input.format}`,
      kind: "sticker",
      char: "",
      label: "Rush Night authored photo grade",
      url: svgDataUrl(materializeSvg(gradeTemplate, primaryColor)),
      x: photoGrade.x,
      y: photoGrade.y,
      scale: photoGrade.scale,
      rotation: 0,
      locked: false,
      opacity: 1,
      blendMode: "normal",
      isSticker: true,
      isShapeGraphic: true,
      svgTemplate: gradeTemplate,
      iconColor: primaryColor,
      shapeKind: "shape_square",
      shapeGradient: true,
      shapeLength: photoGrade.shapeLength,
      shapeSkew: 0,
      paletteRole: "primary",
      cocoContrastRole: "shadow",
      layerOffset: -10,
      showLabel: false,
    },
    {
      id: `coco_rush_night_wear_${input.format}`,
      kind: "sticker",
      char: "",
      label: "Rush Night deterministic wear adaptation",
      url: svgDataUrl(materializeSvg(wearTemplate, secondaryColor)),
      x: texture.x,
      y: texture.y,
      scale: texture.scale,
      rotation: 0,
      locked: false,
      opacity: geometry.texture.opacity,
      blendMode: "soft-light",
      isSticker: true,
      isTexture: true,
      isShapeGraphic: true,
      svgTemplate: wearTemplate,
      iconColor: secondaryColor,
      shapeKind: "shape_square",
      shapeGradient: false,
      shapeLength: texture.shapeLength,
      shapeSkew: 0,
      paletteRole: "secondary",
      layerOffset: -9,
      showLabel: false,
    },
    {
      id: `coco_rush_night_edge_vignette_${input.format}`,
      kind: "sticker",
      char: "",
      label: "Rush Night edge vignette",
      url: svgDataUrl(materializeSvg(edgeVignetteTemplate, baseColor)),
      x: edgeVignette.x,
      y: edgeVignette.y,
      scale: edgeVignette.scale,
      rotation: 0,
      locked: false,
      opacity: 1,
      blendMode: "normal",
      isSticker: true,
      isShapeGraphic: true,
      svgTemplate: edgeVignetteTemplate,
      iconColor: baseColor,
      shapeKind: "shape_square",
      shapeGradient: true,
      shapeLength: edgeVignette.shapeLength,
      shapeSkew: 0,
      paletteRole: "base",
      cocoContrastRole: "shadow",
      layerOffset: -8,
      showLabel: false,
    },
    {
      id: `coco_rush_night_neon_triangle_${input.format}`,
      kind: "sticker",
      char: "",
      label: "Rush Night subject-layered neon triangle",
      url: svgDataUrl(materializeSvg(triangleTemplate, primaryColor)),
      x: triangle.x,
      y: triangle.y,
      scale: triangle.scale,
      rotation: 0,
      locked: false,
      opacity: 0.93,
      blendMode: "normal",
      isSticker: true,
      isShapeGraphic: true,
      svgTemplate: triangleTemplate,
      iconColor: primaryColor,
      shapeKind: "shape_square",
      shapeGradient: true,
      shapeLength: triangle.shapeLength,
      shapeSkew: 0,
      paletteRole: "primary",
      // Runtime photos vary, so the CSS master's portrait-specific ellipse and
      // torso mask cannot be reused. This negative offset lets a real extracted
      // subject occlude the complete triangle instead.
      layerOffset: -7,
      showLabel: false,
    },
    {
      id: `coco_rush_night_script_underline_${input.format}`,
      kind: "sticker",
      char: "",
      label: "Rush Night script underline",
      url: svgDataUrl(materializeSvg(scriptUnderlineTemplate, secondaryColor)),
      x: scriptUnderline.x,
      y: scriptUnderline.y,
      scale: scriptUnderline.scale,
      rotation: geometry.scriptUnderline.rotation,
      locked: false,
      opacity: 1,
      blendMode: "normal",
      isSticker: true,
      isShapeGraphic: true,
      svgTemplate: scriptUnderlineTemplate,
      iconColor: secondaryColor,
      shapeKind: "shape_square",
      shapeGradient: false,
      shapeLength: scriptUnderline.shapeLength,
      shapeSkew: 0,
      paletteRole: "secondary",
      layerOffset: 22,
      showLabel: false,
    },
    {
      id: `coco_rush_night_genre_frame_${input.format}`,
      kind: "sticker",
      char: "",
      label: "Rush Night genre frame",
      url: svgDataUrl(materializeSvg(frameTemplate, secondaryColor)),
      x: genreFrame.x,
      y: genreFrame.y,
      scale: genreFrame.scale,
      rotation: 0,
      locked: false,
      opacity: 0.9,
      blendMode: "normal",
      isSticker: true,
      isShapeGraphic: true,
      svgTemplate: frameTemplate,
      iconColor: secondaryColor,
      shapeKind: "shape_square",
      shapeGradient: false,
      shapeLength: genreFrame.shapeLength,
      shapeSkew: 0,
      paletteRole: "secondary",
      layerOffset: 22,
      showLabel: false,
    },
    {
      id: `coco_rush_night_entry_frame_${input.format}`,
      kind: "sticker",
      char: "",
      label: "Rush Night entry frame",
      url: svgDataUrl(materializeSvg(entryFrameTemplate, secondaryColor)),
      x: entryFrame.x,
      y: entryFrame.y,
      scale: entryFrame.scale,
      rotation: 0,
      locked: false,
      opacity: 1,
      blendMode: "normal",
      isSticker: true,
      isShapeGraphic: true,
      svgTemplate: entryFrameTemplate,
      iconColor: secondaryColor,
      shapeKind: "shape_square",
      shapeGradient: false,
      shapeLength: entryFrame.shapeLength,
      shapeSkew: 0,
      paletteRole: "secondary",
      layerOffset: 22,
      showLabel: false,
    },
    {
      id: `coco_rush_night_price_block_${input.format}`,
      kind: "sticker",
      char: "",
      label: "Rush Night price block",
      url: svgDataUrl(materializeSvg(solidRectTemplate, primaryColor)),
      x: priceBlock.x,
      y: priceBlock.y,
      scale: priceBlock.scale,
      rotation: 0,
      locked: false,
      opacity: 1,
      blendMode: "normal",
      isSticker: true,
      isShapeGraphic: true,
      svgTemplate: solidRectTemplate,
      iconColor: primaryColor,
      shapeKind: "shape_square",
      shapeGradient: false,
      shapeLength: priceBlock.shapeLength,
      shapeSkew: 0,
      paletteRole: "primary",
      layerOffset: 22,
      showLabel: false,
    },
    {
      id: `coco_rush_night_venue_divider_${input.format}`,
      kind: "sticker",
      char: "",
      label: "Rush Night venue divider",
      url: svgDataUrl(materializeSvg(solidRectTemplate, primaryColor)),
      x: venueDivider.x,
      y: venueDivider.y,
      scale: venueDivider.scale,
      rotation: 0,
      locked: false,
      opacity: 1,
      blendMode: "normal",
      isSticker: true,
      isShapeGraphic: true,
      svgTemplate: solidRectTemplate,
      iconColor: primaryColor,
      shapeKind: "shape_square",
      shapeGradient: false,
      shapeLength: venueDivider.shapeLength,
      shapeSkew: 0,
      paletteRole: "primary",
      layerOffset: 22,
      showLabel: false,
    },
  ];
}
