import type {
  CocoSignatureMove,
  CocoSignatureMoveInput,
  CocoSignatureMoveIntensity,
} from "./types";

export function chooseCocoSignatureMove(input: CocoSignatureMoveInput): CocoSignatureMove {
  const candidates = buildSignatureCandidates(input)
    .map((move) => ({
      ...move,
      priority: scoreSignatureMove(move, input),
    }))
    .sort((a, b) => b.priority - a.priority);

  return candidates[0] ?? noSignatureMove("No strong signature move was needed.");
}

export function intensityMultiplier(intensity: CocoSignatureMoveIntensity) {
  if (intensity === "bold") return 1.2;
  if (intensity === "medium") return 1;
  return 0.72;
}

function buildSignatureCandidates(input: CocoSignatureMoveInput): CocoSignatureMove[] {
  const text = `${input.eventName} ${input.headlineText} ${input.accentText ?? ""}`.toLowerCase();
  const story = String(input.story ?? "").toLowerCase();
  const style = String(input.nightlifeStyle ?? "").toLowerCase();
  const mood = input.mood;
  const moves: CocoSignatureMove[] = [];
  const brunchOrCocktail = /(mojito|martini|brunch|cocktail|tropical|day party|dayparty)/.test(text) || story.includes("brunch");
  const scriptCapableAccent = canUseScriptMove(input.accentFontFamily);

  if (brunchOrCocktail) {
    moves.push({
      effects: {
        accentGlowBoost: 0.08,
      },
      id: "script-cross",
      intensity: "medium",
      layout: {
        accentOffsetX: -3,
        accentOffsetY: -1.2,
        allowAccentCrossStack: true,
        allowAccentOverlapHeadline: true,
        metadataOffsetY: 1.8,
      },
      priority: 0,
      reason: "Brunch and cocktail concepts benefit from one relaxed handwritten accent crossing the strong headline.",
      safety: {
        maxFaceOverlap: 0,
        maxHeadlineEdgeRisk: 0.12,
        mustKeepReadability: true,
      },
      target: "accent",
      typography: {
        accentRotationDeg: -6,
        accentScaleMultiplier: 0.92,
        useScriptAccent: true,
      },
    });

    if (!scriptCapableAccent) {
      moves.push({
        effects: {
          headlineGlowBoost: -0.03,
        },
        id: "editorial-spacing",
        intensity: "subtle",
        layout: {
          metadataOffsetY: 2.2,
          stackOffsetY: -1,
        },
        priority: 0,
        reason: "The brunch accent font is not script-like, so the memorable move should come from restrained premium spacing instead of fake handwritten motion.",
        safety: {
          maxFaceOverlap: 0,
          maxHeadlineEdgeRisk: 0.08,
          mustKeepReadability: true,
        },
        target: "full-stack",
        typography: {
          accentScaleMultiplier: 0.76,
          headlineTrackingDelta: 0.018,
        },
      });
    }
  }

  if (/(vip|bottle|luxury|luxe|champagne)/.test(text) || story.includes("luxury")) {
    moves.push({
      effects: {
        addSoftBehindTextBloom: true,
        headlineGlowBoost: -0.04,
      },
      id: "luxury-serif-scale",
      intensity: "medium",
      layout: {
        stackOffsetY: -2,
      },
      priority: 0,
      reason: "Luxury flyers need one refined scale moment instead of many loud effects.",
      safety: {
        maxFaceOverlap: 0,
        maxHeadlineEdgeRisk: 0.1,
        mustKeepReadability: true,
      },
      target: "headline",
      typography: {
        headlineScaleMultiplier: 1.08,
        headlineTrackingDelta: 0.025,
      },
    });
  }

  if (/(edm|rave|techno|afterhours|after hours|neon)/.test(text) || style.includes("edm") || style.includes("techno")) {
    moves.push({
      effects: {
        addSoftBehindTextBloom: true,
        headlineGlowBoost: 0.18,
      },
      id: "glow-sweep",
      intensity: "bold",
      layout: {
        stackOffsetY: -1,
      },
      priority: 0,
      reason: "High-energy electronic flyers need one electric motion cue.",
      safety: {
        maxFaceOverlap: 0,
        maxHeadlineEdgeRisk: 0.16,
        mustKeepReadability: true,
      },
      target: "headline",
      typography: {
        headlineScaleMultiplier: 1.06,
        headlineTrackingDelta: -0.015,
      },
    });
  }

  if (/(hip.?hop|trap|rap|street)/.test(text) || style.includes("hip-hop")) {
    moves.push({
      effects: {
        headlineGlowBoost: 0.06,
      },
      id: "cropped-type",
      intensity: "bold",
      layout: {
        stackOffsetX: -2,
        stackOffsetY: -3,
      },
      priority: 0,
      reason: "Hip-hop posters can handle oversized cropped typography as the memorable move.",
      safety: {
        maxFaceOverlap: 0,
        maxHeadlineEdgeRisk: 0.22,
        mustKeepReadability: true,
      },
      target: "headline",
      typography: {
        headlineScaleMultiplier: 1.14,
        headlineTrackingDelta: -0.025,
        useCondensedHeadline: true,
      },
    });
  }

  if (/(afro|afrobeats|island|sunset)/.test(text) || story.includes("afrobeats")) {
    moves.push({
      effects: {
        accentGlowBoost: 0.06,
      },
      id: "diagonal-accent",
      intensity: "medium",
      layout: {
        accentOffsetX: -2,
        accentOffsetY: -0.8,
        allowAccentCrossStack: true,
      },
      priority: 0,
      reason: "Afrobeats flyers benefit from rhythmic movement, but the headline still needs to lead.",
      safety: {
        maxFaceOverlap: 0,
        maxHeadlineEdgeRisk: 0.14,
        mustKeepReadability: true,
      },
      target: "accent",
      typography: {
        accentRotationDeg: -8,
        accentScaleMultiplier: 0.88,
        useScriptAccent: true,
      },
    });
  }

  if (mood?.elegance && mood.elegance > 78 && Number(mood.energy ?? 50) < 70) {
    moves.push({
      effects: {
        headlineGlowBoost: -0.06,
      },
      id: "editorial-spacing",
      intensity: "subtle",
      layout: {
        metadataOffsetY: 2,
        stackOffsetY: -1,
      },
      priority: 0,
      reason: "Elegant flyers feel memorable through restraint, spacing, and quiet confidence.",
      safety: {
        maxFaceOverlap: 0,
        maxHeadlineEdgeRisk: 0.08,
        mustKeepReadability: true,
      },
      target: "full-stack",
      typography: {
        accentScaleMultiplier: 0.78,
        headlineTrackingDelta: 0.035,
      },
    });
  }

  moves.push({
    effects: {
      headlineGlowBoost: 0.03,
    },
    id: "oversized-headline",
    intensity: "subtle",
    layout: {
      stackOffsetY: -1.5,
    },
    priority: 0,
    reason: "A stronger headline scale gives the flyer a memorable poster anchor without adding clutter.",
    safety: {
      maxFaceOverlap: 0,
      maxHeadlineEdgeRisk: 0.14,
      mustKeepReadability: true,
    },
    target: "headline",
    typography: {
      headlineScaleMultiplier: 1.06,
      headlineTrackingDelta: -0.005,
    },
  });

  return moves;
}

function scoreSignatureMove(move: CocoSignatureMove, input: CocoSignatureMoveInput) {
  let score = 50;
  const text = `${input.eventName} ${input.headlineText} ${input.accentText ?? ""}`.toLowerCase();

  if (move.id === "script-cross" && /(brunch|mojito|martini|cocktail)/.test(text)) score += 30;
  if (move.id === "luxury-serif-scale" && /(vip|luxury|bottle|champagne|luxe)/.test(text)) score += 28;
  if (move.id === "glow-sweep" && /(edm|rave|techno|neon)/.test(text)) score += 30;
  if (move.id === "cropped-type" && /(hip.?hop|trap|rap)/.test(text)) score += 26;
  if (move.id === "diagonal-accent" && /(afro|afrobeats|island|sunset)/.test(text)) score += 26;

  if (input.hasSubject && move.id === "cropped-type") score -= 8;
  if (input.faceZone && move.layout?.stackOffsetX && Math.abs(move.layout.stackOffsetX) > 4) score -= 5;
  if (move.id === "script-cross" && !canUseScriptMove(input.accentFontFamily)) score -= 40;
  if (
    move.id === "editorial-spacing" &&
    /(brunch|mojito|martini|cocktail)/.test(text) &&
    !canUseScriptMove(input.accentFontFamily)
  ) {
    score += 18;
  }

  if (input.compositionPatternId?.includes("premium-stack") && move.target === "accent") score += 8;
  if (input.compositionPatternId === "bottom-lockup" && move.id === "script-cross") score -= 10;

  return clamp(score, 0, 100);
}

function noSignatureMove(reason: string): CocoSignatureMove {
  return {
    id: "none",
    intensity: "subtle",
    priority: 0,
    reason,
    safety: {
      maxFaceOverlap: 0,
      maxHeadlineEdgeRisk: 0.1,
      mustKeepReadability: true,
    },
    target: "full-stack",
  };
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function canUseScriptMove(accentFontFamily: string | null | undefined) {
  return /(script|brush|paint|signature|hand|good brush|openscript|adelia|lacheyard)/i.test(
    String(accentFontFamily ?? "")
  );
}
