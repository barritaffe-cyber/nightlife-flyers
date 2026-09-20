import type {
  CritiqueEvaluation,
  CritiqueLoopInput,
  RenderedSnapshot,
} from "./types.ts";
import { applyPatchesToSnapshot } from "./patchAdapter.ts";

export const INITIAL_SNAPSHOT: RenderedSnapshot = {
  id: "snapshot-1",
  width: 1080,
  height: 1080,
  format: "square",
  subjectRect: {
    x: 48,
    y: 2,
    width: 52,
    height: 98,
  },
  faceRect: {
    x: 61,
    y: 15,
    width: 27,
    height: 30,
  },
  elements: [
    {
      id: "headline",
      role: "headline",
      rect: {
        x: 7,
        y: 18,
        width: 40,
        height: 22,
      },
      visible: true,
      opacity: 1,
      text: "MOJITO\nMONDAZE",
      fontFamily: "Bebas Neue",
      fontSize: 110,
      fontWeight: 700,
      tracking: -0.02,
      lineHeight: 0.84,
      lineCount: 2,
      align: "left",
      color: "#F4EBDD",
      contrastRatio: 5.6,
      visualPower: 92,
      effects: {
        glow: 0.05,
        shadow: 0.2,
        stroke: 0.02,
        blur: 0,
      },
    },
    {
      id: "accent",
      role: "accent",
      rect: {
        x: 10,
        y: 37,
        width: 36,
        height: 10,
      },
      visible: true,
      opacity: 1,
      text: "Brunch Vibes",
      fontFamily: "Great Vibes",
      fontSize: 62,
      fontWeight: 500,
      lineCount: 1,
      align: "left",
      rotationDeg: -5,
      color: "#B9C94A",
      contrastRatio: 4.1,
      visualPower: 58,
      effects: {
        glow: 0.11,
        shadow: 0.14,
        stroke: 0,
        blur: 0,
      },
    },
    {
      id: "metadata",
      role: "metadata",
      rect: {
        x: 9,
        y: 52,
        width: 40,
        height: 14,
      },
      visible: true,
      opacity: 1,
      text: "TROPICAL RHYTHMS • AFROBEATS • LATIN\nCOCKTAILS & ISLAND ENERGY",
      fontFamily: "Inter",
      fontSize: 30,
      fontWeight: 700,
      tracking: 0.03,
      lineHeight: 1.08,
      lineCount: 2,
      align: "left",
      color: "#D8D1C4",
      contrastRatio: 3.7,
      visualPower: 36,
      effects: {
        glow: 0,
        shadow: 0.08,
        stroke: 0,
        blur: 0,
      },
    },
    {
      id: "dateTime",
      role: "dateTime",
      rect: {
        x: 9,
        y: 68,
        width: 32,
        height: 5,
      },
      visible: true,
      opacity: 1,
      text: "MONDAY • 4PM TIL LATE",
      fontFamily: "Inter",
      fontSize: 22,
      fontWeight: 600,
      lineCount: 1,
      align: "left",
      color: "#D8D1C4",
      contrastRatio: 4.2,
      visualPower: 21,
      effects: {
        glow: 0,
        shadow: 0.08,
        stroke: 0,
        blur: 0,
      },
    },
    {
      id: "venue",
      role: "venue",
      rect: {
        x: 9,
        y: 75,
        width: 29,
        height: 4,
      },
      visible: true,
      opacity: 0.92,
      text: "SKY LOUNGE MIAMI",
      fontFamily: "Inter",
      fontSize: 18,
      fontWeight: 500,
      lineCount: 1,
      align: "left",
      color: "#D8D1C4",
      contrastRatio: 4,
      visualPower: 15,
      effects: {
        glow: 0,
        shadow: 0.04,
        stroke: 0,
        blur: 0,
      },
    },
  ],
  globalMetrics: {
    visibleGroupCount: 5,
    uniqueFontCount: 3,
    strongColorCount: 3,
    previewExportMatch: true,
    exportClipped: false,
    safeMarginViolations: 0,
  },
};

export const INITIAL_EVALUATION: CritiqueEvaluation = {
  score: {
    hierarchy: 72,
    readability: 78,
    composition: 84,
    balance: 82,
    rhythm: 76,
    spacing: 79,
    alignment: 88,
    typography: 74,
    copy: 86,
    color: 88,
    contrast: 76,
    effects: 82,
    sceneInteraction: 90,
    subjectProtection: 96,
    informationDensity: 90,
    premiumPolish: 74,
    originality: 82,
    brandFit: 86,
    marketingClarity: 90,
    exportIntegrity: 100,
    total: 83.2,
  },
  findings: [
    {
      id: "hierarchy:headline-not-dominant",
      category: "hierarchy",
      severity: "high",
      confidence: 0.95,
      observation: "The headline is not clearly winning the poster.",
      cause: "The accent is too close to the headline in visual power.",
      evidence: [
        "Headline power: 92.",
        "Accent power: 58.",
      ],
      targetIds: ["headline", "accent"],
      contractIds: ["headline-wins", "accent-subordinate"],
      scorePenalty: 16,
      blocker: false,
      userFacingMessage: "The title needs to lead more clearly.",
    },
    {
      id: "hierarchy:metadata-too-strong",
      category: "hierarchy",
      severity: "medium",
      confidence: 0.9,
      observation: "Supporting copy is too visually heavy.",
      cause: "Metadata is too large and too bold.",
      evidence: [
        "Metadata power: 36.",
      ],
      targetIds: ["metadata"],
      contractIds: ["body-is-metadata"],
      scorePenalty: 10,
      blocker: false,
      userFacingMessage: "The details are too loud.",
    },
    {
      id: "readability:contrast:metadata",
      category: "readability",
      severity: "high",
      confidence: 0.97,
      observation: "Metadata is getting lost in the image.",
      cause: "Local contrast is too low.",
      evidence: [
        "Observed contrast: 3.7.",
      ],
      targetIds: ["metadata"],
      contractIds: ["accessibility"],
      scorePenalty: 14,
      blocker: false,
      userFacingMessage: "This text is getting lost.",
    },
  ],
  strongestFinding: undefined,
  exportAllowed: true,
};

export function createCritiqueLoopFixture(): CritiqueLoopInput {
  return {
    initialSnapshot: INITIAL_SNAPSHOT,
    initialEvaluation: INITIAL_EVALUATION,
    settings: {
      maxIterations: 4,
      minExpectedGain: 3,
      minNetValue: 2.5,
      maxRisk: 0.4,
      plateauTolerance: 1,
      regressionTolerance: 1,
      maxRepeatedCategory: 2,
      maxRepeatedTarget: 2,
      strictness: "balanced",
      preserveUserMoves: true,
      allowAutomaticFixes: true,
      requirePreviewExportParity: true,
      stopWhenExportable: false,
    },
    adapters: {
      applyPatches(snapshot, patches) {
        return applyPatchesToSnapshot(snapshot, patches);
      },

      renderSnapshot(snapshot) {
        return {
          ...snapshot,
          id: `${snapshot.id}-rendered`,
        };
      },

      evaluateArtwork(snapshot) {
        const headline = snapshot.elements.find((element) => element.id === "headline");
        const accent = snapshot.elements.find((element) => element.id === "accent");
        const metadata = snapshot.elements.find((element) => element.id === "metadata");

        const hierarchyRatio =
          (headline?.visualPower ?? 0) /
          Math.max(1, accent?.visualPower ?? 0, metadata?.visualPower ?? 0);

        const hierarchy = Math.min(
          98,
          70 + hierarchyRatio * 12
        );

        const readability = Math.min(
          98,
          70 + Math.max(0, (metadata?.contrastRatio ?? 0) - 3) * 12
        );

        const score = {
          ...INITIAL_EVALUATION.score,
          hierarchy,
          readability,
          typography: Math.min(96, INITIAL_EVALUATION.score.typography + 5),
          premiumPolish: Math.min(96, INITIAL_EVALUATION.score.premiumPolish + 4),
        };

        score.total =
          Object.entries(score)
            .filter(([key]) => key !== "total")
            .reduce((sum, [, value]) => sum + (value as number), 0) /
          20;

        const findings = [];

        if (hierarchyRatio < 1.8) {
          findings.push(INITIAL_EVALUATION.findings[0]);
        }

        if ((metadata?.visualPower ?? 0) > 30) {
          findings.push(INITIAL_EVALUATION.findings[1]);
        }

        if ((metadata?.contrastRatio ?? 0) < 4) {
          findings.push(INITIAL_EVALUATION.findings[2]);
        }

        return {
          score,
          findings,
          strongestFinding: findings[0],
          exportAllowed: true,
        };
      },
    },
  };
}
