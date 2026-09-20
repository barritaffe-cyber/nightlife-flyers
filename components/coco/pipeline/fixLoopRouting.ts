import type { ArtDirectorCategory } from "../../../coco-art-director/index.ts";

export type FixLoopOwner = "color" | "typography" | "composition" | "not-auto-fixable";

// coco/copy and coco/effects have owning directors (coco-copy-architect,
// effectsDirector) but regenerating them isn't wired up yet — treat as
// not-auto-fixable for now rather than silently doing nothing useful.
const CATEGORY_OWNER: Record<ArtDirectorCategory, FixLoopOwner> = {
  alignment: "composition",
  balance: "composition",
  brandFit: "not-auto-fixable",
  color: "color",
  composition: "composition",
  contrast: "color",
  copy: "not-auto-fixable",
  effects: "not-auto-fixable",
  exportIntegrity: "not-auto-fixable",
  hierarchy: "composition",
  informationDensity: "not-auto-fixable",
  marketingClarity: "not-auto-fixable",
  originality: "not-auto-fixable",
  premiumPolish: "not-auto-fixable",
  readability: "typography",
  rhythm: "composition",
  sceneInteraction: "not-auto-fixable",
  spacing: "composition",
  subjectProtection: "not-auto-fixable",
  typography: "typography",
};

export function ownerForCategory(category: ArtDirectorCategory): FixLoopOwner {
  return CATEGORY_OWNER[category] ?? "not-auto-fixable";
}
