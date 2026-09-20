import type { ZoneTextRect } from "./zoneTextColor.ts";

export const COCO_ZONE_BLACK_FLARE_SRC = "/flares/optimized/flareBlack.png";
export const COCO_ZONE_SUPPORTING_BOX_PADDING_PX = 7;

export const COCO_ZONE_CONTRAST_ROLES = [
  "headline",
  "headline2",
  "details",
  "details2",
  "venue",
  "presenter",
  "leftRail",
  "rightRail",
  "socialHandle",
  "date",
  "price",
  "compliance",
] as const;

export type CocoZoneContrastRole = (typeof COCO_ZONE_CONTRAST_ROLES)[number];

export type CocoZoneContrastTreatment =
  | {
      kind: "black-flare";
      assetSrc: typeof COCO_ZONE_BLACK_FLARE_SRC;
      paddingPx: 0;
      textStrokeWidthPx: 0;
    }
  | {
      kind: "supporting-box";
      assetSrc: null;
      paddingPx: typeof COCO_ZONE_SUPPORTING_BOX_PADDING_PX;
      textStrokeWidthPx: 0;
    };

export type CocoZoneContrastCanvasSize = {
  width: number;
  height: number;
};

const HEADLINE_ROLES = new Set<CocoZoneContrastRole>(["headline", "headline2"]);

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.max(minimum, Math.min(maximum, value));

/**
 * Defines the shared preview/export presentation for a low-contrast Coco text
 * role. Display copy gets the organic black-flare asset instead of a box;
 * supporting copy may use a compact box. Neither treatment adds a text stroke.
 */
export function resolveCocoZoneContrastTreatment(
  role: CocoZoneContrastRole
): CocoZoneContrastTreatment {
  if (HEADLINE_ROLES.has(role)) {
    return {
      kind: "black-flare",
      assetSrc: COCO_ZONE_BLACK_FLARE_SRC,
      paddingPx: 0,
      textStrokeWidthPx: 0,
    };
  }

  return {
    kind: "supporting-box",
    assetSrc: null,
    paddingPx: COCO_ZONE_SUPPORTING_BOX_PADDING_PX,
    textStrokeWidthPx: 0,
  };
}

/**
 * Converts the supporting-copy padding from canonical canvas pixels to the
 * percentage coordinate space used by both the live artboard and export plan.
 * Headline flare bounds are intentionally left unchanged; the flare image
 * supplies its own soft transparent falloff rather than simulating box padding.
 */
export function padCocoZoneContrastRect(
  rect: ZoneTextRect,
  role: CocoZoneContrastRole,
  canvas: CocoZoneContrastCanvasSize
): ZoneTextRect {
  const treatment = resolveCocoZoneContrastTreatment(role);
  if (treatment.kind === "black-flare") return { ...rect };

  const width = Math.max(1, Number(canvas.width) || 0);
  const height = Math.max(1, Number(canvas.height) || 0);
  const horizontal = treatment.paddingPx / width * 100;
  const vertical = treatment.paddingPx / height * 100;
  const left = clamp(rect.x - horizontal, 0, 100);
  const top = clamp(rect.y - vertical, 0, 100);
  const right = clamp(rect.x + rect.width + horizontal, 0, 100);
  const bottom = clamp(rect.y + rect.height + vertical, 0, 100);

  return {
    x: left,
    y: top,
    width: Math.max(0, right - left),
    height: Math.max(0, bottom - top),
  };
}
