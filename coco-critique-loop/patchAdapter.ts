import type {
  DesignPatch,
  RenderedElementSnapshot,
  RenderedSnapshot,
} from "./types.ts";
import { clone } from "./utils.ts";

export function applyPatchesToSnapshot(
  snapshot: RenderedSnapshot,
  patches: DesignPatch[]
): RenderedSnapshot {
  const next = clone(snapshot);

  for (const patch of patches) {
    const element = next.elements.find(
      (item) => item.id === patch.targetId || item.role === patch.targetId
    );

    if (!element) continue;

    applyPatch(element, patch);
  }

  next.signature = undefined;
  return next;
}

function applyPatch(
  element: RenderedElementSnapshot,
  patch: DesignPatch
): void {
  if (patch.action === "move") {
    const inward = numberValue(
      patch.values.inwardPercent,
      numberValue(patch.values.inward, 0)
    );

    if (inward > 0) {
      if (element.rect.x < 50) {
        element.rect.x += inward;
      } else {
        element.rect.x -= inward;
      }

      if (element.rect.y < 50) {
        element.rect.y += inward * 0.4;
      } else {
        element.rect.y -= inward * 0.4;
      }
    }

    if (typeof patch.values.x === "number") {
      element.rect.x = patch.values.x;
    }

    if (typeof patch.values.y === "number") {
      element.rect.y = patch.values.y;
    }
  }

  if (patch.action === "scale") {
    const scale = numberValue(patch.values.scale, 1);

    element.rect.width *= scale;
    element.rect.height *= scale;

    if (element.fontSize) {
      element.fontSize *= scale;
    }

    if (element.visualPower) {
      element.visualPower *= scale;
    }
  }

  if (patch.action === "rotate") {
    element.rotationDeg = numberValue(
      patch.values.rotationDeg,
      element.rotationDeg ?? 0
    );
  }

  if (patch.action === "hide") {
    element.visible = false;
  }

  if (patch.action === "show") {
    element.visible = true;
  }

  if (patch.action === "changeOpacity") {
    element.opacity = numberValue(
      patch.values.opacity,
      element.opacity
    );
  }

  if (patch.action === "changeTracking") {
    element.tracking = numberValue(
      patch.values.tracking,
      element.tracking ?? 0
    );
  }

  if (patch.action === "changeLineHeight") {
    element.lineHeight = numberValue(
      patch.values.lineHeight,
      element.lineHeight ?? 1
    );
  }

  if (patch.action === "changeWeight") {
    element.fontWeight = numberValue(
      patch.values.weight,
      element.fontWeight ?? 400
    );
  }

  if (patch.action === "changeFont") {
    const family = String(
      patch.values.family ??
      patch.values.familyRole ??
      element.fontFamily ??
      ""
    );

    element.fontFamily = family;
  }

  if (patch.action === "increaseContrast") {
    element.contrastRatio = Math.max(
      element.contrastRatio ?? 0,
      numberValue(patch.values.minimumRatio, 4.5)
    );
  }

  if (patch.action === "reduceEffects") {
    const multiplier = numberValue(
      patch.values.multiplier,
      1
    );

    element.effects = {
      glow:
        typeof patch.values.glow === "number"
          ? patch.values.glow
          : (element.effects?.glow ?? 0) *
            numberValue(patch.values.glowMultiplier, multiplier),

      shadow:
        typeof patch.values.shadow === "number"
          ? patch.values.shadow
          : (element.effects?.shadow ?? 0) * multiplier,

      stroke:
        typeof patch.values.stroke === "number"
          ? patch.values.stroke
          : (element.effects?.stroke ?? 0) *
            numberValue(patch.values.strokeMultiplier, multiplier),

      blur:
        typeof patch.values.blur === "number"
          ? patch.values.blur
          : (element.effects?.blur ?? 0) * multiplier,

      texture:
        (element.effects?.texture ?? 0) * multiplier,
    };
  }

  if (patch.action === "align") {
    const axis = String(
      patch.values.opticalAxis ?? ""
    );

    if (axis === "headline") {
      const headline = element.id === "headline"
        ? element
        : undefined;

      if (headline) {
        element.align = headline.align ?? "left";
      }
    }
  }

  if (patch.action === "changeLineBreak") {
    const maxLines = numberValue(
      patch.values.maxLines,
      element.lineCount ?? 1
    );

    element.lineCount = Math.max(
      1,
      Math.min(maxLines, element.lineCount ?? maxLines)
    );
  }

  if (patch.action === "changeHierarchy") {
    const ratio = numberValue(
      patch.values.maxPowerRatio,
      1
    );

    if (element.visualPower) {
      element.visualPower = Math.min(
        element.visualPower,
        100 * ratio
      );
    }
  }

  if (patch.action === "tightenSpacing") {
    if (typeof patch.values.lineHeight === "number") {
      element.lineHeight = patch.values.lineHeight;
    }

    if (typeof patch.values.tracking === "number") {
      element.tracking = patch.values.tracking;
    }
  }

  if (patch.action === "restyle") {
    element.effects = {
      ...element.effects,
      shadow:
        typeof patch.values.shadow === "number"
          ? patch.values.shadow
          : element.effects?.shadow,
    };
  }
}

function numberValue(
  value: unknown,
  fallback: number
): number {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : fallback;
}
