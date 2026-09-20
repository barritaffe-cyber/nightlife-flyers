import type {
  TypographyDirectorInput,
  TypographyDirectorResult,
  TypographySystem,
} from "./types.ts";
import { normalizeAvailableFonts } from "./normalizeFonts.ts";
import { buildTypographyCandidate } from "./candidateBuilder.ts";
import { stableSort } from "./utils.ts";
import { validateTypographyDirectorInput, validateTypographySystem } from "./validate.ts";

export function directCocoTypography(input: TypographyDirectorInput): TypographyDirectorResult {
  const inputErrors = validateTypographyDirectorInput(input);
  if (inputErrors.length) {
    throw new Error(`Invalid Coco Typography Director input:\n${inputErrors.join("\n")}`);
  }

  const normalizedFonts = normalizeAvailableFonts(input.availableFonts);
  if (!normalizedFonts.length) throw new Error("No available fonts were supplied.");

  const candidates = Array.from({ length: Math.min(18, Math.max(6, normalizedFonts.length)) }, (_, index) =>
    buildTypographyCandidate(input, normalizedFonts, index)
  );

  const adjusted = candidates.map((candidate) => applyLearningAndPreferences(input, candidate));
  // compareSystems (below) never penalizes "too many font families" as a
  // scoring factor, so a candidate that violates it could still rank #1,
  // get selected as the winner, and then fail validateTypographySystem's
  // stricter check below and throw - the same "picks a winner, then
  // rejects its own winner" crash fixed in coco-composition-director.
  // Filtering it out before ranking means only candidates the final check
  // can actually accept are ever eligible to win, with a safe fallback to
  // the unfiltered pool if literally none qualify.
  const eligible = adjusted.filter((candidate) => candidate.fontFamilies.length <= candidate.maxFontFamilies);
  // Falling back to the raw unfiltered pool here doesn't actually help once
  // eligible is empty (a content-dense flyer where every independently-
  // ranked candidate happens to use 3+ font families) - the same throw
  // above still fires downstream, just later. Repairing the single
  // best-scoring candidate (reusing its own headline/accent family for any
  // role that pulled in an extra one) keeps the crash from happening at all
  // while leaving every OTHER, already-compliant candidate - and which one
  // of THEM wins - completely untouched.
  const pool = eligible.length ? eligible : [repairFontFamilies(stableSort(adjusted, compareSystems)[0])];
  const ranked = stableSort(pool, compareSystems);
  const finalists = ranked.slice(0, 3);
  const winner = chooseHeadToHead(finalists) ?? ranked[0];

  if (!winner) throw new Error("Coco Typography Director produced no candidates.");

  const winnerErrors = validateTypographySystem(winner);
  if (winnerErrors.length) {
    throw new Error(`Invalid winning typography system:\n${winnerErrors.join("\n")}`);
  }

  const roles = [
    winner.headline,
    winner.accent,
    winner.metadata,
    winner.dateTime,
    winner.venue,
    winner.badge,
    winner.presenter,
    winner.footer,
  ].filter(Boolean).map((layer) => layer!.role);

  return {
    winner,
    finalists,
    candidates: ranked,
    rejected: ranked.slice(3).map((candidate) => ({
      id: candidate.id,
      reason: rejectionReason(candidate, winner),
    })),
    normalizedFonts,
    authority: {
      typographySystemId: winner.id,
      ownsRoles: roles,
      maxFontFamilies: winner.maxFontFamilies,
      downstreamMustObey: [
        "font family",
        "fallback family",
        "size scale",
        "weight",
        "tracking",
        "line height",
        "case",
        "alignment",
        "visual power",
        "effects",
        "spacing",
        "signature move",
        "preview/export parity",
      ],
    },
    trace: [
      {
        stage: "fonts",
        decision: `Normalized ${normalizedFonts.length} available fonts.`,
        confidence: 0.98,
        evidence: normalizedFonts.map((font) => `${font.family}:${font.category}`),
      },
      {
        stage: "candidates",
        decision: `Generated ${ranked.length} typography systems.`,
        confidence: 0.9,
        evidence: ranked.slice(0, 5).map((candidate) => `${candidate.name}:${candidate.score.total}`),
      },
      {
        stage: "winner",
        decision: `Selected ${winner.name}.`,
        confidence: winner.score.total / 100,
        evidence: [
          `Hierarchy ${winner.score.hierarchy}`,
          `Readability ${winner.score.readability}`,
          `Pairing ${winner.score.pairingQuality}`,
          `Premium ${winner.score.premiumPotential}`,
        ],
      },
    ],
  };
}

// Only ever called on the single best-scoring candidate, and only when
// every candidate violated the family limit - reuses the headline's own
// (or, failing that, the accent's) font identity on whichever roles pulled
// in an extra family, touching only fontFamily/fallbackFamilies/category
// (the font-identity fields) so each layer's own text, size, tracking, etc.
// stay exactly as originally chosen for that role.
function repairFontFamilies(system: TypographySystem): TypographySystem {
  if (system.fontFamilies.length <= system.maxFontFamilies) return system;
  const allowed = system.fontFamilies.slice(0, Math.max(1, system.maxFontFamilies));
  const donors: Record<string, TypographySystem["headline"]> = { [system.headline.fontFamily]: system.headline };
  if (system.accent) donors[system.accent.fontFamily] = system.accent;
  const fallbackDonor = system.headline;
  const repairLayer = <T extends TypographySystem["headline"] | undefined>(layer: T): T => {
    if (!layer || allowed.includes(layer.fontFamily)) return layer;
    const donor = donors[allowed[0]] ?? fallbackDonor;
    return { ...layer, fontFamily: donor.fontFamily, fallbackFamilies: donor.fallbackFamilies, category: donor.category };
  };
  const repaired: TypographySystem = {
    ...system,
    accent: repairLayer(system.accent),
    metadata: repairLayer(system.metadata),
    dateTime: repairLayer(system.dateTime),
    venue: repairLayer(system.venue),
    badge: repairLayer(system.badge),
    presenter: repairLayer(system.presenter),
    footer: repairLayer(system.footer),
  };
  repaired.fontFamilies = Array.from(
    new Set([repaired.headline, repaired.accent, repaired.metadata, repaired.dateTime, repaired.venue, repaired.badge, repaired.presenter, repaired.footer]
      .filter(Boolean)
      .map((layer) => layer!.fontFamily))
  );
  return repaired;
}

function applyLearningAndPreferences(
  input: TypographyDirectorInput,
  system: TypographySystem
): TypographySystem {
  let total = system.score.total;
  const pair = [system.headline.fontFamily, system.accent?.fontFamily ?? system.metadata?.fontFamily]
    .filter(Boolean)
    .join(" + ");

  if (input.learning?.acceptedFontPairs?.includes(pair)) total += 5;
  if (input.learning?.rejectedFontPairs?.includes(pair)) total -= 12;
  if (input.learning?.preferredHeadlinePersonality === system.headline.personality) total += 4;
  if (input.learning?.preferredAccentPersonality === system.accent?.personality) total += 3;

  if (input.userPreferences?.preferredHeadlineFonts?.includes(system.headline.fontFamily)) total += 4;
  if (system.accent && input.userPreferences?.preferredAccentFonts?.includes(system.accent.fontFamily)) total += 3;
  if (system.fontFamilies.length > (input.userPreferences?.maxFontFamilies ?? system.maxFontFamilies)) total -= 15;

  return {
    ...system,
    score: {
      ...system.score,
      total: Math.max(0, Math.min(100, Math.round(total * 10) / 10)),
    },
  };
}

function compareSystems(a: TypographySystem, b: TypographySystem): number {
  return (
    b.score.total - a.score.total ||
    b.score.hierarchy - a.score.hierarchy ||
    b.score.readability - a.score.readability ||
    b.score.pairingQuality - a.score.pairingQuality ||
    b.score.premiumPotential - a.score.premiumPotential
  );
}

function chooseHeadToHead(finalists: TypographySystem[]): TypographySystem | null {
  if (!finalists.length) return null;
  return finalists.slice(1).reduce((winner, challenger) => {
    const keys: Array<keyof TypographySystem["score"]> = [
      "hierarchy",
      "readability",
      "moodFit",
      "compositionFit",
      "pairingQuality",
      "premiumPotential",
      "total",
    ];
    let winnerVotes = 0;
    let challengerVotes = 0;

    for (const key of keys) {
      if (winner.score[key] > challenger.score[key]) winnerVotes++;
      if (challenger.score[key] > winner.score[key]) challengerVotes++;
    }
    return challengerVotes > winnerVotes ? challenger : winner;
  }, finalists[0]);
}

function rejectionReason(candidate: TypographySystem, winner: TypographySystem): string {
  const differences = [
    ["hierarchy", winner.score.hierarchy - candidate.score.hierarchy],
    ["readability", winner.score.readability - candidate.score.readability],
    ["pairing", winner.score.pairingQuality - candidate.score.pairingQuality],
    ["premium", winner.score.premiumPotential - candidate.score.premiumPotential],
    ["composition fit", winner.score.compositionFit - candidate.score.compositionFit],
  ] as const;
  const largest = [...differences].sort((a, b) => b[1] - a[1])[0];
  return `${candidate.name} lost mainly on ${largest[0]} by ${largest[1].toFixed(1)} points.`;
}
