import type { ArtDirectorFinding, ArtDirectorInput } from "./types.ts";
import type { DerivedMetrics } from "./metrics.ts";

export function evaluateMarketingClarity(
  input: ArtDirectorInput,
  metrics: DerivedMetrics
): ArtDirectorFinding[] {
  const findings: ArtDirectorFinding[] = [];
  const goal = input.creativeDirection?.marketingGoal ??
    input.scene?.creativeDecisions?.marketingIntent ??
    "sell-event";

  if (goal === "sell-lifestyle" && !metrics.accent && !metrics.metadata) {
    findings.push({
      id: "marketing:lifestyle-not-communicated",
      category: "marketingClarity",
      severity: "medium",
      confidence: 0.85,
      observation: "The flyer names the event but does not sell the experience.",
      cause: "Mood or experience copy is missing.",
      evidence: ["No accent or experience metadata was rendered."],
      targetIds: [metrics.headline?.id ?? ""].filter(Boolean),
      contractIds: [],
      scorePenalty: 8,
      blocker: false,
      userFacingMessage: "The event is clear, but the lifestyle promise is missing.",
    });
  }

  if (goal === "sell-music" && !metrics.metadata) {
    findings.push({
      id: "marketing:music-not-communicated",
      category: "marketingClarity",
      severity: "medium",
      confidence: 0.88,
      observation: "The flyer does not clearly communicate the music experience.",
      cause: "Music metadata is missing or hidden.",
      evidence: ["No music or experience metadata was rendered."],
      targetIds: [],
      contractIds: [],
      scorePenalty: 8,
      blocker: false,
      userFacingMessage: "The music promise needs one concise supporting line.",
    });
  }

  if (!metrics.dateTime || !metrics.venue) {
    findings.push({
      id: "marketing:missing-logistics",
      category: "marketingClarity",
      severity: "high",
      confidence: 0.96,
      observation: "The flyer is missing essential event logistics.",
      cause: "Date/time or venue is not visible.",
      evidence: [
        `Date/time present: ${Boolean(metrics.dateTime)}.`,
        `Venue present: ${Boolean(metrics.venue)}.`,
      ],
      targetIds: [],
      contractIds: [],
      scorePenalty: 16,
      blocker: true,
      userFacingMessage: "The flyer needs a visible date/time and venue before export.",
    });
  }

  return findings;
}
