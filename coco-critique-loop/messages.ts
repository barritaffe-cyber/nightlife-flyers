import type {
  CocoCritiqueMessage,
  CritiqueFinding,
  CritiqueMemory,
} from "./types.ts";

export function buildCocoCritiqueMessage(
  finding: CritiqueFinding,
  memory: CritiqueMemory
): CocoCritiqueMessage {
  const tone =
    finding.severity === "critical" ? "urgent" :
    finding.severity === "high" ? "direct" :
    finding.severity === "medium" ? "encouraging" :
    "quiet";

  return {
    findingId: finding.id,
    tone,
    headline: headlineForFinding(finding),
    body: bodyForFinding(finding),
    actions: [
      {
        id: "apply",
        label: applyLabel(finding),
        type: "apply",
      },
      {
        id: "review",
        label: "Show me",
        type: "review",
      },
      {
        id: "keep",
        label: "Keep it",
        type: "keep",
      },
      {
        id: "dismiss",
        label: "Don't ask again",
        type: "dismiss",
      },
    ],
  };
}

function headlineForFinding(finding: CritiqueFinding): string {
  if (finding.id.includes("headline-not-dominant")) return "The title needs to lead.";
  if (finding.id.includes("accent-too-strong")) return "The accent is competing.";
  if (finding.id.includes("metadata-too-strong")) return "The details are too loud.";
  if (finding.id.includes("contrast")) return "This text is getting lost.";
  if (finding.id.includes("safe-margin")) return "This needs more breathing room.";
  if (finding.id.includes("stack-alignment")) return "The stack needs a cleaner axis.";
  if (finding.id.includes("uneven-rhythm")) return "The spacing rhythm feels uneven.";
  if (finding.id.includes("protection")) return "The subject needs to stay clear.";
  if (finding.id.includes("too-many-groups")) return "There is too much visible copy.";
  if (finding.id.includes("too-many-fonts")) return "The type system is splitting.";
  if (finding.id.includes("too-many-glows")) return "The effects are competing.";
  if (finding.id.includes("missing-logistics")) return "The event details are incomplete.";
  return finding.userFacingMessage;
}

function bodyForFinding(finding: CritiqueFinding): string {
  return finding.userFacingMessage || finding.observation;
}

function applyLabel(finding: CritiqueFinding): string {
  if (finding.category === "hierarchy") return "Fix hierarchy";
  if (finding.category === "readability" || finding.category === "contrast") return "Improve contrast";
  if (finding.category === "composition" || finding.category === "alignment") return "Refine layout";
  if (finding.category === "subjectProtection") return "Protect subject";
  if (finding.category === "effects") return "Reduce effects";
  if (finding.category === "informationDensity") return "Simplify copy";
  return "Improve it";
}
