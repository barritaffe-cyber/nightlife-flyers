import type {
  CocoCanvasSnapshot,
  CocoCanvasTextNode,
  CocoFinding,
  CocoRect,
  CocoRule,
  CocoTextRole,
} from "../types";

type RhythmAxis = "x" | "y";

type RhythmGap = {
  after: CocoTextRole;
  before: CocoTextRole;
  gap: number;
};

type RhythmPattern = {
  error: number;
  gaps: number[];
  id: "alternating" | "equal" | "hierarchy" | "tight";
  targetGaps: number[];
};

type RoleDelta = {
  x?: number;
  y?: number;
};

type RhythmGroup = {
  axis: RhythmAxis;
  id: string;
  label: string;
  maxGapRatio: number;
  minGapRatio: number;
  roles: CocoTextRole[];
  tight?: boolean;
};

const RHYTHM_GROUPS: RhythmGroup[] = [
  {
    axis: "y",
    id: "hero",
    label: "headline rhythm",
    maxGapRatio: 1.25,
    minGapRatio: -0.35,
    roles: ["headline", "headline2", "subtag"],
  },
  {
    axis: "y",
    id: "info",
    label: "lower information stack",
    maxGapRatio: 1.55,
    minGapRatio: 0.28,
    roles: ["details", "details2", "venue"],
  },
  {
    axis: "x",
    id: "utility",
    label: "utility spacing",
    maxGapRatio: 4.4,
    minGapRatio: 0.6,
    roles: ["date", "price"],
    tight: true,
  },
];

export function evaluateRhythm(snapshot: CocoCanvasSnapshot): CocoFinding[] {
  if (snapshot.userIsDragging || !snapshot.artboardRect) return [];

  return RHYTHM_GROUPS.flatMap((group) => evaluateRhythmGroup(snapshot, group))
    .filter((finding) => finding.confidence >= 0.78)
    .sort(
      (a, b) =>
        severityWeight(b.severity) - severityWeight(a.severity) ||
        b.confidence - a.confidence
    )
    .slice(0, 2);
}

export const rhythmRule: CocoRule = {
  evaluate: evaluateRhythm,
  id: "rhythm",
};

function evaluateRhythmGroup(snapshot: CocoCanvasSnapshot, group: RhythmGroup): CocoFinding[] {
  const nodes = nodesForGroup(snapshot, group);
  if (nodes.length < 2) return [];

  if (group.id === "utility" && !utilityPairIsRelated(snapshot, nodes)) return [];

  const gaps = measureGaps(nodes, group.axis);
  if (!gaps.length) return [];

  const averageFontSize = average(nodes.map((node) => Number(node.fontSize) || visualRect(node).height || 12));
  const minGap = averageFontSize * group.minGapRatio;
  const maxGap = averageFontSize * group.maxGapRatio;
  const crampedGap = gaps.find((gap) => gap.gap < minGap);
  const looseGap = gaps.find((gap) => gap.gap > maxGap && group.id !== "hero");

  if (crampedGap) {
    return [
      createRhythmFinding({
        confidence: 0.86,
        group,
        id: `rhythm:${group.id}:cramped`,
        intent: group.id === "hero" ? "rhythm_hero_stack_cramped" : "rhythm_info_stack_uneven",
        observation:
          group.id === "hero"
            ? "The headline stack feels cramped."
            : `The ${group.label} has a spacing pinch.`,
        recommendation: "Give the related type a cleaner interval so the stack breathes.",
        roleDeltas: {
          [crampedGap.after]: deltaForGap(snapshot, group.axis, minGap - crampedGap.gap),
        },
        targetRole: crampedGap.after,
        evidence: {
          gapPx: Number(crampedGap.gap.toFixed(2)),
          minGapPx: Number(minGap.toFixed(2)),
        },
      }),
    ];
  }

  if (looseGap) {
    return [
      createRhythmFinding({
        confidence: 0.84,
        group,
        id: `rhythm:${group.id}:loose`,
        intent: group.id === "utility" ? "rhythm_utility_spacing_uneven" : "rhythm_info_stack_uneven",
        observation: `The ${group.label} has a spacing break that feels too loose.`,
        recommendation: "Bring the related elements closer so the spacing feels intentional.",
        roleDeltas: {
          [looseGap.after]: deltaForGap(snapshot, group.axis, maxGap - looseGap.gap),
        },
        targetRole: looseGap.after,
        evidence: {
          gapPx: Number(looseGap.gap.toFixed(2)),
          maxGapPx: Number(maxGap.toFixed(2)),
        },
      }),
    ];
  }

  if (gaps.length < 2) return [];

  const pattern = bestRhythmPattern(gaps.map((gap) => gap.gap));
  const tolerance = Math.max(6, averageFontSize * (group.id === "hero" ? 0.5 : 0.38));
  if (pattern.error <= tolerance) return [];

  const roleDeltas = deltasForPattern(snapshot, group.axis, gaps, pattern.targetGaps);
  if (!Object.keys(roleDeltas).length) return [];

  return [
    createRhythmFinding({
      confidence: Math.min(0.92, 0.78 + pattern.error / Math.max(1, averageFontSize) * 0.1),
      group,
      id: `rhythm:${group.id}:uneven`,
      intent: group.id === "hero" ? "rhythm_hero_stack_cramped" : "rhythm_info_stack_uneven",
      observation: `The ${group.label} spacing feels uneven.`,
      recommendation: "Use a repeated spacing pattern so the layout feels designed, not accidental.",
      roleDeltas,
      targetRole: gaps[0].after,
      evidence: {
        gaps: gaps.map((gap) => Number(gap.gap.toFixed(2))),
        pattern: pattern.id,
        patternError: Number(pattern.error.toFixed(2)),
        targetGaps: pattern.targetGaps.map((gap) => Number(gap.toFixed(2))),
      },
    }),
  ];
}

function createRhythmFinding({
  confidence,
  evidence,
  group,
  id,
  intent,
  observation,
  recommendation,
  roleDeltas,
  targetRole,
}: {
  confidence: number;
  evidence: Record<string, unknown>;
  group: RhythmGroup;
  id: string;
  intent: string;
  observation: string;
  recommendation: string;
  roleDeltas: Partial<Record<CocoTextRole, RoleDelta>>;
  targetRole: CocoTextRole;
}): CocoFinding {
  return {
    actions: [
      {
        id: "fix-rhythm",
        label: "Clean rhythm",
        meta: {
          rhythmGroup: group.id,
          roleDeltas,
        },
        target: { role: targetRole, type: "text" },
      },
    ],
    confidence,
    evidence: {
      group: group.id,
      ...evidence,
    },
    id,
    intent,
    observation,
    principle: "rhythm",
    reason:
      "Rhythm comes from repeated spacing patterns. When related gaps drift without a pattern, the layout starts to feel accidental.",
    recommendation,
    ruleId: "rhythm",
    severity: "medium",
    target: { role: targetRole, type: "text" },
  };
}

function nodesForGroup(snapshot: CocoCanvasSnapshot, group: RhythmGroup) {
  const map = new Map<CocoTextRole, CocoCanvasTextNode>();
  for (const node of snapshot.textNodes) {
    if (!map.has(node.role)) map.set(node.role, node);
  }

  return group.roles
    .map((role) => map.get(role))
    .filter((node): node is CocoCanvasTextNode => Boolean(node))
    .sort((a, b) =>
      group.axis === "x"
        ? visualRect(a).left - visualRect(b).left
        : visualRect(a).top - visualRect(b).top
    );
}

function measureGaps(nodes: CocoCanvasTextNode[], axis: RhythmAxis): RhythmGap[] {
  const gaps: RhythmGap[] = [];
  for (let index = 1; index < nodes.length; index += 1) {
    const before = nodes[index - 1];
    const after = nodes[index];
    const beforeRect = visualRect(before);
    const afterRect = visualRect(after);
    gaps.push({
      after: after.role,
      before: before.role,
      gap: axis === "x" ? afterRect.left - beforeRect.right : afterRect.top - beforeRect.bottom,
    });
  }
  return gaps;
}

function bestRhythmPattern(gaps: number[]): RhythmPattern {
  const positive = gaps.map((gap) => Math.max(0, gap));
  const mean = average(positive);
  const equal = pattern("equal", positive, positive.map(() => mean));
  const tightBase = Math.max(4, Math.min(...positive.filter((gap) => gap > 0), mean || 8));
  const tight = pattern("tight", positive, positive.map(() => tightBase));
  const alternatingTargets = positive.map((_, index) => (index % 2 === 0 ? mean * 0.72 : mean * 1.28));
  const alternating = pattern("alternating", positive, alternatingTargets);
  const hierarchyTargets = positive.map((_, index) => mean * Math.max(0.55, 1.45 - index * 0.34));
  const hierarchy = pattern("hierarchy", positive, hierarchyTargets);

  return [equal, tight, alternating, hierarchy].sort((a, b) => a.error - b.error)[0];
}

function pattern(id: RhythmPattern["id"], gaps: number[], targetGaps: number[]): RhythmPattern {
  return {
    error: average(gaps.map((gap, index) => Math.abs(gap - targetGaps[index]))),
    gaps,
    id,
    targetGaps,
  };
}

function deltasForPattern(
  snapshot: CocoCanvasSnapshot,
  axis: RhythmAxis,
  gaps: RhythmGap[],
  targetGaps: number[]
): Partial<Record<CocoTextRole, RoleDelta>> {
  const deltas: Partial<Record<CocoTextRole, RoleDelta>> = {};
  let cumulativeAdjustment = 0;

  gaps.forEach((gap, index) => {
    const desired = targetGaps[index];
    const adjustment = desired - Math.max(0, gap.gap);
    cumulativeAdjustment += adjustment;
    if (Math.abs(cumulativeAdjustment) < 2) return;
    deltas[gap.after] = deltaForGap(snapshot, axis, cumulativeAdjustment);
  });

  return deltas;
}

function deltaForGap(snapshot: CocoCanvasSnapshot, axis: RhythmAxis, px: number): RoleDelta {
  const artboard = snapshot.artboardRect;
  if (!artboard) return axis === "x" ? { x: 0 } : { y: 0 };
  const value =
    axis === "x"
      ? clamp((px / Math.max(1, artboard.width)) * 100, -5, 5)
      : clamp((px / Math.max(1, artboard.height)) * 100, -5, 5);
  return axis === "x" ? { x: value } : { y: value };
}

function utilityPairIsRelated(snapshot: CocoCanvasSnapshot, nodes: CocoCanvasTextNode[]) {
  if (nodes.length !== 2 || !snapshot.artboardRect) return false;
  const [a, b] = nodes;
  const aRect = visualRect(a);
  const bRect = visualRect(b);
  const yDistance = Math.abs(centerY(aRect) - centerY(bRect));
  const xGap = bRect.left - aRect.right;
  return (
    yDistance < snapshot.artboardRect.height * 0.16 &&
    xGap > -Math.min(aRect.width, bRect.width) * 0.4 &&
    xGap < snapshot.artboardRect.width * 0.34
  );
}

function visualRect(node: CocoCanvasTextNode): CocoRect {
  return node.visualRect ?? node.rect;
}

function centerY(rect: CocoRect) {
  return rect.top + rect.height / 2;
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function severityWeight(severity: CocoFinding["severity"]) {
  switch (severity) {
    case "blocker":
      return 4;
    case "high":
      return 3;
    case "medium":
      return 2;
    case "low":
      return 1;
  }
}
