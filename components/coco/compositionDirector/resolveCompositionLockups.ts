import type {
  CanvasCompositionResult,
  CapacityCheckedCandidate,
} from "./chooseCanvasComposition.ts";
import type {
  CompositionGuide,
  CompositionLockupId,
} from "./evaluateCompositionAssembly.ts";

type Rect = CapacityCheckedCandidate["rect"];

export type ResolvedLockupLayout = {
  id: CompositionLockupId;
  mode: "column" | "row";
  guide: CompositionGuide;
  gap: number;
  changed: boolean;
  rect: Rect;
};

export type LockupResolutionResult = {
  placements: CapacityCheckedCandidate[];
  lockups: ResolvedLockupLayout[];
  changed: boolean;
};

const ROLE_ORDER: Record<CompositionLockupId, string[]> = {
  hero: ["accent", "headline"],
  support: ["presenter", "details"],
  facts: ["date", "price"],
  footer: ["venue", "compliance"],
};

const GAP_BY_LOCKUP: Record<CompositionLockupId, number> = {
  hero: 1.25,
  support: 2,
  facts: 1.75,
  footer: 1.5,
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), Math.max(minimum, maximum));
}

function unionRect(rects: Rect[]): Rect {
  const x = Math.min(...rects.map((rect) => rect.x));
  const y = Math.min(...rects.map((rect) => rect.y));
  const right = Math.max(...rects.map((rect) => rect.x + rect.width));
  const bottom = Math.max(...rects.map((rect) => rect.y + rect.height));
  return { x, y, width: right - x, height: bottom - y };
}

function alignedX(container: Rect, width: number, guide: CompositionGuide) {
  if (guide === "right") return container.x + container.width - width;
  if (guide === "center") return container.x + (container.width - width) / 2;
  return container.x;
}

function preferredMode(id: CompositionLockupId, members: CapacityCheckedCandidate[]) {
  if (id === "hero" || id === "support") return "column" as const;
  const totalWidth = members.reduce((sum, member) => sum + member.rect.width, 0);
  const current = unionRect(members.map((member) => member.rect));
  return totalWidth + GAP_BY_LOCKUP[id] <= current.width + 1
    ? "row" as const
    : "column" as const;
}

function buildColumnRects(
  members: CapacityCheckedCandidate[],
  container: Rect,
  guide: CompositionGuide,
  gap: number
) {
  const totalHeight = members.reduce((sum, member) => sum + member.rect.height, 0) +
    gap * Math.max(0, members.length - 1);
  let y = clamp(
    container.y + (container.height - totalHeight) / 2,
    0,
    100 - totalHeight
  );
  return members.map((member) => {
    const rect = {
      x: clamp(alignedX(container, member.rect.width, guide), 0, 100 - member.rect.width),
      y,
      width: member.rect.width,
      height: member.rect.height,
    };
    y += member.rect.height + gap;
    return rect;
  });
}

function buildRowRects(
  members: CapacityCheckedCandidate[],
  container: Rect,
  gap: number
) {
  const totalWidth = members.reduce((sum, member) => sum + member.rect.width, 0) +
    gap * Math.max(0, members.length - 1);
  let x = clamp(
    container.x + (container.width - totalWidth) / 2,
    0,
    100 - totalWidth
  );
  const centerY = container.y + container.height / 2;
  return members.map((member) => {
    const rect = {
      x,
      y: clamp(centerY - member.rect.height / 2, 0, 100 - member.rect.height),
      width: member.rect.width,
      height: member.rect.height,
    };
    x += member.rect.width + gap;
    return rect;
  });
}

function overlapRatio(a: Rect, b: Rect) {
  const width = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const height = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  return width * height / Math.max(1, Math.min(a.width * a.height, b.width * b.height));
}

function rectChanged(a: Rect, b: Rect) {
  return Math.abs(a.x - b.x) > 0.05 || Math.abs(a.y - b.y) > 0.05 ||
    Math.abs(a.width - b.width) > 0.05 || Math.abs(a.height - b.height) > 0.05;
}

/**
 * Converts advisory assembly groups into authoritative geometry. Each complete
 * lockup is reflowed as a compact row or column on its selected guide, then its
 * copy is measured again. Unsafe or unfittable proposals are left untouched.
 */
export function resolveCompositionLockups(input: {
  composition: CanvasCompositionResult;
  refit: (candidate: CapacityCheckedCandidate, rect: Rect) => CapacityCheckedCandidate["capacity"];
  validate?: (candidate: CapacityCheckedCandidate, rect: Rect) => boolean;
}): LockupResolutionResult {
  let placements = input.composition.placements.map((candidate) => ({ ...candidate }));
  const lockups: ResolvedLockupLayout[] = [];

  for (const lockup of input.composition.assembly.lockups) {
    const members = placements
      .filter((candidate) => lockup.roles.includes(candidate.role))
      .sort(
        (a, b) => ROLE_ORDER[lockup.id].indexOf(a.role) - ROLE_ORDER[lockup.id].indexOf(b.role)
      );
    const container = unionRect(members.map((member) => member.rect));
    const mode = preferredMode(lockup.id, members);
    const gap = GAP_BY_LOCKUP[lockup.id];
    if (members.length < 2) {
      lockups.push({ id: lockup.id, mode, guide: lockup.guide, gap, changed: false, rect: container });
      continue;
    }

    const proposedRects = mode === "row"
      ? buildRowRects(members, container, gap)
      : buildColumnRects(members, container, lockup.guide, gap);
    const proposed = members.map((member, index) => {
      const rect = proposedRects[index];
      return { ...member, rect, capacity: input.refit(member, rect) };
    });
    const memberIds = new Set(members.map((member) => member.id));
    const outsiders = placements.filter((candidate) => !memberIds.has(candidate.id));
    const valid = proposed.every(
      (candidate) =>
        candidate.capacity.fits &&
        (input.validate?.(candidate, candidate.rect) ?? true) &&
        outsiders.every((other) => overlapRatio(candidate.rect, other.rect) <= 0.08)
    ) && proposed.every(
      (candidate, index) => proposed.slice(index + 1).every(
        (other) => overlapRatio(candidate.rect, other.rect) <= 0.08
      )
    );
    const changed = valid && proposed.some((candidate, index) =>
      rectChanged(candidate.rect, members[index].rect)
    );
    if (valid) {
      const byId = new Map(proposed.map((candidate) => [candidate.id, candidate]));
      placements = placements.map((candidate) => byId.get(candidate.id) ?? candidate);
    }
    lockups.push({
      id: lockup.id,
      mode,
      guide: lockup.guide,
      gap,
      changed,
      rect: valid ? unionRect(proposed.map((candidate) => candidate.rect)) : container,
    });
  }

  return {
    placements,
    lockups,
    changed: lockups.some((lockup) => lockup.changed),
  };
}
