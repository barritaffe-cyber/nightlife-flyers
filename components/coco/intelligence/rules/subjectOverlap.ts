import type { CocoCanvasSnapshot, CocoFinding, CocoRule } from "../types";

export function evaluateSubjectOverlap(snapshot: CocoCanvasSnapshot): CocoFinding[] {
  const issue = snapshot.subjectIssue;
  if (!snapshot.hasSubject || !issue?.type || issue.type === "hero-combo") return [];

  if (issue.type === "text-overlap") {
    const overlapRole = issue.overlapRole;
    const confidence = Math.min(0.98, 0.86 + Math.max(0, issue.overlapRatio ?? 0) * 0.18);
    return [
      {
        actions: [{ id: "fix-subject-placement", label: "Fix subject", target: { type: "subject" } }],
        confidence,
        evidence: {
          overlapRatio: issue.overlapRatio ?? null,
          overlapRole: overlapRole ?? null,
          suggestion: issue.suggestion ?? null,
        },
        id: `subject-overlap:${overlapRole ?? "text"}`,
        intent: overlapRole === "headline" ? "subject_covers_headline" : "subject_covers_text",
        observation:
          overlapRole === "headline"
            ? "The subject is competing with the headline."
            : "The subject is crowding important information.",
        principle: overlapRole === "headline" ? "dominance" : "proximity",
        reason:
          overlapRole === "headline"
            ? "The hero image and event name both need to read without fighting each other."
            : "Important text should stay clear enough to read instantly on a phone.",
        recommendation: issue.suggestion ?? "Move the subject or text just enough to create separation.",
        ruleId: "subject-overlap",
        severity: overlapRole === "headline" ? "high" : "medium",
        target: { type: "subject" },
      },
    ];
  }

  if (issue.type === "off-canvas") {
    return [
      {
        actions: [{ id: "fix-subject-placement", label: "Fix subject", target: { type: "subject" } }],
        confidence: 0.96,
        id: "subject-overlap:off-canvas",
        intent: "subject_off_canvas",
        observation: "The subject is drifting out of the canvas.",
        principle: "dominance",
        reason: "The hero needs enough visible shape to carry the flyer confidently.",
        recommendation: "Bring the strongest part of the subject back into frame.",
        ruleId: "subject-overlap",
        severity: "high",
        target: { type: "subject" },
      },
    ];
  }

  return [
    {
      actions: [{ id: "fix-subject-placement", label: "Fix subject", target: { type: "subject" } }],
      confidence: 0.88,
      evidence: { issueType: issue.type },
      id: `subject-overlap:${issue.type}`,
      intent: issue.type === "too-large" ? "subject_too_large" : "subject_too_small",
      observation:
        issue.type === "too-large"
          ? "The subject is overpowering the rest of the layout."
          : "The subject does not have enough presence yet.",
      principle: "scale",
      reason: "Scale controls how much attention each part of the flyer receives.",
      recommendation:
        issue.type === "too-large"
          ? "Scale the subject back until the text can breathe."
          : "Bring the subject up until it clearly supports the event.",
      ruleId: "subject-overlap",
      severity: "medium",
      target: { type: "subject" },
    },
  ];
}

export const subjectOverlapRule: CocoRule = {
  evaluate: evaluateSubjectOverlap,
  id: "subject-overlap",
};
