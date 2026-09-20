import type {
  CocoAction,
  CocoCanvasSnapshot,
  CocoCanvasTextNode,
  CocoFinding,
  CocoRect,
  CocoSolutionCandidate,
  CocoSolutionScore,
  CocoTextRole,
} from "./types";

type RoleDelta = {
  x?: number;
  y?: number;
};

type CandidateDraft = Omit<CocoSolutionCandidate, "score">;

const ROLE_PRIORITY: Record<CocoTextRole, number> = {
  date: 0.42,
  details: 0.7,
  details2: 0.58,
  headline: 1,
  headline2: 0.82,
  leftRail: 0.25,
  presenter: 0.32,
  price: 0.38,
  rightRail: 0.25,
  subtag: 0.68,
  venue: 0.5,
};

export function selectCocoSolution({
  finding,
  snapshot,
}: {
  finding: CocoFinding;
  snapshot: CocoCanvasSnapshot;
}): CocoSolutionCandidate | null {
  const candidates = buildSolutionCandidates(finding, snapshot);
  if (!candidates.length) return null;

  return candidates
    .map((candidate) => ({
      ...candidate,
      score: scoreSolution(candidate, finding, snapshot),
    }))
    .sort(
      (a, b) =>
        (b.score?.finalScore ?? 0) - (a.score?.finalScore ?? 0) ||
        (a.score?.disruption ?? 1) - (b.score?.disruption ?? 1) ||
        (a.score?.risk ?? 1) - (b.score?.risk ?? 1)
    )[0];
}

function buildSolutionCandidates(finding: CocoFinding, snapshot: CocoCanvasSnapshot): CandidateDraft[] {
  const candidates: CandidateDraft[] = [];
  for (const action of finding.actions ?? []) {
    candidates.push({
      action,
      explanation: "Use the direct fix from the detecting rule.",
      id: `direct:${action.id}`,
      predictedOutcome: "Improves the detected issue with the rule's suggested adjustment.",
      recommendation: finding.recommendation,
    });
  }

  if (finding.principle === "balance" || finding.intent.startsWith("balance_")) {
    candidates.push(...buildBalanceCandidates(finding, snapshot));
  }

  if (finding.principle === "alignment" || finding.intent.startsWith("alignment_")) {
    candidates.push(...buildScaledRoleDeltaCandidates(finding, 0.55, "alignment-small"));
  }

  if (finding.principle === "rhythm" || finding.intent.startsWith("rhythm_")) {
    candidates.push(...buildScaledRoleDeltaCandidates(finding, 0.72, "rhythm-small"));
  }

  return dedupeCandidates(candidates);
}

function buildBalanceCandidates(finding: CocoFinding, snapshot: CocoCanvasSnapshot): CandidateDraft[] {
  const offsetRatio = Number(finding.evidence?.offsetRatio);
  const direction = String(finding.evidence?.direction ?? finding.intent);
  const axis: "x" | "y" =
    finding.intent.includes("top") || finding.intent.includes("bottom") ? "y" : "x";
  const rawDirection =
    Number.isFinite(offsetRatio) && offsetRatio !== 0
      ? -Math.sign(offsetRatio)
      : direction.includes("left") || direction.includes("top")
        ? 1
        : -1;
  const magnitude = clamp(
    Number.isFinite(offsetRatio) ? Math.abs(offsetRatio) * 100 * (axis === "x" ? 0.38 : 0.3) : 2.4,
    1.25,
    axis === "x" ? 4.5 : 3.6
  );
  const roles = balanceMoveRoles(snapshot, axis);
  const candidates: CandidateDraft[] = roles.map((role) => {
    const roleDeltas = {
      [role]: axis === "x" ? { x: rawDirection * magnitude } : { y: rawDirection * magnitude },
    };
    return {
      action: {
        id: "fix-balance",
        label: "Balance it",
        meta: {
          balanceMetric: finding.intent,
          roleDeltas,
        },
        target: { role, type: "text" },
      } satisfies CocoAction,
      explanation: `Use the ${roleLabel(role)} as the counterweight instead of changing the whole design.`,
      id: `balance:${axis}:${role}`,
      predictedOutcome: `Moves the ${roleLabel(role)} just enough to counter the heavy side.`,
      recommendation: `Nudge the ${roleLabel(role)} slightly ${axis === "x" ? (rawDirection > 0 ? "right" : "left") : rawDirection > 0 ? "down" : "up"} to stabilize the composition without changing the look.`,
    };
  });

  if (finding.intent === "balance_utility_too_heavy") {
    for (const role of ["date", "price"] as CocoTextRole[]) {
      if (!snapshot.textNodes.some((node) => node.role === role)) continue;
      candidates.push({
        action: {
          id: "fix-balance",
          label: "Balance it",
          meta: {
            balanceMetric: finding.intent,
            sizeDeltas: { [role]: -3 },
          },
          target: { role, type: "text" },
        },
        explanation: `Reduce the ${roleLabel(role)} instead of moving the main composition.`,
        id: `balance:utility-size:${role}`,
        predictedOutcome: `Lowers utility weight while keeping the headline dominant.`,
        recommendation: `Lighten the ${roleLabel(role)} presence so the headline stays dominant.`,
      });
    }
  }

  return candidates;
}

function buildScaledRoleDeltaCandidates(
  finding: CocoFinding,
  scale: number,
  suffix: string
): CandidateDraft[] {
  const base = firstRoleDeltaAction(finding);
  if (!base) return [];
  const roleDeltas = scaleRoleDeltas(base.roleDeltas, scale);
  if (!Object.keys(roleDeltas).length) return [];

  return [
    {
      action: {
        ...base.action,
        meta: {
          ...(base.action.meta ?? {}),
          roleDeltas,
        },
      },
      explanation: "Try the smaller correction first to preserve the existing composition.",
      id: `${suffix}:${base.action.id}`,
      predictedOutcome: "Improves the issue with less movement than the direct fix.",
      recommendation: finding.recommendation,
    },
  ];
}

function scoreSolution(
  candidate: CandidateDraft,
  finding: CocoFinding,
  snapshot: CocoCanvasSnapshot
): CocoSolutionScore {
  const disruption = estimateDisruption(candidate.action, snapshot);
  const risk = estimateRisk(candidate.action, snapshot);
  const improvement = estimateImprovement(candidate.action, finding);
  const styleFit = estimateStyleFit(candidate.action, finding, disruption);
  const confidence = finding.confidence;
  const finalScore = clamp(
    improvement * 0.45 + styleFit * 0.18 + confidence * 0.18 - disruption * 0.12 - risk * 0.07,
    0,
    1
  );

  return {
    confidence,
    disruption,
    finalScore,
    improvement,
    risk,
    styleFit,
  };
}

function estimateImprovement(action: CocoAction, finding: CocoFinding) {
  if (action.id === "open-text-panel" || action.id === "open-subject-panel") return 0.32;
  if (action.id === "fix-readability" && finding.principle === "contrast") return 0.82;
  if (action.id === "fix-alignment" && finding.principle === "alignment") return 0.8;
  if (action.id === "fix-rhythm" && finding.principle === "rhythm") return 0.8;
  if (action.id === "fix-balance" && finding.principle === "balance") return 0.82;
  if (action.id === "fix-subject-placement") return 0.78;
  if (action.id === "make-nightlife-impact") return 0.84;
  if (action.id === "tighten-headline" || action.id === "rebalance-date") return 0.8;
  if (action.id === "fix-text-margin") return 0.75;
  return 0.64;
}

function estimateStyleFit(action: CocoAction, finding: CocoFinding, disruption: number) {
  let fit = 0.78;
  if (action.id === "make-nightlife-impact") fit = 0.9;
  if (action.id === "fix-balance" || action.id === "fix-alignment" || action.id === "fix-rhythm") {
    fit = 0.86 - disruption * 0.18;
  }
  if (finding.styleContext === "luxury-club" && disruption < 0.28) fit += 0.05;
  if (finding.severity === "blocker") fit += 0.04;
  return clamp(fit, 0, 1);
}

function estimateDisruption(action: CocoAction, snapshot: CocoCanvasSnapshot) {
  const roleDeltas = getRoleDeltas(action);
  const sizeDeltas = getNumberMap(action.meta?.sizeDeltas);
  const motion = Object.entries(roleDeltas).reduce((sum, [role, delta]) => {
    const priority = ROLE_PRIORITY[role as CocoTextRole] ?? 0.4;
    return sum + (Math.abs(Number(delta.x) || 0) + Math.abs(Number(delta.y) || 0)) * priority;
  }, 0);
  const sizing = Object.entries(sizeDeltas).reduce((sum, [role, delta]) => {
    const node = snapshot.textNodes.find((item) => item.role === role);
    const size = Math.max(8, Number(node?.fontSize) || 18);
    return sum + Math.abs(delta) / size;
  }, 0);
  const base =
    action.id === "fix-subject-placement"
      ? 0.55
      : action.id === "make-nightlife-impact"
        ? 0.38
        : action.id === "tighten-headline"
          ? 0.42
          : 0.1;
  return clamp(base + motion / 24 + sizing * 0.35, 0, 1);
}

function estimateRisk(action: CocoAction, snapshot: CocoCanvasSnapshot) {
  const moved = applyActionPrediction(snapshot, action);
  if (!moved.length) return action.id === "fix-subject-placement" ? 0.42 : 0.1;

  let risk = 0;
  const artboard = snapshot.artboardRect;
  if (artboard) {
    for (const node of moved) {
      const rect = node.visualRect ?? node.rect;
      const edge = Math.min(
        rect.left - artboard.left,
        artboard.right - rect.right,
        rect.top - artboard.top,
        artboard.bottom - rect.bottom
      );
      if (edge < Math.min(artboard.width, artboard.height) * 0.028) risk += 0.18;
    }
  }

  const subjectRect = snapshot.subjectIssue?.rect;
  if (subjectRect) {
    for (const node of moved) {
      const rect = node.visualRect ?? node.rect;
      const overlap = overlapRatio(rect, subjectRect);
      if (overlap > 0.04) risk += overlap * 0.75;
    }
  }

  return clamp(risk, 0, 1);
}

function applyActionPrediction(snapshot: CocoCanvasSnapshot, action: CocoAction): CocoCanvasTextNode[] {
  const roleDeltas = getRoleDeltas(action);
  const artboard = snapshot.artboardRect;
  if (!artboard || !Object.keys(roleDeltas).length) return [];

  const predicted: CocoCanvasTextNode[] = [];
  for (const node of snapshot.textNodes) {
    const delta = roleDeltas[node.role];
    if (!delta) continue;
    const dx = ((Number(delta.x) || 0) / 100) * artboard.width;
    const dy = ((Number(delta.y) || 0) / 100) * artboard.height;
    predicted.push({
      ...node,
      rect: moveRect(node.rect, dx, dy),
      visualRect: node.visualRect ? moveRect(node.visualRect, dx, dy) : null,
    });
  }
  return predicted;
}

function balanceMoveRoles(snapshot: CocoCanvasSnapshot, axis: "x" | "y"): CocoTextRole[] {
  const present = new Set(snapshot.textNodes.map((node) => node.role));
  const order: CocoTextRole[] =
    axis === "x"
      ? ["headline", "details", "details2", "headline2", "subtag", "venue", "date", "price"]
      : ["details", "details2", "headline", "headline2", "venue", "date", "price"];
  return order.filter((role) => present.has(role)).slice(0, 4);
}

function firstRoleDeltaAction(finding: CocoFinding):
  | {
      action: CocoAction;
      roleDeltas: Record<string, RoleDelta>;
    }
  | null {
  for (const action of finding.actions ?? []) {
    const roleDeltas = getRoleDeltas(action);
    if (Object.keys(roleDeltas).length) return { action, roleDeltas };
  }
  return null;
}

function getRoleDeltas(action: CocoAction): Record<string, RoleDelta> {
  const raw = action.meta?.roleDeltas;
  if (!raw || typeof raw !== "object") return {};
  const output: Record<string, RoleDelta> = {};
  for (const [role, delta] of Object.entries(raw as Record<string, unknown>)) {
    if (!delta || typeof delta !== "object") continue;
    const value = delta as Record<string, unknown>;
    const x = Number(value.x);
    const y = Number(value.y);
    output[role] = {
      ...(Number.isFinite(x) ? { x } : {}),
      ...(Number.isFinite(y) ? { y } : {}),
    };
  }
  return output;
}

function getNumberMap(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object") return {};
  const output: Record<string, number> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    const next = Number(raw);
    if (Number.isFinite(next)) output[key] = next;
  }
  return output;
}

function scaleRoleDeltas(roleDeltas: Record<string, RoleDelta>, scale: number) {
  const output: Record<string, RoleDelta> = {};
  for (const [role, delta] of Object.entries(roleDeltas)) {
    output[role] = {
      ...(typeof delta.x === "number" ? { x: delta.x * scale } : {}),
      ...(typeof delta.y === "number" ? { y: delta.y * scale } : {}),
    };
  }
  return output;
}

function moveRect(rect: CocoRect, dx: number, dy: number): CocoRect {
  return {
    bottom: rect.bottom + dy,
    height: rect.height,
    left: rect.left + dx,
    right: rect.right + dx,
    top: rect.top + dy,
    width: rect.width,
  };
}

function overlapRatio(a: CocoRect, b: CocoRect) {
  const left = Math.max(a.left, b.left);
  const right = Math.min(a.right, b.right);
  const top = Math.max(a.top, b.top);
  const bottom = Math.min(a.bottom, b.bottom);
  const width = Math.max(0, right - left);
  const height = Math.max(0, bottom - top);
  const area = width * height;
  return area / Math.max(1, a.width * a.height);
}

function dedupeCandidates(candidates: CandidateDraft[]) {
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    const key = `${candidate.action.id}:${candidate.action.target?.type ?? "none"}:${candidate.action.target?.type === "text" ? candidate.action.target.role : ""}:${JSON.stringify(candidate.action.meta ?? {})}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function roleLabel(role: CocoTextRole) {
  switch (role) {
    case "headline":
      return "headline";
    case "headline2":
      return "support headline";
    case "details":
      return "details";
    case "details2":
      return "extra details";
    case "venue":
      return "venue";
    case "date":
      return "date";
    case "price":
      return "price";
    case "subtag":
      return "tagline";
    default:
      return "text";
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
