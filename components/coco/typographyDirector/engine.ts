import {
  COCO_FONT_PROFILES,
  COCO_TYPE_PERSONALITY_BY_STYLE,
} from "./fontProfiles.ts";
import { chooseTypographyHeadlineBreak, scoreTypographyLineBreaks } from "./lineBreaks.ts";
import type {
  CocoTypographyDecision,
  CocoTypographySnapshot,
  FontProfile,
  TypePersonality,
  TypographyCandidate,
  TypographyHeadlineDecision,
  TypographyLayerDecision,
  TypographyScores,
  TypographyTreatment,
} from "./types.ts";
import type { CocoNightlifeStyle } from "../intelligence/types.ts";

type TypographyRole =
  | "body"
  | "body2"
  | "headline"
  | "headline2"
  | "presenter"
  | "price"
  | "subtag"
  | "utility"
  | "venue";

type CandidateVariant = "cleaner" | "impact" | "premium" | "seed";

const RESTRAINED_PERSONALITIES = new Set<TypePersonality>(["editorial", "elegant", "luxury", "minimal"]);
const HIGH_ENERGY_PERSONALITIES = new Set<TypePersonality>(["aggressive", "festival", "nightclub", "throwback"]);
const SCRIPT_PERSONALITIES = new Set<TypePersonality>(["afrobeats", "elegant", "festival", "latin", "luxury"]);
const SUPPORT_ROLES = new Set<TypographyRole>([
  "body",
  "body2",
  "presenter",
  "price",
  "subtag",
  "utility",
  "venue",
]);
const CLEAN_SUPPORT_FONTS = new Set([
  "Bebas Neue",
  "BebasNeue-Regular",
  "Coolvetica Rg Cond",
  "LEMONMILK-Bold",
  "LEMONMILK-Medium",
  "LEMONMILK-Light",
  "LEMONMILK-Regular",
]);
const BOLD_BODY_FONTS = new Set([
  "Bebas Neue",
  "Coolvetica Rg Cond",
  "LEMONMILK-Bold",
  "LEMONMILK-Medium",
]);
const REGULAR_BODY_FONTS = new Set([
  "BebasNeue-Regular",
  "LEMONMILK-Light",
  "LEMONMILK-Regular",
]);
const BODY_FIRST_HEADLINE_PENALTY_FONTS = new Set([
  "BebasNeue-Regular",
  "Coolvetica Rg Cond",
  "LEMONMILK-Light",
  "LEMONMILK-Medium",
  "LEMONMILK-Regular",
]);
const DECORATIVE_SUPPORT_FONTS = new Set([
  "Adelia Alternate",
  "African",
  "Aliens Among Us",
  "Antonio",
  "Aqilah-JRYXK",
  "Asectica Simple Demo",
  "Atlantis Famingo DEMO VERSION",
  "Avigea",
  "Avigea Italic",
  "Bad Coma",
  "BAD GRUNGE",
  "Bigtimes",
  "Brich",
  "Broken Glass",
  "ChettaVissto",
  "Dear Script (Demo_Font)",
  "Doctor Glitch",
  "DS-Digital",
  "EdgeOfTheGalaxyRegular-OVEa6",
  "Galaxia Personal Used",
  "Game Of Squids",
  "Good Brush",
  "Grunge Manifesto",
  "Lacheyard Script",
  "Maglisto",
  "Mandalore",
  "Mandalore 3D",
  "Mandalore Gradient",
  "Mandalore Halftone",
  "Mandalore Laser",
  "Mandalore Rough",
  "Mandalore Title",
  "Minecrafter",
  "Minecrafter Alt",
  "Mitshuka",
  "Monoton",
  "Nancy Spungen",
  "Nancy Spungen Basic",
  "OpenScript",
  "Oups",
  "Paint the town",
  "PaybAck",
  "Pixel Digivolve",
  "Road Rage",
  "SF Hollywood Hills",
  "SF Hollywood Hills Bold",
  "SF Hollywood Hills Bold Italic",
  "SF Hollywood Hills Condensed",
  "SF Hollywood Hills Condensed Italic",
  "SF Hollywood Hills Extended",
  "SF Hollywood Hills Extended Italic",
  "SF Hollywood Hills Italic",
  "Techno Hideo",
  "Techno Hideo Bold",
  "Tropical Avenue",
  "Vartigo",
  "who asks satan",
  "jelani",
  "raidercrusader",
]);

const FALLBACK_PROFILE: FontProfile = {
  aggression: 34,
  avoidFor: [],
  bestFor: [],
  elegance: 50,
  energy: 54,
  family: "Bebas Neue",
  luxury: 44,
  personalities: ["nightclub"],
  readability: 68,
};

export function chooseCocoTypography(snapshot: CocoTypographySnapshot): CocoTypographyDecision {
  const baseCandidates = generateTypographyCandidates(snapshot)
    .map((candidate) => scoreTypographyCandidate(candidate, snapshot))
    .sort(compareTypographyCandidates);
  const topCandidates = baseCandidates.slice(0, 6);
  const refined = topCandidates
    .flatMap((candidate) => refineTypographyCandidate(candidate, snapshot))
    .map((candidate) => scoreTypographyCandidate(candidate, snapshot));
  const finalists = [...baseCandidates, ...refined].sort(compareTypographyCandidates);
  const winner = finalists.find((candidate) => passesTypographyGates(candidate.scores)) ?? finalists[0];

  return winner ?? scoreTypographyCandidate(buildFallbackCandidate(snapshot), snapshot);
}

function generateTypographyCandidates(snapshot: CocoTypographySnapshot): TypographyCandidate[] {
  const personalities = inferTypographyPersonalities(snapshot);
  const candidates: TypographyCandidate[] = [];

  for (const personality of personalities) {
    const fallbackFonts = resolveFallbackFonts(snapshot, personality);
    const headlineProfiles = rankProfilesForRole(
      availableFontsForRole(snapshot, "headline"),
      fallbackFonts.headline,
      personality,
      snapshot.nightlifeStyle,
      "headline"
    ).slice(0, 6);
    const subheadlineProfiles = rankProfilesForRole(
      availableFontsForRole(snapshot, "headline2"),
      fallbackFonts.headline2,
      personality,
      snapshot.nightlifeStyle,
      "headline2"
    ).slice(0, 4);
    const bodyProfiles = rankProfilesForRole(
      availableFontsForRole(snapshot, "body"),
      fallbackFonts.body,
      personality,
      snapshot.nightlifeStyle,
      "body"
    ).slice(0, 3);
    const body2Profiles = rankProfilesForRole(
      availableFontsForRole(snapshot, "body2"),
      fallbackFonts.body2 ?? fallbackFonts.utility,
      personality,
      snapshot.nightlifeStyle,
      "body2"
    ).slice(0, 3);
    const utilityProfiles = rankProfilesForRole(
      availableFontsForRole(snapshot, "utility"),
      fallbackFonts.utility,
      personality,
      snapshot.nightlifeStyle,
      "utility"
    ).slice(0, 3);
    const venueProfiles = rankProfilesForRole(
      availableFontsForRole(snapshot, "venue"),
      fallbackFonts.venue,
      personality,
      snapshot.nightlifeStyle,
      "venue"
    ).slice(0, 2);

    for (const headlineProfile of headlineProfiles) {
      for (const subheadlineProfile of subheadlineProfiles) {
        for (const bodyProfile of bodyProfiles) {
          for (const body2Profile of body2Profiles) {
            for (const utilityProfile of utilityProfiles) {
              candidates.push(
                buildTypographyCandidate({
                  body2Profile,
                  bodyProfile,
                  headlineProfile,
                  personality,
                  snapshot,
                  subheadlineProfile,
                  utilityProfile,
                  variant: "seed",
                  venueProfile: venueProfiles[0] ?? utilityProfile,
                })
              );
            }
          }
        }
      }
    }
  }

  return dedupeTypographyCandidates(candidates);
}

function buildTypographyCandidate({
  bodyProfile,
  body2Profile,
  headlineProfile,
  personality,
  snapshot,
  subheadlineProfile,
  utilityProfile,
  variant,
  venueProfile,
}: {
  bodyProfile: FontProfile;
  body2Profile: FontProfile;
  headlineProfile: FontProfile;
  personality: TypePersonality;
  snapshot: CocoTypographySnapshot;
  subheadlineProfile: FontProfile;
  utilityProfile: FontProfile;
  variant: CandidateVariant;
  venueProfile: FontProfile;
}): TypographyCandidate {
  const centerLayout = snapshot.layoutId === "subject-center";
  const headlineBreak = chooseTypographyHeadlineBreak({
    format: snapshot.format,
    hasSubheadline: Boolean(cleanText(snapshot.text.script)),
    personality,
    text: cleanText(snapshot.text.headline) || snapshot.eventName || "EVENT NAME",
  });
  const treatment = headlineTreatment(personality, variant);
  const headline = {
    fontFamily: headlineProfile.family,
    glow: headlineGlow(personality, variant),
    letterSpacing: headlineTracking(personality, variant),
    lineHeight: headlineLineHeight(personality, variant),
    shadow: RESTRAINED_PERSONALITIES.has(personality) ? 0.34 : 0.5,
    sizeScale: headlineSizeScale(personality, snapshot.layoutId, variant),
    strokeWidth: headlineStrokeWidth(personality, treatment, variant),
    text: headlineBreak.text,
    transform: "uppercase" as const,
    treatment,
    weight: 900,
  };
  const subheadline = {
    fontFamily: subheadlineProfile.family,
    letterSpacing: SCRIPT_PERSONALITIES.has(personality) ? 0 : 0.015,
    lineHeight: SCRIPT_PERSONALITIES.has(personality) ? 0.82 : 0.88,
    sizeScale: subheadlineSizeScale(personality, snapshot.layoutId, variant),
    text: cleanText(snapshot.text.script),
    transform: "titlecase" as const,
    weight: SCRIPT_PERSONALITIES.has(personality) ? 500 : 800,
  };
  const details = supportLayer(bodyProfile.family, {
    centerLayout,
    lineHeight: 0.86,
    role: "details",
    sizeScale: centerLayout ? 0.62 : 0.58,
    tracking: 0.075,
    weight: RESTRAINED_PERSONALITIES.has(personality) ? 520 : 620,
  });
  const details2 = supportLayer(body2Profile.family, {
    centerLayout,
    lineHeight: 0.88,
    role: "details2",
    sizeScale: centerLayout ? 0.5 : 0.46,
    tracking: 0.09,
    weight: 430,
  });
  const venue = supportLayer(venueProfile.family, {
    centerLayout,
    lineHeight: 0.9,
    role: "venue",
    sizeScale: centerLayout ? 0.52 : 0.48,
    tracking: 0.11,
    weight: 520,
  });
  const presenter = supportLayer(utilityProfile.family, {
    centerLayout,
    lineHeight: 0.72,
    role: "presenter",
    sizeScale: centerLayout ? 0.78 : 0.84,
    tracking: 0.12,
    weight: 800,
  });
  const date = supportLayer(utilityProfile.family, {
    centerLayout,
    lineHeight: 0.76,
    role: "date",
    sizeScale: centerLayout ? 0.88 : 0.84,
    tracking: 0.01,
    weight: 850,
  });
  const price = supportLayer(utilityProfile.family, {
    centerLayout,
    lineHeight: 0.76,
    role: "price",
    sizeScale: centerLayout ? 0.86 : 0.82,
    tracking: 0.005,
    weight: 850,
  });
  const subtag = supportLayer(utilityProfile.family, {
    centerLayout,
    lineHeight: 0.8,
    role: "subtag",
    sizeScale: centerLayout ? 0.68 : 0.7,
    tracking: 0.035,
    weight: 750,
  });

  return {
    date,
    details,
    details2,
    headline,
    metadata: {
      mood: typographyMood(personality),
      personality,
    },
    presenter,
    price,
    subheadline,
    subtag,
    venue,
  };
}

function refineTypographyCandidate(candidate: CocoTypographyDecision, snapshot: CocoTypographySnapshot): TypographyCandidate[] {
  const variants: TypographyCandidate[] = [];
  const cleaner = cloneCandidate(candidate);
  cleaner.headline = {
    ...cleaner.headline,
    glow: Math.max(0.04, cleaner.headline.glow * 0.72),
    shadow: Math.max(0.28, cleaner.headline.shadow * 0.82),
    strokeWidth: Math.max(0, cleaner.headline.strokeWidth - 0.25),
    treatment: cleaner.headline.treatment === "distressed" ? "clean" : cleaner.headline.treatment,
  };
  cleaner.details2 = {
    ...cleaner.details2,
    sizeScale: Math.max(snapshot.layoutId === "subject-center" ? 0.48 : 0.42, cleaner.details2.sizeScale * 0.94),
    weight: Math.min(cleaner.details2.weight, 500),
  };
  variants.push(cleaner);

  const impact = cloneCandidate(candidate);
  const sideLayout = snapshot.layoutId !== "subject-center";
  const accentScaleCap = compositionAccentScaleCap(snapshot);
  impact.headline = {
    ...impact.headline,
    letterSpacing: Math.max(-0.055, impact.headline.letterSpacing - 0.01),
    shadow: Math.min(0.72, impact.headline.shadow + 0.08),
    sizeScale: Math.min(snapshot.layoutId === "subject-center" ? 1.24 : 1.16, impact.headline.sizeScale + 0.06),
  };
  impact.subheadline = {
    ...impact.subheadline,
    sizeScale: Math.min(accentScaleCap ?? (sideLayout ? 0.58 : 0.68), impact.subheadline.sizeScale + 0.025),
  };
  variants.push(impact);

  const premium = cloneCandidate(candidate);
  premium.headline = {
    ...premium.headline,
    glow: Math.min(premium.headline.glow, 0.12),
    letterSpacing: RESTRAINED_PERSONALITIES.has(premium.metadata.personality) ? 0.08 : premium.headline.letterSpacing,
    lineHeight: Math.max(0.84, premium.headline.lineHeight),
    shadow: Math.min(premium.headline.shadow, 0.4),
    strokeWidth: Math.min(premium.headline.strokeWidth, 0.35),
    treatment: RESTRAINED_PERSONALITIES.has(premium.metadata.personality) ? "serifLuxury" : premium.headline.treatment,
  };
  premium.venue = {
    ...premium.venue,
    letterSpacing: Math.max(0.04, premium.venue.letterSpacing),
    weight: Math.min(premium.venue.weight, 650),
  };
  variants.push(premium);

  return variants;
}

function scoreTypographyCandidate(candidate: TypographyCandidate, snapshot: CocoTypographySnapshot): CocoTypographyDecision {
  const scores: TypographyScores = {
    elegance: scoreElegance(candidate),
    eventMatch: scoreEventMatch(candidate, snapshot),
    fontPersonalityMatch: scoreFontPersonality(candidate),
    hierarchy: scoreHierarchy(candidate, snapshot),
    lineBreakQuality: scoreTypographyLineBreaks({
      format: snapshot.format,
      hasSubheadline: Boolean(cleanText(snapshot.text.script)),
      lines: cleanText(candidate.headline.text || snapshot.text.headline).split("\n").filter(Boolean),
      personality: candidate.metadata.personality,
      text: cleanText(candidate.headline.text || snapshot.text.headline) || snapshot.eventName,
    }),
    photographyMatch: scorePhotographyMatch(candidate, snapshot),
    premiumFeel: scorePremiumFeel(candidate, snapshot),
    readability: scoreReadability(candidate),
    rhythm: scoreRhythm(candidate, snapshot),
    total: 0,
    treatmentRestraint: scoreTreatmentRestraint(candidate),
    zoneFit: scoreZoneFit(candidate, snapshot),
  };
  scores.total = weightedScore([
    [scores.eventMatch, 0.13],
    [scores.fontPersonalityMatch, 0.12],
    [scores.hierarchy, 0.14],
    [scores.readability, 0.15],
    [scores.zoneFit, 0.14],
    [scores.rhythm, 0.09],
    [scores.lineBreakQuality, 0.09],
    [scores.premiumFeel, 0.08],
    [scores.treatmentRestraint, 0.04],
    [scores.photographyMatch, 0.02],
  ]);

  return {
    ...candidate,
    scores,
  };
}

function scoreEventMatch(candidate: TypographyCandidate, snapshot: CocoTypographySnapshot) {
  const style = snapshot.nightlifeStyle;
  const expected = style ? COCO_TYPE_PERSONALITY_BY_STYLE[style] ?? [] : inferTypographyPersonalities(snapshot);
  const position = expected.indexOf(candidate.metadata.personality);
  let score = position >= 0 ? 96 - position * 9 : 72;
  const event = `${snapshot.eventName} ${snapshot.text.headline ?? ""} ${snapshot.text.script ?? ""}`.toLowerCase();
  if (/(vip|luxe|luxury|black tie|champagne)/.test(event) && candidate.metadata.personality === "luxury") score += 8;
  if (/(rave|edm|bass|techno|neon)/.test(event) && HIGH_ENERGY_PERSONALITIES.has(candidate.metadata.personality)) score += 8;
  if (/(afro|afrobeats|island|sunset)/.test(event) && candidate.metadata.personality === "afrobeats") score += 8;
  if (/(latin|salsa|bachata|reggaeton)/.test(event) && candidate.metadata.personality === "latin") score += 8;
  const mood = snapshot.moodProfile;
  if (mood) {
    if (mood.primaryMood === "luxury" && candidate.metadata.personality === "luxury") score += 12;
    if (mood.primaryMood === "rnb" && (candidate.metadata.personality === "elegant" || candidate.metadata.personality === "luxury")) score += 9;
    if (mood.primaryMood === "latin" && candidate.metadata.personality === "latin") score += 12;
    if (mood.primaryMood === "afrobeats" && candidate.metadata.personality === "afrobeats") score += 12;
    if ((mood.primaryMood === "rave" || mood.primaryMood === "techno") && HIGH_ENERGY_PERSONALITIES.has(candidate.metadata.personality)) score += 10;
    if (mood.primaryMood === "hiphop" && candidate.metadata.personality === "aggressive") score += 10;
    if (mood.primaryMood === "pool" && (candidate.metadata.personality === "festival" || candidate.metadata.personality === "afrobeats")) score += 8;
    if (mood.primaryMood === "rooftop" && (candidate.metadata.personality === "editorial" || candidate.metadata.personality === "minimal")) score += 8;
    if (mood.vector.elegance > 75 && RESTRAINED_PERSONALITIES.has(candidate.metadata.personality)) score += 7;
    if (mood.vector.energy > 82 && HIGH_ENERGY_PERSONALITIES.has(candidate.metadata.personality)) score += 7;
    if (mood.vector.underground > 75 && (candidate.metadata.personality === "minimal" || candidate.metadata.personality === "aggressive")) score += 6;
  }
  return clamp(score, 0, 100);
}

function scoreFontPersonality(candidate: TypographyCandidate) {
  const personality = candidate.metadata.personality;
  return clamp(average([
    fontPersonalityMatch(candidate.headline.fontFamily, personality) * 1.5,
    fontPersonalityMatch(candidate.subheadline.fontFamily, personality),
    fontPersonalityMatch(candidate.details.fontFamily, personality),
    fontPersonalityMatch(candidate.details2.fontFamily, personality) * 0.85,
    fontPersonalityMatch(candidate.venue.fontFamily, personality),
  ]), 0, 100);
}

function visualPower(sizeScale: number, weight: number, area = 1) {
  return sizeScale * 100 + weight / 24 + area * 8;
}

function visualPowerForLayer(
  layer: TypographyLayerDecision,
  role: "accent" | "body" | "headline" | "metadata"
) {
  const sizeMultiplier =
    role === "headline" ? 72 :
    role === "accent" ? 45 :
    role === "body" ? 28 :
    24;
  const weightDivisor =
    role === "headline" ? 35 :
    role === "accent" ? 90 :
    role === "body" ? 140 :
    170;
  const headline = layer as TypographyHeadlineDecision;
  const effects =
    role === "headline"
      ? Math.max(0, Number(headline.strokeWidth) || 0) * 4 + Math.max(0, Number(headline.glow) || 0) * 6
      : 0;
  return clamp(layer.sizeScale * sizeMultiplier + layer.weight / weightDivisor + effects, 0, 120);
}

function maxPowerForCompositionRole(snapshot: CocoTypographySnapshot, role: string) {
  return snapshot.composition?.blocks?.find((block) => block.role === role)?.maxVisualPower;
}

function minPowerForCompositionRole(snapshot: CocoTypographySnapshot, role: string) {
  return snapshot.composition?.blocks?.find((block) => block.role === role)?.minVisualPower;
}

function scoreCompositionBlockPower(
  candidate: TypographyCandidate,
  snapshot: CocoTypographySnapshot,
  headlineVisualPower: number
) {
  let score = 0;
  const headlineMin = minPowerForCompositionRole(snapshot, "headline");
  const accentMax = maxPowerForCompositionRole(snapshot, "accent");
  const primaryMetaMax = maxPowerForCompositionRole(snapshot, "primaryMeta");
  const secondaryMetaMax = maxPowerForCompositionRole(snapshot, "secondaryMeta");
  const venueMax = maxPowerForCompositionRole(snapshot, "venue");
  const dateMax = maxPowerForCompositionRole(snapshot, "dateTime");

  if (Number.isFinite(headlineMin) && headlineVisualPower < Number(headlineMin)) {
    score -= Math.min(16, (Number(headlineMin) - headlineVisualPower) * 0.5);
  }

  const checks: Array<[number, number | undefined]> = [
    [visualPowerForLayer(candidate.subheadline, "accent"), accentMax],
    [visualPowerForLayer(candidate.details, "body"), primaryMetaMax],
    [visualPowerForLayer(candidate.details2, "metadata"), secondaryMetaMax],
    [visualPowerForLayer(candidate.venue, "metadata"), venueMax],
    [visualPowerForLayer(candidate.date, "metadata"), dateMax],
  ];

  checks.forEach(([actual, max]) => {
    if (!Number.isFinite(max)) return;
    if (actual > Number(max)) score -= Math.min(12, (actual - Number(max)) * 0.65);
    else score += 2;
  });

  return score;
}

function compositionAccentScaleCap(snapshot: CocoTypographySnapshot) {
  const ratio = snapshot.composition?.hierarchy?.accentPowerMaxRatio;
  if (!Number.isFinite(ratio)) return null;
  if (Number(ratio) <= 0.38) return snapshot.layoutId === "subject-center" ? 0.56 : 0.46;
  if (Number(ratio) <= 0.42) return snapshot.layoutId === "subject-center" ? 0.64 : 0.54;
  if (Number(ratio) <= 0.5) return snapshot.layoutId === "subject-center" ? 0.68 : 0.58;
  return snapshot.layoutId === "subject-center" ? 0.68 : 0.58;
}

function scoreHierarchy(candidate: TypographyCandidate, snapshot: CocoTypographySnapshot) {
  const sideLayout = snapshot.layoutId !== "subject-center";
  const compositionHierarchy = snapshot.composition?.hierarchy;
  const headlinePower = candidate.headline.sizeScale * 100 + candidate.headline.weight / 22;
  const subheadlinePower = candidate.subheadline.sizeScale * 74 + candidate.subheadline.weight / 44;
  const supportPower = candidate.details.sizeScale * 78 + candidate.details.weight / 42;
  const secondaryPower = candidate.details2.sizeScale * 72 + candidate.details2.weight / 52;
  const venuePower = candidate.venue.sizeScale * 64 + candidate.venue.weight / 56;
  const headlineVisualPower = visualPowerForLayer(candidate.headline, "headline");
  const accentVisualPower = visualPowerForLayer(candidate.subheadline, "accent");
  const bodyVisualPower = visualPowerForLayer(candidate.details, "body");
  const secondaryMetaVisualPower = visualPowerForLayer(candidate.details2, "metadata");
  const venueVisualPower = visualPowerForLayer(candidate.venue, "metadata");
  const strictHeadlinePower = visualPower(candidate.headline.sizeScale, candidate.headline.weight, 1.25);
  const strictAccentPower = visualPower(candidate.subheadline.sizeScale, candidate.subheadline.weight, 0.8);
  const strictBodyPower = visualPower(candidate.details.sizeScale, candidate.details.weight, 0.6);
  const strictBody2Power = visualPower(candidate.details2.sizeScale, candidate.details2.weight, 0.45);
  const strictVenuePower = visualPower(candidate.venue.sizeScale, candidate.venue.weight, 0.35);
  const accentMaxRatio = compositionHierarchy?.accentPowerMaxRatio ?? (sideLayout ? 0.48 : 0.58);
  const bodyMaxRatio = compositionHierarchy?.bodyPowerMaxRatio ?? (sideLayout ? 0.6 : 0.7);
  const metadataMaxRatio = compositionHierarchy?.metadataPowerMaxRatio ?? (sideLayout ? 0.5 : 0.62);
  const gates = snapshot.composition?.gates;
  let score = 88;

  if (compositionHierarchy) {
    if (headlineVisualPower < compositionHierarchy.headlinePowerMin) {
      score -= Math.min(22, (compositionHierarchy.headlinePowerMin - headlineVisualPower) * 0.6);
    }
    if (accentVisualPower > headlineVisualPower * accentMaxRatio && cleanText(candidate.subheadline.text)) {
      score -= Math.min(28, (accentVisualPower / Math.max(1, headlineVisualPower) - accentMaxRatio) * 95);
    }
    if (bodyVisualPower > headlineVisualPower * bodyMaxRatio) {
      score -= Math.min(22, (bodyVisualPower / Math.max(1, headlineVisualPower) - bodyMaxRatio) * 80);
    }
    if (secondaryMetaVisualPower > headlineVisualPower * metadataMaxRatio) {
      score -= Math.min(16, (secondaryMetaVisualPower / Math.max(1, headlineVisualPower) - metadataMaxRatio) * 75);
    }
    if (venueVisualPower > headlineVisualPower * metadataMaxRatio) {
      score -= Math.min(14, (venueVisualPower / Math.max(1, headlineVisualPower) - metadataMaxRatio) * 70);
    }
    score += scoreCompositionBlockPower(candidate, snapshot, headlineVisualPower);
  }

  if (gates) {
    if (headlineVisualPower <= accentVisualPower * gates.headlineOverScriptMin && cleanText(candidate.subheadline.text)) {
      score -= Math.min(30, (accentVisualPower * gates.headlineOverScriptMin - headlineVisualPower) * 0.75);
    }
    if (headlineVisualPower <= bodyVisualPower * gates.headlineOverBodyMin) {
      score -= Math.min(28, (bodyVisualPower * gates.headlineOverBodyMin - headlineVisualPower) * 0.65);
    }
    if (accentVisualPower > headlineVisualPower * gates.scriptMaxHeadlineRatio && cleanText(candidate.subheadline.text)) {
      score -= Math.min(24, (accentVisualPower / Math.max(1, headlineVisualPower) - gates.scriptMaxHeadlineRatio) * 90);
    }
    if (bodyVisualPower > headlineVisualPower * gates.detailsMaxHeadlineRatio) {
      score -= Math.min(20, (bodyVisualPower / Math.max(1, headlineVisualPower) - gates.detailsMaxHeadlineRatio) * 85);
    }
    if (venueVisualPower > headlineVisualPower * gates.venueMaxHeadlineRatio) {
      score -= Math.min(18, (venueVisualPower / Math.max(1, headlineVisualPower) - gates.venueMaxHeadlineRatio) * 80);
    }
  }

  if (strictAccentPower > strictHeadlinePower * 0.45 && cleanText(candidate.subheadline.text)) score -= 32;
  if (strictBodyPower > strictHeadlinePower * 0.3) score -= 28;
  if (strictBody2Power > strictHeadlinePower * 0.22) score -= 24;
  if (strictVenuePower > strictHeadlinePower * 0.22) score -= 16;
  if (candidate.details.sizeScale > 0.72) score -= 14;
  if (candidate.details.weight > 700) score -= 18;
  if (candidate.details.lineHeight > 1) score -= 12;
  if (candidate.details2.sizeScale > 0.56) score -= 14;
  if (candidate.details2.weight > 540) score -= 12;
  if (candidate.subheadline.sizeScale > 0.58 && snapshot.layoutId !== "subject-center") score -= 18;

  if (headlinePower < supportPower * 1.36) score -= 24;
  if (subheadlinePower > headlinePower * accentMaxRatio && cleanText(candidate.subheadline.text)) {
    score -= sideLayout ? 28 : 20;
  }
  if (candidate.subheadline.sizeScale > (sideLayout ? 0.68 : 0.9) && cleanText(candidate.subheadline.text)) score -= 12;
  if (candidate.details2.weight >= candidate.details.weight) score -= 18;
  if (secondaryPower > supportPower * 0.92) score -= 14;
  if (venuePower > supportPower * 0.92 && snapshot.layoutId === "subject-center") score -= 10;
  if (candidate.headline.sizeScale >= 1.08 && candidate.subheadline.sizeScale <= 0.86) score += 7;
  if (sideLayout) {
    if (candidate.details.sizeScale > 0.86) score -= 12;
    if (candidate.details2.sizeScale > 0.62) score -= 8;
    if (candidate.venue.sizeScale > 0.64) score -= 8;
  }
  if (snapshot.layoutId === "subject-center") {
    if (candidate.details.sizeScale > 0.96) score -= 10;
    if (candidate.details2.sizeScale > 0.68) score -= 12;
    if (candidate.venue.sizeScale > 0.74) score -= 8;
    if (candidate.details.weight - candidate.details2.weight < 180) score -= 12;
  }
  return clamp(score, 0, 100);
}

function scoreReadability(candidate: TypographyCandidate) {
  const headlineProfile = profileForFont(candidate.headline.fontFamily);
  const subheadlineProfile = profileForFont(candidate.subheadline.fontFamily);
  const bodyProfile = profileForFont(candidate.details.fontFamily);
  const body2Profile = profileForFont(candidate.details2.fontFamily);
  const utilityProfile = profileForFont(candidate.venue.fontFamily);
  let score = average([
    headlineProfile.readability * 1.2,
    subheadlineProfile.readability * 0.75,
    bodyProfile.readability,
    body2Profile.readability,
    utilityProfile.readability,
  ]);

  if (candidate.headline.lineHeight < 0.74) score -= 10;
  if (candidate.details.lineHeight < 0.7) score -= 9;
  if (candidate.headline.letterSpacing > 0.13 || candidate.headline.letterSpacing < -0.07) score -= 8;
  if (candidate.headline.glow > 0.38 && candidate.headline.strokeWidth < 0.2) score -= 7;
  if (isPoorSupportFont(candidate.details.fontFamily)) score -= 38;
  if (isPoorSupportFont(candidate.details2.fontFamily)) score -= 32;
  if (isPoorSupportFont(candidate.venue.fontFamily)) score -= 24;
  if (isPoorSupportFont(candidate.presenter.fontFamily)) score -= 18;
  if (
    cleanText(candidate.subheadline.text).length > 18 &&
    (subheadlineProfile.readability < 78 || DECORATIVE_SUPPORT_FONTS.has(candidate.subheadline.fontFamily))
  ) {
    score -= 10;
  }
  return clamp(score, 0, 100);
}

function scoreRhythm(candidate: TypographyCandidate, snapshot: CocoTypographySnapshot) {
  const centerLayout = snapshot.layoutId === "subject-center";
  const target = centerLayout
    ? { details2: 0.66, venue: 0.7, subtag: 0.78 }
    : { details2: 0.74, venue: 0.72, subtag: 0.82 };
  const detailsScale = Math.max(0.1, candidate.details.sizeScale);
  const ratios = {
    details2: candidate.details2.sizeScale / detailsScale,
    venue: candidate.venue.sizeScale / detailsScale,
    subtag: candidate.subtag.sizeScale / detailsScale,
  };
  const supportTracks = [
    candidate.details.letterSpacing,
    candidate.details2.letterSpacing,
    candidate.venue.letterSpacing,
    candidate.subtag.letterSpacing,
  ];
  let score =
    92 -
    Math.abs(ratios.details2 - target.details2) * 55 -
    Math.abs(ratios.venue - target.venue) * 48 -
    Math.abs(ratios.subtag - target.subtag) * 32 -
    standardDeviation(supportTracks) * 80;
  if (centerLayout && candidate.details.sizeScale - candidate.details2.sizeScale > 0.22) {
    score += 8;
  }
  if (!centerLayout && candidate.details.sizeScale - candidate.details2.sizeScale > 0.18) score += 5;
  if (candidate.presenter.letterSpacing >= 0.08) score += 4;
  return clamp(score, 0, 100);
}

function scoreZoneFit(candidate: TypographyCandidate, snapshot: CocoTypographySnapshot) {
  const checks = [
    scoreLayerZoneFit(cleanText(candidate.headline.text || snapshot.text.headline), snapshot.zones.headline, candidate.headline, "headline") * 1.35,
    scoreLayerZoneFit(cleanText(snapshot.text.script), snapshot.zones.script, candidate.subheadline, "headline2"),
    scoreLayerZoneFit(cleanText(snapshot.text.details), snapshot.zones.leftInfo, candidate.details, "body"),
    scoreLayerZoneFit(cleanText(snapshot.text.details2), snapshot.zones.rightInfo, candidate.details2, "body2"),
    scoreLayerZoneFit(cleanText(snapshot.text.venue), snapshot.zones.venue, candidate.venue, "venue"),
    scoreLayerZoneFit(cleanText(snapshot.text.presenter), snapshot.zones.presenter, candidate.presenter, "presenter"),
  ];
  return clamp(average(checks), 0, 100);
}

function scoreLayerZoneFit(
  text: string,
  zone: CocoTypographySnapshot["zones"]["headline"] | undefined,
  layer: TypographyLayerDecision,
  role: TypographyRole
) {
  if (!text || !zone) return 90;
  const lines = text.split("\n").filter(Boolean);
  const longest = Math.max(...lines.map((line) => line.length), text.length);
  const lineCount = Math.max(lines.length, Math.ceil(text.length / Math.max(8, zone.width * 0.82)));
  const profile = profileForFont(layer.fontFamily);
  const poorSupport = role !== "headline" && role !== "headline2" && isPoorSupportFont(layer.fontFamily);
  const accentPenalty = role === "headline2" && text.length > 18 && profile.readability < 78 ? 9 : 0;
  const poorSupportPenalty = poorSupport ? 24 : 0;
  const roleWidthFactor =
    role === "headline"
      ? 1.1
      : role === "headline2"
      ? 0.98
      : role === "presenter"
      ? 1.1
      : 0.82;
  const capacity = Math.max(1, zone.width * roleWidthFactor * Math.max(0.7, zone.height / 8));
  const fontFootprint =
    profile.readability >= 88
      ? 0.94
      : profile.readability >= 78
      ? 1
      : profile.readability >= 68
      ? 1.12
      : 1.24;
  const need = longest * layer.sizeScale * fontFootprint * (1 + Math.max(0, layer.letterSpacing) * 1.8);
  const widthPenalty = Math.max(0, need - capacity) * 1.65;
  const targetLineHeight = role === "headline" ? 8 : role === "headline2" ? 4.8 : 3.9;
  const heightNeed = lineCount * targetLineHeight * layer.sizeScale * layer.lineHeight;
  const heightPenalty = Math.max(0, heightNeed - zone.height) * 4.5;
  const maxLines = role === "headline" ? 3 : role === "headline2" ? 2 : role === "presenter" ? 2 : 4;
  const linePenalty = Math.max(0, lines.length - maxLines) * 10;
  return clamp(100 - widthPenalty - heightPenalty - poorSupportPenalty - accentPenalty - linePenalty, 0, 100);
}

function scoreElegance(candidate: TypographyCandidate) {
  const personality = candidate.metadata.personality;
  const headlineProfile = profileForFont(candidate.headline.fontFamily);
  const bodyProfile = profileForFont(candidate.details.fontFamily);
  let score = average([headlineProfile.elegance * 1.2, headlineProfile.luxury, bodyProfile.elegance]);
  if (RESTRAINED_PERSONALITIES.has(personality)) score += 8;
  if (candidate.headline.treatment === "serifLuxury") score += 8;
  if (candidate.headline.strokeWidth > 0.75 && RESTRAINED_PERSONALITIES.has(personality)) score -= 16;
  return clamp(score, 0, 100);
}

function scorePhotographyMatch(candidate: TypographyCandidate, snapshot: CocoTypographySnapshot) {
  if (!snapshot.photoMood) return 84;
  let score = 84;
  if (snapshot.photoMood.saturation === "vivid" && HIGH_ENERGY_PERSONALITIES.has(candidate.metadata.personality)) score += 8;
  if (snapshot.photoMood.brightness === "dark" && candidate.headline.glow > 0.08) score += 5;
  if (snapshot.photoMood.contrast === "low" && candidate.headline.strokeWidth > 0.15) score += 5;
  if (snapshot.photoMood.saturation === "muted" && candidate.headline.glow > 0.32) score -= 10;
  return clamp(score, 0, 100);
}

function scorePremiumFeel(candidate: TypographyCandidate, snapshot: CocoTypographySnapshot) {
  let score = 82;
  if (candidate.details.weight > candidate.details2.weight) score += 10;
  if (candidate.venue.fontFamily !== candidate.details.fontFamily || candidate.venue.letterSpacing > candidate.details.letterSpacing) score += 6;
  if (candidate.presenter.letterSpacing >= 0.08) score += 5;
  if (snapshot.layoutId === "subject-center" && candidate.details2.sizeScale <= 0.82) score += 4;
  if (candidate.headline.fontFamily === candidate.details.fontFamily) score -= 18;
  if (candidate.details.fontFamily === candidate.details2.fontFamily) score -= 24;
  if (candidate.details.fontFamily === candidate.venue.fontFamily) score -= 6;
  if (candidate.details2.sizeScale > candidate.details.sizeScale * 0.92) score -= 10;
  // Information typography should behave like a designed family: bold or
  // condensed for primary facts, then regular/light for explanatory copy.
  if (BOLD_BODY_FONTS.has(candidate.details.fontFamily)) score += 12;
  else if (REGULAR_BODY_FONTS.has(candidate.details.fontFamily)) score -= 8;
  if (REGULAR_BODY_FONTS.has(candidate.details2.fontFamily)) score += 12;
  else if (BOLD_BODY_FONTS.has(candidate.details2.fontFamily)) score -= 10;
  if (
    candidate.details.fontFamily.startsWith("LEMONMILK-") &&
    candidate.details2.fontFamily.startsWith("LEMONMILK-") &&
    candidate.details.fontFamily !== candidate.details2.fontFamily
  ) score += 8;
  return clamp(score, 0, 100);
}

function scoreTreatmentRestraint(candidate: TypographyCandidate) {
  const personality = candidate.metadata.personality;
  let score = 88;
  if (RESTRAINED_PERSONALITIES.has(personality)) {
    score -= candidate.headline.glow * 45;
    score -= candidate.headline.strokeWidth * 8;
  } else {
    if (candidate.headline.glow >= 0.12) score += 5;
    if (candidate.headline.strokeWidth <= 0.9) score += 4;
  }
  if (candidate.headline.treatment === "distressed" && personality !== "throwback" && personality !== "aggressive") score -= 16;
  if (candidate.headline.treatment === "serifLuxury" && !RESTRAINED_PERSONALITIES.has(personality)) score -= 10;
  return clamp(score, 0, 100);
}

function passesTypographyGates(scores: TypographyScores) {
  return scores.readability >= 64 && scores.zoneFit >= 60 && scores.hierarchy >= 60 && scores.lineBreakQuality >= 56;
}

function compareTypographyCandidates(a: CocoTypographyDecision, b: CocoTypographyDecision) {
  return b.scores.total - a.scores.total;
}

function inferTypographyPersonalities(snapshot: CocoTypographySnapshot): TypePersonality[] {
  const stylePersonalities = snapshot.nightlifeStyle
    ? COCO_TYPE_PERSONALITY_BY_STYLE[snapshot.nightlifeStyle] ?? []
    : [];
  const text = `${snapshot.eventName} ${snapshot.text.headline ?? ""} ${snapshot.text.script ?? ""}`.toLowerCase();
  const keywordPersonalities: TypePersonality[] = [];
  const mood = snapshot.moodProfile;

  if (mood) {
    if (mood.primaryMood === "luxury") keywordPersonalities.push("luxury", "elegant", "editorial", "minimal");
    if (mood.primaryMood === "rnb") keywordPersonalities.push("elegant", "luxury", "editorial");
    if (mood.primaryMood === "latin") keywordPersonalities.push("latin", "festival", "elegant");
    if (mood.primaryMood === "afrobeats") keywordPersonalities.push("afrobeats", "festival", "elegant");
    if (mood.primaryMood === "rave") keywordPersonalities.push("nightclub", "aggressive", "minimal");
    if (mood.primaryMood === "techno") keywordPersonalities.push("minimal", "aggressive", "nightclub");
    if (mood.primaryMood === "hiphop") keywordPersonalities.push("aggressive", "nightclub", "throwback");
    if (mood.primaryMood === "pool") keywordPersonalities.push("festival", "afrobeats", "elegant");
    if (mood.primaryMood === "rooftop") keywordPersonalities.push("editorial", "minimal", "luxury");
    if (mood.primaryMood === "throwback") keywordPersonalities.push("throwback", "aggressive", "nightclub");
    if (mood.vector.elegance > 76 || mood.vector.exclusivity > 78) keywordPersonalities.push("luxury", "elegant", "editorial");
    if (mood.vector.energy > 82) keywordPersonalities.push("aggressive", "nightclub");
    if (mood.vector.underground > 76) keywordPersonalities.push("minimal", "aggressive");
    if (mood.vector.summer > 72) keywordPersonalities.push("festival", "afrobeats");
  }

  if (/(vip|luxe|luxury|black tie|champagne|bottle)/.test(text)) keywordPersonalities.push("luxury", "minimal");
  if (/(ladies|girls|queen|baddie|brunch|r&b|rnb|lounge)/.test(text)) keywordPersonalities.push("elegant", "editorial");
  if (/(afro|afrobeats|island|tropical|sunset)/.test(text)) keywordPersonalities.push("afrobeats", "festival");
  if (/(latin|salsa|bachata|reggaeton)/.test(text)) keywordPersonalities.push("latin", "festival");
  if (/(hip.?hop|trap|rap|street)/.test(text)) keywordPersonalities.push("aggressive", "nightclub");
  if (/(throwback|retro|old school|90s|2000s|disco)/.test(text)) keywordPersonalities.push("throwback", "aggressive");
  if (/(rave|edm|techno|house|bass|afterhours|neon)/.test(text)) keywordPersonalities.push("nightclub", "aggressive", "minimal");
  if (/(rooftop|day party|dayparty)/.test(text)) keywordPersonalities.push("editorial", "minimal");

  return uniquePersonalities([
    ...stylePersonalities,
    ...keywordPersonalities,
    "nightclub",
    "editorial",
    "aggressive",
  ]).slice(0, 5);
}

function rankProfilesForRole(
  availableFonts: string[],
  fallbackFont: string,
  personality: TypePersonality,
  nightlifeStyle: CocoNightlifeStyle | null | undefined,
  role: TypographyRole
): FontProfile[] {
  const available = uniqueStrings([...availableFonts, fallbackFont]).filter(Boolean);
  const profiles = available.map(profileForFont);
  const roleProfiles = SUPPORT_ROLES.has(role)
    ? profiles.filter((profile) => isReadableSupportProfile(profile))
    : profiles;
  const usableProfiles = roleProfiles.length ? roleProfiles : profiles;
  return usableProfiles
    .map((profile) => ({
      profile,
      score: scoreProfileForRole(profile, personality, nightlifeStyle, role),
    }))
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.profile);
}

function scoreProfileForRole(
  profile: FontProfile,
  personality: TypePersonality,
  nightlifeStyle: CocoNightlifeStyle | null | undefined,
  role: TypographyRole
) {
  let score = profile.readability * 0.35;
  if (profile.personalities.includes(personality)) score += 34;
  if (nightlifeStyle && profile.bestFor.includes(nightlifeStyle)) score += 18;
  if (nightlifeStyle && profile.avoidFor.includes(nightlifeStyle)) score -= 48;

  if (role === "headline") {
    // Body-first faces may remain emergency fallbacks, but they should not
    // beat a real display face merely because their static readability is
    // excellent. A Coco headline must provide visible poster authority.
    if (BODY_FIRST_HEADLINE_PENALTY_FONTS.has(profile.family)) score -= 38;
    if (
      profile.energy >= 76 ||
      profile.aggression >= 72 ||
      (profile.luxury >= 78 && profile.elegance >= 76)
    ) score += 18;
    if (RESTRAINED_PERSONALITIES.has(personality)) score += profile.luxury * 0.24 + profile.elegance * 0.24;
    else score += profile.energy * 0.24 + profile.aggression * 0.22;
  } else if (role === "headline2") {
    score += profile.elegance * 0.25;
    if (SCRIPT_PERSONALITIES.has(personality)) score += profile.luxury * 0.1 + profile.energy * 0.08;
  } else if (role === "body" || role === "body2" || role === "venue") {
    score += profile.readability * 0.34 + profile.elegance * 0.1;
  } else {
    score += profile.readability * 0.24 + profile.energy * 0.12;
  }

  if (SUPPORT_ROLES.has(role)) {
    if (CLEAN_SUPPORT_FONTS.has(profile.family)) score += 34;
    if (DECORATIVE_SUPPORT_FONTS.has(profile.family)) score -= 90;
    if (profile.readability < 82) score -= 42;
    if (!isReadableSupportProfile(profile)) score -= 80;
  }
  if (role === "body" && ["Bebas Neue", "LEMONMILK-Bold", "LEMONMILK-Medium"].includes(profile.family)) {
    score += 28;
  }
  if (role === "body2" && ["LEMONMILK-Regular", "LEMONMILK-Light", "BebasNeue-Regular"].includes(profile.family)) {
    score += 28;
  }
  if (role === "venue" && ["LEMONMILK-Regular", "LEMONMILK-Light", "Bebas Neue"].includes(profile.family)) {
    score += 10;
  }

  if (role === "headline") {
    if (profile.readability < 68) score -= 18;
    if (!RESTRAINED_PERSONALITIES.has(personality) && profile.energy < 70) score -= 14;
  }

  return score;
}

function resolveFallbackFonts(snapshot: CocoTypographySnapshot, personality: TypePersonality) {
  const fallback = snapshot.fallbackFonts;
  const fallbackForPersonality = fallbackProfileForPersonality(personality);
  return {
    body: firstSafeCocoFont([fallback?.body, ...snapshot.availableFonts.body], "Bebas Neue"),
    body2: firstSafeCocoFont(
      [fallback?.body2, ...(snapshot.availableFonts.body2 ?? []), fallback?.utility],
      "LEMONMILK-Regular"
    ),
    headline: firstSafeCocoFont([fallback?.headline], fallbackForPersonality.headline),
    headline2: firstSafeCocoFont([fallback?.headline2], fallbackForPersonality.headline2),
    subtag: firstSafeCocoFont(
      [fallback?.subtag, fallback?.utility, ...(snapshot.availableFonts.subtag ?? [])],
      "Bebas Neue"
    ),
    utility: firstSafeCocoFont(
      [fallback?.utility, ...(snapshot.availableFonts.utility ?? []), ...snapshot.availableFonts.body],
      "Bebas Neue"
    ),
    venue: firstSafeCocoFont(
      [fallback?.venue, ...(snapshot.availableFonts.venue ?? []), fallback?.utility],
      "LEMONMILK-Light"
    ),
  };
}

function firstSafeCocoFont(candidates: Array<string | null | undefined>, fallback: string) {
  return candidates.find((family) => family && !isForbiddenCocoFlyerFont(family)) || fallback;
}

function isForbiddenCocoFlyerFont(fontFamily: string) {
  return fontFamily
    .split(",")
    .some(
      (family) => family.trim().replace(/^['"]|['"]$/g, "").toLowerCase() === "inter"
    );
}

function fallbackProfileForPersonality(personality: TypePersonality) {
  if (personality === "luxury" || personality === "elegant" || personality === "editorial") {
    return { headline: "Avigea", headline2: "OpenScript" };
  }
  if (personality === "minimal") return { headline: "LEMONMILK-Bold", headline2: "LEMONMILK-Regular" };
  if (personality === "afrobeats" || personality === "latin" || personality === "festival") {
    return { headline: "Tropical Avenue", headline2: "Good Brush" };
  }
  if (personality === "throwback") return { headline: "Monoton", headline2: "Good Brush" };
  return { headline: "Bebas Neue", headline2: "OpenScript" };
}

function availableFontsForRole(snapshot: CocoTypographySnapshot, role: TypographyRole) {
  if (role === "headline") return snapshot.availableFonts.headline;
  if (role === "headline2") return snapshot.availableFonts.headline2;
  if (role === "body") return snapshot.availableFonts.body;
  if (role === "body2") return snapshot.availableFonts.body2 ?? snapshot.availableFonts.body;
  if (role === "venue") return snapshot.availableFonts.venue ?? snapshot.availableFonts.body;
  if (role === "subtag") return snapshot.availableFonts.subtag ?? snapshot.availableFonts.body;
  return snapshot.availableFonts.utility ?? snapshot.availableFonts.body;
}

function supportLayer(
  fontFamily: string,
  input: {
    centerLayout: boolean;
    lineHeight: number;
    role: string;
    sizeScale: number;
    tracking: number;
    weight: number;
  }
): TypographyLayerDecision {
  return {
    fontFamily,
    letterSpacing: input.tracking,
    lineHeight: input.lineHeight,
    sizeScale: input.sizeScale,
    transform: "uppercase",
    weight: input.weight,
  };
}

function headlineTreatment(
  personality: TypePersonality,
  variant: CandidateVariant
): TypographyTreatment {
  if (variant === "premium" && RESTRAINED_PERSONALITIES.has(personality)) return "serifLuxury";
  if (personality === "luxury" || personality === "elegant") return "serifLuxury";
  if (personality === "throwback") return "distressed";
  if (personality === "aggressive") return "chrome";
  if (personality === "nightclub" || personality === "festival") return "glow";
  return "clean";
}

function headlineGlow(personality: TypePersonality, variant: CandidateVariant) {
  const base = RESTRAINED_PERSONALITIES.has(personality) ? 0.08 : personality === "aggressive" ? 0.2 : 0.26;
  if (variant === "cleaner") return base * 0.62;
  if (variant === "impact") return Math.min(0.42, base + 0.08);
  if (variant === "premium") return Math.min(base, 0.12);
  return base;
}

function headlineStrokeWidth(
  personality: TypePersonality,
  treatment: TypographyTreatment,
  variant: CandidateVariant
) {
  if (treatment === "serifLuxury") return variant === "impact" ? 0.35 : 0.15;
  if (treatment === "chrome") return variant === "impact" ? 0.75 : 0.48;
  if (treatment === "distressed") return 0.4;
  return HIGH_ENERGY_PERSONALITIES.has(personality) ? 0.32 : 0.18;
}

function headlineTracking(personality: TypePersonality, variant: CandidateVariant) {
  let value = -0.025;
  if (personality === "luxury" || personality === "elegant") value = 0.075;
  if (personality === "editorial" || personality === "minimal") value = 0.055;
  if (personality === "aggressive" || personality === "nightclub") value = -0.035;
  if (personality === "afrobeats" || personality === "latin" || personality === "festival") value = 0.005;
  if (variant === "impact") value -= 0.01;
  if (variant === "premium" && value < 0.04) value = 0.04;
  return clamp(value, -0.06, 0.13);
}

function headlineLineHeight(personality: TypePersonality, variant: CandidateVariant) {
  let value = RESTRAINED_PERSONALITIES.has(personality) ? 0.9 : 0.78;
  if (personality === "aggressive" || personality === "nightclub") value = 0.76;
  if (personality === "afrobeats" || personality === "latin") value = 0.82;
  if (variant === "premium") value = Math.max(value, 0.86);
  return value;
}

function headlineSizeScale(
  personality: TypePersonality,
  layoutId: CocoTypographySnapshot["layoutId"],
  variant: CandidateVariant
) {
  const centerLayout = layoutId === "subject-center";
  let scale = centerLayout ? 1.1 : 1.03;
  if (personality === "aggressive" || personality === "nightclub" || personality === "throwback") scale += 0.06;
  if (personality === "luxury" || personality === "minimal") scale -= centerLayout ? 0.03 : 0.01;
  if (personality === "afrobeats" || personality === "latin" || personality === "festival") scale += 0.03;
  if (variant === "impact") scale += 0.04;
  if (variant === "premium") scale -= 0.02;
  return clamp(scale, 0.9, centerLayout ? 1.24 : 1.16);
}

function subheadlineSizeScale(
  personality: TypePersonality,
  layoutId: CocoTypographySnapshot["layoutId"],
  variant: CandidateVariant
) {
  const centerLayout = layoutId === "subject-center";
  let scale = centerLayout ? 0.58 : 0.5;
  if (SCRIPT_PERSONALITIES.has(personality)) scale += 0.04;
  if (personality === "minimal") scale -= 0.04;
  if (variant === "impact") scale += 0.025;
  if (variant === "premium") scale -= 0.035;
  return clamp(scale, 0.38, centerLayout ? 0.68 : 0.58);
}

function typographyMood(personality: TypePersonality) {
  if (personality === "luxury") return "restrained luxury";
  if (personality === "elegant") return "elegant nightlife";
  if (personality === "editorial") return "editorial";
  if (personality === "minimal") return "minimal club";
  if (personality === "aggressive") return "high-impact poster";
  if (personality === "afrobeats") return "warm festival";
  if (personality === "latin") return "warm rhythmic";
  if (personality === "throwback") return "retro impact";
  return "club energy";
}

function profileForFont(family: string): FontProfile {
  const normalized = family.toLowerCase();
  const found = COCO_FONT_PROFILES.find((profile) => profile.family.toLowerCase() === normalized);
  if (found) return found;
  return inferUnknownFontProfile(family);
}

function fontPersonalityMatch(family: string, personality: TypePersonality) {
  const profile = profileForFont(family);
  let score = profile.personalities.includes(personality) ? 96 : 72;
  if (RESTRAINED_PERSONALITIES.has(personality)) score += (profile.elegance + profile.luxury - 120) * 0.18;
  else score += (profile.energy + profile.aggression - 120) * 0.16;
  return clamp(score, 0, 100);
}

function isPoorSupportFont(family: string) {
  return (
    DECORATIVE_SUPPORT_FONTS.has(family) ||
    !CLEAN_SUPPORT_FONTS.has(family)
  );
}

function isReadableSupportProfile(profile: FontProfile) {
  if (DECORATIVE_SUPPORT_FONTS.has(profile.family)) return false;
  return CLEAN_SUPPORT_FONTS.has(profile.family);
}

function inferUnknownFontProfile(family: string): FontProfile {
  const normalized = family.toLowerCase();
  const cleanSupport =
    /(lemonmilk|bebas|coolvetica)/.test(normalized);
  const scriptOrBrush =
    /(script|brush|paint|adelia|aqilah|asectica|bigtimes|mitshuka|lacheyard|maglisto|vartigo|flamingo|brich|hollywood)/.test(normalized);
  const techOrNovelty =
    /(alien|galax|game|squid|glitch|digital|pixel|minecrafter|mandalore|techno|tr2n|dune|azonix|cubic|edge|broken|glass|grunge|coma|horror|satan|rage|payback|raider|oups|nancy|edosz)/.test(normalized);
  const condensedDisplay =
    /(anton|expanded|heavy|bold|college|dimitri|designer|tropical|african|chetta|monoton)/.test(normalized);

  if (cleanSupport) {
    return {
      aggression: 38,
      avoidFor: [],
      bestFor: ["general-nightlife", "rooftop", "house"],
      elegance: 66,
      energy: 58,
      family,
      luxury: 60,
      personalities: ["minimal", "editorial", "nightclub"],
      readability: 88,
    };
  }

  if (scriptOrBrush) {
    return {
      aggression: 18,
      avoidFor: ["techno", "edm"],
      bestFor: ["ladies-night", "rnb-lounge", "brunch"],
      elegance: 74,
      energy: 54,
      family,
      luxury: 72,
      personalities: ["elegant", "luxury", "festival"],
      readability: 58,
    };
  }

  if (techOrNovelty) {
    return {
      aggression: 82,
      avoidFor: ["luxury-club", "rooftop", "rnb-lounge"],
      bestFor: ["edm", "techno", "hip-hop"],
      elegance: 28,
      energy: 86,
      family,
      luxury: 34,
      personalities: ["aggressive", "nightclub"],
      readability: 56,
    };
  }

  if (condensedDisplay) {
    return {
      aggression: 58,
      avoidFor: [],
      bestFor: ["general-nightlife", "hip-hop"],
      elegance: 42,
      energy: 78,
      family,
      luxury: 48,
      personalities: ["nightclub", "aggressive"],
      readability: 78,
    };
  }

  return {
    ...FALLBACK_PROFILE,
    family,
  };
}

function cloneCandidate(candidate: TypographyCandidate): TypographyCandidate {
  return {
    date: { ...candidate.date },
    details: { ...candidate.details },
    details2: { ...candidate.details2 },
    headline: { ...candidate.headline },
    metadata: { ...candidate.metadata },
    presenter: { ...candidate.presenter },
    price: { ...candidate.price },
    subheadline: { ...candidate.subheadline },
    subtag: { ...candidate.subtag },
    venue: { ...candidate.venue },
  };
}

function buildFallbackCandidate(snapshot: CocoTypographySnapshot): TypographyCandidate {
  const personality = inferTypographyPersonalities(snapshot)[0] ?? "nightclub";
  const fallbackFonts = resolveFallbackFonts(snapshot, personality);
  return buildTypographyCandidate({
    bodyProfile: profileForFont(fallbackFonts.body),
    body2Profile: profileForFont(fallbackFonts.body2),
    headlineProfile: profileForFont(fallbackFonts.headline),
    personality,
    snapshot,
    subheadlineProfile: profileForFont(fallbackFonts.headline2),
    utilityProfile: profileForFont(fallbackFonts.utility),
    variant: "seed",
    venueProfile: profileForFont(fallbackFonts.venue),
  });
}

function dedupeTypographyCandidates(candidates: TypographyCandidate[]) {
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    const key = [
      candidate.metadata.personality,
      candidate.headline.fontFamily,
      candidate.subheadline.fontFamily,
      candidate.details.fontFamily,
      candidate.details2.fontFamily,
      candidate.venue.fontFamily,
      candidate.headline.text,
    ].join("|").toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function uniquePersonalities(values: TypePersonality[]) {
  return values.filter((value, index) => values.indexOf(value) === index);
}

function uniqueStrings(values: string[]) {
  return values.filter(
    (value, index) =>
      value && !isForbiddenCocoFlyerFont(value) && values.indexOf(value) === index
  );
}

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function weightedScore(values: Array<[number, number]>) {
  const totalWeight = values.reduce((sum, [, weight]) => sum + weight, 0);
  if (totalWeight <= 0) return 0;
  return clamp(values.reduce((sum, [value, weight]) => sum + value * weight, 0) / totalWeight, 0, 100);
}

function average(values: number[]) {
  const filtered = values.filter((value) => Number.isFinite(value));
  if (!filtered.length) return 0;
  return filtered.reduce((sum, value) => sum + value, 0) / filtered.length;
}

function standardDeviation(values: number[]) {
  if (!values.length) return 0;
  const avg = average(values);
  return Math.sqrt(values.reduce((sum, value) => sum + Math.pow(value - avg, 2), 0) / values.length);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
