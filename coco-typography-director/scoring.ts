import type {
  TypographyDirectorInput,
  TypographyScore,
  TypographySystem,
} from "./types.ts";
import { clamp, weightedAverage, round } from "./utils.ts";

export function scoreTypographySystem(
  input: TypographyDirectorInput,
  system: Omit<TypographySystem, "score">
): TypographyScore {
  const hierarchy = scoreHierarchy(system);
  const readability = scoreReadability(system);
  const moodFit = scoreMoodFit(input, system);
  const sceneFit = scoreSceneFit(input, system);
  const compositionFit = scoreCompositionFit(input, system);
  const fontQuality = scoreFontQuality(system);
  const pairingQuality = scorePairing(system);
  const rhythm = scoreRhythm(system);
  const premiumPotential = scorePremium(input, system);
  const originality = scoreOriginality(system);
  const restraint = scoreRestraint(input, system);
  const renderability = scoreRenderability(system);

  const total = weightedAverage([
    [hierarchy, 0.15],
    [readability, 0.13],
    [moodFit, 0.1],
    [sceneFit, 0.08],
    [compositionFit, 0.1],
    [fontQuality, 0.08],
    [pairingQuality, 0.1],
    [rhythm, 0.08],
    [premiumPotential, 0.07],
    [originality, 0.04],
    [restraint, 0.04],
    [renderability, 0.03],
  ]);

  return {
    hierarchy: round(hierarchy),
    readability: round(readability),
    moodFit: round(moodFit),
    sceneFit: round(sceneFit),
    compositionFit: round(compositionFit),
    fontQuality: round(fontQuality),
    pairingQuality: round(pairingQuality),
    rhythm: round(rhythm),
    premiumPotential: round(premiumPotential),
    originality: round(originality),
    restraint: round(restraint),
    renderability: round(renderability),
    total: round(total),
  };
}

function scoreHierarchy(system: Omit<TypographySystem, "score">): number {
  let score = 96;
  const headline = system.headline.visualPower;

  if (system.accent && system.accent.visualPower > headline * system.hierarchy.accentMaxRatio) score -= 18;
  if (system.metadata && system.metadata.visualPower > headline * system.hierarchy.bodyMaxRatio) score -= 18;
  if (system.dateTime && system.dateTime.visualPower > headline * system.hierarchy.dateMaxRatio) score -= 12;
  if (system.venue && system.venue.visualPower > headline * system.hierarchy.venueMaxRatio) score -= 12;
  if (system.badge && system.badge.visualPower > headline * system.hierarchy.badgeMaxRatio) score -= 10;
  if (system.presenter && system.presenter.visualPower > headline * system.hierarchy.presenterMaxRatio) score -= 10;

  const strongestSecondary = Math.max(
    system.accent?.visualPower ?? 0,
    system.metadata?.visualPower ?? 0,
    system.dateTime?.visualPower ?? 0,
    system.venue?.visualPower ?? 0
  );

  if (strongestSecondary > 0 && headline / strongestSecondary < system.hierarchy.headlineMustWinBy) score -= 15;
  return clamp(score);
}

function scoreReadability(system: Omit<TypographySystem, "score">): number {
  let score = 94;
  for (const layer of layers(system)) {
    if (layer.role !== "headline" && ["script", "decorative", "retro"].includes(layer.category)) score -= 12;
    if (layer.lineHeight < 0.76) score -= 7;
    if (layer.tracking < -0.06 || layer.tracking > 0.16) score -= 5;
    if (layer.maxLines > 4 && layer.role !== "footer") score -= 5;
  }
  return clamp(score);
}

function scoreMoodFit(input: TypographyDirectorInput, system: Omit<TypographySystem, "score">): number {
  const target = input.creativeDirection?.typography?.headlinePersonality ??
    input.scene?.creativeDecisions?.typographyPolicy ??
    "";
  let score = 80;
  if (String(target).includes(system.headline.personality.split("-")[0])) score += 12;
  if (input.scene?.creativeDecisions?.story?.includes("brunch") && system.accent?.personality === "organic-script") score += 10;
  if (input.scene?.creativeDecisions?.story?.includes("techno") && system.headline.personality === "industrial-minimal") score += 10;
  if (input.scene?.creativeDecisions?.story?.includes("hiphop") && system.headline.personality === "urban-heavy") score += 10;
  return clamp(score);
}

function scoreSceneFit(input: TypographyDirectorInput, system: Omit<TypographySystem, "score">): number {
  let score = 84 + (input.scene?.confidence ?? 0.6) * 8;
  const hero = input.scene?.creativeDecisions?.hero?.type;
  if (hero === "subject" && system.headline.effects.glow <= 0.14) score += 5;
  if (hero === "headline" && system.headline.sizeScale >= 1) score += 5;
  return clamp(score);
}

function scoreCompositionFit(input: TypographyDirectorInput, system: Omit<TypographySystem, "score">): number {
  let score = 90;
  const align = input.composition?.alignment ?? input.scene?.creativeDecisions?.composition?.stackAlignment;
  if (align && system.headline.align === align) score += 5;
  if (input.composition?.family?.includes("premium-stack") && system.headline.lineHeight <= 0.86) score += 4;
  if (input.composition?.family === "diagonal-energy" && Math.abs(system.accent?.rotationDeg ?? 0) > 2) score += 4;
  return clamp(score);
}

function scoreFontQuality(system: Omit<TypographySystem, "score">): number {
  let score = 86;
  if (system.headline.category === "unknown") score -= 12;
  if (system.metadata && system.metadata.category === "unknown") score -= 8;
  if (system.headline.fontFamily === system.metadata?.fontFamily) score += 4;
  return clamp(score);
}

function scorePairing(system: Omit<TypographySystem, "score">): number {
  let score = 90;
  if (system.fontFamilies.length > system.maxFontFamilies) score -= 25;
  if (system.fontFamilies.length === 2) score += 4;
  if (system.accent?.category === "script" && system.headline.category === "display-condensed") score += 6;
  if (system.accent?.category === system.headline.category && system.accent?.fontFamily !== system.headline.fontFamily) score -= 6;
  return clamp(score);
}

function scoreRhythm(system: Omit<TypographySystem, "score">): number {
  let score = 90;
  const ls = layers(system);
  for (let i = 1; i < ls.length; i++) {
    if (ls[i].spacingBefore > 4) score -= 5;
    if (ls[i - 1].spacingAfter > 4) score -= 5;
  }
  if (system.headline.lineHeight <= 0.86) score += 3;
  return clamp(score);
}

function scorePremium(input: TypographyDirectorInput, system: Omit<TypographySystem, "score">): number {
  let score = 76;
  const identity = input.creativeDirection?.posterIdentity ?? "";
  if (/luxury|editorial|fashion|lifestyle/.test(identity)) {
    if (["luxury-serif", "fashion-serif", "condensed-editorial"].includes(system.headline.personality)) score += 12;
    if (system.fontFamilies.length <= 2) score += 6;
    if (system.headline.effects.glow <= 0.12) score += 5;
  }
  return clamp(score);
}

function scoreOriginality(system: Omit<TypographySystem, "score">): number {
  const move = system.signatureMove?.id ?? "none";
  const map: Record<string, number> = {
    none: 62,
    "oversized-headline": 76,
    "script-cross": 84,
    "diagonal-accent": 82,
    "cropped-type": 88,
    "luxury-serif-scale": 80,
    "editorial-spacing": 78,
    "single-electric-glow": 82,
    "subject-type-depth": 90,
    "corner-badge": 68,
  };
  return map[move] ?? 72;
}

function scoreRestraint(input: TypographyDirectorInput, system: Omit<TypographySystem, "score">): number {
  let score = 92;
  const policy = input.creativeDirection?.effects?.policy ?? input.scene?.creativeDecisions?.effectPolicy?.policy;
  if (policy === "restrained" || policy === "none") {
    if (system.headline.effects.glow > 0.14) score -= 18;
    if (layers(system).filter((layer) => layer.effects.glow > 0.04).length > 1) score -= 14;
  }
  return clamp(score);
}

function scoreRenderability(system: Omit<TypographySystem, "score">): number {
  let score = 94;
  if (system.fontFamilies.length > system.maxFontFamilies) score -= 20;
  for (const layer of layers(system)) {
    if (!layer.text.trim()) score -= 8;
    if (!layer.fontFamily.trim()) score -= 8;
    if (layer.sizeScale <= 0) score -= 8;
  }
  return clamp(score);
}

function layers(system: Omit<TypographySystem, "score">) {
  return [
    system.headline,
    system.accent,
    system.metadata,
    system.dateTime,
    system.venue,
    system.badge,
    system.presenter,
    system.footer,
  ].filter(Boolean) as any[];
}
