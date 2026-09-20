import type { Emoji } from "../../app/types/emoji.ts";
import {
  FASHION_CLUB_VERTICAL_RECIPE,
  getFashionClubVerticalFormatRecipe,
} from "../../lib/recipes/fashionClubVertical.ts";

export type CocoFashionClubFormat = "square" | "story";

export type CocoFashionClubAssetInput = {
  /** Near-black used by the photographic floor/contrast field. */
  baseColor?: string;
  /** Retained for campaign-palette compatibility; text owns this accent. */
  accentColor?: string;
  /** Red or magenta light that connects the typography to the photograph. */
  glowColor?: string;
  /** Normally white; exposed so a campaign palette can warm the linework. */
  neutralColor?: string;
  composition?: { patternId?: string | null } | null;
  format: CocoFashionClubFormat;
  patternId?: string | null;
};

const fashionClubPalette = FASHION_CLUB_VERTICAL_RECIPE.runtime.palette;

const normalizeHex = (value: string | undefined, fallback: string) => {
  const compact = String(value || "").trim().replace(/^#/, "");
  const expanded = compact.length === 3
    ? compact.split("").map((part) => `${part}${part}`).join("")
    : compact;
  return /^[0-9a-f]{6}$/i.test(expanded) ? `#${expanded.toUpperCase()}` : fallback;
};

const darkEditorialColor = (value: string | undefined) => {
  const normalized = normalizeHex(value, fashionClubPalette.bgFrom).slice(1);
  const channel = (offset: number) => {
    const source = Number.parseInt(normalized.slice(offset, offset + 2), 16);
    return Math.max(2, Math.min(18, Math.round(source * 0.1)));
  };
  return `#${[channel(0), channel(2), channel(4)]
    .map((part) => part.toString(16).padStart(2, "0"))
    .join("")}`.toUpperCase();
};

const tintHueForHex = (value: string) => {
  const normalized = normalizeHex(value, fashionClubPalette.primary).slice(1);
  const [red, green, blue] = [0, 2, 4].map(
    (offset) => Number.parseInt(normalized.slice(offset, offset + 2), 16) / 255
  );
  const maximum = Math.max(red, green, blue);
  const minimum = Math.min(red, green, blue);
  const delta = maximum - minimum;
  if (!delta) return 0;
  const hue = maximum === red
    ? ((green - blue) / delta) % 6
    : maximum === green
    ? (blue - red) / delta + 2
    : (red - green) / delta + 4;
  // The editor's colorize baseline is approximately 38deg warmer than CSS
  // hue, matching the rest of Coco's tintable paint assets.
  return Math.round(((hue * 60 + 360) % 360) - 38);
};

const svgDataUrl = (svg: string) =>
  `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;

const materializeSvg = (template: string, color: string) =>
  template.replace(/\{\{COLOR\}\}/g, color);

const fieldTemplate =
  '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256" preserveAspectRatio="none"><defs><linearGradient id="clubFloor" x1="0.5" y1="0" x2="0.5" y2="1"><stop offset="0%" stop-color="{{COLOR}}" stop-opacity="0"/><stop offset="28.94736842105263%" stop-color="{{COLOR}}" stop-opacity="0.65"/><stop offset="44.73684210526316%" stop-color="{{COLOR}}" stop-opacity="1"/><stop offset="100%" stop-color="{{COLOR}}" stop-opacity="1"/></linearGradient></defs><rect width="256" height="256" fill="url(#clubFloor)"/></svg>';

const glowTemplate =
  '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><defs><radialGradient id="clubGlow" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="{{COLOR}}" stop-opacity="0.96"/><stop offset="34%" stop-color="{{COLOR}}" stop-opacity="0.74"/><stop offset="72%" stop-color="{{COLOR}}" stop-opacity="0.2"/><stop offset="100%" stop-color="{{COLOR}}" stop-opacity="0"/></radialGradient></defs><circle cx="128" cy="128" r="128" fill="url(#clubGlow)"/></svg>';

// Inline the same editable scribble silhouette used by the design-elements
// library. Keeping it in the generated asset removes the only network-backed
// layer from this composition, so Square→Story switches and export cannot
// briefly capture an undecoded image.
const paintTemplate =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 343.62 274.8"><path fill="{{COLOR}}" d="m270.47 81.49c4.08-1.53 6.83-5.36 5.59-9.85-.3-1.09-.88-2.11-1.64-3 12.32-4.91 24.8-9.45 37.42-13.62 8.58-2.84 17.22-5.48 25.9-7.97 4.19-1.2 6.76-5.61 5.59-9.85-1.15-4.17-5.66-6.8-9.85-5.59-13.01 3.73-25.92 7.84-38.69 12.33-.77-1.58-2.09-2.92-3.66-3.76 6.62-2.8 13.34-5.34 20.18-7.54 4.15-1.34 6.79-5.51 5.59-9.85-.61-2.23-2.27-4.1-4.33-5.11 1.71-.63 3.42-1.25 5.14-1.86 4.11-1.46 6.82-5.41 5.59-9.85-1.09-3.97-5.74-7.06-9.85-5.59-59.69 21.28-116.08 51.62-169.11 86.14C95.13 118.55 48.25 155.96 12.66 203.07c-4.03 5.34-7.87 10.82-11.53 16.42-2.39 3.66-.75 8.84 2.87 10.96 3.91 2.29 8.57.77 10.96-2.87.48-.74.97-1.46 1.46-2.19.13.09.26.18.39.26.28.17.58.31.89.43-1 1.53-1.99 3.07-2.96 4.63-2.3 3.71-.82 8.8 2.87 10.96 1.4.82 2.94 1.15 4.43 1.06.66 1.9 1.96 3.6 3.58 4.55 4.08 2.39 8.35.62 10.96-2.87 7.91-10.62 17.06-21.72 26.51-32.24 3.12-3.47 6.3-6.89 9.52-10.26-.05.07-.1.14-.16.21-7.01 9.72-13.81 19.71-20.47 29.67-7.11 10.65-12.99 22.11-14.31 35-.45 4.35 3.98 8.01 8.01 8.01 4.7 0 7.57-3.67 8.01-8.01.02-.24.04-.42.05-.56.03-.14.06-.34.11-.61.14-.83.33-1.64.52-2.46.38-1.65.9-3.27 1.45-4.87 1.01-2.92 2.47-5.84 4.32-9.21 1.93-3.51 4.08-6.88 6.33-10.2 3.76 1.69 7.86.07 10.15-3.28 16.63-24.4 36.37-46.76 58.61-66.97 22.98-20.87 47.84-38 74.19-54.91 19.36-12.42 39.92-24.31 61.03-32.23Zm-57.84-17.26c-1.97 1.19-3.94 2.38-5.91 3.58-.11-.03-.21-.06-.32-.09 1.57-.89 3.14-1.77 4.71-2.65.51-.28 1.01-.56 1.52-.84Z"/></svg>';

const frameTemplate =
  '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256" preserveAspectRatio="none"><rect x="2.5" y="2.5" width="251" height="251" fill="none" stroke="{{COLOR}}" stroke-width="5"/></svg>';

/**
 * Build the photographic lighting and contrast grammar for Coco's
 * `fashion-club-vertical` composition.
 *
 * Every layer is a normal, unlocked editor asset. Coco is not baking a new
 * background image: the user can still move, recolor, resize, reorder, or
 * remove the black floor, magenta light, paint, or footer frame.
 */
export function buildCocoFashionClubAssets(input: CocoFashionClubAssetInput): Emoji[] {
  const patternId = input.patternId ?? input.composition?.patternId;
  if (patternId !== "fashion-club-vertical") return [];

  const geometry = getFashionClubVerticalFormatRecipe(input.format).assets;
  const canvasWidth = 540;
  const canvasHeight = input.format === "story" ? 960 : 540;
  const baseColor = darkEditorialColor(input.baseColor);
  const glowColor = normalizeHex(input.glowColor, fashionClubPalette.primary);
  const neutralColor = normalizeHex(input.neutralColor, fashionClubPalette.neutral);

  const fieldScale = (canvasHeight * (geometry.fieldHeightPct / 100)) / 160;
  const fieldLength = (canvasWidth * 1.12) / fieldScale;
  const frameScale = (canvasHeight * (geometry.frameHeightPct / 100)) / 160;
  const frameLength = (canvasWidth * (geometry.frameWidthPct / 100)) / frameScale;

  const coreAssets: Emoji[] = [
    {
      id: `coco_fashion_club_floor_${input.format}`,
      kind: "sticker",
      char: "",
      label: "Fashion club contrast floor",
      url: svgDataUrl(materializeSvg(fieldTemplate, baseColor)),
      x: 50,
      y: geometry.fieldY,
      scale: fieldScale,
      rotation: 0,
      locked: false,
      opacity: 1,
      blendMode: "normal",
      isSticker: true,
      isShapeGraphic: true,
      svgTemplate: fieldTemplate,
      iconColor: baseColor,
      shapeKind: "shape_square",
      shapeGradient: true,
      shapeLength: fieldLength,
      shapeSkew: 0,
      paletteRole: "base",
      cocoContrastRole: "shadow",
      layerOffset: -9,
      showLabel: false,
    },
    {
      id: `coco_fashion_club_glow_${input.format}`,
      kind: "sticker",
      char: "",
      label: "Fashion club magenta glow",
      url: svgDataUrl(materializeSvg(glowTemplate, glowColor)),
      x: geometry.glowX,
      y: geometry.glowY,
      scale: geometry.glowScale,
      rotation: 0,
      locked: false,
      opacity: geometry.glowOpacity,
      blendMode: "screen",
      isSticker: true,
      isShapeGraphic: true,
      svgTemplate: glowTemplate,
      iconColor: glowColor,
      shapeKind: "shape_circle",
      shapeGradient: true,
      shapeLength: 160,
      shapeSkew: 0,
      paletteRole: "primary",
      layerOffset: -8,
      showLabel: false,
    },
    {
      id: `coco_fashion_club_paint_${input.format}`,
      kind: "sticker",
      char: "",
      label: "Fashion club light paint",
      url: svgDataUrl(materializeSvg(paintTemplate, "#231F20")),
      x: geometry.paintX,
      y: geometry.paintY,
      scale: geometry.paintScale,
      rotation: geometry.paintRotation,
      locked: false,
      opacity: geometry.paintOpacity,
      blendMode: "screen",
      isSticker: true,
      isTexture: true,
      tint: tintHueForHex(glowColor),
      tintMode: "colorize",
      paletteRole: "primary",
      layerOffset: -7,
      showLabel: false,
    },
    {
      id: `coco_fashion_club_footer_frame_${input.format}`,
      kind: "sticker",
      char: "",
      label: "Fashion club footer frame",
      url: svgDataUrl(materializeSvg(frameTemplate, neutralColor)),
      x: geometry.frameX,
      y: geometry.frameY,
      scale: frameScale,
      rotation: 0,
      locked: false,
      opacity: 0.72,
      blendMode: "normal",
      isSticker: true,
      isShapeGraphic: true,
      svgTemplate: frameTemplate,
      iconColor: neutralColor,
      shapeKind: "shape_square",
      shapeGradient: false,
      shapeLength: frameLength,
      shapeSkew: 0,
      paletteRole: "neutral",
      layerOffset: -4,
      showLabel: false,
    },
  ];

  const arrow: Emoji = {
    id: `coco_fashion_club_arrow_${input.format}`,
    kind: "sticker",
    char: "",
    label: "Fashion club arrow rail",
    url: "/design-elements/arrows01.svg",
    x: input.format === "story" ? 80.59317129629629 : 82.61863425925927,
    y: input.format === "story" ? 83.32234700520833 : 75.92592592592594,
    scale: input.format === "story" ? 1.02 : 1,
    rotation: 0,
    opacity: 0.9,
    locked: false,
    blendMode: "normal",
    isSticker: true,
    isDesignElement: true,
    iconColor: neutralColor,
    paletteRole: "neutral",
    layerOffset: 55,
    hitTestMode: "alpha-bounds",
    showLabel: false,
  };
  const circles: Emoji = {
    id: `coco_fashion_club_circles_${input.format}`,
    kind: "sticker",
    char: "",
    label: "Fashion club circle rail",
    url: "/design-elements/circles02.svg",
    x: input.format === "story" ? 46.83159722222222 : 47.74956597222223,
    y: input.format === "story" ? 27.547607421875004 : 15.105613425925926,
    scale: input.format === "story" ? 1 : 0.7,
    rotation: 0,
    opacity: 0.9,
    locked: false,
    blendMode: "normal",
    isSticker: true,
    isDesignElement: true,
    iconColor: neutralColor,
    paletteRole: "neutral",
    layerOffset: 55,
    hitTestMode: "alpha-bounds",
    showLabel: false,
  };
  const squareSun: Emoji[] = input.format === "square"
    ? [{
        id: "coco_fashion_club_red_sun_square",
        kind: "sticker",
        char: "",
        label: "Fashion club red sun",
        url: "/flares/sun03.png",
        x: 76.41420717592592,
        y: 67.69820601851853,
        scale: 0.2,
        rotation: 0,
        opacity: 0.5,
        locked: false,
        blendMode: "screen",
        isFlare: true,
        isSticker: false,
        paletteRole: "primary",
        layerOffset: 54,
        showLabel: false,
      }]
    : [];

  return [...coreAssets, ...squareSun, arrow, circles].map((asset) => ({
    ...asset,
    hitTestMode: "alpha-bounds" as const,
    isDesignElement: true,
  }));
}
