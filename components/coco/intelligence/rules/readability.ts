import type {
  CocoCanvasSnapshot,
  CocoDesignPrinciple,
  CocoFinding,
  CocoReadabilityMetric,
  CocoReadabilityMetricId,
  CocoRule,
  CocoTextRole,
} from "../types";

export function evaluateReadability(snapshot: CocoCanvasSnapshot): CocoFinding[] {
  if (snapshot.userIsDragging) return [];

  const findings: CocoFinding[] = [];

  for (const node of snapshot.textNodes) {
    if (!node.readability || !isReadableRole(node.role)) continue;

    const readability = node.readability;
    const threshold = thresholdForRole(node.role);
    const weakest = readability.weakestMetric;
    if (readability.overallScore >= threshold || weakest.score >= weakestMetricThreshold(node.role)) {
      continue;
    }

    const severity = severityForScore(readability.overallScore, weakest.score, node.role);
    const confidence = Math.min(
      0.97,
      0.68 + Math.max(0, threshold - readability.overallScore) / 80 + Math.max(0, 78 - weakest.score) / 160
    );

    findings.push({
      actions: [
        {
          id: "fix-readability",
          label: "Fix readability",
          meta: {
            overallScore: readability.overallScore,
            weakestMetric: weakest.id,
            weakestScore: weakest.score,
          },
          target: { role: node.role, type: "text" },
        },
      ],
      confidence,
      evidence: {
        backgroundComplexity: readability.backgroundComplexity,
        contrastRatio: readability.contrastRatio,
        metrics: readability.metrics.map((metric) => ({
          id: metric.id,
          score: metric.score,
        })),
        overallScore: readability.overallScore,
        weakestMetric: weakest.id,
        weakestScore: weakest.score,
      },
      id: `readability:${node.role}:${weakest.id}`,
      intent: `readability_${weakest.id}`,
      observation: observationForMetric(node.role, weakest),
      principle: principleForMetric(weakest.id),
      reason:
        "Readability is not one pass or fail. It depends on contrast, size, effects, background activity, and margins working together.",
      recommendation: weakest.recommendation,
      ruleId: "readability",
      severity,
      target: { role: node.role, type: "text" },
    });
  }

  return findings
    .sort(
      (a, b) =>
        severityWeight(b.severity) - severityWeight(a.severity) ||
        b.confidence - a.confidence ||
        Number(a.evidence?.overallScore ?? 100) - Number(b.evidence?.overallScore ?? 100)
    )
    .slice(0, 3);
}

export const readabilityRule: CocoRule = {
  evaluate: evaluateReadability,
  id: "readability",
};

const READABILITY_ROLE_LABELS: Record<CocoTextRole, string> = {
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

function isReadableRole(role: CocoTextRole) {
  return role !== "leftRail" && role !== "rightRail";
}

function thresholdForRole(role: CocoTextRole) {
  switch (role) {
    case "headline":
      return 76;
    case "headline2":
    case "details":
    case "date":
    case "price":
      return 72;
    case "details2":
    case "venue":
    case "subtag":
      return 68;
    default:
      return 64;
  }
}

function weakestMetricThreshold(role: CocoTextRole) {
  return role === "headline" || role === "headline2" ? 70 : 64;
}

function severityForScore(
  overallScore: number,
  weakestScore: number,
  role: CocoTextRole
): CocoFinding["severity"] {
  if ((role === "headline" || role === "headline2") && (overallScore < 58 || weakestScore < 48)) {
    return "high";
  }
  if (overallScore < 54 || weakestScore < 42) return "high";
  return "medium";
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

function principleForMetric(metric: CocoReadabilityMetricId): CocoDesignPrinciple {
  switch (metric) {
    case "text_size":
      return "scale";
    case "edge_distance":
      return "negative-space";
    case "background_complexity":
      return "dominance";
    case "glow_interference":
    case "shadow_effectiveness":
    case "stroke_effectiveness":
      return "consistency";
    case "contrast":
    default:
      return "contrast";
  }
}

function observationForMetric(role: CocoTextRole, metric: CocoReadabilityMetric) {
  const label = READABILITY_ROLE_LABELS[role] ?? "text";
  if (metric.observation) return metric.observation.replace(/^This text/i, `The ${label}`);
  return `The ${label} readability is being held back by ${metric.label.toLowerCase()}.`;
}
