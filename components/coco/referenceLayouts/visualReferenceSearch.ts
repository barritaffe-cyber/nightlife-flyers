import type { OptimizedVisualTemplateReference } from "./optimizedVisualReferences.ts";

export type VisualReferenceCandidate = {
  id: string;
  imageUrl: string;
};

export type VisualReferenceJudgment = {
  id: string;
  score: number;
  reason: string;
  profile: {
    balance: "asymmetric" | "centered" | "split";
    density: "low" | "medium" | "high";
    headlineMass: "light" | "medium" | "dominant";
    subjectInteraction: "avoid" | "frame" | "overlap";
    subjectPosition?: "left" | "center" | "right" | "none";
    facePosition?: "left" | "center" | "right" | "none";
  };
};

export type VisualReferenceAnalysisInput = {
  currentCanvasImage: string;
  creativeBrief: string;
  references: VisualReferenceCandidate[];
};

export type VisualReferenceAnalyzer = (
  input: VisualReferenceAnalysisInput
) => Promise<readonly VisualReferenceJudgment[]>;

export type RankedVisualReference = VisualReferenceCandidate &
  Omit<VisualReferenceJudgment, "id"> & {
    rank: number;
  };

export type HydratedCompositionReference = RankedVisualReference & {
  construction: OptimizedVisualTemplateReference["construction"];
  template: OptimizedVisualTemplateReference["template"];
  templateId: string;
};

// Phase one is intentionally incapable of exposing template construction.
// The analyzer sees finished pixels and stable visual ids only.
export async function rankFinishedVisualReferences(input: {
  analyzer: VisualReferenceAnalyzer;
  catalog: readonly OptimizedVisualTemplateReference[];
  creativeBrief: string;
  currentCanvasImage: string;
  limit?: number;
}): Promise<RankedVisualReference[]> {
  const visualCandidates = input.catalog.map(({ id, imageUrl }) => ({ id, imageUrl }));
  const candidateById = new Map(visualCandidates.map((candidate) => [candidate.id, candidate]));
  const raw = await input.analyzer({
    currentCanvasImage: input.currentCanvasImage,
    creativeBrief: input.creativeBrief,
    references: visualCandidates,
  });
  const seen = new Set<string>();
  const ranked = raw
    .filter((judgment) => candidateById.has(judgment.id) && !seen.has(judgment.id))
    .map((judgment) => {
      seen.add(judgment.id);
      return {
        ...candidateById.get(judgment.id)!,
        ...judgment,
        score: Math.max(0, Math.min(100, Number(judgment.score) || 0)),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, input.limit ?? 5))
    .map((judgment, index) => ({ ...judgment, rank: index + 1 }));

  if (!ranked.length) {
    throw new Error("Visual reference analysis returned no registered finished-flyer ids.");
  }
  return ranked;
}

// Phase two runs only after vision has selected finished flyers. It reveals
// construction for those visual ids and cannot introduce a template that
// was not present in the visual ranking.
export function hydrateSelectedReferenceConstruction(
  ranked: readonly RankedVisualReference[],
  catalog: readonly OptimizedVisualTemplateReference[]
): HydratedCompositionReference[] {
  const catalogByVisualId = new Map(catalog.map((reference) => [reference.id, reference]));
  return ranked.map((visual) => {
    const reference = catalogByVisualId.get(visual.id);
    if (!reference) {
      throw new Error(`Selected visual reference ${visual.id} is no longer in the catalog.`);
    }
    return {
      ...visual,
      profile: {
        ...visual.profile,
        subjectPosition: reference.subjectPosition,
      },
      templateId: reference.templateId,
      template: reference.template,
      construction: reference.construction,
    };
  });
}
