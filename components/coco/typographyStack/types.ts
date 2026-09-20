import type {
  CocoCompositionRole,
  CocoCompositionSource,
  CocoCompositionSystem,
  CocoTournamentAlign,
  CocoTournamentFormat,
  CocoTournamentRect,
  CocoTournamentText,
} from "../layoutTournament";
import type { CocoSignatureMove } from "../signatureMove/types.ts";

export type CocoTypographyStackBoundsPolicy = "clip" | "scale-to-fit";

export type CocoTypographyStackItemKind =
  | "headline"
  | "accent"
  | "metadata"
  | "dateTime"
  | "venue"
  | "footer"
  | "presenter"
  | "badge"
  | "tagline"
  | "compliance";

export type CocoTypographyStackStyle = {
  backgroundImage?: string;
  backgroundBlendMode?: string;
  backgroundPosition?: string;
  backgroundSize?: string;
  color: string;
  fontFamily: string;
  fontSize: number;
  fontStyle?: string;
  fontWeight?: number | string;
  letterSpacingEm?: number;
  lineHeight?: number;
  opacity?: number;
  shadow?: string;
  strokeColor?: string;
  strokeWidth?: number;
  textTransform?: "none" | "uppercase" | "titlecase";
  transparentFill?: boolean;
};

export type CocoTypographyStackStyleMap = Partial<
  Record<CocoTypographyStackItemKind, Partial<CocoTypographyStackStyle>>
>;

export type CocoTypographyStackEnabledMap = Partial<Record<CocoCompositionSource, boolean>>;

export type CocoTypographyStackItem = {
  id: string;
  align: CocoTournamentAlign;
  effects?: Partial<{
    glowBoost: number;
    softBloom: boolean;
  }>;
  kind: CocoTypographyStackItemKind;
  maxWidthRatio: number;
  // The item's real, tight bounding box (canvas-percent space) - measured
  // from its actual rendered glyphs at its final font size, not the loose
  // column it's allotted. Used for precise collision/protection checks
  // (see components/coco/pipeline/renderedSnapshot.ts) instead of the
  // wider, content-agnostic composition block rect.
  measuredRect?: CocoTournamentRect;
  offsetXPct?: number;
  offsetYPct?: number;
  rotationDeg?: number;
  role: CocoCompositionRole;
  source: CocoCompositionSource;
  sources: CocoCompositionSource[];
  spacingBeforePct: number;
  style: CocoTypographyStackStyle;
  text: string;
  visualPower: number;
};

export type CocoTypographyStackModel = {
  alignment: CocoTournamentAlign;
  boundsPolicy: CocoTypographyStackBoundsPolicy;
  composition: Pick<
    CocoCompositionSystem,
    "copyTreatment" | "gates" | "hierarchy" | "patternId" | "rhythm"
  >;
  debug?: {
    gates: string[];
    reason: string;
  };
  format: CocoTournamentFormat;
  items: CocoTypographyStackItem[];
  ownedSources: CocoCompositionSource[];
  rect: CocoTournamentRect;
  signatureMove?: CocoSignatureMove;
};

export type CocoTypographyStackModelInput = {
  // A retrieved template is already a resolved composition. Preserve its
  // typography as the ceiling and only shrink when the supplied copy needs
  // to fit; do not reinterpret it through Coco's procedural hierarchy caps.
  authoritativeReference?: boolean;
  boundsPolicy?: CocoTypographyStackBoundsPolicy;
  composition?: CocoCompositionSystem | null;
  debugReason?: string;
  enabled?: CocoTypographyStackEnabledMap;
  eventName?: string;
  faceZone?: CocoTournamentRect | null;
  format: CocoTournamentFormat;
  hasSubject?: boolean;
  minReadableSize?: number;
  mood?: Partial<{
    elegance: number;
    energy: number;
    exclusivity: number;
    playfulness: number;
    summer: number;
    underground: number;
  }> | null;
  nightlifeStyle?: string | null;
  signatureMove?: CocoSignatureMove | null;
  // Every other family reads top-to-bottom as headline-then-accent. A hero
  // lockup (script welded onto a bold word, e.g. "Sunday"/"TAKEOVER") reads
  // the opposite way - the script sits above, near-zero gap, and the bold
  // word anchors below it. Defaults to the existing order when omitted.
  stackOrder?: "headline-accent" | "accent-headline";
  story?: string | null;
  styles: CocoTypographyStackStyleMap;
  subjectZone?: CocoTournamentRect | null;
  text: CocoTournamentText;
};

export type CocoTypographyStackTextLayer = {
  align?: CocoTournamentAlign;
  color?: string;
  effects?: CocoTypographyStackItem["effects"];
  fontFamily: string;
  fontSize: number;
  fontStyle?: string;
  fontWeight?: number | string;
  id: string;
  kind: "text";
  letterSpacingEm?: number;
  lineHeight?: number;
  opacity?: number;
  rotation?: number;
  strokeColor?: string;
  strokeWidth?: number;
  text: string;
  textShadow?: string;
  uppercase?: boolean;
  widthPct?: number;
  xPct: number;
  yPct: number;
  z: number;
};
