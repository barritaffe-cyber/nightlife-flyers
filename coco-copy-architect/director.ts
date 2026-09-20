import type {
  CopyArchitectInput,
  CopyArchitectResult,
  CopyArchitectureCandidate,
} from "./types.ts";
import { normalizeCopyInput } from "./normalize.ts";
import { extractCopyFacts } from "./facts.ts";
import { inferCopyTone } from "./tone.ts";
import { recommendPatterns } from "./patterns.ts";
import { buildCopyCandidate } from "./candidateBuilder.ts";
import { stableSort } from "./utils.ts";
import { validateCopyArchitectInput, validateCopyArchitecture } from "./validate.ts";

export function architectCocoCopy(input: CopyArchitectInput): CopyArchitectResult {
  const inputErrors = validateCopyArchitectInput(input);
  if (inputErrors.length) {
    throw new Error(`Invalid Coco Copy Architect input:\n${inputErrors.join("\n")}`);
  }

  const normalized = normalizeCopyInput(input);
  const facts = extractCopyFacts(normalized);
  const tone = inferCopyTone(input);
  const patterns = recommendPatterns(input);

  const candidates = patterns.map((pattern, index) =>
    buildCopyCandidate(input, facts, pattern, tone, index)
  );

  const adjusted = candidates.map((candidate) => applyLearningAndPreferences(input, candidate));
  const ranked = stableSort(adjusted, compareCandidates);
  const finalists = ranked.slice(0, 3);
  const winner = chooseHeadToHead(finalists) ?? ranked[0];

  if (!winner) throw new Error("Coco Copy Architect produced no candidates.");

  const winnerErrors = validateCopyArchitecture(winner);
  if (winnerErrors.length) {
    throw new Error(`Invalid winning copy architecture:\n${winnerErrors.join("\n")}`);
  }

  const rejected = ranked.slice(3).map((candidate) => ({
    id: candidate.id,
    reason: rejectionReason(candidate, winner),
  }));

  const ownsSources = uniqueSources(
    winner.groups
      .filter((group) => group.treatment !== "hide")
      .flatMap((group) => group.sources)
  );

  const hiddenSources = uniqueSources(
    winner.groups
      .filter((group) => group.treatment === "hide")
      .flatMap((group) => group.sources)
  );

  const mergedSources = uniqueSources(
    winner.groups
      .filter((group) => group.mergePolicy !== "none" || group.treatment === "merge")
      .flatMap((group) => group.sources)
  );

  return {
    winner,
    finalists,
    candidates: ranked,
    rejected,
    normalized,
    facts,
    authority: {
      architectureId: winner.id,
      ownsSources,
      hiddenSources,
      mergedSources,
      downstreamMustObey: [
        "group order",
        "group treatment",
        "group text",
        "line limits",
        "power ratios",
        "source ownership",
        "hidden sources",
        "preview/export parity",
      ],
    },
    trace: [
      {
        stage: "normalize",
        decision: `Normalized ${normalized.filter((field) => !field.empty).length} non-empty fields.`,
        confidence: 0.96,
        evidence: normalized.filter((field) => !field.empty).map((field) => `${field.source}: ${field.text}`),
      },
      {
        stage: "facts",
        decision: `Extracted ${facts.length} semantic facts.`,
        confidence: 0.9,
        evidence: facts.map((fact) => `${fact.category}: ${fact.text}`),
      },
      {
        stage: "tone",
        decision: `Selected ${tone} copy tone.`,
        confidence: 0.86,
        evidence: [input.scene?.creativeDecisions?.story ?? "", input.creativeDirection?.posterIdentity ?? ""].filter(Boolean),
      },
      {
        stage: "winner",
        decision: `Selected ${winner.pattern} with score ${winner.score.total}.`,
        confidence: winner.score.total / 100,
        evidence: [
          `Clarity ${winner.score.clarity}`,
          `Hierarchy ${winner.score.hierarchy}`,
          `Density ${winner.score.densityControl}`,
          `Premium ${winner.score.premiumPotential}`,
        ],
      },
    ],
  };
}

function applyLearningAndPreferences(
  input: CopyArchitectInput,
  candidate: CopyArchitectureCandidate
): CopyArchitectureCandidate {
  let total = candidate.score.total;

  if (input.learning?.acceptedPatterns?.includes(candidate.pattern)) total += 5;
  if (input.learning?.rejectedPatterns?.includes(candidate.pattern)) total -= 12;

  if (input.userPreferences?.preserveOriginalCopy) {
    const rewritten = candidate.groups.some((group) => group.mergePolicy !== "none");
    if (rewritten) total -= 3;
  }

  if (input.userPreferences?.allowHiding === false) {
    const hidden = candidate.groups.filter((group) => group.treatment === "hide" && group.text).length;
    total -= hidden * 3;
  }

  return {
    ...candidate,
    score: {
      ...candidate.score,
      total: Math.max(0, Math.min(100, Math.round(total * 10) / 10)),
    },
  };
}

function compareCandidates(a: CopyArchitectureCandidate, b: CopyArchitectureCandidate): number {
  return (
    b.score.total - a.score.total ||
    b.score.hierarchy - a.score.hierarchy ||
    b.score.clarity - a.score.clarity ||
    b.score.densityControl - a.score.densityControl ||
    b.score.premiumPotential - a.score.premiumPotential
  );
}

function chooseHeadToHead(finalists: CopyArchitectureCandidate[]): CopyArchitectureCandidate | null {
  if (!finalists.length) return null;
  return finalists.slice(1).reduce((winner, challenger) => {
    const keys: Array<keyof CopyArchitectureCandidate["score"]> = [
      "clarity",
      "hierarchy",
      "densityControl",
      "rhythm",
      "premiumPotential",
      "marketingFit",
      "renderability",
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

function rejectionReason(candidate: CopyArchitectureCandidate, winner: CopyArchitectureCandidate): string {
  const differences = [
    ["clarity", winner.score.clarity - candidate.score.clarity],
    ["hierarchy", winner.score.hierarchy - candidate.score.hierarchy],
    ["density", winner.score.densityControl - candidate.score.densityControl],
    ["premium", winner.score.premiumPotential - candidate.score.premiumPotential],
    ["renderability", winner.score.renderability - candidate.score.renderability],
  ] as const;
  const largest = [...differences].sort((a, b) => b[1] - a[1])[0];
  return `${candidate.pattern} lost mainly on ${largest[0]} by ${largest[1].toFixed(1)} points.`;
}

function uniqueSources(values: any[]): any[] {
  return values.filter((value, index) => values.indexOf(value) === index);
}
