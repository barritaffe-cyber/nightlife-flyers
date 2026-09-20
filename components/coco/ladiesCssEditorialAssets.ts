import type { Emoji } from "../../app/types/emoji.ts";
import {
  getLadiesCssEditorialFormatRecipe,
  LADIES_CSS_EDITORIAL_RECIPE,
  type LadiesCssEditorialFormat,
} from "../../lib/recipes/ladiesCssEditorial.ts";

export type CocoLadiesCssEditorialAssetInput = {
  /** Near-black used only by the two editable photo-contrast controls. */
  baseColor?: string;
  /** Warm white used by the swash and footer hairline. */
  paperColor?: string;
  /** Signal red used by the date ring and age pill. */
  signalColor?: string;
  composition?: { patternId?: string | null } | null;
  format: LadiesCssEditorialFormat;
  patternId?: string | null;
};

const recipePalette = LADIES_CSS_EDITORIAL_RECIPE.runtime.palette;

const normalizeHex = (value: string | undefined, fallback: string) => {
  const compact = String(value || "").trim().replace(/^#/, "");
  const expanded = compact.length === 3
    ? compact.split("").map((part) => `${part}${part}`).join("")
    : compact;
  return /^[0-9a-f]{6}$/i.test(expanded)
    ? `#${expanded.toUpperCase()}`
    : fallback;
};

const svgDataUrl = (svg: string) =>
  `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;

const materializeSvg = (template: string, color: string) =>
  template.replace(/\{\{COLOR\}\}/g, color);

const photoControlTemplate =
  '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256" preserveAspectRatio="none"><defs><linearGradient id="top" x1="0.5" y1="0" x2="0.5" y2="1"><stop offset="0%" stop-color="{{COLOR}}" stop-opacity="0.5"/><stop offset="23%" stop-color="{{COLOR}}" stop-opacity="0.07"/><stop offset="48%" stop-color="{{COLOR}}" stop-opacity="0"/><stop offset="100%" stop-color="{{COLOR}}" stop-opacity="0"/></linearGradient><linearGradient id="sides" x1="0" y1="0.5" x2="1" y2="0.5"><stop offset="0%" stop-color="{{COLOR}}" stop-opacity="0.24"/><stop offset="30%" stop-color="{{COLOR}}" stop-opacity="0"/><stop offset="76%" stop-color="{{COLOR}}" stop-opacity="0"/><stop offset="100%" stop-color="{{COLOR}}" stop-opacity="0.12"/></linearGradient></defs><rect width="256" height="256" fill="url(#top)"/><rect width="256" height="256" fill="url(#sides)"/></svg>';

const footerFadeTemplate =
  '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256" preserveAspectRatio="none"><defs><linearGradient id="footer" x1="0.5" y1="0" x2="0.5" y2="1"><stop offset="0%" stop-color="{{COLOR}}" stop-opacity="0"/><stop offset="26%" stop-color="{{COLOR}}" stop-opacity="0.72"/><stop offset="70%" stop-color="{{COLOR}}" stop-opacity="1"/><stop offset="100%" stop-color="{{COLOR}}" stop-opacity="1"/></linearGradient></defs><rect width="256" height="256" fill="url(#footer)"/></svg>';

const swashTemplate =
  '<svg xmlns="http://www.w3.org/2000/svg" width="500" height="160" viewBox="0 0 500 160" preserveAspectRatio="none"><path d="M10 55 C100 90 196 103 292 91 C365 82 430 60 487 38 C414 82 341 102 276 107 C174 116 83 96 10 55 Z" fill="{{COLOR}}"/></svg>';

// The center date remains native editable Coco text. This asset stores only
// the authored circular wordmark from the CSS source.
const dateRingTemplate =
  '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><defs><path id="ring" d="M100,100 m-77,0 a77,77 0 1,1 154,0 a77,77 0 1,1 -154,0"/></defs><text fill="{{COLOR}}" font-family="Avigea, Didot, serif" font-size="15" letter-spacing="1.8"><textPath href="#ring" startOffset="1%">LA VIDA · LA VIDA · LA VIDA · LA VIDA ·</textPath></text></svg>';

const footerRuleTemplate =
  '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="160" viewBox="0 0 800 160" preserveAspectRatio="none"><rect x="0" y="78" width="800" height="4" fill="{{COLOR}}"/></svg>';

const agePillTemplate =
  '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256" preserveAspectRatio="none"><rect width="256" height="256" rx="52" ry="52" fill="{{COLOR}}"/></svg>';

const rectCenter = (rect: { x: number; y: number; width: number; height: number }) => ({
  x: rect.x + rect.width / 2,
  y: rect.y + rect.height / 2,
});

/**
 * Build only the seven non-destructive SVG objects measured in the verified CSS
 * master. No stock art, generated background, texture or generic decoration
 * enters this recipe. Every returned object is unlocked for Fine Tune/export.
 */
export function buildCocoLadiesCssEditorialAssets(
  input: CocoLadiesCssEditorialAssetInput
): Emoji[] {
  const patternId = input.patternId ?? input.composition?.patternId;
  if (patternId !== LADIES_CSS_EDITORIAL_RECIPE.runtime.compositionPattern) return [];

  const formatRecipe = getLadiesCssEditorialFormatRecipe(input.format);
  const { width: canvasWidth, height: canvasHeight } = formatRecipe.canvas;
  const geometry = formatRecipe.assets;
  const baseColor = normalizeHex(input.baseColor, recipePalette.bgFrom);
  const paperColor = normalizeHex(input.paperColor, recipePalette.secondary);
  const signalColor = normalizeHex(input.signalColor, recipePalette.primary);

  const stretchedGeometry = (rect: { x: number; y: number; width: number; height: number }) => {
    const center = rectCenter(rect);
    const scale = (canvasHeight * rect.height / 100) / 160;
    return {
      ...center,
      scale,
      shapeLength: (canvasWidth * rect.width / 100) / scale,
    };
  };

  const photoControl = stretchedGeometry(geometry.photoControl);
  const footerFade = stretchedGeometry(geometry.footerFade);
  const swash = stretchedGeometry(geometry.swash);
  const dateCenter = rectCenter(geometry.dateRing);
  const dateScale = Math.min(
    canvasWidth * geometry.dateRing.width / 100,
    canvasHeight * geometry.dateRing.height / 100
  ) / 160;
  const scriptUnderlineCenter = rectCenter(geometry.scriptUnderline);
  // The CSS source uses a 3px rule at 900px wide. Both Coco formats are
  // 540px wide, so the authored line becomes 1.8px (4 SVG units * 0.45).
  const scriptUnderlineScale = 0.45;
  const agePill = stretchedGeometry(geometry.agePill);
  const footerRuleScale = 0.25;
  const footerRuleCenterX = geometry.footerRule.x + geometry.footerRule.width / 2;

  return [
    {
      id: `coco_ladies_css_photo_control_${input.format}`,
      kind: "sticker",
      char: "",
      label: "Ladies CSS photo contrast control",
      url: svgDataUrl(materializeSvg(photoControlTemplate, baseColor)),
      x: photoControl.x,
      y: photoControl.y,
      scale: photoControl.scale,
      rotation: 0,
      locked: false,
      opacity: 1,
      blendMode: "normal",
      isSticker: true,
      isShapeGraphic: true,
      svgTemplate: photoControlTemplate,
      iconColor: baseColor,
      shapeKind: "shape_square",
      shapeGradient: true,
      shapeLength: photoControl.shapeLength,
      shapeSkew: 0,
      paletteRole: "base",
      cocoContrastRole: "shadow",
      layerOffset: -10,
      showLabel: false,
    },
    {
      id: `coco_ladies_css_footer_fade_${input.format}`,
      kind: "sticker",
      char: "",
      label: "Ladies CSS footer fade",
      url: svgDataUrl(materializeSvg(footerFadeTemplate, baseColor)),
      x: footerFade.x,
      y: footerFade.y,
      scale: footerFade.scale,
      rotation: 0,
      locked: false,
      opacity: 1,
      blendMode: "normal",
      isSticker: true,
      isShapeGraphic: true,
      svgTemplate: footerFadeTemplate,
      iconColor: baseColor,
      shapeKind: "shape_square",
      shapeGradient: true,
      shapeLength: footerFade.shapeLength,
      shapeSkew: 0,
      paletteRole: "base",
      cocoContrastRole: "shadow",
      layerOffset: -9,
      showLabel: false,
    },
    {
      id: `coco_ladies_css_headline_swash_${input.format}`,
      kind: "sticker",
      char: "",
      label: "Ladies CSS headline swash",
      url: svgDataUrl(materializeSvg(swashTemplate, paperColor)),
      x: swash.x,
      y: swash.y,
      scale: swash.scale,
      rotation: geometry.swash.rotation,
      locked: false,
      opacity: 1,
      blendMode: "normal",
      isSticker: true,
      isShapeGraphic: true,
      svgTemplate: swashTemplate,
      iconColor: paperColor,
      shapeKind: "shape_square",
      shapeGradient: false,
      shapeLength: swash.shapeLength,
      shapeSkew: 0,
      paletteRole: "secondary",
      layerOffset: -1,
      showLabel: false,
    },
    {
      id: `coco_ladies_css_date_ring_${input.format}`,
      kind: "sticker",
      char: "",
	  label: "LA VIDA · LA VIDA · LA VIDA · LA VIDA ·",
      url: svgDataUrl(materializeSvg(dateRingTemplate, signalColor)),
      x: dateCenter.x,
      y: dateCenter.y,
      scale: dateScale,
      rotation: 0,
      locked: false,
      opacity: 1,
      blendMode: "normal",
      isSticker: true,
	  isDesignElement: true,
	  isCircularText: true,
	  isShapeGraphic: false,
      svgTemplate: dateRingTemplate,
      iconColor: signalColor,
      shapeKind: "shape_circle",
      shapeGradient: false,
      shapeLength: 160,
      shapeSkew: 0,
      paletteRole: "primary",
      layerOffset: -1,
	  labelSize: 15,
	  circularTextGeometryVersion: 3,
	  circularTextScaleVersion: 1,
	  hitTestMode: "alpha-bounds",
      showLabel: false,
    },
    {
      id: `coco_ladies_css_script_underline_${input.format}`,
      kind: "sticker",
      char: "",
      label: "Ladies CSS script underline",
      url: svgDataUrl(materializeSvg(footerRuleTemplate, paperColor)),
      x: scriptUnderlineCenter.x,
      y: scriptUnderlineCenter.y,
      scale: scriptUnderlineScale,
      rotation: geometry.scriptUnderline.rotation,
      locked: false,
      opacity: 1,
      blendMode: "normal",
      isSticker: true,
      isShapeGraphic: true,
      svgTemplate: footerRuleTemplate,
      iconColor: paperColor,
      shapeKind: "shape_square",
      shapeGradient: false,
      shapeLength:
        (canvasWidth * geometry.scriptUnderline.width / 100) / scriptUnderlineScale,
      shapeSkew: 0,
      paletteRole: "secondary",
      layerOffset: -1,
      showLabel: false,
    },
    {
      id: `coco_ladies_css_footer_rule_${input.format}`,
      kind: "sticker",
      char: "",
      label: "Ladies CSS footer hairline",
      url: svgDataUrl(materializeSvg(footerRuleTemplate, paperColor)),
      x: footerRuleCenterX,
      y: geometry.footerRule.y,
      scale: footerRuleScale,
      rotation: 0,
      locked: false,
      opacity: 0.25,
      blendMode: "normal",
      isSticker: true,
      isShapeGraphic: true,
      svgTemplate: footerRuleTemplate,
      iconColor: paperColor,
      shapeKind: "shape_square",
      shapeGradient: false,
      shapeLength: (canvasWidth * geometry.footerRule.width / 100) / footerRuleScale,
      shapeSkew: 0,
      paletteRole: "neutral",
      layerOffset: -2,
      showLabel: false,
    },
    {
      id: `coco_ladies_css_age_pill_${input.format}`,
      kind: "sticker",
      char: "",
      label: "Ladies CSS age pill",
      url: svgDataUrl(materializeSvg(agePillTemplate, signalColor)),
      x: agePill.x,
      y: agePill.y,
      scale: agePill.scale,
      rotation: 0,
      locked: false,
      opacity: 1,
      blendMode: "normal",
      isSticker: true,
      isShapeGraphic: true,
      svgTemplate: agePillTemplate,
      iconColor: signalColor,
      shapeKind: "shape_square",
      shapeGradient: false,
      shapeLength: agePill.shapeLength,
      shapeSkew: 0,
      paletteRole: "accent",
      layerOffset: -2,
      showLabel: false,
    },
  ];
}
