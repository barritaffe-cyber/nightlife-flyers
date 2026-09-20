import { contrastRatio as computeContrastRatio } from "../../../coco-color-director/colorMath.ts";
import type { ColorRenderModel, ColorRole } from "../../../coco-color-director/index.ts";
import type { CompositionBlock, CompositionCandidate } from "../../../coco-composition-director/index.ts";
import type { RenderedElementSnapshot, RenderedFlyerSnapshot } from "../../../coco-art-director/index.ts";
import type { CocoTypographyStackItem, CocoTypographyStackModel } from "../typographyStack/types.ts";
import type { CocoCompositionRole } from "../layoutTournament/types.ts";
import { cocoRole } from "./engine.ts";
import type { CocoSceneAuthority } from "./types.ts";

const FORMAT_CANVAS_SIZE: Record<"square" | "story", { width: number; height: number }> = {
  square: { width: 1080, height: 1080 },
  story: { width: 1080, height: 1920 },
};

// Composition blocks use CompositionRole ("identity", "presenter", ...); typography-stack
// items key off the CocoCompositionRole vocabulary produced by engine.ts's cocoRole(). Neither
// matches the free-text role aliases art-director/color-director look for (metrics.ts's
// findRole()), so every element's role is normalized onto this set as a final step.
const COCO_ROLE_TO_ELEMENT_ROLE: Record<CocoCompositionRole, string> = {
  headline: "headline",
  accent: "accent",
  primaryMeta: "metadata",
  secondaryMeta: "metadata",
  dateTime: "dateTime",
  venue: "venue",
  footer: "footer",
  badge: "badge",
};

export type BuildRenderedFlyerSnapshotInput = {
  colorRenderModel: ColorRenderModel | null;
  compositionCandidate: CompositionCandidate | null;
  format: "square" | "story";
  sceneAuthority: CocoSceneAuthority | null;
  typographyStack: CocoTypographyStackModel | null | undefined;
};

export function buildRenderedFlyerSnapshotFromPipelineState(
  input: BuildRenderedFlyerSnapshotInput
): RenderedFlyerSnapshot {
  const { width, height } = FORMAT_CANVAS_SIZE[input.format];
  const blocks = input.compositionCandidate?.blocks.filter((block) => !block.hidden) ?? [];
  const items = input.typographyStack?.items ?? [];
  const colorRoles = input.colorRenderModel?.roles ?? [];
  const backgroundColor = colorRoles.find((role) => role.role === "background")?.color;

  const elements = blocks
    .map((block) => buildElement(block, items, colorRoles, backgroundColor))
    .filter((element): element is RenderedElementSnapshot => element !== null);

  const uniqueFontCount = new Set(elements.map((element) => element.fontFamily).filter(Boolean)).size;
  const strongColorCount = input.colorRenderModel?.roles
    ? new Set(colorRoles.filter((role) => role.importance === "critical" || role.importance === "high").map((role) => role.color)).size
    : 0;

  return {
    elements,
    format: input.format,
    globalMetrics: {
      exportClipped: false,
      previewExportMatch: true,
      safeMarginViolations: countSafeMarginViolations(elements, input.sceneAuthority),
      strongColorCount,
      uniqueFontCount,
      visibleGroupCount: elements.filter((element) => element.visible).length,
    },
    height,
    subjectRect: input.compositionCandidate?.subjectRect,
    width,
  };
}

function buildElement(
  block: CompositionBlock,
  items: CocoTypographyStackItem[],
  colorRoles: ColorRenderModel["roles"],
  backgroundColor: string | undefined
): RenderedElementSnapshot | null {
  const directedRole = cocoRole(block.role);
  const item = items.find((candidate) => candidate.role === directedRole);
  const elementRole = item?.kind ?? COCO_ROLE_TO_ELEMENT_ROLE[directedRole];
  const colorRole = colorRoles.find((role) => role.role === (elementRole as ColorRole));
  const foreground = item?.style.color ?? colorRole?.color;
  const background = colorRole?.contrastAgainst ?? backgroundColor;

  return {
    align: item?.align,
    backgroundColor: background,
    color: foreground,
    contrastRatio:
      colorRole?.contrastRatio ?? (foreground && background ? computeContrastRatio(foreground, background) : undefined),
    effects: item
      ? {
          blur: 0,
          glow: item.effects?.glowBoost ?? 0,
          shadow: item.style.shadow ? 0.3 : 0,
          stroke: item.style.strokeWidth ? Math.min(1, item.style.strokeWidth / 4) : 0,
          texture: 0,
        }
      : undefined,
    fontFamily: item?.style.fontFamily,
    fontSize: item?.style.fontSize,
    fontWeight: typeof item?.style.fontWeight === "number" ? item.style.fontWeight : undefined,
    id: block.id,
    lineHeight: item?.style.lineHeight,
    opacity: item?.style.opacity ?? 1,
    // Prefer the item's real measured glyph footprint over the loose,
    // content-agnostic composition block rect, so protection/collision
    // checks gate on where the text actually ends up, not the full column
    // it was allotted.
    rect: item?.measuredRect ?? block.rect,
    role: elementRole,
    rotationDeg: item?.rotationDeg,
    text: item?.text,
    tracking: item?.style.letterSpacingEm,
    visible: !block.hidden && Boolean(item?.text),
    visualPower: item?.visualPower ?? block.maxVisualPower ?? block.minVisualPower,
    zIndex: undefined,
  };
}

function countSafeMarginViolations(
  elements: RenderedElementSnapshot[],
  sceneAuthority: CocoSceneAuthority | null
): number {
  const SAFE_MARGIN_PCT = 4;
  let violations = 0;

  for (const element of elements) {
    if (!element.visible) continue;
    const { x, y, width, height } = element.rect;
    if (x < SAFE_MARGIN_PCT || y < SAFE_MARGIN_PCT || x + width > 100 - SAFE_MARGIN_PCT || y + height > 100 - SAFE_MARGIN_PCT) {
      violations += 1;
      continue;
    }

    for (const zone of sceneAuthority?.protectionZones ?? []) {
      if (zone.importance !== "critical") continue;
      const overlap = overlapRatio(element.rect, zone.rect);
      if (overlap > zone.allowOverlapRatio) {
        violations += 1;
        break;
      }
    }
  }

  return violations;
}

function overlapRatio(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number }
): number {
  const x = Math.max(a.x, b.x);
  const y = Math.max(a.y, b.y);
  const right = Math.min(a.x + a.width, b.x + b.width);
  const bottom = Math.min(a.y + a.height, b.y + b.height);
  if (right <= x || bottom <= y) return 0;
  const intersectionArea = (right - x) * (bottom - y);
  const areaA = Math.max(1e-6, a.width * a.height);
  return intersectionArea / areaA;
}
