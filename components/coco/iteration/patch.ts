import type {
  CocoBadgePatch,
  CocoDesignPatch,
  CocoIterationState,
} from "./types";
import type {
  CocoTypographyStackItem,
  CocoTypographyStackModel,
} from "../typographyStack/types";
import type { CocoTournamentRect } from "../layoutTournament";

export function applyCocoDesignPatch(
  state: CocoIterationState,
  patch: CocoDesignPatch
): CocoIterationState {
  const stack = cloneStack(state.stack);

  if (patch.stackOffsetX || patch.stackOffsetY) {
    stack.rect = clampRect({
      ...stack.rect,
      x: stack.rect.x + Number(patch.stackOffsetX ?? 0),
      y: stack.rect.y + Number(patch.stackOffsetY ?? 0),
    });
  }

  stack.items = stack.items.map((item) => patchStackItem(item, patch));

  return {
    stack,
    badgePatch: mergeBadgePatch(state.badgePatch ?? null, patch),
  };
}

export function cloneStack(stack: CocoTypographyStackModel): CocoTypographyStackModel {
  return {
    ...stack,
    composition: {
      ...stack.composition,
      copyTreatment: { ...stack.composition.copyTreatment },
      gates: stack.composition.gates ? { ...stack.composition.gates } : undefined,
      hierarchy: { ...stack.composition.hierarchy },
      rhythm: { ...stack.composition.rhythm },
    },
    debug: stack.debug
      ? {
          gates: [...stack.debug.gates],
          reason: stack.debug.reason,
        }
      : undefined,
    items: stack.items.map((item) => ({
      ...item,
      effects: item.effects ? { ...item.effects } : undefined,
      sources: [...item.sources],
      style: { ...item.style },
    })),
    ownedSources: [...stack.ownedSources],
    rect: { ...stack.rect },
    signatureMove: stack.signatureMove
      ? {
          ...stack.signatureMove,
          effects: stack.signatureMove.effects ? { ...stack.signatureMove.effects } : undefined,
          layout: stack.signatureMove.layout ? { ...stack.signatureMove.layout } : undefined,
          safety: { ...stack.signatureMove.safety },
          typography: stack.signatureMove.typography ? { ...stack.signatureMove.typography } : undefined,
        }
      : undefined,
  };
}

export function resolveBadgeZone(
  badgeZone: CocoTournamentRect | null | undefined,
  patch: CocoBadgePatch | null | undefined
): CocoTournamentRect | null {
  if (!badgeZone) return null;
  if (!patch) return { ...badgeZone };
  const scale = Math.max(0.55, Math.min(1.35, Number(patch.scale) || 1));
  const width = badgeZone.width * scale;
  const height = badgeZone.height * scale;
  return clampRect({
    ...badgeZone,
    height,
    width,
    x: badgeZone.x + patch.offsetX,
    y: badgeZone.y + patch.offsetY,
  });
}

function patchStackItem(
  item: CocoTypographyStackItem,
  patch: CocoDesignPatch
): CocoTypographyStackItem {
  if (item.kind === "headline") {
    const scale = Number(patch.headlineScale ?? 1);
    if (!Number.isFinite(scale) || scale === 1) return item;
    return {
      ...item,
      style: {
        ...item.style,
        fontSize: Math.round(item.style.fontSize * scale),
      },
      visualPower: Math.round(clamp(item.visualPower * scale, 1, 100)),
    };
  }

  if (item.kind === "accent") {
    const scale = Number(patch.accentScale ?? 1);
    return {
      ...item,
      offsetXPct: round((item.offsetXPct ?? 0) + Number(patch.accentOffsetX ?? 0)),
      offsetYPct: round((item.offsetYPct ?? 0) + Number(patch.accentOffsetY ?? 0)),
      rotationDeg:
        typeof patch.accentRotation === "number"
          ? round(patch.accentRotation)
          : item.rotationDeg,
      style: {
        ...item.style,
        fontSize: Number.isFinite(scale)
          ? Math.round(item.style.fontSize * scale)
          : item.style.fontSize,
      },
      visualPower: Number.isFinite(scale)
        ? Math.round(clamp(item.visualPower * scale, 1, 100))
        : item.visualPower,
    };
  }

  if (item.kind === "metadata" || item.kind === "footer") {
    const scale = Number(patch.metadataScale ?? 1);
    return {
      ...item,
      spacingBeforePct: round(item.spacingBeforePct + Number(patch.metadataOffsetY ?? 0)),
      style: {
        ...item.style,
        fontSize: Number.isFinite(scale)
          ? Math.round(item.style.fontSize * scale)
          : item.style.fontSize,
      },
      visualPower: Number.isFinite(scale)
        ? Math.round(clamp(item.visualPower * scale, 1, 100))
        : item.visualPower,
    };
  }

  return item;
}

function mergeBadgePatch(
  current: CocoBadgePatch | null,
  patch: CocoDesignPatch
): CocoBadgePatch | null {
  if (
    patch.badgeOffsetX == null &&
    patch.badgeOffsetY == null &&
    patch.badgeScale == null
  ) {
    return current;
  }

  return {
    offsetX: round(Number(current?.offsetX ?? 0) + Number(patch.badgeOffsetX ?? 0)),
    offsetY: round(Number(current?.offsetY ?? 0) + Number(patch.badgeOffsetY ?? 0)),
    scale: round(Math.max(0.55, Math.min(1.35, Number(current?.scale ?? 1) * Number(patch.badgeScale ?? 1)))),
  };
}

function clampRect(rect: CocoTournamentRect): CocoTournamentRect {
  const width = clamp(rect.width, 1, 100);
  const height = clamp(rect.height, 1, 100);
  return {
    ...rect,
    height: round(height),
    width: round(width),
    x: round(clamp(rect.x, 0, 100 - width)),
    y: round(clamp(rect.y, 0, 100 - height)),
  };
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function round(value: number) {
  return Math.round(value * 1000) / 1000;
}

