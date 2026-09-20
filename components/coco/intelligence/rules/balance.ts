import type {
  CocoCanvasSnapshot,
  CocoFinding,
  CocoRect,
  CocoRule,
  CocoTextRole,
} from "../types";

type BalanceElementKind = "accent" | "details" | "headline" | "subject" | "utility";

type BalanceElement = {
  centerX: number;
  centerY: number;
  kind: BalanceElementKind;
  rect: CocoRect;
  role: CocoTextRole | "subject";
  weight: number;
};

type RoleDelta = {
  x?: number;
  y?: number;
};

const TEXT_BASE_WEIGHT: Record<CocoTextRole, number> = {
  date: 9,
  details: 8,
  details2: 6,
  headline: 24,
  headline2: 12,
  leftRail: 3,
  presenter: 5,
  price: 8,
  rightRail: 3,
  subtag: 8,
  venue: 6,
};

const TEXT_BASE_SIZE: Record<CocoTextRole, number> = {
  date: 28,
  details: 18,
  details2: 14,
  headline: 88,
  headline2: 36,
  leftRail: 10,
  presenter: 12,
  price: 24,
  rightRail: 10,
  subtag: 18,
  venue: 14,
};

const ROLE_KIND: Record<CocoTextRole, BalanceElementKind> = {
  date: "utility",
  details: "details",
  details2: "details",
  headline: "headline",
  headline2: "accent",
  leftRail: "accent",
  presenter: "accent",
  price: "utility",
  rightRail: "accent",
  subtag: "accent",
  venue: "details",
};

export function evaluateBalance(snapshot: CocoCanvasSnapshot): CocoFinding[] {
  if (snapshot.userIsDragging || !snapshot.artboardRect) return [];

  const elements = buildBalanceElements(snapshot);
  if (elements.length < 2) return [];

  const findings = [
    evaluateMassBalance(snapshot, elements, "x"),
    evaluateMassBalance(snapshot, elements, "y"),
    evaluateUtilityWeight(snapshot, elements),
  ].filter((finding): finding is CocoFinding => Boolean(finding));

  return findings
    .filter((finding) => finding.confidence >= 0.78)
    .sort(
      (a, b) =>
        severityWeight(b.severity) - severityWeight(a.severity) ||
        b.confidence - a.confidence
    )
    .slice(0, 2);
}

export const balanceRule: CocoRule = {
  evaluate: evaluateBalance,
  id: "balance",
};

function buildBalanceElements(snapshot: CocoCanvasSnapshot): BalanceElement[] {
  const artboard = snapshot.artboardRect;
  if (!artboard) return [];
  const area = Math.max(1, artboard.width * artboard.height);
  const elements: BalanceElement[] = [];

  if (snapshot.subjectIssue?.rect) {
    const rect = snapshot.subjectIssue.rect;
    const subjectAreaRatio = Math.max(0, (rect.width * rect.height) / area);
    elements.push({
      centerX: rect.left + rect.width / 2,
      centerY: rect.top + rect.height / 2,
      kind: "subject",
      rect,
      role: "subject",
      weight: clamp(18 + Math.sqrt(subjectAreaRatio) * 42, 24, 48),
    });
  }

  for (const node of snapshot.textNodes) {
    const rect = node.visualRect ?? node.rect;
    const nodeAreaRatio = Math.max(0, (rect.width * rect.height) / area);
    const baseWeight = TEXT_BASE_WEIGHT[node.role] ?? 4;
    const baseSize = TEXT_BASE_SIZE[node.role] ?? 16;
    const fontSize = Math.max(1, Number(node.fontSize) || rect.height || baseSize);
    const sizeFactor = clamp(fontSize / baseSize, 0.62, 1.65);
    const areaFactor = clamp(0.76 + Math.sqrt(nodeAreaRatio) * 1.9, 0.76, 1.55);
    const contrastMetric = node.readability?.metrics.find((metric) => metric.id === "contrast");
    const contrastFactor = contrastMetric ? clamp(0.72 + contrastMetric.score / 180, 0.72, 1.22) : 1;
    const effectFactor = clamp(
      1 +
        Math.max(0, Number(node.strokeWidth) || 0) * 0.035 +
        (node.textShadow ? 0.08 : 0),
      1,
      1.18
    );

    elements.push({
      centerX: node.opticalCenter?.x ?? rect.left + rect.width / 2,
      centerY: node.opticalCenter?.y ?? rect.top + rect.height / 2,
      kind: ROLE_KIND[node.role] ?? "details",
      rect,
      role: node.role,
      weight: clamp(baseWeight * sizeFactor * areaFactor * contrastFactor * effectFactor, 1.5, 32),
    });
  }

  return elements;
}

function evaluateMassBalance(
  snapshot: CocoCanvasSnapshot,
  elements: BalanceElement[],
  axis: "x" | "y"
): CocoFinding | null {
  const artboard = snapshot.artboardRect;
  if (!artboard) return null;

  const totalWeight = elements.reduce((sum, element) => sum + element.weight, 0);
  if (totalWeight <= 0) return null;

  const centerOfMass =
    elements.reduce(
      (sum, element) => sum + (axis === "x" ? element.centerX : element.centerY) * element.weight,
      0
    ) / totalWeight;
  const canvasCenter =
    axis === "x" ? artboard.left + artboard.width / 2 : artboard.top + artboard.height / 2;
  const size = axis === "x" ? artboard.width : artboard.height;
  const offsetPx = centerOfMass - canvasCenter;
  const offsetRatio = offsetPx / Math.max(1, size);
  const threshold = axis === "x" ? 0.105 : 0.13;
  if (Math.abs(offsetRatio) < threshold) return null;

  const movingRole = chooseCounterweightRole(elements, axis);
  if (!movingRole) return null;

  const roleDeltas: Partial<Record<CocoTextRole, RoleDelta>> = {
    [movingRole]: axis === "x" ? { x: clamp((-offsetRatio * 100) / 2.6, -5, 5) } : { y: clamp((-offsetRatio * 100) / 3, -4, 4) },
  };
  const direction =
    axis === "x"
      ? offsetPx < 0
        ? "left-heavy"
        : "right-heavy"
      : offsetPx < 0
        ? "top-heavy"
        : "bottom-heavy";
  const recommendationDirection =
    axis === "x"
      ? offsetPx < 0
        ? "right"
        : "left"
      : offsetPx < 0
        ? "down"
        : "up";
  const intent =
    axis === "x"
      ? offsetPx < 0
        ? "balance_left_heavy"
        : "balance_right_heavy"
      : offsetPx < 0
        ? "balance_top_heavy"
        : "balance_bottom_heavy";

  return createBalanceFinding({
    confidence: clamp(0.78 + (Math.abs(offsetRatio) - threshold) * 1.7, 0.78, 0.93),
    evidence: {
      centerOfMass: Number(centerOfMass.toFixed(2)),
      direction,
      offsetPx: Number(offsetPx.toFixed(2)),
      offsetRatio: Number(offsetRatio.toFixed(3)),
      weights: summarizeWeights(elements),
    },
    id: `balance:${direction}`,
    intent,
    observation: `The flyer feels ${direction}.`,
    recommendation: `Nudge the ${roleLabel(movingRole)} slightly ${recommendationDirection} to create a more stable composition.`,
    roleDeltas,
    targetRole: movingRole,
  });
}

function evaluateUtilityWeight(
  snapshot: CocoCanvasSnapshot,
  elements: BalanceElement[]
): CocoFinding | null {
  const headlineWeight = sumKind(elements, "headline") + sumRole(elements, "headline2") * 0.55;
  const utilityWeight = sumKind(elements, "utility");
  if (headlineWeight <= 0 || utilityWeight < headlineWeight * 0.72 || utilityWeight < 14) return null;

  const date = elements.find((element) => element.role === "date");
  const price = elements.find((element) => element.role === "price");
  const movingRole = date && (!price || date.weight >= price.weight) ? "date" : price ? "price" : null;
  if (!movingRole) return null;

  const artboard = snapshot.artboardRect;
  const centerX = artboard ? artboard.left + artboard.width / 2 : 0;
  const utility = elements.find((element) => element.role === movingRole);
  const deltaX =
    artboard && utility
      ? clamp(((centerX - utility.centerX) / artboard.width) * 100 * 0.18, -2.5, 2.5)
      : 0;

  return createBalanceFinding({
    confidence: 0.84,
    evidence: {
      headlineWeight: Number(headlineWeight.toFixed(2)),
      utilityWeight: Number(utilityWeight.toFixed(2)),
      weights: summarizeWeights(elements),
    },
    id: "balance:utility-too-heavy",
    intent: "balance_utility_too_heavy",
    observation: "The utility information is carrying too much visual weight for its role.",
    recommendation: `Lighten the ${roleLabel(movingRole)} presence so the headline stays dominant.`,
    roleDeltas: Math.abs(deltaX) > 0.1 ? { [movingRole]: { x: deltaX } } : undefined,
    sizeDeltas: { [movingRole]: -3 },
    targetRole: movingRole,
  });
}

function createBalanceFinding({
  confidence,
  evidence,
  id,
  intent,
  observation,
  recommendation,
  roleDeltas,
  sizeDeltas,
  targetRole,
}: {
  confidence: number;
  evidence: Record<string, unknown>;
  id: string;
  intent: string;
  observation: string;
  recommendation: string;
  roleDeltas?: Partial<Record<CocoTextRole, RoleDelta>>;
  sizeDeltas?: Partial<Record<CocoTextRole, number>>;
  targetRole: CocoTextRole;
}): CocoFinding {
  return {
    actions: [
      {
        id: "fix-balance",
        label: "Balance it",
        meta: {
          balanceMetric: intent,
          roleDeltas,
          sizeDeltas,
        },
        target: { role: targetRole, type: "text" },
      },
    ],
    confidence,
    evidence,
    id,
    intent,
    observation,
    principle: "balance",
    reason:
      "A flyer can be aligned and still feel unstable. Balance looks at where the visual weight is actually pulling the composition.",
    recommendation,
    ruleId: "balance",
    severity: "medium",
    target: { role: targetRole, type: "text" },
  };
}

function chooseCounterweightRole(
  elements: BalanceElement[],
  axis: "x" | "y"
): CocoTextRole | null {
  const textElements = elements
    .filter((element): element is BalanceElement & { role: CocoTextRole } => element.role !== "subject")
    .filter((element) => !["leftRail", "rightRail", "presenter"].includes(element.role));
  const preferredRoles: CocoTextRole[] =
    axis === "x"
      ? ["headline", "details", "details2", "headline2", "subtag", "venue", "date", "price"]
      : ["details", "details2", "headline", "headline2", "venue", "date", "price"];

  for (const role of preferredRoles) {
    if (textElements.some((element) => element.role === role)) return role;
  }
  return textElements[0]?.role ?? null;
}

function summarizeWeights(elements: BalanceElement[]) {
  return {
    accent: Number(sumKind(elements, "accent").toFixed(2)),
    details: Number(sumKind(elements, "details").toFixed(2)),
    headline: Number(sumKind(elements, "headline").toFixed(2)),
    subject: Number(sumKind(elements, "subject").toFixed(2)),
    utility: Number(sumKind(elements, "utility").toFixed(2)),
  };
}

function sumKind(elements: BalanceElement[], kind: BalanceElementKind) {
  return elements
    .filter((element) => element.kind === kind)
    .reduce((sum, element) => sum + element.weight, 0);
}

function sumRole(elements: BalanceElement[], role: CocoTextRole | "subject") {
  return elements
    .filter((element) => element.role === role)
    .reduce((sum, element) => sum + element.weight, 0);
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
