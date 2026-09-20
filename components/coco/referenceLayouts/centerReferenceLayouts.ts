import { scoreEnvironmentCells, type CanvasEnvironmentCell } from "../subjectGeometry/buildCanvasEnvironmentMap.ts";
import {
  evaluateCanvasRectInteraction,
  type CanvasInteractionCell,
  type CanvasTextCandidate,
} from "../subjectGeometry/buildCanvasTextCandidates.ts";
import type { SubjectCopyRole } from "../subjectGeometry/buildSubjectInteractionMap.ts";

type Rect = { x: number; y: number; width: number; height: number };

export type CenterReferenceLayout = {
  id: string;
  sourceUrl: string;
  aspectRatio: number;
  faceAnchor: Rect;
  requiresOcclusion?: boolean;
  headlineKind: "display" | "script" | "geometric";
  fonts: Partial<Record<SubjectCopyRole, string>>;
  zones: Partial<Record<SubjectCopyRole, Rect>>;
};

export const CENTER_REFERENCE_LAYOUTS: CenterReferenceLayout[] = [
  {
    id: "center-01-title-behind-subject",
    sourceUrl: "/coco-references/center/center01.jpg",
    aspectRatio: 1200 / 1632,
    faceAnchor: { x: 39, y: 18, width: 22, height: 20 },
    requiresOcclusion: true,
    headlineKind: "display",
    fonts: { headline: "Coolvetica Hv Comp", accent: "OpenScript", presenter: "Bebas Neue", details: "Bebas Neue", date: "Bebas Neue", price: "Bebas Neue", venue: "Bebas Neue", compliance: "LEMONMILK-Regular" },
    zones: {},
  },
  {
    id: "center-02-monogram-behind-subject",
    sourceUrl: "/coco-references/center/center02.jpg",
    aspectRatio: 1199 / 1487,
    faceAnchor: { x: 44, y: 17, width: 16, height: 18 },
    requiresOcclusion: true,
    headlineKind: "display",
    fonts: { headline: "Magiel Black", accent: "OpenScript", presenter: "Bebas Neue", details: "Bebas Neue", date: "Bebas Neue", price: "Bebas Neue", venue: "LEMONMILK-Light", compliance: "LEMONMILK-Regular" },
    zones: {},
  },
  {
    id: "center-03-torso-title",
    sourceUrl: "/coco-references/center/center03.jpg",
    aspectRatio: 1179 / 1465,
    faceAnchor: { x: 52, y: 12, width: 22, height: 22 },
    headlineKind: "display",
    fonts: { headline: "Newake", accent: "Bebas Neue", presenter: "Bebas Neue", details: "Bebas Neue", date: "Bebas Neue", price: "Bebas Neue", venue: "Bebas Neue", compliance: "LEMONMILK-Regular" },
    zones: {
      presenter: { x: 28, y: 3, width: 44, height: 6 },
      date: { x: 68, y: 5, width: 24, height: 12 },
      headline: { x: 20, y: 36, width: 64, height: 22 },
      accent: { x: 25, y: 58, width: 50, height: 7 },
      details: { x: 12, y: 68, width: 34, height: 13 },
      price: { x: 58, y: 68, width: 30, height: 13 },
      venue: { x: 20, y: 87, width: 60, height: 7 },
      compliance: { x: 35, y: 95, width: 30, height: 4 },
    },
  },
  {
    id: "center-04-title-footer-slab",
    sourceUrl: "/coco-references/center/center04.jpg",
    aspectRatio: 1199 / 1696,
    faceAnchor: { x: 35, y: 12, width: 30, height: 25 },
    headlineKind: "script",
    fonts: { headline: "OpenScript", accent: "Bebas Neue", presenter: "LEMONMILK-Bold", details: "Bebas Neue", date: "Bebas Neue", price: "Bebas Neue", venue: "LEMONMILK-Bold", compliance: "LEMONMILK-Regular" },
    zones: {
      presenter: { x: 35, y: 3, width: 30, height: 6 },
      headline: { x: 12, y: 43, width: 76, height: 18 },
      accent: { x: 34, y: 60, width: 32, height: 6 },
      date: { x: 8, y: 67, width: 24, height: 11 },
      price: { x: 68, y: 67, width: 24, height: 11 },
      details: { x: 35, y: 68, width: 30, height: 11 },
      venue: { x: 7, y: 88, width: 86, height: 7 },
      compliance: { x: 26, y: 96, width: 48, height: 3 },
    },
  },
  {
    id: "center-05-stacked-block-title",
    sourceUrl: "/coco-references/center/center05.jpg",
    aspectRatio: 736 / 920,
    faceAnchor: { x: 34, y: 13, width: 32, height: 24 },
    headlineKind: "display",
    fonts: { headline: "Anton", accent: "Bebas Neue", presenter: "Bebas Neue", details: "Bebas Neue", date: "Bebas Neue", price: "Bebas Neue", venue: "Bebas Neue", compliance: "LEMONMILK-Regular" },
    zones: {
      presenter: { x: 6, y: 3, width: 32, height: 6 },
      date: { x: 6, y: 9, width: 25, height: 12 },
      headline: { x: 15, y: 48, width: 70, height: 20 },
      accent: { x: 29, y: 68, width: 42, height: 6 },
      details: { x: 20, y: 75, width: 60, height: 10 },
      price: { x: 30, y: 85, width: 40, height: 7 },
      venue: { x: 18, y: 92, width: 64, height: 5 },
      compliance: { x: 30, y: 97, width: 40, height: 3 },
    },
  },
  {
    id: "center-06-script-and-sans",
    sourceUrl: "/coco-references/center/center06.jpg",
    aspectRatio: 1080 / 1440,
    faceAnchor: { x: 38, y: 14, width: 24, height: 23 },
    headlineKind: "script",
    fonts: { headline: "OpenScript", accent: "LEMONMILK-Bold", presenter: "Bebas Neue", details: "Bebas Neue", date: "Bebas Neue", price: "Bebas Neue", venue: "Bebas Neue", compliance: "LEMONMILK-Regular" },
    zones: {
      presenter: { x: 41, y: 3, width: 18, height: 6 },
      headline: { x: 13, y: 51, width: 74, height: 17 },
      accent: { x: 28, y: 66, width: 44, height: 10 },
      details: { x: 30, y: 77, width: 40, height: 8 },
      date: { x: 68, y: 82, width: 24, height: 12 },
      price: { x: 6, y: 83, width: 24, height: 10 },
      venue: { x: 24, y: 91, width: 52, height: 6 },
      compliance: { x: 34, y: 97, width: 32, height: 3 },
    },
  },
  {
    id: "center-07-geometric-title",
    sourceUrl: "/coco-references/center/center07.jpg",
    aspectRatio: 1199 / 1496,
    faceAnchor: { x: 42, y: 15, width: 22, height: 23 },
    headlineKind: "geometric",
    fonts: { headline: "LEMONMILK-Bold", accent: "Bebas Neue", presenter: "LEMONMILK-Light", details: "Bebas Neue", date: "Bebas Neue", price: "Bebas Neue", venue: "LEMONMILK-Light", compliance: "LEMONMILK-Regular" },
    zones: {
      presenter: { x: 36, y: 3, width: 28, height: 6 },
      date: { x: 25, y: 13, width: 20, height: 10 },
      headline: { x: 20, y: 43, width: 60, height: 20 },
      accent: { x: 34, y: 63, width: 32, height: 6 },
      details: { x: 14, y: 70, width: 34, height: 14 },
      price: { x: 55, y: 70, width: 31, height: 14 },
      venue: { x: 17, y: 88, width: 66, height: 7 },
      compliance: { x: 30, y: 96, width: 40, height: 3 },
    },
  },
];

function overlapArea(a: Rect, b: Rect) {
  const width = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const height = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  return width * height;
}

function center(rect: Rect) {
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

export function chooseCenterReferenceLayout(input: {
  cells: CanvasInteractionCell[];
  environmentCells?: CanvasEnvironmentCell[];
  faceRect?: Rect | null;
  canvasAspectRatio: number;
  copyTextByRole: Partial<Record<SubjectCopyRole, string>>;
}) {
  const targetFace = input.faceRect ?? { x: 40, y: 15, width: 20, height: 22 };
  const activeRoles = (Object.entries(input.copyTextByRole) as Array<[SubjectCopyRole, string]>)
    .filter(([, text]) => String(text ?? "").trim())
    .map(([role]) => role);
  const headline = String(input.copyTextByRole.headline ?? "").trim();

  return CENTER_REFERENCE_LAYOUTS
    .filter((layout) => !layout.requiresOcclusion)
    .map((layout) => {
      const candidates = activeRoles.flatMap((role) => {
        const rect = layout.zones[role];
        if (!rect) return [];
        const evidence = evaluateCanvasRectInteraction({ role, rect, cells: input.cells });
        if (!evidence.interaction.allowed) return [];
        const localEnvironment = (input.environmentCells ?? []).filter((cell) =>
          overlapArea(rect, cell) > 0
        );
        const environment = scoreEnvironmentCells(localEnvironment);
        return [{
          id: `${role}:reference:${layout.id}`,
          role,
          rect,
          score: 112 + evidence.interaction.score + environment.readability * 18,
          subjectOverlap: evidence.subjectOverlap,
          maximumProtection: evidence.maximumProtection,
          regionCoverage: evidence.regionCoverage,
          interactionMode: evidence.interaction.mode,
          interactionScore: evidence.interaction.score,
          environmentReadability: localEnvironment.length ? environment.readability : undefined,
          environmentComplexity: localEnvironment.length ? environment.complexity : undefined,
          referenceLayoutId: layout.id,
          referenceSourceUrl: layout.sourceUrl,
          referenceFontFamily: layout.fonts[role],
          rejected: false,
        } satisfies CanvasTextCandidate];
      });
      const validRoles = new Set(candidates.map((candidate) => candidate.role));
      const faceDistance = Math.hypot(
        center(targetFace).x - center(layout.faceAnchor).x,
        center(targetFace).y - center(layout.faceAnchor).y
      );
      const aspectDistance = Math.abs(input.canvasAspectRatio - layout.aspectRatio) * 45;
      const missingPenalty = activeRoles.filter((role) => !validRoles.has(role)).length * 24;
      const scriptPenalty = layout.headlineKind === "script" &&
        (headline.length > 18 || headline.split(/\s+/).length > 3) ? 28 : 0;
      const score = candidates.length * 28 - faceDistance * 1.4 - aspectDistance -
        missingPenalty - scriptPenalty;
      return { layout, candidates, score };
    })
    .filter((result) => result.candidates.some((candidate) => candidate.role === "headline"))
    .sort((a, b) => b.score - a.score)[0] ?? null;
}
