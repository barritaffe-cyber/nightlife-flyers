import type { Emoji } from "../../app/types/emoji.ts";

export type CocoGoldenHeroFormat = "square" | "story";

export type CocoGoldenHeroAssetInput = {
  composition?: { patternId?: string | null } | null;
  format: CocoGoldenHeroFormat;
  patternId?: string | null;
};

const svgDataUrl = (svg: string) =>
  `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;

// Each format's uploaded-photo contain crop begins at a different x position.
// These measured feathers fully cover that hard edge, then release the image
// before the face, so the result reads as one photograph rather than a panel
// pasted beside a portrait.
const curtainSquareTemplate =
  '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256" preserveAspectRatio="none"><defs><linearGradient id="curtain" x1="0" y1="0.5" x2="1" y2="0.5"><stop offset="0%" stop-color="{{COLOR}}" stop-opacity="1"/><stop offset="50%" stop-color="{{COLOR}}" stop-opacity="1"/><stop offset="59%" stop-color="{{COLOR}}" stop-opacity="0.96"/><stop offset="71%" stop-color="{{COLOR}}" stop-opacity="0.68"/><stop offset="86%" stop-color="{{COLOR}}" stop-opacity="0.22"/><stop offset="100%" stop-color="{{COLOR}}" stop-opacity="0"/></linearGradient></defs><rect width="256" height="256" fill="url(#curtain)"/></svg>';

const curtainStoryTemplate =
  '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256" preserveAspectRatio="none"><defs><linearGradient id="curtain" x1="0" y1="0.5" x2="1" y2="0.5"><stop offset="0%" stop-color="{{COLOR}}" stop-opacity="1"/><stop offset="27%" stop-color="{{COLOR}}" stop-opacity="1"/><stop offset="39%" stop-color="{{COLOR}}" stop-opacity="0.96"/><stop offset="55%" stop-color="{{COLOR}}" stop-opacity="0.68"/><stop offset="80%" stop-color="{{COLOR}}" stop-opacity="0.22"/><stop offset="100%" stop-color="{{COLOR}}" stop-opacity="0"/></linearGradient></defs><rect width="256" height="256" fill="url(#curtain)"/></svg>';

const floorTemplate =
  '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256" preserveAspectRatio="none"><defs><linearGradient id="floor" x1="0.5" y1="0" x2="0.5" y2="1"><stop offset="0%" stop-color="{{COLOR}}" stop-opacity="0"/><stop offset="38%" stop-color="{{COLOR}}" stop-opacity="0.62"/><stop offset="66%" stop-color="{{COLOR}}" stop-opacity="0.94"/><stop offset="100%" stop-color="{{COLOR}}" stop-opacity="1"/></linearGradient></defs><rect width="256" height="256" fill="url(#floor)"/></svg>';

const glowTemplate =
  '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><defs><radialGradient id="goldGlow" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="{{COLOR}}" stop-opacity="0.92"/><stop offset="35%" stop-color="{{COLOR}}" stop-opacity="0.54"/><stop offset="73%" stop-color="{{COLOR}}" stop-opacity="0.14"/><stop offset="100%" stop-color="{{COLOR}}" stop-opacity="0"/></radialGradient></defs><circle cx="128" cy="128" r="128" fill="url(#goldGlow)"/></svg>';

const brushTemplate =
  '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="72" viewBox="0 0 320 72"><path fill="{{COLOR}}" d="M4 39C45 26 94 19 146 19c55 0 111 9 170 1-37 14-87 19-138 21 36 4 73 9 108 19-67-7-129-6-191-1-33 3-62 2-91-2 38-4 74-10 108-16C70 43 35 44 4 39Z"/></svg>';

const footerRuleTemplate =
  '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="160" viewBox="0 0 800 160" preserveAspectRatio="none"><rect x="0" y="78" width="800" height="4" fill="{{COLOR}}"/></svg>';

const materialize = (template: string, color: string) =>
  template.replace(/\{\{COLOR\}\}/g, color);

/**
 * Stores the non-destructive atmosphere/contrast part of the Golden Hero
 * recipe. Every returned object is unlocked and remains editable after Coco
 * generation and .nflyer export.
 */
export function buildCocoGoldenHeroAssets(input: CocoGoldenHeroAssetInput): Emoji[] {
  const patternId = input.patternId ?? input.composition?.patternId;
  if (patternId !== "golden-hero-editorial") return [];

  const story = input.format === "story";
  const canvasHeight = story ? 960 : 540;
  const canvasWidth = 540;
  const black = "#050403";
  const amber = "#E58A00";
  const orange = "#FF8B00";
  const curtainTemplate = story ? curtainStoryTemplate : curtainSquareTemplate;

  const curtainHeightPct = 100;
  const curtainWidthPct = story ? 49 : 58;
  const curtainScale = (canvasHeight * (curtainHeightPct / 100)) / 160;
  const curtainLength = (canvasWidth * (curtainWidthPct / 100)) / curtainScale;
  // The reference uses a long, gradual floor rather than a short dark bar.
  // Starting around 40% lets the portrait and footer read as one poster.
  const floorHeightPct = 62;
  const floorScale = (canvasHeight * (floorHeightPct / 100)) / 160;
  const floorLength = (canvasWidth * 1.08) / floorScale;

  const assets: Emoji[] = [
    {
      id: `coco_golden_hero_curtain_${input.format}`,
      kind: "sticker",
      char: "",
      label: "Golden hero left contrast curtain",
      url: svgDataUrl(materialize(curtainTemplate, black)),
      x: curtainWidthPct / 2,
      y: 50,
      scale: curtainScale,
      rotation: 0,
      locked: false,
      opacity: 1,
      blendMode: "normal",
      isSticker: true,
      isShapeGraphic: true,
      svgTemplate: curtainTemplate,
      iconColor: black,
      shapeKind: "shape_square",
      shapeGradient: true,
      shapeLength: curtainLength,
      shapeSkew: 0,
      paletteRole: "base",
      cocoContrastRole: "shadow",
      layerOffset: -10,
      showLabel: false,
    },
    {
      id: `coco_golden_hero_floor_${input.format}`,
      kind: "sticker",
      char: "",
      label: "Golden hero footer veil",
      url: svgDataUrl(materialize(floorTemplate, black)),
      x: 50,
      // Deliberately extends one percent beyond the artboard to prevent a
      // sub-pixel source-image strip along the exported bottom edge.
      y: 70,
      scale: floorScale,
      rotation: 0,
      locked: false,
      opacity: 1,
      blendMode: "normal",
      isSticker: true,
      isShapeGraphic: true,
      svgTemplate: floorTemplate,
      iconColor: black,
      shapeKind: "shape_square",
      shapeGradient: true,
      shapeLength: floorLength,
      shapeSkew: 0,
      paletteRole: "base",
      cocoContrastRole: "shadow",
      layerOffset: -9,
      showLabel: false,
    },
    {
      id: `coco_golden_hero_glow_${input.format}`,
      kind: "sticker",
      char: "",
      label: "Golden hero amber light",
      url: svgDataUrl(materialize(glowTemplate, amber)),
      x: story ? 78 : 76,
      y: story ? 25 : 28,
      scale: story ? 2.45 : 1.62,
      rotation: 0,
      locked: false,
      opacity: 0.26,
      blendMode: "screen",
      isSticker: true,
      isShapeGraphic: true,
      svgTemplate: glowTemplate,
      iconColor: amber,
      shapeKind: "shape_circle",
      shapeGradient: true,
      shapeLength: 160,
      shapeSkew: 0,
      paletteRole: "primary",
      layerOffset: -8,
      showLabel: false,
    },
    {
      id: `coco_golden_hero_palms_${input.format}`,
      kind: "sticker",
      char: "",
      label: "Golden hero foliage shadow",
      url: "/scene-assets/common/palm-shadow.svg",
      x: story ? 28 : 25,
      y: story ? 17 : 18,
      scale: story ? 1.8 : 1.08,
      rotation: -8,
      locked: false,
      opacity: 0.2,
      blendMode: "multiply",
      isSticker: true,
      isTexture: true,
      paletteRole: "base",
      layerOffset: -7,
      showLabel: false,
    },
    {
      id: `coco_golden_hero_particles_${input.format}`,
      kind: "sticker",
      char: "",
      label: "Golden hero gold particles",
      url: "/scene-assets/afrobeats-night/gold-particles.svg",
      x: 54,
      y: story ? 36 : 38,
      scale: story ? 2.9 : 1.72,
      rotation: 0,
      locked: false,
      opacity: 0.1,
      blendMode: "screen",
      isSticker: true,
      isTexture: true,
      paletteRole: "accent",
      layerOffset: -6,
      showLabel: false,
    },
    {
      id: `coco_golden_hero_brush_${input.format}`,
      kind: "sticker",
      char: "",
      label: "Golden hero script underline",
      url: svgDataUrl(materialize(brushTemplate, orange)),
      x: 18,
      y: story ? 45.5 : 61,
      scale: story ? 0.46 : 0.4,
      rotation: -5,
      locked: false,
      opacity: 0.74,
      blendMode: "normal",
      isSticker: true,
      isShapeGraphic: true,
      svgTemplate: brushTemplate,
      iconColor: orange,
      shapeKind: "shape_square",
      shapeGradient: false,
      shapeLength: 320,
      shapeSkew: 0,
      paletteRole: "accent",
      layerOffset: -1,
      showLabel: false,
    },
    {
      id: `coco_golden_hero_footer_rule_${input.format}`,
      kind: "sticker",
      char: "",
      label: "Golden hero footer rule",
      url: svgDataUrl(materialize(footerRuleTemplate, amber)),
      x: 50,
      y: story ? 82.5 : 82,
      scale: 0.2,
      rotation: 0,
      locked: false,
      opacity: 0.68,
      blendMode: "normal",
      isSticker: true,
      isShapeGraphic: true,
      svgTemplate: footerRuleTemplate,
      iconColor: amber,
      shapeKind: "shape_square",
      shapeGradient: false,
      shapeLength: 2376,
      shapeSkew: 0,
      paletteRole: "primary",
      layerOffset: -2,
      showLabel: false,
    },
  ];

  return assets.map((asset) => ({
    ...asset,
    hitTestMode: "alpha-bounds" as const,
    isDesignElement: true,
  }));
}
