import type { TemplateBase, TemplateSpec } from "../../../lib/templates.ts";
import { scoreEnvironmentCells, type CanvasEnvironmentCell } from "../subjectGeometry/buildCanvasEnvironmentMap.ts";
import {
  evaluateCanvasRectInteraction,
  type CanvasInteractionCell,
  type CanvasTextCandidate,
} from "../subjectGeometry/buildCanvasTextCandidates.ts";
import type { SubjectCopyRole } from "../subjectGeometry/buildSubjectInteractionMap.ts";

type Rect = { x: number; y: number; width: number; height: number };
type Align = "left" | "center" | "right";

export type StructuredTemplateReference = {
  id: string;
  label: string;
  layoutFamily: "subject-left" | "subject-center" | "subject-right";
  subjectRect: Rect | null;
  faceRect: Rect | null;
  candidates: CanvasTextCandidate[];
};

export type DirectTemplateTextLayout = {
  role: SubjectCopyRole;
  rect: Rect;
  align: Align;
  fontFamily?: string;
  fontSize?: number;
  lineHeight?: number;
  letterSpacing?: number;
  fontWeight?: number | string;
  rotation: number;
  uppercase?: boolean;
};

const ROLE_ZONE_KEYS: Record<SubjectCopyRole, string[]> = {
  headline: ["mainTitle", "blockHeadline", "headline"],
  accent: ["scriptTitle", "headline2", "script"],
  presenter: ["presenter", "promoter", "topHeader"],
  details: ["details", "moreDetails", "footerInfo", "leftMeta"],
  date: ["date", "dateBadge"],
  price: ["price", "rightPriceLane", "rightBadge"],
  venue: ["venue", "footer", "footerInfo"],
  compliance: ["compliance", "rightUtility"],
};

const ROLE_MIN_HEIGHT: Record<SubjectCopyRole, number> = {
  headline: 14,
  accent: 5,
  presenter: 4,
  details: 7,
  date: 6,
  price: 6,
  venue: 5,
  compliance: 3,
};

function variantFor(template: TemplateSpec, format: "square" | "story"): TemplateBase {
  return template.formats?.[format] ?? template.formats?.square ?? template.base ?? {};
}

function validRect(value: unknown): Rect | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<Rect>;
  const rect = {
    x: Number(raw.x),
    y: Number(raw.y),
    width: Number(raw.width),
    height: Number(raw.height),
  };
  if (Object.values(rect).some((part) => !Number.isFinite(part))) return null;
  if (rect.width <= 0 || rect.height <= 0) return null;
  const x = Math.max(0, Math.min(99, rect.x));
  const y = Math.max(0, Math.min(99, rect.y));
  return {
    x,
    y,
    width: Math.max(1, Math.min(100 - x, rect.width)),
    height: Math.max(1, Math.min(100 - y, rect.height)),
  };
}

function zoneFor(base: TemplateBase, role: SubjectCopyRole): (Rect & { align?: Align }) | null {
  for (const key of ROLE_ZONE_KEYS[role]) {
    const zone = validRect(base.textZones?.[key]);
    if (zone) return { ...zone, align: base.textZones?.[key]?.align };
  }
  const explicit = role === "headline"
    ? base.mainTitleRect
    : role === "accent"
      ? base.scriptRect
      : role === "price"
        ? base.priceRect
        : role === "venue"
          ? base.footerRect
          : null;
  const rect = validRect(explicit);
  if (rect) return rect;

  const prefix = role === "headline"
    ? "head"
    : role === "accent"
      ? "head2"
      : role === "compliance"
        ? "subtag"
        : role;
  const source = base as Record<string, unknown>;
  const x = Number(source[`${prefix}X`]);
  const y = Number(source[`${prefix}Y`]);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  const width = role === "headline"
    ? Number(base.textColWidth ?? 70)
    : role === "accent"
      ? Number(base.head2ColWidth ?? Math.min(58, base.textColWidth ?? 48))
      : role === "presenter"
        ? Number(base.presenterWidth ?? 34)
        : role === "details"
          ? Math.min(58, Number(base.textColWidth ?? 38))
          : role === "venue"
            ? Math.min(68, Number(base.textColWidth ?? 52))
            : role === "compliance"
              ? 28
              : 22;
  return validRect({ x, y, width, height: ROLE_MIN_HEIGHT[role] });
}

function fontFor(base: TemplateBase, role: SubjectCopyRole) {
  if (role === "headline") return base.headlineFamily;
  if (role === "accent") return base.head2Family;
  if (role === "details") return base.detailsFamily ?? base.bodyFamily;
  return (base as Record<string, unknown>)[`${role}Family`] as string | undefined;
}

function sizeFor(base: TemplateBase, role: SubjectCopyRole) {
  if (role === "headline") return Number(base.headMaxPx ?? base.headlineSize);
  if (role === "accent") return Number(base.head2SizePx ?? base.head2Size);
  return Number((base as Record<string, unknown>)[`${role}Size`]);
}

function lineHeightFor(base: TemplateBase, role: SubjectCopyRole) {
  if (role === "headline") return Number(base.headlineLineHeight ?? base.lineHeight);
  if (role === "accent") return Number(base.head2LineHeight ?? base.head2lineHeight);
  if (role === "details") return Number(base.detailsLineHeight ?? base.lineHeight);
  return Number((base as Record<string, unknown>)[`${role}LineHeight`]);
}

function letterSpacingFor(base: TemplateBase, role: SubjectCopyRole) {
  if (role === "headline") return Number(base.headTracking ?? base.letterSpacing);
  if (role === "accent") return Number(base.head2Tracking ?? base.head2TrackEm);
  if (role === "details") return Number(base.detailsLetterSpacing ?? base.detailsTracking);
  if (role === "compliance") return Number(base.subtagLetterSpacing);
  return Number((base as Record<string, unknown>)[`${role}LetterSpacing`]);
}

function weightFor(base: TemplateBase, role: SubjectCopyRole): number | string | undefined {
  const bold = role === "headline"
    ? base.headBold ?? base.headlineBold
    : role === "accent"
      ? base.head2Bold
      : role === "details"
        ? base.detailsBold
        : role === "venue"
          ? base.venueBold
          : role === "compliance"
            ? base.subtagBold
            : undefined;
  return bold == null ? undefined : bold ? 900 : 500;
}

function rotationFor(base: TemplateBase, role: SubjectCopyRole) {
  if (role === "headline") return Number(base.headRotate);
  if (role === "accent") return Number(base.head2Rotate);
  if (role === "details") return Number(base.detailsRotate);
  if (role === "presenter") return Number(base.presenterRotation);
  if (role === "date") return Number(base.dateRotation);
  if (role === "venue") return Number(base.venueRotate);
  if (role === "compliance") return Number(base.subtagRotate);
  return 0;
}

function uppercaseFor(base: TemplateBase, role: SubjectCopyRole) {
  if (role === "headline") return base.headUppercase ?? base.headlineUppercase;
  if (role === "accent") return base.head2Uppercase;
  if (role === "details") return base.detailsUppercase;
  if (role === "venue") return base.venueUppercase;
  if (role === "compliance") return base.subtagUppercase;
  return true;
}

function maxLinesFor(role: SubjectCopyRole) {
  if (role === "headline") return 3;
  if (role === "details") return 6;
  if (role === "compliance") return 3;
  return role === "accent" ? 2 : 3;
}

function roleEnabledInTemplate(base: TemplateBase, role: SubjectCopyRole) {
  const source = base as Record<string, unknown>;
  if (role === "accent") return source.head2Enabled !== false;
  if (role === "presenter") return source.presenterEnabled !== false;
  if (role === "details") return source.detailsEnabled !== false;
  if (role === "date") return source.dateEnabled !== false;
  if (role === "price") return source.priceEnabled !== false;
  if (role === "venue") return source.venueEnabled !== false;
  if (role === "compliance") {
    if (source.complianceEnabled === false) return false;
    // Saved templates predate the dedicated compliance field. In those
    // references the subtag toggle is the authoritative visibility signal
    // for the utility/footer slot that compliance inherits.
    if (source.complianceEnabled == null && source.subtagEnabled === false) return false;
  }
  return true;
}

export function readDirectTemplateTextLayout(input: {
  template: TemplateSpec;
  format: "square" | "story";
}): DirectTemplateTextLayout[] {
  const base = variantFor(input.template, input.format);
  return (Object.keys(ROLE_ZONE_KEYS) as SubjectCopyRole[]).flatMap((role) => {
    if (!roleEnabledInTemplate(base, role)) return [];
    const zone = zoneFor(base, role);
    if (!zone) return [];
    const fontSize = sizeFor(base, role);
    const lineHeight = lineHeightFor(base, role);
    const letterSpacing = letterSpacingFor(base, role);
    return [{
      role,
      rect: { x: zone.x, y: zone.y, width: zone.width, height: zone.height },
      align: alignFor(base, role, zone),
      fontFamily: fontFor(base, role),
      fontSize: Number.isFinite(fontSize) && fontSize > 0 ? fontSize : undefined,
      lineHeight: Number.isFinite(lineHeight) && lineHeight > 0 ? lineHeight : undefined,
      letterSpacing: Number.isFinite(letterSpacing) ? letterSpacing : undefined,
      fontWeight: weightFor(base, role),
      rotation: rotationFor(base, role),
      uppercase: uppercaseFor(base, role),
    }];
  });
}

function alignFor(base: TemplateBase, role: SubjectCopyRole, zone?: { align?: Align } | null): Align {
  if (zone?.align) return zone.align;
  const value = role === "headline"
    ? base.headAlign ?? base.textAlign ?? base.align
    : role === "accent"
      ? base.head2Align ?? base.align
      : (base as Record<string, unknown>)[`${role}Align`] ?? base.align;
  return value === "right" || value === "center" ? value : "left";
}

function layoutFamily(base: TemplateBase) {
  const subject = validRect(base.subjectVisibleRect);
  const centerX = subject
    ? subject.x + subject.width / 2
    : Number.isFinite(Number(base.portraitX))
      ? Number(base.portraitX)
      : 50;
  if (centerX < 44) return "subject-left" as const;
  if (centerX > 56) return "subject-right" as const;
  return "subject-center" as const;
}

function overlapArea(a: Rect, b: Rect) {
  const width = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const height = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  return width * height;
}

export function extractStructuredTemplateReferences(input: {
  templates: TemplateSpec[];
  format: "square" | "story";
  copyTextByRole: Partial<Record<SubjectCopyRole, string>>;
  cells: CanvasInteractionCell[];
  environmentCells?: CanvasEnvironmentCell[];
}) {
  const activeRoles = (Object.entries(input.copyTextByRole) as Array<[SubjectCopyRole, string]>)
    .filter(([, text]) => String(text ?? "").trim())
    .map(([role]) => role);
  return input.templates.flatMap((template) => {
    const base = variantFor(template, input.format);
    const referenceId = `template:${template.id}:${input.format}`;
    const candidates = activeRoles.flatMap((role) => {
      const zone = zoneFor(base, role);
      if (!zone) return [];
      const evidence = evaluateCanvasRectInteraction({ role, rect: zone, cells: input.cells });
      const localEnvironment = (input.environmentCells ?? []).filter(
        (cell) => overlapArea(zone, cell) > 0
      );
      const environment = scoreEnvironmentCells(localEnvironment);
      const fontSize = sizeFor(base, role);
      const lineHeight = lineHeightFor(base, role);
      return [{
        id: `${role}:${referenceId}`,
        role,
        rect: { x: zone.x, y: zone.y, width: zone.width, height: zone.height },
        score: 140 + evidence.interaction.score + environment.readability * 12,
        subjectOverlap: evidence.subjectOverlap,
        maximumProtection: evidence.maximumProtection,
        regionCoverage: evidence.regionCoverage,
        interactionMode: evidence.interaction.mode,
        interactionScore: evidence.interaction.score,
        environmentReadability: localEnvironment.length ? environment.readability : undefined,
        environmentComplexity: localEnvironment.length ? environment.complexity : undefined,
        referenceLayoutId: referenceId,
        referenceSourceUrl: template.preview,
        referenceFontFamily: fontFor(base, role),
        referenceFontSize: Number.isFinite(fontSize) && fontSize > 0 ? fontSize : undefined,
        referenceLineHeight: Number.isFinite(lineHeight) && lineHeight > 0 ? lineHeight : undefined,
        referenceAlign: alignFor(base, role, zone),
        referenceLetterSpacing: Number.isFinite(letterSpacingFor(base, role))
          ? letterSpacingFor(base, role)
          : undefined,
        referenceFontWeight: weightFor(base, role),
        referenceMaxLines: maxLinesFor(role),
        referenceRotation: rotationFor(base, role),
        referenceUppercase: uppercaseFor(base, role),
        rejected: false,
      } satisfies CanvasTextCandidate];
    });
    if (!candidates.some((candidate) => candidate.role === "headline")) return [];
    return [{
      id: referenceId,
      label: template.label,
      layoutFamily: layoutFamily(base),
      subjectRect: validRect(base.subjectVisibleRect),
      faceRect: validRect(base.subjectFaceRect),
      candidates,
    } satisfies StructuredTemplateReference];
  });
}

export function chooseStructuredTemplateReference(input: {
  templates: TemplateSpec[];
  format: "square" | "story";
  layoutId?: string | null;
  copyTextByRole: Partial<Record<SubjectCopyRole, string>>;
  cells: CanvasInteractionCell[];
  environmentCells?: CanvasEnvironmentCell[];
  faceRect?: Rect | null;
  subjectRect?: Rect | null;
  visualReferenceTemplateIds?: readonly string[];
}) {
  const visualRankByTemplateId = new Map(
    (input.visualReferenceTemplateIds ?? []).map((templateId, index) => [templateId, index])
  );
  const usesVisualShortlist = visualRankByTemplateId.size > 0;
  const templates = usesVisualShortlist
    ? input.templates.filter((template) => visualRankByTemplateId.has(template.id))
    : input.templates;
  const references = extractStructuredTemplateReferences({ ...input, templates });
  const activeCount = Object.values(input.copyTextByRole).filter((text) => String(text ?? "").trim()).length;
  const desiredFamily = input.layoutId === "subject-left" || input.layoutId === "subject-right"
    ? input.layoutId
    : "subject-center";
  return references
    .map((reference) => {
      const roles = new Set(reference.candidates.map((candidate) => candidate.role));
      const coverage = reference.candidates.length / Math.max(1, activeCount);
      const familyScore = reference.layoutFamily === desiredFamily ? 90 : -90;
      const templateId = reference.id.replace(/^template:/, "").replace(/:(square|story)$/, "");
      const visualRank = visualRankByTemplateId.get(templateId);
      const visualScore = visualRank == null ? 0 : 500 - visualRank * 60;
      const hierarchyScore = roles.has("headline") ? 80 : -200;
      const fontScore = reference.candidates.filter((candidate) => candidate.referenceFontFamily).length * 4;
      const faceScore = reference.faceRect && input.faceRect
        ? 60 - Math.hypot(
            reference.faceRect.x + reference.faceRect.width / 2 - input.faceRect.x - input.faceRect.width / 2,
            reference.faceRect.y + reference.faceRect.height / 2 - input.faceRect.y - input.faceRect.height / 2
          ) * 2
        : 0;
      const subjectScore = reference.subjectRect && input.subjectRect
        ? 70 - Math.hypot(
            reference.subjectRect.x + reference.subjectRect.width / 2 - input.subjectRect.x - input.subjectRect.width / 2,
            reference.subjectRect.y + reference.subjectRect.height / 2 - input.subjectRect.y - input.subjectRect.height / 2,
            (reference.subjectRect.width - input.subjectRect.width) * 0.7,
            (reference.subjectRect.height - input.subjectRect.height) * 0.7
          ) * 1.5
        : 0;
      const score = (usesVisualShortlist ? 0 : familyScore) + visualScore + hierarchyScore + coverage * 120 + fontScore +
        faceScore + subjectScore + reference.candidates.reduce((sum, candidate) => sum + candidate.score, 0) / 20;
      return { ...reference, score, coverage };
    })
    .filter((reference) => (usesVisualShortlist || reference.layoutFamily === desiredFamily) && reference.coverage === 1)
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))[0] ?? null;
}
