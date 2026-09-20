import type {
  ArtDirectorFinding,
  ArtDirectorInput,
  ImprovementCandidate,
} from "./types.ts";

export function generateImprovements(
  input: ArtDirectorInput,
  finding: ArtDirectorFinding
): ImprovementCandidate[] {
  switch (finding.id.split(":")[0] + ":" + finding.id.split(":")[1]) {
    case "hierarchy:headline-not-dominant":
      return [
        candidate(finding, "increase-headline-authority", "Increase headline authority.", [
          patch(finding.targetIds[0] ?? "headline", "scale", { scale: 1.08 }),
          patch("accent", "changeHierarchy", { maxPowerRatio: 0.42 }),
          patch("metadata", "changeHierarchy", { maxPowerRatio: 0.28 }),
        ], 14, 0.12, 2),
        candidate(finding, "reduce-secondary-power", "Reduce secondary visual power.", [
          patch("accent", "scale", { scale: 0.86 }),
          patch("metadata", "scale", { scale: 0.9 }),
          patch("badge", "scale", { scale: 0.86 }),
        ], 11, 0.08, 2),
      ];

    case "hierarchy:accent-too-strong":
      return [
        candidate(finding, "shrink-accent", "Make the accent support the headline.", [
          patch(finding.targetIds[0] ?? "accent", "scale", { scale: 0.82 }),
          patch(finding.targetIds[0] ?? "accent", "reduceEffects", { glowMultiplier: 0.6, strokeMultiplier: 0.5 }),
        ], 10, 0.06, 1),
      ];

    case "hierarchy:metadata-too-strong":
      return [
        candidate(finding, "recompose-metadata", "Recompose body copy as compact metadata.", [
          patch(finding.targetIds[0] ?? "metadata", "scale", { scale: 0.84 }),
          patch(finding.targetIds[0] ?? "metadata", "tightenSpacing", { lineHeight: 0.9, tracking: 0.08 }),
          patch(finding.targetIds[0] ?? "metadata", "changeLineBreak", { maxLines: 3 }),
        ], 9, 0.05, 2),
      ];

    case "readability:contrast":
      return [
        candidate(finding, "increase-local-contrast", "Strengthen local text contrast.", [
          patch(finding.targetIds[0], "increaseContrast", { minimumRatio: 4.5, useRoleColor: true }),
        ], 13, 0.04, 1),
        candidate(finding, "add-local-separation", "Add restrained local separation behind the text.", [
          patch(finding.targetIds[0], "restyle", { shadow: 0.24, localOverlayOpacity: 0.12 }),
        ], 9, 0.08, 1),
      ];

    case "composition:safe-margin":
      return [
        candidate(finding, "pull-inward", "Pull the element inside the safe margin.", [
          patch(finding.targetIds[0], "move", { inward: 3 }),
        ], 7, 0.02, 1),
      ];

    case "composition:stack-alignment":
      return [
        candidate(finding, "align-stack", "Align the typography stack to one optical axis.", [
          ...finding.targetIds.map((id) => patch(id, "align", { opticalAxis: "headline" })),
        ], 10, 0.06, 2),
      ];

    case "composition:uneven-rhythm":
      return [
        candidate(finding, "normalize-rhythm", "Normalize the typography spacing rhythm.", [
          ...finding.targetIds.map((id, index) =>
            patch(id, "tightenSpacing", { rhythmStep: index, ratio: 1.25 })
          ),
        ], 9, 0.05, 2),
      ];

    case "protection:face":
    case "protection:eyes":
    case "protection:gaze":
      return [
        candidate(finding, "clear-protected-feature", "Move typography away from the protected feature.", [
          patch(finding.targetIds[0], "protectSubject", { target: finding.id.split(":")[1], minimumClearance: 2.5 }),
        ], 18, 0.05, 2),
      ];

    case "density:too-many-groups":
      return [
        candidate(finding, "merge-secondary-copy", "Merge or hide low-priority copy.", [
          patch("details2", "mergeCopy", { into: "metadata" }),
          patch("presenter", "hide", { reason: "low-priority" }),
          patch("footer", "hide", { whenDensity: "low" }),
        ], 11, 0.08, 2),
      ];

    case "density:too-many-fonts":
      return [
        candidate(finding, "restore-font-contract", "Return all supporting copy to the approved body family.", [
          ...finding.targetIds.map((id) => patch(id, "changeFont", { familyRole: "body" })),
        ], 14, 0.03, 2),
      ];

    case "effects:too-many-glows":
      return [
        candidate(finding, "single-glow-only", "Keep glow on one signature role only.", [
          ...finding.targetIds.slice(1).map((id) => patch(id, "reduceEffects", { glow: 0 })),
        ], 10, 0.03, 1),
      ];

    case "effects:blurred-information":
      return [
        candidate(finding, "restore-crisp-copy", "Remove blur from functional information.", [
          ...finding.targetIds.map((id) => patch(id, "reduceEffects", { blur: 0 })),
        ], 12, 0.02, 1),
      ];

    case "marketing:missing-logistics":
      return [
        candidate(finding, "restore-logistics", "Restore a compact date/time and venue lockup.", [
          patch("dateTime", "show", { treatment: "metadata" }),
          patch("venue", "show", { treatment: "footer" }),
        ], 18, 0.04, 2),
      ];

    case "premium:too-many-effects":
      return [
        candidate(finding, "premium-restraint-pass", "Reduce effects and let scale, spacing, and image quality carry the design.", [
          ...finding.targetIds.map((id) => patch(id, "reduceEffects", { multiplier: 0.55 })),
        ], 11, 0.04, 2),
      ];

    default:
      return [
        candidate(finding, `fix-${finding.id}`, `Resolve ${finding.observation.toLowerCase()}`, [
          patch(finding.targetIds[0] ?? "artwork", "restyle", { category: finding.category }),
        ], Math.max(4, finding.scorePenalty * 0.55), 0.12, 2),
      ];
  }
}

function candidate(
  finding: ArtDirectorFinding,
  id: string,
  description: string,
  patches: ImprovementCandidate["patches"],
  expectedGain: number,
  risk: number,
  implementationCost: number
): ImprovementCandidate {
  return {
    id,
    findingId: finding.id,
    category: finding.category,
    description,
    patches,
    expectedGain,
    risk,
    implementationCost,
    confidence: Math.min(0.98, finding.confidence),
    reason: finding.cause,
  };
}

function patch(
  targetId: string,
  action: ImprovementCandidate["patches"][number]["action"],
  values: Record<string, string | number | boolean>
) {
  return { targetId, action, values };
}
