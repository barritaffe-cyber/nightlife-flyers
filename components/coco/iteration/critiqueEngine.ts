import type { CocoTournamentRect } from "../layoutTournament";
import type { CocoTypographyStackItem } from "../typographyStack/types";
import type {
  CocoDesignCritique,
  CocoIterationInput,
  CocoIterationState,
} from "./types";
import { resolveBadgeZone } from "./patch.ts";

type CritiqueInput = CocoIterationInput & Partial<CocoIterationState>;

export function critiqueCocoDesign(input: CritiqueInput): CocoDesignCritique[] {
  const stack = input.stack;
  const critiques: CocoDesignCritique[] = [];
  const headline = stack.items.find((item) => item.kind === "headline");
  const accent = stack.items.find((item) => item.kind === "accent");
  const metadata = stack.items.find((item) => item.kind === "metadata");
  const stackRect = stack.rect;
  const badgeZone = resolveBadgeZone(input.badgeZone, input.badgePatch);

  if (!headline) return critiques;

  const projected = projectStackItems(stackRect, stack.items);
  const accentRect = projected.find((item) => item.item.kind === "accent")?.rect;
  const subjectZone = input.subjectZone ?? input.zones.subject ?? null;
  const faceZone = input.faceZone ?? null;
  const presenterZone = input.presenterZone ?? input.zones.presenter ?? null;

  const detachPatch = detachedPatch(stackRect, accentRect, subjectZone);
  if (detachPatch) {
    critiques.push({
      id: "text-detached-from-image",
      category: "visualInteraction",
      severity: "high",
      confidence: 0.88,
      observation: "The typography feels separated from the image.",
      reason: "The stack sits beside the subject but does not visually interact with the scene.",
      suggestedPatch: detachPatch,
    });
  }

  if (accent && accentPowerRatio(accent, headline) > 0.48) {
    critiques.push({
      id: "accent-too-loud",
      category: "hierarchy",
      severity: "medium",
      confidence: 0.91,
      observation: "The accent is competing with the headline.",
      reason: "Accent text should add personality without becoming a second headline.",
    });
  }

  if (metadata && itemPowerRatio(metadata, headline) > 0.34) {
    critiques.push({
      id: "metadata-too-heavy",
      category: "metadata",
      severity: "medium",
      confidence: 0.86,
      observation: "The supporting copy still feels too heavy.",
      reason: "Premium flyer metadata should feel like controlled information, not body copy.",
    });
  }

  if (stackRect.x < 4 || stackRect.x + stackRect.width > 96) {
    const direction = stackRect.x < 4 ? 4 - stackRect.x : 96 - (stackRect.x + stackRect.width);
    critiques.push({
      id: "stack-edge-risk",
      category: "edgeRisk",
      severity: "medium",
      confidence: 0.84,
      observation: "The type stack is too close to the edge.",
      reason: "Premium layouts need breathing room so the typography feels intentional.",
      suggestedPatch: { stackOffsetX: clamp(direction, -4, 4) },
    });
  }

  if (badgeZone && presenterZone && overlaps(expandRect(presenterZone, 0.7), badgeZone)) {
    critiques.push({
      id: "badge-presenter-collision",
      category: "topUtility",
      severity: "high",
      confidence: 0.96,
      observation: "The badge is colliding with the presenter strip.",
      reason: "Top utility elements need separation; when they touch, the poster starts to feel like a template.",
      suggestedPatch: badgePatchAwayFromPresenter(badgeZone, presenterZone),
    });
  }

  if (badgeZone && presenterZone && topUtilityFeelsCrowded(badgeZone, presenterZone)) {
    critiques.push({
      id: "top-utility-clutter",
      category: "topUtility",
      severity: "medium",
      confidence: 0.84,
      observation: "The top utility area feels crowded.",
      reason: "Presenter copy and price badge should not compete for the same small top band.",
      suggestedPatch: badgePatchAwayFromPresenter(badgeZone, presenterZone),
    });
  }

  const badgeCollision = badgeZone ? strongestBadgeCollision(badgeZone, projected) : null;
  if (badgeZone && badgeCollision) {
    critiques.push({
      id: badgeCollision.item.kind === "headline" ? "badge-interferes" : `badge-interferes-${badgeCollision.item.kind}`,
      category: "badge",
      severity: badgeCollision.item.kind === "headline" ? "high" : "medium",
      confidence: badgeCollision.item.kind === "headline" ? 0.93 : 0.82,
      observation:
        badgeCollision.item.kind === "headline"
          ? "The badge is interfering with the headline area."
          : "The badge is crowding the typography stack.",
      reason: "A price badge should either anchor a corner or support the stack, not collide with core information.",
      suggestedPatch: badgePatchAwayFromRect(badgeZone, badgeCollision.rect),
    });
  }

  if (badgeZone && badgeLooksTooDominant(badgeZone, stackRect)) {
    critiques.push({
      id: "badge-too-dominant",
      category: "badge",
      severity: "medium",
      confidence: 0.78,
      observation: "The price badge is visually louder than the poster needs.",
      reason: "For a premium flyer, the badge should be a utility cue, not a competing focal point.",
      suggestedPatch: {
        badgeOffsetY: -1.4,
        badgeScale: 0.78,
      },
    });
  }

  if (faceZone && accentRect && overlaps(expandRect(faceZone, 1.5), accentRect)) {
    critiques.push({
      id: "accent-face-risk",
      category: "visualInteraction",
      severity: "high",
      confidence: 0.9,
      observation: "The accent is getting too close to the face.",
      reason: "Image interaction should not cover the face, smile, or main expression.",
      suggestedPatch: {
        accentOffsetX: accentRect.x < faceZone.x ? -2 : 2,
        accentOffsetY: 1,
        accentRotation: 0,
      },
    });
  }

  return critiques.sort(compareCritiques);
}

export function scoreCocoCritiques(critiques: CocoDesignCritique[]) {
  return Math.round(
    critiques.reduce((sum, critique) => sum + critiqueWeight(critique), 0)
  );
}

function detachedPatch(
  stackRect: CocoTournamentRect,
  accentRect: CocoTournamentRect | undefined,
  subjectZone: CocoTournamentRect | null
) {
  if (!subjectZone) return null;
  const interactionRect = accentRect ?? stackRect;
  const interactionRight = Math.max(stackRect.x + stackRect.width, interactionRect.x + interactionRect.width);
  const interactionLeft = Math.min(stackRect.x, interactionRect.x);
  const subjectLeft = subjectZone.x;
  const subjectRight = subjectZone.x + subjectZone.width;

  if (interactionRight < subjectLeft - 7) {
    const gap = subjectLeft - interactionRight;
    return { stackOffsetX: clamp(gap * 0.32, 2, 4.5) };
  }

  if (subjectRight < interactionLeft - 7) {
    const gap = interactionLeft - subjectRight;
    return { stackOffsetX: -clamp(gap * 0.32, 2, 4.5) };
  }

  return null;
}

function strongestBadgeCollision(
  badgeZone: CocoTournamentRect,
  projected: Array<{ item: CocoTypographyStackItem; rect: CocoTournamentRect }>
) {
  const protectedItems = projected.filter(({ item }) =>
    ["headline", "accent", "metadata", "dateTime", "venue"].includes(item.kind)
  );
  return protectedItems
    .map((entry) => ({
      ...entry,
      area: overlapArea(badgeZone, entry.rect),
    }))
    .filter((entry) => entry.area > 0)
    .sort((a, b) => {
      const priority = kindPriority(b.item.kind) - kindPriority(a.item.kind);
      return priority || b.area - a.area;
    })[0];
}

function kindPriority(kind: CocoTypographyStackItem["kind"]) {
  if (kind === "headline") return 5;
  if (kind === "accent") return 4;
  if (kind === "metadata") return 3;
  if (kind === "dateTime") return 2;
  if (kind === "venue") return 1;
  return 0;
}

function badgePatchAwayFromPresenter(
  badgeZone: CocoTournamentRect,
  presenterZone: CocoTournamentRect
) {
  const targetX = presenterZone.x + presenterZone.width + 2.5;
  const targetY = Math.max(1.5, presenterZone.y - 2.2);
  return {
    badgeOffsetX: clamp(targetX - badgeZone.x, 6, 30),
    badgeOffsetY: clamp(targetY - badgeZone.y, -5, 2),
    badgeScale: 0.74,
  };
}

function badgePatchAwayFromRect(
  badgeZone: CocoTournamentRect,
  obstacle: CocoTournamentRect
) {
  if (obstacle.y > badgeZone.height + 3) {
    return {
      badgeOffsetX: clamp(obstacle.x - badgeZone.x, -10, 10),
      badgeOffsetY: clamp(obstacle.y - badgeZone.height - 2 - badgeZone.y, -18, -3),
      badgeScale: 0.82,
    };
  }

  const moveRight = centerX(obstacle) < 50;
  const targetX = moveRight
    ? obstacle.x + obstacle.width + 2
    : obstacle.x - badgeZone.width - 2;
  const targetY =
    badgeZone.y + badgeZone.height / 2 < obstacle.y + obstacle.height / 2
      ? obstacle.y - badgeZone.height - 2
      : obstacle.y + obstacle.height + 2;

  return {
    badgeOffsetX: clamp(targetX - badgeZone.x, -42, 42),
    badgeOffsetY: clamp(targetY - badgeZone.y, -14, 14),
    badgeScale: 0.82,
  };
}

function topUtilityFeelsCrowded(
  badgeZone: CocoTournamentRect,
  presenterZone: CocoTournamentRect
) {
  if (badgeZone.y > 18 || presenterZone.y > 14) return false;
  return horizontalGap(badgeZone, presenterZone) < 2.5 && verticalGap(badgeZone, presenterZone) < 3;
}

function badgeLooksTooDominant(
  badgeZone: CocoTournamentRect,
  stackRect: CocoTournamentRect
) {
  const badgeArea = badgeZone.width * badgeZone.height;
  const stackArea = stackRect.width * stackRect.height;
  const nearStackTop = badgeZone.y < stackRect.y + Math.min(12, stackRect.height * 0.2);
  return nearStackTop && badgeArea / Math.max(1, stackArea) > 0.045;
}

function projectStackItems(stackRect: CocoTournamentRect, items: CocoTypographyStackItem[]) {
  let cursorY = stackRect.y;
  return items.map((item) => {
    cursorY += item.spacingBeforePct;
    const lineCount = Math.max(1, item.text.split(/\r?\n/).length);
    const lineHeight = Number(item.style.lineHeight ?? 1);
    const height = clamp(item.style.fontSize * lineHeight * lineCount * 0.095, 1.2, stackRect.height);
    const width = Math.min(
      stackRect.width * item.maxWidthRatio,
      estimateTextWidthPct(item, stackRect.width)
    );
    const alignOffset =
      item.align === "center"
        ? (stackRect.width - width) / 2
        : item.align === "right"
        ? stackRect.width - width
        : 0;
    const rect = {
      align: item.align,
      height,
      width,
      x: stackRect.x + alignOffset + Number(item.offsetXPct ?? 0),
      y: cursorY + Number(item.offsetYPct ?? 0),
    };
    cursorY += height;
    return { item, rect };
  });
}

function estimateTextWidthPct(item: CocoTypographyStackItem, stackWidth: number) {
  const longestLine = item.text
    .split(/\r?\n/)
    .reduce((longest, line) => Math.max(longest, Array.from(line).length), 1);
  const fontSize = Math.max(1, item.style.fontSize);
  return clamp(longestLine * fontSize * 0.035, stackWidth * 0.3, stackWidth);
}

function accentPowerRatio(accent: CocoTypographyStackItem, headline: CocoTypographyStackItem) {
  return Math.max(itemPowerRatio(accent, headline), accent.style.fontSize / Math.max(1, headline.style.fontSize));
}

function itemPowerRatio(item: CocoTypographyStackItem, headline: CocoTypographyStackItem) {
  return Math.max(
    item.visualPower / Math.max(1, headline.visualPower),
    item.style.fontSize / Math.max(1, headline.style.fontSize)
  );
}

function overlaps(a: CocoTournamentRect, b: CocoTournamentRect) {
  return !(
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  );
}

function overlapArea(a: CocoTournamentRect, b: CocoTournamentRect) {
  const width = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const height = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  return width * height;
}

function horizontalGap(a: CocoTournamentRect, b: CocoTournamentRect) {
  if (a.x <= b.x + b.width && b.x <= a.x + a.width) return 0;
  return a.x < b.x ? b.x - (a.x + a.width) : a.x - (b.x + b.width);
}

function verticalGap(a: CocoTournamentRect, b: CocoTournamentRect) {
  if (a.y <= b.y + b.height && b.y <= a.y + a.height) return 0;
  return a.y < b.y ? b.y - (a.y + a.height) : a.y - (b.y + b.height);
}

function centerX(rect: CocoTournamentRect) {
  return rect.x + rect.width / 2;
}

function expandRect(rect: CocoTournamentRect, amount: number): CocoTournamentRect {
  return {
    ...rect,
    height: rect.height + amount * 2,
    width: rect.width + amount * 2,
    x: rect.x - amount,
    y: rect.y - amount,
  };
}

function compareCritiques(a: CocoDesignCritique, b: CocoDesignCritique) {
  return critiqueWeight(b) - critiqueWeight(a);
}

function critiqueWeight(critique: CocoDesignCritique) {
  const severityScore = { high: 3, medium: 2, low: 1 }[critique.severity];
  return severityScore * 10 * critique.confidence;
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}
