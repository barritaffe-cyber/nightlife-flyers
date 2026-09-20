import type {
  CocoAlignmentMetricId,
  CocoCanvasSnapshot,
  CocoCanvasTextNode,
  CocoFinding,
  CocoRect,
  CocoRule,
  CocoTextRole,
} from "../types";

export function evaluateAlignment(snapshot: CocoCanvasSnapshot): CocoFinding[] {
  if (snapshot.userIsDragging || !snapshot.artboardRect) return [];

  const candidates = [
    ...evaluateOpticalCenter(snapshot),
    ...evaluateGroupAlignment(snapshot),
    ...evaluateInformationGrouping(snapshot),
    ...evaluateBaselineConsistency(snapshot),
    ...evaluateSubjectBalance(snapshot),
  ];

  return candidates
    .filter((finding) => finding.confidence >= 0.76)
    .sort(
      (a, b) =>
        severityWeight(b.severity) - severityWeight(a.severity) ||
        b.confidence - a.confidence ||
        targetWeight(b.target.type === "text" ? b.target.role : null) -
          targetWeight(a.target.type === "text" ? a.target.role : null)
    )
    .slice(0, 3);
}

export const alignmentRule: CocoRule = {
  evaluate: evaluateAlignment,
  id: "alignment",
};

type RoleDelta = {
  x?: number;
  y?: number;
};

type AlignmentIssueInput = {
  confidence: number;
  evidence?: Record<string, unknown>;
  id: string;
  intent: string;
  metric: CocoAlignmentMetricId;
  observation: string;
  recommendation: string;
  roleDeltas?: Partial<Record<CocoTextRole, RoleDelta>>;
  roles: CocoTextRole[];
  severity?: CocoFinding["severity"];
  targetRole: CocoTextRole;
};

type AlignmentMode = "center" | "left" | "right";

const ROLE_LABELS: Record<CocoTextRole, string> = {
  date: "date",
  details: "details",
  details2: "extra details",
  headline: "headline",
  headline2: "support headline",
  leftRail: "left rail",
  presenter: "presenter",
  price: "price",
  rightRail: "right rail",
  subtag: "tagline",
  venue: "venue",
};

const GROUPS: Array<{
  id: string;
  label: string;
  roles: CocoTextRole[];
}> = [
  { id: "information", label: "information stack", roles: ["details", "details2"] },
];

function createAlignmentFinding(input: AlignmentIssueInput): CocoFinding {
  return {
    actions: [
      {
        id: "fix-alignment",
        label: "Fix alignment",
        meta: {
          alignmentMetric: input.metric,
          roleDeltas: input.roleDeltas,
          roles: input.roles,
        },
        target: { role: input.targetRole, type: "text" },
      },
    ],
    confidence: Math.max(0, Math.min(0.98, input.confidence)),
    evidence: {
      alignmentMetric: input.metric,
      roles: input.roles,
      ...(input.evidence ?? {}),
    },
    id: input.id,
    intent: input.intent,
    observation: input.observation,
    principle: "alignment",
    reason:
      "Premium alignment is optical. Related information should share a clear visual logic, not just similar coordinates.",
    recommendation: input.recommendation,
    ruleId: "alignment",
    severity: input.severity ?? "medium",
    target: { role: input.targetRole, type: "text" },
  };
}

function visualRect(node: CocoCanvasTextNode): CocoRect {
  return node.visualRect ?? node.rect;
}

function centerX(node: CocoCanvasTextNode) {
  const rect = visualRect(node);
  return rect.left + rect.width / 2;
}

function centerY(node: CocoCanvasTextNode) {
  const rect = visualRect(node);
  return rect.top + rect.height / 2;
}

function lineFor(node: CocoCanvasTextNode, mode: AlignmentMode) {
  const rect = visualRect(node);
  if (mode === "left") return rect.left;
  if (mode === "right") return rect.right;
  return centerX(node);
}

function spread(values: number[]) {
  if (!values.length) return 0;
  return Math.max(...values) - Math.min(...values);
}

function scoreFromError(error: number, tolerance: number) {
  return Math.round(Math.max(0, Math.min(100, 100 - (error / Math.max(1, tolerance)) * 100)));
}

function roleMap(snapshot: CocoCanvasSnapshot) {
  const map = new Map<CocoTextRole, CocoCanvasTextNode>();
  for (const node of snapshot.textNodes) {
    if (!map.has(node.role)) map.set(node.role, node);
  }
  return map;
}

function pctX(snapshot: CocoCanvasSnapshot, px: number) {
  return snapshot.artboardRect ? (px / snapshot.artboardRect.width) * 100 : 0;
}

function pctY(snapshot: CocoCanvasSnapshot, px: number) {
  return snapshot.artboardRect ? (px / snapshot.artboardRect.height) * 100 : 0;
}

function targetWeight(role: CocoTextRole | null) {
  switch (role) {
    case "headline":
      return 10;
    case "headline2":
      return 8;
    case "subtag":
      return 7;
    case "details":
      return 6;
    case "details2":
      return 5;
    case "venue":
      return 5;
    case "date":
      return 4;
    case "price":
      return 3;
    default:
      return 1;
  }
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

function evaluateOpticalCenter(snapshot: CocoCanvasSnapshot): CocoFinding[] {
  const artboard = snapshot.artboardRect;
  if (!artboard) return [];
  const roles: CocoTextRole[] = ["headline", "headline2", "presenter"];
  const findings: CocoFinding[] = [];
  const map = roleMap(snapshot);

  for (const role of roles) {
    const node = map.get(role);
    if (!node?.opticalCenter) continue;
    const align = String(node.textAlign || "").toLowerCase();
    if (role !== "headline" && align !== "center") continue;

    const intendedCenter = node.rect.left + node.rect.width / 2;
    const offset = node.opticalCenter.x - intendedCenter;
    const tolerance = Math.max(8, artboard.width * (role === "headline" ? 0.018 : 0.014));
    const score = scoreFromError(Math.abs(offset), tolerance);
    if (score >= 74) continue;

    const delta = pctX(snapshot, -offset);
    findings.push(
      createAlignmentFinding({
        confidence: Math.min(0.94, 0.78 + Math.abs(offset) / Math.max(1, artboard.width) * 2.4),
        evidence: {
          offsetPx: Number(offset.toFixed(2)),
          score,
        },
        id: `alignment:${role}:optical-center`,
        intent: "alignment_optical_center",
        metric: "optical_center",
        observation: `The ${ROLE_LABELS[role]} is mathematically placed, but its visual weight feels slightly off-center.`,
        recommendation:
          Math.abs(delta) < 0.2
            ? "Make a small optical correction so the type feels centered."
            : `Shift it ${delta > 0 ? "right" : "left"} slightly so it feels centered, not just measured centered.`,
        roleDeltas: { [role]: { x: delta } },
        roles: [role],
        targetRole: role,
      })
    );
  }

  return findings;
}

function bestAlignmentMode(nodes: CocoCanvasTextNode[], artboard: CocoRect) {
  const modes: AlignmentMode[] = ["left", "center", "right"];
  return modes
    .map((mode) => {
      const values = nodes.map((node) => lineFor(node, mode));
      const error = spread(values);
      const tolerance = artboard.width * (mode === "center" ? 0.028 : 0.022);
      return {
        error,
        mode,
        score: scoreFromError(error, tolerance),
      };
    })
    .sort((a, b) => b.score - a.score)[0];
}

function evaluateGroupAlignment(snapshot: CocoCanvasSnapshot): CocoFinding[] {
  const artboard = snapshot.artboardRect;
  if (!artboard) return [];
  const map = roleMap(snapshot);
  const findings: CocoFinding[] = [];

  for (const group of GROUPS) {
    const nodes = group.roles.map((role) => map.get(role)).filter(Boolean) as CocoCanvasTextNode[];
    if (nodes.length < 2) continue;

    const best = bestAlignmentMode(nodes, artboard);
    if (!best || best.score >= 72 || best.error < 10) continue;

    const anchor = [...nodes].sort((a, b) => targetWeight(b.role) - targetWeight(a.role))[0];
    const anchorLine = lineFor(anchor, best.mode);
    const roleDeltas: Partial<Record<CocoTextRole, RoleDelta>> = {};

    for (const node of nodes) {
      if (node.role === anchor.role) continue;
      const delta = pctX(snapshot, anchorLine - lineFor(node, best.mode));
      if (Math.abs(delta) >= 0.12) roleDeltas[node.role] = { x: delta };
    }

    if (!Object.keys(roleDeltas).length) continue;

    findings.push(
      createAlignmentFinding({
        confidence: Math.min(0.94, 0.77 + best.error / Math.max(1, artboard.width) * 2.2),
        evidence: {
          mode: best.mode,
          score: best.score,
          spreadPx: Number(best.error.toFixed(2)),
        },
        id: `alignment:${group.id}:group`,
        intent: "alignment_group_alignment",
        metric: "group_alignment",
        observation: `The ${group.label} does not share a clear ${best.mode} alignment yet.`,
        recommendation: "Give the related text one visual alignment logic so it reads as a designed system.",
        roleDeltas,
        roles: nodes.map((node) => node.role),
        targetRole: anchor.role,
      })
    );
  }

  return findings;
}

function evaluateInformationGrouping(snapshot: CocoCanvasSnapshot): CocoFinding[] {
  const artboard = snapshot.artboardRect;
  if (!artboard) return [];
  const map = roleMap(snapshot);
  const orderedRoles: CocoTextRole[] = ["details", "details2"];
  const orderedNodes = orderedRoles.map((role) => map.get(role)).filter(Boolean) as CocoCanvasTextNode[];
  if (orderedNodes.length < 2) return [];

  const minGap = Math.max(6, artboard.height * 0.01);
  const maxGap = Math.max(26, artboard.height * 0.075);
  const roleDeltas: Partial<Record<CocoTextRole, RoleDelta>> = {};
  const issues: string[] = [];

  for (let index = 1; index < orderedNodes.length; index += 1) {
    const prev = visualRect(orderedNodes[index - 1]);
    const currentNode = orderedNodes[index];
    const current = visualRect(currentNode);
    const gap = current.top - prev.bottom;
    if (gap < minGap) {
      const delta = pctY(snapshot, minGap - gap);
      roleDeltas[currentNode.role] = { ...(roleDeltas[currentNode.role] ?? {}), y: delta };
      issues.push(`${orderedNodes[index - 1].role}:${currentNode.role}:tight`);
    } else if (gap > maxGap) {
      const delta = pctY(snapshot, maxGap - gap);
      roleDeltas[currentNode.role] = { ...(roleDeltas[currentNode.role] ?? {}), y: delta };
      issues.push(`${orderedNodes[index - 1].role}:${currentNode.role}:loose`);
    }
  }

  if (!Object.keys(roleDeltas).length) return [];

  const strongest = orderedNodes[0];
  return [
    createAlignmentFinding({
      confidence: 0.88,
      evidence: {
        issues,
      },
      id: "alignment:information:grouping",
      intent: "alignment_information_grouping",
      metric: "information_grouping",
      observation: "The supporting information is not grouping like one intentional stack.",
      recommendation: "Keep the two detail blocks connected with cleaner vertical spacing.",
      roleDeltas,
      roles: orderedNodes.map((node) => node.role),
      targetRole: strongest.role,
    }),
  ];
}

function evaluateBaselineConsistency(snapshot: CocoCanvasSnapshot): CocoFinding[] {
  const artboard = snapshot.artboardRect;
  if (!artboard) return [];
  const map = roleMap(snapshot);
  const pairs: Array<[CocoTextRole, CocoTextRole, string]> = [
    ["date", "price", "date and price"],
  ];
  const findings: CocoFinding[] = [];

  for (const [leftRole, rightRole, label] of pairs) {
    const first = map.get(leftRole);
    const second = map.get(rightRole);
    if (!first || !second) continue;
    const yError = Math.abs(centerY(first) - centerY(second));
    const tolerance = Math.max(10, artboard.height * 0.035);
    const score = scoreFromError(yError, tolerance);
    if (score >= 64) continue;

    const anchor = targetWeight(first.role) >= targetWeight(second.role) ? first : second;
    const moving = anchor.role === first.role ? second : first;
    const roleDeltas: Partial<Record<CocoTextRole, RoleDelta>> = {
      [moving.role]: { y: pctY(snapshot, centerY(anchor) - centerY(moving)) },
    };

    findings.push(
      createAlignmentFinding({
        confidence: Math.min(0.91, 0.76 + yError / Math.max(1, artboard.height) * 2),
        evidence: {
          score,
          yErrorPx: Number(yError.toFixed(2)),
        },
        id: `alignment:${leftRole}-${rightRole}:baseline`,
        intent: "alignment_baseline_consistency",
        metric: "baseline_consistency",
        observation: `The ${label} do not sit on a consistent visual line.`,
        recommendation: "Bring the pair onto a cleaner shared axis.",
        roleDeltas,
        roles: [leftRole, rightRole],
        targetRole: anchor.role,
      })
    );
  }

  return findings;
}

function evaluateSubjectBalance(snapshot: CocoCanvasSnapshot): CocoFinding[] {
  const artboard = snapshot.artboardRect;
  const subjectRect = snapshot.subjectIssue?.rect;
  if (!artboard || !subjectRect) return [];
  const map = roleMap(snapshot);
  const headline = map.get("headline");
  if (!headline) return [];

  const subjectCenter = subjectRect.left + subjectRect.width / 2;
  const headlineCenter = headline.opticalCenter?.x ?? centerX(headline);
  const weightedCenter = (subjectCenter * 0.62 + headlineCenter * 0.38) / 1;
  const targetCenter = artboard.left + artboard.width / 2;
  const offset = weightedCenter - targetCenter;
  const tolerance = artboard.width * 0.12;
  const score = scoreFromError(Math.abs(offset), tolerance);
  if (score >= 62) return [];

  const moveHeadline = pctX(snapshot, -offset * 0.35);
  return [
    createAlignmentFinding({
      confidence: Math.min(0.9, 0.76 + Math.abs(offset) / Math.max(1, artboard.width) * 1.5),
      evidence: {
        offsetPx: Number(offset.toFixed(2)),
        score,
      },
      id: "alignment:subject-balance",
      intent: "alignment_subject_balance",
      metric: "subject_balance",
      observation: "The subject and headline are pulling visual weight to the same side.",
      recommendation: `Nudge the headline ${moveHeadline > 0 ? "right" : "left"} so the composition feels balanced.`,
      roleDeltas: { headline: { x: moveHeadline } },
      roles: ["headline"],
      targetRole: "headline",
    }),
  ];
}
