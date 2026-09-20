import type { Emoji } from "../../app/types/emoji.ts";
import { buildShapeSvgDataUrl, buildShapeSvgMarkup } from "../../lib/shapeGraphics.ts";
import type { CocoCompositionSystem } from "./layoutTournament/index.ts";

type CocoContrastFormat = "square" | "story";
type CocoContrastLayoutId = "subject-center" | "subject-left" | "subject-right";

export type CocoContrastAssetInput = {
  accentColor: string;
  baseColor: string;
  composition?: CocoCompositionSystem | null;
  format: CocoContrastFormat;
  layoutId: CocoContrastLayoutId;
};

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.max(minimum, Math.min(maximum, value));

const richDarkColor = (value: string) => {
  const compact = String(value || "").trim().replace(/^#/, "");
  const normalized = compact.length === 3
    ? compact.split("").map((part) => `${part}${part}`).join("")
    : compact;
  if (!/^[0-9a-f]{6}$/i.test(normalized)) return "#0B0A0D";
  const channel = (offset: number) => {
    const source = Number.parseInt(normalized.slice(offset, offset + 2), 16);
    // Retain a hint of the selected palette while guaranteeing that light
    // editorial palettes still create a useful text-contrast field.
    return Math.max(6, Math.min(42, Math.round(source * 0.14)));
  };
  return `#${[channel(0), channel(2), channel(4)]
    .map((part) => part.toString(16).padStart(2, "0"))
    .join("")}`;
};

const tintHueForHex = (value: string) => {
  const compact = String(value || "").trim().replace(/^#/, "");
  const normalized = compact.length === 3
    ? compact.split("").map((part) => `${part}${part}`).join("")
    : compact;
  if (!/^[0-9a-f]{6}$/i.test(normalized)) return 0;
  const channels = [0, 2, 4].map((offset) => Number.parseInt(normalized.slice(offset, offset + 2), 16) / 255);
  const [red, green, blue] = channels;
  const maximum = Math.max(red, green, blue);
  const minimum = Math.min(red, green, blue);
  const delta = maximum - minimum;
  if (delta === 0) return 0;
  const hue = maximum === red
    ? ((green - blue) / delta) % 6
    : maximum === green
    ? (blue - red) / delta + 2
    : (red - green) / delta + 4;
  return Math.round(((hue * 60 + 360) % 360) - 38);
};

const svgDataUrl = (svg: string) =>
  `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;

/**
 * Materialize Coco's split-editorial contrast field as normal editor assets.
 *
 * These are deliberately ordinary shape/paint records. They remain
 * selectable, movable, recolorable, reorderable, and export through the same
 * renderer as anything the user adds from Coco's asset library.
 */
export function buildCocoContrastAssets(input: CocoContrastAssetInput): Emoji[] {
  if (
    input.layoutId === "subject-center" ||
    input.composition?.patternId !== "split-hero-editorial"
  ) {
    return [];
  }

  const canvasWidth = 540;
  const canvasHeight = input.format === "story" ? 960 : 540;
  const column = input.composition.textColumn;
  const textOnLeft = input.layoutId === "subject-right";
  const paddedColumnLeft = clamp(column.x - 4, 0, 58);
  const paddedColumnRight = clamp(column.x + column.width + 4, 48, 100);
  // A split editorial needs enough negative field for a headline to feel
  // designed, not squeezed into a narrow utility rail. Keep at least 48% of
  // the canvas behind the copy while leaving the subject as the dominant
  // photographic half.
  const panelLeft = textOnLeft ? 0 : clamp(paddedColumnLeft, 42, 52);
  const panelRight = textOnLeft ? clamp(paddedColumnRight, 48, 58) : 100;
  const panelWidthPct = panelRight - panelLeft;
  const panelCenterX = panelLeft + panelWidthPct / 2;
  const panelScale = (canvasHeight / 160) * 1.04;
  const panelLength = (canvasWidth * (panelWidthPct / 100)) / panelScale;
  const seamX = textOnLeft ? panelRight : panelLeft;
  const paintRotation = textOnLeft ? -8 : 8;
  const panelColor = richDarkColor(input.baseColor);

  const panelTemplate = buildShapeSvgMarkup("shape_square", "{{COLOR}}", false);
  // Shape graphics intentionally have a 48px minimum editable length. A
  // literal narrow rectangle therefore expands into a huge opaque block at
  // full-canvas height. Keep that useful hit area, but paint only a centered
  // 6px strip inside it so the visual seam remains genuinely thin.
  const seamTemplate =
    '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256" preserveAspectRatio="none" fill="none"><rect x="125" y="0" width="6" height="256" fill="{{COLOR}}"/></svg>';

  return [
    {
      id: `coco_contrast_panel_${input.format}`,
      kind: "sticker",
      char: "",
      label: "Coco contrast panel",
      url: buildShapeSvgDataUrl("shape_square", panelColor, false),
      x: panelCenterX,
      y: 50,
      scale: panelScale,
      rotation: 0,
      locked: false,
      opacity: 0.94,
      blendMode: "normal",
      isSticker: true,
      isShapeGraphic: true,
      svgTemplate: panelTemplate,
      iconColor: panelColor,
      shapeKind: "shape_square",
      shapeGradient: false,
      shapeLength: panelLength,
      shapeSkew: 0,
      paletteRole: "base",
      cocoContrastRole: "shadow",
      layerOffset: -9,
      showLabel: false,
    },
    {
      id: `coco_contrast_seam_${input.format}`,
      kind: "sticker",
      char: "",
      label: "Coco contrast edge",
      url: svgDataUrl(seamTemplate.replace(/\{\{COLOR\}\}/g, input.accentColor)),
      x: seamX,
      y: 50,
      scale: panelScale * 0.9,
      rotation: 0,
      locked: false,
      opacity: 0.82,
      blendMode: "normal",
      isSticker: true,
      isShapeGraphic: true,
      svgTemplate: seamTemplate,
      iconColor: input.accentColor,
      shapeKind: "shape_square",
      shapeGradient: false,
      shapeLength: 48,
      shapeSkew: 0,
      paletteRole: "accent",
      layerOffset: -8,
      showLabel: false,
    },
    {
      id: `coco_contrast_paint_${input.format}`,
      kind: "sticker",
      char: "",
      label: "Coco paint accent",
      url: "/design-elements/paint-scribble.svg",
      x: textOnLeft ? panelRight * 0.52 : panelLeft + (100 - panelLeft) * 0.48,
      y: input.format === "story" ? 27 : 29,
      scale: input.format === "story" ? 0.62 : 0.55,
      rotation: paintRotation,
      locked: false,
      opacity: 0.12,
      blendMode: "normal",
      isSticker: true,
      isTexture: true,
      tint: tintHueForHex(input.accentColor),
      tintMode: "colorize",
      paletteRole: "accent",
      layerOffset: -7,
      showLabel: false,
    },
  ];
}
