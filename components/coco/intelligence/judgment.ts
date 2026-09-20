import type {
  CocoCanvasSnapshot,
  CocoFinding,
  CocoFindingSeverity,
  CocoJudgment,
  CocoMemorySnapshot,
  CocoTextRole,
} from "./types";
import { isCocoFindingSuppressed } from "./memory";
import { selectCocoSolution } from "./solutionScoring";

const SEVERITY_SCORE: Record<CocoFindingSeverity, number> = {
  blocker: 4,
  high: 3,
  medium: 2,
  low: 1,
};

const TARGET_SCORE: Record<CocoTextRole, number> = {
  headline: 10,
  headline2: 8,
  subtag: 7,
  date: 6,
  venue: 6,
  details: 4,
  details2: 3,
  presenter: 3,
  price: 3,
  leftRail: 2,
  rightRail: 2,
};

function confidenceThreshold(snapshot: CocoCanvasSnapshot) {
  if (snapshot.phase === "export" || snapshot.phase === "polish") return 0.78;
  if (snapshot.phase === "arrival" || snapshot.phase === "post-change") return 0.84;
  return 0.86;
}

function targetScore(finding: CocoFinding) {
  if (finding.target.type === "subject") return 9;
  if (finding.target.type === "text") return TARGET_SCORE[finding.target.role] ?? 1;
  if (finding.target.type === "canvas") return 5;
  return 3;
}

function sortFindings(a: CocoFinding, b: CocoFinding) {
  return (
    SEVERITY_SCORE[b.severity] - SEVERITY_SCORE[a.severity] ||
    b.confidence - a.confidence ||
    targetScore(b) - targetScore(a)
  );
}

export function selectCocoJudgment({
  findings,
  memory,
  snapshot,
}: {
  findings: CocoFinding[];
  memory: CocoMemorySnapshot;
  snapshot: CocoCanvasSnapshot;
}): CocoJudgment {
  if (snapshot.userIsDragging) {
    return {
      actions: [],
      confidence: 0,
      finding: null,
      intent: null,
      mode: "quiet",
      selectedSolution: null,
      severity: null,
      target: null,
    };
  }

  const threshold = confidenceThreshold(snapshot);
  const finding =
    findings
      .filter((item) => item.confidence >= threshold)
      .filter((item) => !isCocoFindingSuppressed(item, memory))
      .sort(sortFindings)[0] ?? null;

  if (!finding) {
    return {
      actions: [],
      confidence: 0,
      finding: null,
      intent: null,
      mode: "quiet",
      selectedSolution: null,
      severity: null,
      target: null,
    };
  }

  const selectedSolution = selectCocoSolution({ finding, snapshot });
  const judgedFinding: CocoFinding = selectedSolution
    ? {
        ...finding,
        evidence: {
          ...(finding.evidence ?? {}),
          selectedSolution: {
            disruption: selectedSolution.score?.disruption,
            finalScore: selectedSolution.score?.finalScore,
            id: selectedSolution.id,
            improvement: selectedSolution.score?.improvement,
            predictedOutcome: selectedSolution.predictedOutcome,
            risk: selectedSolution.score?.risk,
          },
        },
        recommendation: selectedSolution.recommendation,
      }
    : finding;

  return {
    actions: selectedSolution ? [selectedSolution.action] : finding.actions ?? [],
    confidence: judgedFinding.confidence,
    finding: judgedFinding,
    intent: judgedFinding.intent,
    mode: judgedFinding.severity === "blocker" || judgedFinding.severity === "high" ? "director" : "nudge",
    selectedSolution,
    severity: judgedFinding.severity,
    target: judgedFinding.target,
  };
}
