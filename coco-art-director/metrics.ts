import type {
  ArtDirectorInput,
  RenderedElementSnapshot,
  TypographyRoleLike,
} from "./types.ts";
import { average } from "./utils.ts";
import { center, overlapRatio } from "./geometry.ts";

export type DerivedMetrics = {
  visibleElements: RenderedElementSnapshot[];
  textElements: RenderedElementSnapshot[];
  headline?: RenderedElementSnapshot;
  accent?: RenderedElementSnapshot;
  metadata?: RenderedElementSnapshot;
  dateTime?: RenderedElementSnapshot;
  venue?: RenderedElementSnapshot;
  badge?: RenderedElementSnapshot;
  presenter?: RenderedElementSnapshot;
  footer?: RenderedElementSnapshot;
  headlinePower: number;
  strongestSecondaryPower: number;
  fontCount: number;
  visibleGroupCount: number;
  averageContrast: number;
  minCriticalContrast: number;
  subjectOverlap: number;
  faceOverlap: number;
  stackCenter?: { x: number; y: number };
  visualCenter: { x: number; y: number };
};

export function deriveMetrics(input: ArtDirectorInput): DerivedMetrics {
  const visibleElements = input.renderedSnapshot.elements.filter((element) => element.visible && element.opacity > 0.03);
  const textElements = visibleElements.filter((element) => Boolean(element.text));

  const headline = findRole(textElements, ["headline", "identity"]);
  const accent = findRole(textElements, ["accent", "emotion", "script"]);
  const metadata = findRole(textElements, ["metadata", "experience", "music", "offer"]);
  const dateTime = findRole(textElements, ["dateTime", "logistics", "date"]);
  const venue = findRole(textElements, ["venue"]);
  const badge = findRole(textElements, ["badge", "price"]);
  const presenter = findRole(textElements, ["presenter"]);
  const footer = findRole(textElements, ["footer", "social"]);

  const headlinePower = powerOf(headline, input.typography?.headline);
  const secondaryPowers = [
    powerOf(accent, input.typography?.accent),
    powerOf(metadata, input.typography?.metadata),
    powerOf(dateTime, input.typography?.dateTime),
    powerOf(venue, input.typography?.venue),
    powerOf(badge, input.typography?.badge),
    powerOf(presenter, input.typography?.presenter),
    powerOf(footer, input.typography?.footer),
  ];

  const critical = [headline, metadata, dateTime, venue].filter(Boolean) as RenderedElementSnapshot[];
  const contrasts = critical.map((element) => element.contrastRatio ?? 0).filter((value) => value > 0);

  const subjectRect = input.renderedSnapshot.subjectRect;
  const faceRect = input.renderedSnapshot.faceRect;
  const subjectOverlap = subjectRect
    ? textElements.reduce((sum, element) => sum + overlapRatio(element.rect, subjectRect, "a"), 0)
    : 0;
  const faceOverlap = faceRect
    ? textElements.reduce((sum, element) => sum + overlapRatio(element.rect, faceRect, "b"), 0)
    : 0;

  const weighted = visibleElements.map((element) => ({
    point: center(element.rect),
    weight: Math.max(0.05, element.visualPower ?? (element.fontSize ?? 12) / 24) * element.opacity,
  }));

  const totalWeight = weighted.reduce((sum, item) => sum + item.weight, 0);
  const visualCenter = totalWeight > 0
    ? {
        x: weighted.reduce((sum, item) => sum + item.point.x * item.weight, 0) / totalWeight,
        y: weighted.reduce((sum, item) => sum + item.point.y * item.weight, 0) / totalWeight,
      }
    : { x: 50, y: 50 };

  const stackElements = [headline, accent, metadata, dateTime, venue].filter(Boolean) as RenderedElementSnapshot[];
  const stackCenter = stackElements.length
    ? {
        x: average(stackElements.map((element) => center(element.rect).x)),
        y: average(stackElements.map((element) => center(element.rect).y)),
      }
    : undefined;

  return {
    visibleElements,
    textElements,
    headline,
    accent,
    metadata,
    dateTime,
    venue,
    badge,
    presenter,
    footer,
    headlinePower,
    strongestSecondaryPower: Math.max(0, ...secondaryPowers),
    fontCount: new Set(textElements.map((element) => element.fontFamily).filter(Boolean)).size,
    visibleGroupCount: input.renderedSnapshot.globalMetrics?.visibleGroupCount ?? textElements.length,
    averageContrast: contrasts.length ? average(contrasts) : 0,
    minCriticalContrast: contrasts.length ? Math.min(...contrasts) : 0,
    subjectOverlap,
    faceOverlap,
    stackCenter,
    visualCenter,
  };
}

function findRole(elements: RenderedElementSnapshot[], roles: string[]) {
  return elements.find((element) => roles.includes(element.role));
}

function powerOf(
  rendered: RenderedElementSnapshot | undefined,
  contract: TypographyRoleLike | undefined
): number {
  return rendered?.visualPower ?? contract?.visualPower ?? 0;
}
