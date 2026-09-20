import type {
  CritiqueCandidate,
  CritiqueFinding,
  CritiqueLoopInput,
  DesignPatch,
  DesignPatchAction,
} from "./types.ts";

export function generateCritiqueCandidates(
  finding: CritiqueFinding,
  input: CritiqueLoopInput
): CritiqueCandidate[] {
  const forbiddenActions = new Set(
    input.userPreferences?.forbiddenActions ?? []
  );

  const preserveTargets = new Set(
    input.userPreferences?.preserveTargets ?? []
  );

  const candidates = baseCandidates(finding)
    .map((candidate) => ({
      ...candidate,
      patches: candidate.patches.filter(
        (patch) => !forbiddenActions.has(patch.action)
      ),
    }))
    .filter((candidate) => candidate.patches.length > 0)
    .map((candidate) => {
      const touchesPreservedTarget = candidate.patches.some(
        (patch) => preserveTargets.has(patch.targetId)
      );

      return {
        ...candidate,
        preservesUserIntent: !touchesPreservedTarget,
        estimatedRisk: touchesPreservedTarget
          ? Math.min(1, candidate.estimatedRisk + 0.22)
          : candidate.estimatedRisk,
      };
    });

  return candidates;
}

function baseCandidates(
  finding: CritiqueFinding
): CritiqueCandidate[] {
  if (finding.id.startsWith("hierarchy:headline-not-dominant")) {
    return [
      makeCandidate(
        finding,
        "headline-authority",
        "Increase headline authority while reducing secondary competition.",
        [
          patch(finding, finding.targetIds[0] ?? "headline", "scale", { scale: 1.08 }),
          patch(finding, "accent", "changeHierarchy", { maxPowerRatio: 0.42 }),
          patch(finding, "metadata", "changeHierarchy", { maxPowerRatio: 0.28 }),
        ],
        14,
        0.12,
        2
      ),
      makeCandidate(
        finding,
        "secondary-restraint",
        "Reduce accent, metadata, and badge power.",
        [
          patch(finding, "accent", "scale", { scale: 0.84 }),
          patch(finding, "metadata", "scale", { scale: 0.9 }),
          patch(finding, "badge", "scale", { scale: 0.86 }),
        ],
        11,
        0.07,
        2
      ),
      makeCandidate(
        finding,
        "headline-line-break",
        "Improve the headline line break and width usage.",
        [
          patch(finding, finding.targetIds[0] ?? "headline", "changeLineBreak", {
            strategy: "balanced-two-line",
            maxLines: 2,
          }),
          patch(finding, finding.targetIds[0] ?? "headline", "changeTracking", {
            tracking: -0.03,
          }),
        ],
        9,
        0.08,
        2
      ),
    ];
  }

  if (finding.id.startsWith("hierarchy:accent-too-strong")) {
    return [
      makeCandidate(
        finding,
        "accent-subordination",
        "Make the accent clearly support the headline.",
        [
          patch(finding, finding.targetIds[0] ?? "accent", "scale", { scale: 0.82 }),
          patch(finding, finding.targetIds[0] ?? "accent", "reduceEffects", {
            glowMultiplier: 0.55,
            strokeMultiplier: 0.5,
          }),
          patch(finding, finding.targetIds[0] ?? "accent", "changeOpacity", {
            opacity: 0.94,
          }),
        ],
        10,
        0.05,
        1
      ),
    ];
  }

  if (finding.id.startsWith("hierarchy:metadata-too-strong")) {
    return [
      makeCandidate(
        finding,
        "metadata-compression",
        "Compress supporting copy into premium metadata.",
        [
          patch(finding, finding.targetIds[0] ?? "metadata", "scale", { scale: 0.84 }),
          patch(finding, finding.targetIds[0] ?? "metadata", "changeTracking", {
            tracking: 0.08,
          }),
          patch(finding, finding.targetIds[0] ?? "metadata", "changeLineHeight", {
            lineHeight: 0.9,
          }),
          patch(finding, finding.targetIds[0] ?? "metadata", "changeLineBreak", {
            maxLines: 3,
          }),
        ],
        9,
        0.05,
        2
      ),
    ];
  }

  if (finding.id.startsWith("readability:contrast")) {
    return [
      makeCandidate(
        finding,
        "local-contrast",
        "Increase local text contrast using the approved role color.",
        [
          patch(finding, finding.targetIds[0], "increaseContrast", {
            minimumRatio: 4.5,
            useApprovedRoleColor: true,
          }),
        ],
        13,
        0.03,
        1
      ),
      makeCandidate(
        finding,
        "local-separation",
        "Add subtle local separation without changing the palette.",
        [
          patch(finding, finding.targetIds[0], "restyle", {
            shadow: 0.22,
            overlayOpacity: 0.1,
          }),
        ],
        9,
        0.07,
        1
      ),
    ];
  }

  if (finding.id.startsWith("composition:safe-margin")) {
    return [
      makeCandidate(
        finding,
        "safe-margin-correction",
        "Move the element inward to restore breathing room.",
        [
          patch(finding, finding.targetIds[0], "move", {
            inwardPercent: 3,
          }),
        ],
        7,
        0.02,
        1
      ),
    ];
  }

  if (finding.id.startsWith("composition:stack-alignment")) {
    return [
      makeCandidate(
        finding,
        "optical-stack-axis",
        "Align the stack to the headline's optical axis.",
        finding.targetIds.map((targetId) =>
          patch(finding, targetId, "align", {
            opticalAxis: "headline",
          })
        ),
        10,
        0.05,
        2
      ),
    ];
  }

  if (finding.id.startsWith("composition:uneven-rhythm")) {
    return [
      makeCandidate(
        finding,
        "stack-rhythm",
        "Normalize the vertical spacing rhythm.",
        finding.targetIds.map((targetId, index) =>
          patch(finding, targetId, "tightenSpacing", {
            rhythmIndex: index,
            ratio: 1.25,
          })
        ),
        9,
        0.04,
        2
      ),
    ];
  }

  if (finding.id.startsWith("protection:")) {
    const target = finding.id.split(":")[1] ?? "subject";
    return [
      makeCandidate(
        finding,
        "protected-feature-clearance",
        `Move typography away from the ${target}.`,
        [
          patch(finding, finding.targetIds[0], "protectSubject", {
            target,
            minimumClearance: 2.5,
          }),
        ],
        18,
        0.04,
        2,
        true
      ),
    ];
  }

  if (finding.id.startsWith("density:too-many-groups")) {
    return [
      makeCandidate(
        finding,
        "copy-consolidation",
        "Merge or hide low-priority copy.",
        [
          patch(finding, "details2", "mergeCopy", { into: "metadata" }),
          patch(finding, "presenter", "hide", { reason: "low-priority" }),
          patch(finding, "footer", "hide", { whenDensity: "low" }),
        ],
        11,
        0.08,
        2
      ),
    ];
  }

  if (finding.id.startsWith("density:too-many-fonts")) {
    return [
      makeCandidate(
        finding,
        "font-contract-restoration",
        "Return supporting roles to the approved body family.",
        finding.targetIds.map((targetId) =>
          patch(finding, targetId, "changeFont", {
            familyRole: "body",
          })
        ),
        14,
        0.03,
        2
      ),
    ];
  }

  if (finding.id.startsWith("effects:too-many-glows")) {
    return [
      makeCandidate(
        finding,
        "single-glow",
        "Keep glow on one signature role only.",
        finding.targetIds.slice(1).map((targetId) =>
          patch(finding, targetId, "reduceEffects", {
            glow: 0,
          })
        ),
        10,
        0.03,
        1
      ),
    ];
  }

  if (finding.id.startsWith("effects:blurred-information")) {
    return [
      makeCandidate(
        finding,
        "crisp-information",
        "Remove blur from functional information.",
        finding.targetIds.map((targetId) =>
          patch(finding, targetId, "reduceEffects", {
            blur: 0,
          })
        ),
        12,
        0.02,
        1
      ),
    ];
  }

  if (finding.id.startsWith("marketing:missing-logistics")) {
    return [
      makeCandidate(
        finding,
        "restore-logistics",
        "Restore a compact date/time and venue lockup.",
        [
          patch(finding, "dateTime", "show", { treatment: "metadata" }),
          patch(finding, "venue", "show", { treatment: "footer" }),
        ],
        18,
        0.04,
        2
      ),
    ];
  }

  if (finding.id.startsWith("premium:too-many-effects")) {
    return [
      makeCandidate(
        finding,
        "premium-restraint",
        "Reduce decorative treatment across non-signature roles.",
        finding.targetIds.map((targetId) =>
          patch(finding, targetId, "reduceEffects", {
            multiplier: 0.55,
          })
        ),
        11,
        0.04,
        2
      ),
    ];
  }

  return [
    makeCandidate(
      finding,
      `generic-${finding.category}`,
      `Resolve ${finding.observation.toLowerCase()}`,
      [
        patch(finding, finding.targetIds[0] ?? "artwork", "restyle", {
          category: finding.category,
        }),
      ],
      Math.max(4, finding.scorePenalty * 0.55),
      0.12,
      2
    ),
  ];
}

function makeCandidate(
  finding: CritiqueFinding,
  id: string,
  description: string,
  patches: DesignPatch[],
  expectedGain: number,
  estimatedRisk: number,
  implementationCost: number,
  touchesProtectedRegion = false
): CritiqueCandidate {
  return {
    id,
    findingId: finding.id,
    category: finding.category,
    description,
    patches,
    expectedGain,
    estimatedRisk,
    implementationCost,
    confidence: Math.min(0.98, finding.confidence),
    preservesUserIntent: true,
    touchesProtectedRegion,
    reason: finding.cause,
  };
}

function patch(
  finding: CritiqueFinding,
  targetId: string,
  action: DesignPatchAction,
  values: Record<string, string | number | boolean>
): DesignPatch {
  return {
    id: `${finding.id}:${targetId}:${action}`,
    targetId,
    action,
    values,
    reversible: true,
    sourceFindingId: finding.id,
  };
}
