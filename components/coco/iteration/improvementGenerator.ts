import type {
  CocoDesignCritique,
  CocoImprovementCandidate,
  CocoIterationInput,
  CocoIterationState,
} from "./types";

type ImprovementInput = CocoIterationInput & Partial<CocoIterationState>;

export function generateCocoImprovements(
  input: ImprovementInput,
  critique: CocoDesignCritique
): CocoImprovementCandidate[] {
  const accent = input.stack.items.find((item) => item.kind === "accent");
  const scriptLikeAccent = isScriptLikeAccent(accent?.style.fontFamily);
  const stackOffsetX = critique.suggestedPatch?.stackOffsetX ?? 0;

  switch (critique.category) {
    case "visualInteraction": {
      const candidates: CocoImprovementCandidate[] = [];
      if (scriptLikeAccent && accent) {
        candidates.push({
          id: "interaction-accent-overlap",
          action: "addImageInteraction",
          critiqueId: critique.id,
          description: "Let the accent slightly cross toward the subject so type and image feel connected.",
          patch: {
            accentOffsetX: stackOffsetX ? Math.sign(stackOffsetX) * 2.6 : 2.4,
            accentOffsetY: -0.8,
            accentRotation: stackOffsetX < 0 ? 4 : -4,
            allowAccentOverlap: true,
          },
        });
        candidates.push({
          id: "interaction-accent-subtle-overlap",
          action: "addImageInteraction",
          critiqueId: critique.id,
          description: "Use a smaller accent overlap so the type connects without becoming messy.",
          patch: {
            accentOffsetX: stackOffsetX ? Math.sign(stackOffsetX) * 1.5 : 1.4,
            accentOffsetY: -0.4,
            accentRotation: stackOffsetX < 0 ? 2 : -2,
            allowAccentOverlap: true,
          },
        });
      }
      if (stackOffsetX) {
        candidates.push({
          id: "interaction-stack-closer",
          action: "moveStack",
          critiqueId: critique.id,
          description: "Move the whole type stack closer to the subject.",
          patch: {
            stackOffsetX,
          },
        });
        candidates.push({
          id: "interaction-stack-closer-with-tighter-meta",
          action: "moveStack",
          critiqueId: critique.id,
          description: "Move the stack closer to the subject and tighten metadata so the composition feels linked.",
          patch: {
            stackOffsetX: stackOffsetX * 0.75,
            metadataScale: 0.92,
          },
        });
      }
      if (critique.id === "accent-face-risk") {
        candidates.push({
          id: "remove-face-risk",
          action: "addImageInteraction",
          critiqueId: critique.id,
          description: "Pull the accent away from the protected face area.",
          patch: critique.suggestedPatch ?? { accentOffsetY: 1, accentRotation: 0 },
        });
      }
      return candidates;
    }

    case "hierarchy":
      return [
        {
          id: "shrink-accent",
          action: "shrinkAccent",
          critiqueId: critique.id,
          description: "Reduce the accent so the headline clearly wins.",
          patch: {
            accentScale: 0.84,
            metadataOffsetY: -0.6,
          },
        },
        {
          id: "scale-headline",
          action: "scaleHeadline",
          critiqueId: critique.id,
          description: "Increase headline authority instead of making everything louder.",
          patch: {
            headlineScale: 1.05,
          },
        },
      ];

    case "metadata":
      return [
        {
          id: "reduce-metadata",
          action: "reduceMetadataWeight",
          critiqueId: critique.id,
          description: "Make metadata smaller and tighter so it reads as premium information.",
          patch: {
            metadataScale: 0.86,
            metadataOffsetY: 0.8,
          },
        },
        {
          id: "premium-metadata-tighter",
          action: "reduceMetadataWeight",
          critiqueId: critique.id,
          description: "Make metadata quieter and move it closer to the headline stack.",
          patch: {
            metadataScale: 0.78,
            metadataOffsetY: -0.2,
          },
        },
      ];

    case "badge":
      return [
        {
          id: "move-badge-corner",
          action: "moveBadge",
          critiqueId: critique.id,
          description: "Move the badge away from the headline and make it a corner anchor.",
          patch: critique.suggestedPatch ?? {
            badgeOffsetX: 4,
            badgeOffsetY: -3,
            badgeScale: 0.88,
          },
        },
        {
          id: "quiet-badge",
          action: "quietBadge",
          critiqueId: critique.id,
          description: "Keep the badge but reduce its visual authority.",
          patch: {
            badgeOffsetY: -1.2,
            badgeScale: 0.74,
          },
        },
        {
          id: "move-and-quiet-badge",
          action: "quietBadge",
          critiqueId: critique.id,
          description: "Move the badge away from the stack and make it quieter.",
          patch: {
            ...(critique.suggestedPatch ?? {
              badgeOffsetX: 4,
              badgeOffsetY: -3,
            }),
            badgeScale: 0.7,
          },
        },
      ];

    case "topUtility":
      return [
        {
          id: "separate-top-utility",
          action: "separateTopUtility",
          critiqueId: critique.id,
          description: "Separate the price badge from the presenter strip.",
          patch: critique.suggestedPatch ?? {
            badgeOffsetX: 18,
            badgeOffsetY: -2,
            badgeScale: 0.76,
          },
        },
        {
          id: "top-badge-quieter",
          action: "quietBadge",
          critiqueId: critique.id,
          description: "Make the top badge smaller so presenter copy can breathe.",
          patch: {
            badgeOffsetX: critique.suggestedPatch?.badgeOffsetX
              ? critique.suggestedPatch.badgeOffsetX * 0.75
              : 12,
            badgeOffsetY: critique.suggestedPatch?.badgeOffsetY ?? -2,
            badgeScale: 0.66,
          },
        },
        {
          id: "top-badge-corner-anchor",
          action: "moveBadge",
          critiqueId: critique.id,
          description: "Move the badge into a cleaner corner-anchor role.",
          patch: {
            badgeOffsetX: critique.suggestedPatch?.badgeOffsetX ?? 22,
            badgeOffsetY: -3.5,
            badgeScale: 0.72,
          },
        },
      ];

    case "edgeRisk":
      return [
        {
          id: "add-breathing-room",
          action: "increaseBreathingRoom",
          critiqueId: critique.id,
          description: "Pull the stack inward for cleaner poster margins.",
          patch: critique.suggestedPatch ?? {
            stackOffsetX: input.stack.rect.x < 4 ? 3 : -3,
          },
        },
      ];

    default:
      return [];
  }
}

function isScriptLikeAccent(fontFamily: unknown) {
  return /(script|brush|paint|signature|hand|good brush|openscript|adelia|lacheyard)/i.test(
    String(fontFamily ?? "")
  );
}
