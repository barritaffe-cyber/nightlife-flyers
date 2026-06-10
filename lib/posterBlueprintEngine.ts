import type {
  ArtDirectionPreset,
  AssetPack,
  BlendMode,
  CompositionMode,
  CreativeBrief,
  ImageLayer,
  LayoutScore,
  PosterCandidate,
  PosterSize,
  Rect,
  SceneLayer,
  SubjectAnalysis,
  TextAlign,
  TextLayer,
  Vibe,
} from "./artDirectorEngine";
import { enhanceBlueprintPoster } from "./cinematicDepthEngine";
import { applyDepthOverlapDirector, critiqueOverlap } from "./depthOverlapDirector";
import { enforceReadablePosterText } from "./readablePosterText";
import {
  applySemanticHierarchyToPoster,
  directSemanticHierarchy,
} from "./semanticHierarchyDirector";
import { getPosterCompositionPlacement, searchPosterComposition } from "./subjectCompositionSearch";

export type BlueprintId =
  | "CENTER_HERO_BIG_GHOST_TITLE"
  | "RED_ONLY_CENTER_HERO"
  | "MIAMI_LUXE_HERO"
  | "NEON_CLUB_STACK"
  | "BOTTLE_SERVICE_VERTICAL"
  | "EDITORIAL_NEGATIVE_SPACE";

export type BlueprintSlotType =
  | "background"
  | "ghostTitle"
  | "subject"
  | "presenter"
  | "scriptAccent"
  | "dateBlock"
  | "artistBlock"
  | "offerLine"
  | "footerTitle"
  | "addressLine"
  | "logo"
  | "qr"
  | "particles"
  | "fog"
  | "vignette"
  | "texture";

type AnchorRect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

type BlueprintTextStyle = {
  fontFamily: string;
  fontSize: number;
  fontWeight?: number | string;
  lineHeight: number;
  letterSpacing: number;
  color: string;
  opacity: number;
  align: TextAlign;
  rotation?: number;
  blendMode?: BlendMode;
  shadow?: TextLayer["shadow"];
  stroke?: TextLayer["stroke"];
};

type BlueprintImageStyle = {
  opacity: number;
  fit: "cover" | "contain" | "stretch";
  blendMode?: BlendMode;
  filter?: ImageLayer["filter"];
};

type BlueprintSlot = {
  type: BlueprintSlotType;
  required: boolean;
  zIndex: number;
  rect: AnchorRect;
  allowCrop?: boolean;
  textStyle?: BlueprintTextStyle;
  imageStyle?: BlueprintImageStyle;
  semanticImportance: number;
  avoidFace?: boolean;
};

type BlueprintRuleId =
  | "ONE_DOMINANT_HEADLINE"
  | "SUBJECT_MUST_DOMINATE"
  | "NO_METADATA_FACE_COLLISION"
  | "FOOTER_SAFE_AND_COMPACT"
  | "NO_SCATTERED_METADATA"
  | "LIMIT_LARGE_TEXT_MOMENTS"
  | "LOWER_THIRD_NOT_CLUTTERED"
  | "SCRIPT_CROSSES_SUBJECT";

type BlueprintRule = {
  id: BlueprintRuleId;
  weight: number;
  hard: boolean;
};

export type PosterBlueprint = {
  id: BlueprintId;
  label: string;
  description: string;
  preferredVibes: Vibe[];
  compositionMode: CompositionMode;
  palette: {
    background: string;
    primary: string;
    secondary: string;
    script: string;
    text: string;
    muted: string;
  };
  slots: BlueprintSlot[];
  rules: BlueprintRule[];
};

export type BlueprintInput = {
  brief: CreativeBrief;
  size?: PosterSize;
  subject?: SubjectAnalysis;
  assetPack?: AssetPack;
  blueprintId?: BlueprintId;
  candidateCount?: number;
};

export type BlueprintOutput = {
  best: PosterCandidate;
  candidates: PosterCandidate[];
  selectedBlueprint: PosterBlueprint;
};

export type CritiqueResult = {
  passed: boolean;
  score: number;
  failures: string[];
  fixes: string[];
};

const BASE_RULES: BlueprintRule[] = [
  { id: "ONE_DOMINANT_HEADLINE", weight: 1, hard: true },
  { id: "SUBJECT_MUST_DOMINATE", weight: 1, hard: true },
  { id: "NO_METADATA_FACE_COLLISION", weight: 1, hard: true },
  { id: "FOOTER_SAFE_AND_COMPACT", weight: 0.8, hard: false },
  { id: "NO_SCATTERED_METADATA", weight: 0.9, hard: true },
  { id: "LIMIT_LARGE_TEXT_MOMENTS", weight: 0.8, hard: false },
  { id: "LOWER_THIRD_NOT_CLUTTERED", weight: 0.8, hard: false },
  { id: "SCRIPT_CROSSES_SUBJECT", weight: 0.7, hard: false },
];

const BLUEPRINT_PALETTES: Record<BlueprintId, PosterBlueprint["palette"]> = {
  CENTER_HERO_BIG_GHOST_TITLE: {
    background: "#070006",
    primary: "#D9003D",
    secondary: "#FFFFFF",
    script: "#FFFFFF",
    text: "#FFFFFF",
    muted: "rgba(255,255,255,0.72)",
  },
  RED_ONLY_CENTER_HERO: {
    background: "#080002",
    primary: "#C90037",
    secondary: "#FFFFFF",
    script: "#FFFFFF",
    text: "#FFFFFF",
    muted: "rgba(255,255,255,0.72)",
  },
  MIAMI_LUXE_HERO: {
    background: "#050008",
    primary: "#FF2D7A",
    secondary: "#FFFFFF",
    script: "#FFE1A8",
    text: "#FFFFFF",
    muted: "rgba(236,251,255,0.78)",
  },
  NEON_CLUB_STACK: {
    background: "#030014",
    primary: "#FF2BD6",
    secondary: "#00E5FF",
    script: "#00E5FF",
    text: "#FFFFFF",
    muted: "rgba(255,255,255,0.72)",
  },
  BOTTLE_SERVICE_VERTICAL: {
    background: "#050505",
    primary: "#F5C76B",
    secondary: "#FFFFFF",
    script: "#FFFFFF",
    text: "#FFFFFF",
    muted: "rgba(255,255,255,0.72)",
  },
  EDITORIAL_NEGATIVE_SPACE: {
    background: "#F2EFEA",
    primary: "#111111",
    secondary: "#A88D5D",
    script: "#A88D5D",
    text: "#111111",
    muted: "rgba(0,0,0,0.55)",
  },
};

export const POSTER_BLUEPRINTS: Record<BlueprintId, PosterBlueprint> = {
  CENTER_HERO_BIG_GHOST_TITLE: makeBlueprint(
    "CENTER_HERO_BIG_GHOST_TITLE",
    "Center Hero / Big Ghost Title",
    "Tiny presenter, oversized cropped title, dominant subject, expressive script, side metadata, compact footer.",
    ["afrobeats", "latin_night", "neon_club", "miami_luxe"],
    "CENTER_HERO"
  ),
  RED_ONLY_CENTER_HERO: makeBlueprint(
    "RED_ONLY_CENTER_HERO",
    "Red Only Center Hero",
    "Red and black glamour flyer grammar based on the supplied premium nightlife reference.",
    ["afrobeats", "latin_night", "trap_urban"],
    "CENTER_HERO"
  ),
  MIAMI_LUXE_HERO: makeBlueprint(
    "MIAMI_LUXE_HERO",
    "Miami Luxe Hero",
    "Pink, warm gold, VIP nightlife composition with the subject carrying the poster.",
    ["miami_luxe", "luxury_lounge", "rooftop_sunset"],
    "CENTER_HERO"
  ),
  NEON_CLUB_STACK: makeBlueprint(
    "NEON_CLUB_STACK",
    "Neon Club Stack",
    "Cyan and magenta high-energy club poster with glow, atmosphere, and tight metadata lanes.",
    ["neon_club", "trap_urban"],
    "DIAGONAL_DRAMA"
  ),
  BOTTLE_SERVICE_VERTICAL: makeBlueprint(
    "BOTTLE_SERVICE_VERTICAL",
    "Bottle Service Vertical",
    "Product-dominant luxury nightlife poster with vertical center object and compact footer.",
    ["miami_luxe", "luxury_lounge"],
    "CENTER_HERO",
    (slot) => {
      if (slot.type === "subject") return { ...slot, rect: { x: 0.34, y: 0.17, w: 0.32, h: 0.62 } };
      if (slot.type === "ghostTitle") return { ...slot, rect: { x: -0.08, y: 0.09, w: 1.16, h: 0.22 } };
      return slot;
    }
  ),
  EDITORIAL_NEGATIVE_SPACE: makeBlueprint(
    "EDITORIAL_NEGATIVE_SPACE",
    "Editorial Negative Space",
    "Fashion/luxury grammar with restrained typography and a quieter subject offset.",
    ["fashion_editorial", "luxury_lounge"],
    "NEGATIVE_SPACE",
    (slot) => {
      if (slot.type === "subject") return { ...slot, rect: { x: 0.52, y: 0.15, w: 0.42, h: 0.64 } };
      if (slot.type === "ghostTitle") {
        return {
          ...slot,
          rect: { x: 0.04, y: 0.08, w: 0.64, h: 0.2 },
          textStyle: slot.textStyle ? { ...slot.textStyle, opacity: 0.12, color: "#111111" } : slot.textStyle,
        };
      }
      if (slot.type === "scriptAccent") return { ...slot, rect: { x: 0.08, y: 0.33, w: 0.5, h: 0.08 } };
      if (slot.type === "dateBlock") return { ...slot, rect: { x: 0.08, y: 0.55, w: 0.22, h: 0.13 } };
      if (slot.type === "artistBlock") return { ...slot, rect: { x: 0.08, y: 0.68, w: 0.3, h: 0.11 } };
      return slot;
    }
  ),
};

export class PosterBlueprintEngine {
  generate(input: BlueprintInput): BlueprintOutput {
    const size = input.size ?? { width: 1080, height: 1350 };
    const candidateCount = clamp(input.candidateCount ?? 72, 12, 160);
    const hierarchy = directSemanticHierarchy(input.brief);
    const directedBrief = hierarchy.brief;
    const blueprint = input.blueprintId
      ? POSTER_BLUEPRINTS[input.blueprintId]
      : chooseBlueprint(directedBrief, input.subject);

    const candidates: PosterCandidate[] = [];
    for (let i = 0; i < candidateCount; i += 1) {
      const candidate = compileBlueprint({
        blueprint,
        brief: directedBrief,
        size,
        subject: input.subject,
        assetPack: input.assetPack,
        seed: i,
      });
      const pushed = pushFurther(candidate, blueprint, input.subject, i);
      const compositionResult = searchPosterComposition(pushed, input.subject, {
        hierarchy,
        candidateCount: 112,
      });
      const compositionScore = compositionResult.placements[0]?.score;
      const semanticPoster = applySemanticHierarchyToPoster(compositionResult.bestPoster, hierarchy);
      const overlapped = applyDepthOverlapDirector(semanticPoster, input.subject);
      const critique = critiquePoster(overlapped, blueprint, input.subject);
      const overlapCritique = critiqueOverlap(overlapped, input.subject);
      const score = makeLayoutScore(critique);
      const compositionPremium = compositionScore
        ? Math.round((compositionScore.negativeSpace + compositionScore.tension) / 2)
        : score.premiumFeel;
      overlapped.score = {
        ...score,
        readability: Math.round(
          score.readability * 0.7 +
            overlapCritique.score * 0.2 +
            (compositionScore?.textOpportunity ?? score.readability) * 0.1
        ),
        balance: Math.round(
          score.balance * 0.65 + overlapCritique.score * 0.15 + (compositionScore?.balance ?? score.balance) * 0.2
        ),
        premiumFeel: Math.round(score.premiumFeel * 0.7 + overlapCritique.score * 0.12 + compositionPremium * 0.18),
        total: Math.round(score.total * 0.6 + overlapCritique.score * 0.22 + (compositionScore?.total ?? score.total) * 0.18),
        rejected: score.rejected || !overlapCritique.passed || (compositionScore?.total ?? 100) < 54,
        failures: [...score.failures, ...overlapCritique.failures, ...(compositionScore?.failures ?? [])],
        subjectDominance: Math.round(
          score.subjectDominance * 0.3 + (compositionScore?.subjectDominance ?? score.subjectDominance) * 0.7
        ),
        notes: [
          ...score.notes,
          `Composition search tested ${compositionResult.placements.length} subject placements.`,
          `Best composition intent: ${compositionResult.bestPlacement.intent}.`,
          ...(compositionScore ? compositionScore.notes : []),
          ...overlapCritique.failures,
          ...overlapCritique.fixes,
        ],
      };
      const depthPoster = enhanceBlueprintPoster(overlapped);
      const finalPoster = enforceReadablePosterText(depthPoster, input.subject);
      candidates.push(finalPoster);
    }

    const passing = candidates.filter((candidate) => !candidate.score?.rejected);
    const pool = passing.length ? passing : candidates;
    pool.sort((a, b) => (b.score?.total ?? 0) - (a.score?.total ?? 0));

    return {
      best: pool[0],
      candidates: pool,
      selectedBlueprint: blueprint,
    };
  }
}

export function generatePosterFromBlueprint(input: BlueprintInput): BlueprintOutput {
  return new PosterBlueprintEngine().generate(input);
}

export function chooseBlueprint(brief: CreativeBrief, subject?: SubjectAnalysis): PosterBlueprint {
  const text = `${brief.title} ${brief.accentTitle ?? ""} ${brief.callToAction ?? ""} ${brief.venue ?? ""}`.toLowerCase();

  if (brief.mainSubject === "bottle" || subject?.kind === "bottle") {
    return POSTER_BLUEPRINTS.BOTTLE_SERVICE_VERTICAL;
  }
  if (/\b(ladies|girls|vip|elite|soiree|soirée)\b/.test(text) || brief.vibe === "miami_luxe") {
    return POSTER_BLUEPRINTS.MIAMI_LUXE_HERO;
  }
  if (brief.vibe === "afrobeats" || brief.vibe === "latin_night") {
    return POSTER_BLUEPRINTS.RED_ONLY_CENTER_HERO;
  }
  if (brief.vibe === "neon_club" || brief.vibe === "trap_urban") {
    return POSTER_BLUEPRINTS.NEON_CLUB_STACK;
  }
  if (brief.vibe === "fashion_editorial" || brief.vibe === "luxury_lounge") {
    return POSTER_BLUEPRINTS.EDITORIAL_NEGATIVE_SPACE;
  }
  return POSTER_BLUEPRINTS.CENTER_HERO_BIG_GHOST_TITLE;
}

export function findBlueprintLayerBySlot<T extends SceneLayer>(
  candidate: PosterCandidate,
  slot: BlueprintSlotType
): T | undefined {
  return candidate.layers.find((layer) => {
    if (layer.meta?.blueprintSlot !== slot) return false;
    if (slot === "subject" && isSubjectShadowLayer(layer)) return false;
    return true;
  }) as T | undefined;
}

export function findBlueprintTextLayer(
  candidate: PosterCandidate,
  slot: BlueprintSlotType
): TextLayer | undefined {
  const layer = findBlueprintLayerBySlot<SceneLayer>(candidate, slot);
  return layer && isTextLayer(layer) ? layer : undefined;
}

function makeBlueprint(
  id: BlueprintId,
  label: string,
  description: string,
  preferredVibes: Vibe[],
  compositionMode: CompositionMode,
  mapSlot?: (slot: BlueprintSlot) => BlueprintSlot
): PosterBlueprint {
  const palette = BLUEPRINT_PALETTES[id];
  const slots = makeBaseSlots(palette).map((slot) => (mapSlot ? mapSlot(slot) : slot));
  return {
    id,
    label,
    description,
    preferredVibes,
    compositionMode,
    palette,
    slots,
    rules: BASE_RULES,
  };
}

function makeBaseSlots(palette: PosterBlueprint["palette"]): BlueprintSlot[] {
  return [
    imageSlot("background", true, 0, { x: 0, y: 0, w: 1, h: 1 }, 10, {
      opacity: 1,
      fit: "cover",
      filter: { brightness: 0.64, contrast: 1.16, saturation: 1.16 },
    }),
    textSlot("presenter", false, 10, { x: 0.12, y: 0.045, w: 0.76, h: 0.035 }, 3, {
      fontFamily: "Montserrat",
      fontSize: 0.016,
      fontWeight: 700,
      lineHeight: 1,
      letterSpacing: 9,
      color: palette.text,
      opacity: 0.86,
      align: "center",
    }),
    textSlot("ghostTitle", true, 12, { x: -0.05, y: 0.065, w: 1.1, h: 0.22 }, 9, {
      fontFamily: "Anton",
      fontSize: 0.245,
      fontWeight: 900,
      lineHeight: 0.78,
      letterSpacing: -8,
      color: palette.primary,
      opacity: 0.54,
      align: "center",
      blendMode: "screen",
      shadow: { color: palette.primary, blur: 18, offsetX: 0, offsetY: 0 },
    }, true),
    imageSlot("fog", false, 16, { x: -0.08, y: 0.2, w: 1.16, h: 0.62 }, 3, {
      opacity: 0.4,
      fit: "cover",
      blendMode: "screen",
      filter: { blur: 6, saturation: 1.35 },
    }),
    imageSlot("particles", false, 17, { x: 0, y: 0.24, w: 1, h: 0.58 }, 2, {
      opacity: 0.28,
      fit: "cover",
      blendMode: "screen",
    }),
    imageSlot("subject", true, 30, { x: 0.22, y: 0.16, w: 0.56, h: 0.66 }, 10, {
      opacity: 1,
      fit: "contain",
      filter: { brightness: 1.05, contrast: 1.12, saturation: 1.04 },
    }),
    textSlot("scriptAccent", true, 42, { x: 0.13, y: 0.335, w: 0.74, h: 0.085 }, 7, {
      fontFamily: "Great Vibes",
      fontSize: 0.092,
      fontWeight: 400,
      lineHeight: 1,
      letterSpacing: 0,
      color: palette.script,
      opacity: 1,
      align: "center",
      rotation: -3,
      shadow: { color: palette.script, blur: 18, offsetX: 0, offsetY: 0 },
    }),
    textSlot("dateBlock", true, 45, { x: 0.075, y: 0.49, w: 0.18, h: 0.145 }, 5, {
      fontFamily: "Montserrat",
      fontSize: 0.052,
      fontWeight: 800,
      lineHeight: 0.9,
      letterSpacing: 0.4,
      color: palette.text,
      opacity: 1,
      align: "center",
      shadow: { color: "rgba(0,0,0,0.65)", blur: 10, offsetX: 0, offsetY: 4 },
    }),
    textSlot("artistBlock", false, 45, { x: 0.72, y: 0.51, w: 0.23, h: 0.12 }, 5, {
      fontFamily: "Montserrat",
      fontSize: 0.034,
      fontWeight: 800,
      lineHeight: 1.06,
      letterSpacing: 0.5,
      color: palette.text,
      opacity: 1,
      align: "center",
      shadow: { color: "rgba(0,0,0,0.65)", blur: 10, offsetX: 0, offsetY: 4 },
    }),
    textSlot("offerLine", false, 50, { x: 0.16, y: 0.78, w: 0.68, h: 0.038 }, 4, {
      fontFamily: "Montserrat",
      fontSize: 0.026,
      fontWeight: 800,
      lineHeight: 1,
      letterSpacing: -0.2,
      color: palette.text,
      opacity: 0.96,
      align: "center",
    }),
    textSlot("footerTitle", true, 51, { x: 0.14, y: 0.835, w: 0.72, h: 0.055 }, 5, {
      fontFamily: "Montserrat",
      fontSize: 0.039,
      fontWeight: 600,
      lineHeight: 1,
      letterSpacing: 5,
      color: palette.secondary,
      opacity: 1,
      align: "center",
    }),
    textSlot("addressLine", true, 51, { x: 0.18, y: 0.895, w: 0.64, h: 0.033 }, 3, {
      fontFamily: "Montserrat",
      fontSize: 0.022,
      fontWeight: 500,
      lineHeight: 1,
      letterSpacing: 0.2,
      color: palette.text,
      opacity: 0.92,
      align: "center",
    }),
    imageSlot("logo", false, 55, { x: 0.07, y: 0.855, w: 0.13, h: 0.09 }, 2, {
      opacity: 1,
      fit: "contain",
    }),
    imageSlot("qr", false, 55, { x: 0.865, y: 0.85, w: 0.07, h: 0.1 }, 2, {
      opacity: 1,
      fit: "contain",
    }),
    imageSlot("texture", false, 80, { x: 0, y: 0, w: 1, h: 1 }, 1, {
      opacity: 0.08,
      fit: "cover",
      blendMode: "overlay",
    }),
    imageSlot("vignette", true, 90, { x: 0, y: 0, w: 1, h: 1 }, 2, {
      opacity: 0.44,
      fit: "cover",
      blendMode: "multiply",
    }),
  ];
}

function compileBlueprint(args: {
  blueprint: PosterBlueprint;
  brief: CreativeBrief;
  size: PosterSize;
  subject?: SubjectAnalysis;
  assetPack?: AssetPack;
  seed: number;
}): PosterCandidate {
  const { blueprint, brief, size, subject, assetPack, seed } = args;
  const layers: SceneLayer[] = [];

  for (const slot of blueprint.slots) {
    const rect = jitterRect(toAbsoluteRect(slot.rect, size), slot, seed);
    if (slot.imageStyle) {
      const layer = buildImageLayer({ slot, rect, subject, assetPack, seed });
      if (layer) layers.push(layer);
    } else {
      const layer = buildTextLayer({ slot, rect, brief, blueprint, size });
      if (layer) layers.push(layer);
    }
  }

  return {
    id: `blueprint_${blueprint.id}_${seed}`,
    brief,
    preset: blueprintToPreset(blueprint, brief.vibe),
    compositionMode: blueprint.compositionMode,
    size,
    layers: sortLayers(layers),
  };
}

function buildImageLayer(args: {
  slot: BlueprintSlot;
  rect: Rect;
  subject?: SubjectAnalysis;
  assetPack?: AssetPack;
  seed: number;
}): ImageLayer | undefined {
  const { slot, rect, subject, assetPack, seed } = args;
  const imageStyle = slot.imageStyle;
  if (!imageStyle) return undefined;

  let src: string | undefined;
  switch (slot.type) {
    case "background":
      src = pick(assetPack?.backgroundImages, seed);
      break;
    case "subject":
      src = subject?.imageUrl;
      break;
    case "fog":
      src = pick(assetPack?.fogOverlays ?? assetPack?.glowOverlays, seed);
      break;
    case "particles":
      src = pick(assetPack?.foregroundOverlays ?? assetPack?.accentImages, seed);
      break;
    case "texture":
      src = pick(assetPack?.textureImages, seed);
      break;
    case "logo":
      src = pick(assetPack?.accentImages, seed + 11);
      break;
    default:
      src = pick(assetPack?.accentImages, seed);
      break;
  }

  return {
    id: `layer_${slot.type}_${seed}`,
    type: mapImageSlotToLayerType(slot.type),
    zIndex: slot.zIndex,
    bounds: rect,
    opacity: imageStyle.opacity,
    src,
    fit: imageStyle.fit,
    blendMode: imageStyle.blendMode,
    filter: imageStyle.filter,
    meta: {
      blueprintSlot: slot.type,
      visualImportance: slot.semanticImportance,
      dominant: slot.type === "subject",
      role: slot.type,
      fallback: !src,
    },
  };
}

function buildTextLayer(args: {
  slot: BlueprintSlot;
  rect: Rect;
  brief: CreativeBrief;
  blueprint: PosterBlueprint;
  size: PosterSize;
}): TextLayer | undefined {
  const { slot, rect, brief, blueprint, size } = args;
  const style = slot.textStyle;
  if (!style) return undefined;

  const text = resolveSlotText(slot.type, brief, blueprint);
  if (!text && slot.required) return undefined;
  if (!text) return undefined;

  return {
    id: `layer_${slot.type}_${text.replace(/\s+/g, "_").slice(0, 24)}`,
    type: mapTextSlotToLayerType(slot.type),
    zIndex: slot.zIndex,
    bounds: rect,
    opacity: style.opacity,
    text,
    fontFamily: style.fontFamily,
    fontSize: style.fontSize * size.width,
    fontWeight: style.fontWeight,
    lineHeight: style.lineHeight,
    letterSpacing: style.letterSpacing,
    color: style.color,
    align: style.align,
    rotation: style.rotation,
    blendMode: style.blendMode,
    shadow: style.shadow,
    stroke: style.stroke,
    meta: {
      blueprintSlot: slot.type,
      visualImportance: slot.semanticImportance,
      role: slot.type,
      semanticGroup: true,
      allowCrop: slot.allowCrop,
      noCharacterDistribution: slot.semanticImportance <= 5,
    },
  };
}

export function pushFurther(
  candidate: PosterCandidate,
  blueprint: PosterBlueprint,
  subject?: SubjectAnalysis,
  seed = 0
): PosterCandidate {
  const c = cloneCandidate(candidate);
  const size = c.size;
  const subjectLayer = findBlueprintLayerBySlot<ImageLayer>(c, "subject");
  const ghostTitle = findBlueprintTextLayer(c, "ghostTitle");
  const script = findBlueprintTextLayer(c, "scriptAccent");
  const dateBlock = findBlueprintTextLayer(c, "dateBlock");
  const artistBlock = findBlueprintTextLayer(c, "artistBlock");
  const footerTitle = findBlueprintTextLayer(c, "footerTitle");

  if (subjectLayer) {
    const subjectAreaRatio = area(subjectLayer.bounds) / area(fullRect(size));
    if (subjectAreaRatio < 0.32 && c.brief.mainSubject !== "bottle") {
      scaleRectFromCenter(subjectLayer.bounds, 1.12, 1.1);
    }
    if (subject?.kind === "person" || c.brief.mainSubject === "person" || c.brief.mainSubject === "dj") {
      subjectLayer.bounds.y -= size.height * 0.012;
      subjectLayer.bounds.height *= 1.035;
      subjectLayer.bounds.width *= 1.035;
    }
  }

  if (ghostTitle) {
    ghostTitle.bounds.x -= size.width * 0.02;
    ghostTitle.bounds.width += size.width * 0.04;
    ghostTitle.fontSize *= 1.03;
  }

  if (script && subjectLayer) {
    script.bounds.y = subjectLayer.bounds.y + subjectLayer.bounds.height * 0.28;
    script.bounds.x = size.width * 0.13;
    script.bounds.width = size.width * 0.74;
    script.fontSize = size.width * 0.092;
  }

  if (subjectLayer && subject?.faceBox) {
    const face = normalizedRectToAbsolute(subject.faceBox, subjectLayer.bounds);
    for (const layer of [dateBlock, artistBlock, footerTitle]) {
      if (layer && intersects(layer.bounds, face)) {
        layer.bounds.y += size.height * 0.11;
      }
    }
  }

  for (const layer of [dateBlock, artistBlock, footerTitle]) {
    if (!layer) continue;
    const importance = Number(layer.meta?.visualImportance ?? 3);
    if (importance <= 5) {
      layer.letterSpacing = clamp(layer.letterSpacing, -0.5, 5);
    }
  }

  const asymmetry = randomFromSeed(seed + 400, -0.012, 0.012) * size.width;
  if (subjectLayer && blueprint.compositionMode !== "NEGATIVE_SPACE") subjectLayer.bounds.x += asymmetry;
  if (script) script.bounds.x -= asymmetry * 0.5;

  c.layers = sortLayers(c.layers);
  return c;
}

export function critiquePoster(
  candidate: PosterCandidate,
  blueprint: PosterBlueprint,
  subject?: SubjectAnalysis
): CritiqueResult {
  let score = 100;
  const failures: string[] = [];
  const fixes: string[] = [];
  const size = candidate.size;
  const canvas = fullRect(size);
  const canvasArea = area(canvas);
  const subjectLayer = findBlueprintLayerBySlot<ImageLayer>(candidate, "subject");
  const compositionPlacement = getPosterCompositionPlacement(candidate);
  const ghostTitle = findBlueprintTextLayer(candidate, "ghostTitle");
  const script = findBlueprintTextLayer(candidate, "scriptAccent");
  const footerTitle = findBlueprintTextLayer(candidate, "footerTitle");
  const dateBlock = findBlueprintTextLayer(candidate, "dateBlock");
  const artistBlock = findBlueprintTextLayer(candidate, "artistBlock");
  const offerLine = findBlueprintTextLayer(candidate, "offerLine");
  const addressLine = findBlueprintTextLayer(candidate, "addressLine");

  for (const rule of blueprint.rules) {
    switch (rule.id) {
      case "ONE_DOMINANT_HEADLINE": {
        if (!ghostTitle) {
          penalize(20, rule, "Missing oversized ghost title.", "Add a huge cropped background title.");
        } else if (area(ghostTitle.bounds) / canvasArea < 0.18) {
          penalize(14, rule, "Ghost title is too small to create poster scale.", "Scale ghost title until it feels cropped.");
        }
        break;
      }
      case "SUBJECT_MUST_DOMINATE": {
        if (candidate.brief.mainSubject !== "none" && !subjectLayer) {
          penalize(30, rule, "Missing hero subject.", "Add isolated subject layer.");
        } else if (
          subjectLayer &&
          !compositionPlacement &&
          area(subjectLayer.bounds) / canvasArea < 0.28
        ) {
          penalize(22, rule, "Subject is too small; poster is not subject-dominant.", "Scale subject to at least 28% canvas area.");
        } else if (
          subjectLayer &&
          compositionPlacement &&
          area(subjectLayer.bounds) / canvasArea < 0.16
        ) {
          penalize(16, rule, "Camera-composed subject is too small to carry the poster.", "Increase subject camera dominance while preserving typography air.");
        }
        break;
      }
      case "NO_METADATA_FACE_COLLISION": {
        if (subjectLayer && subject?.faceBox) {
          const face = normalizedRectToAbsolute(subject.faceBox, subjectLayer.bounds);
          const badCollision = [dateBlock, artistBlock, footerTitle, offerLine, addressLine].some(
            (layer) => layer && overlapRatio(layer.bounds, face) > 0.03
          );
          if (badCollision) {
            penalize(24, rule, "Metadata collides with face area.", "Move metadata away from face. Script can cross body; metadata cannot.");
          }
        }
        break;
      }
      case "FOOTER_SAFE_AND_COMPACT": {
        const safe = getSafeArea(size);
        for (const layer of [footerTitle, offerLine, addressLine].filter(Boolean) as TextLayer[]) {
          if (!isInside(layer.bounds, safe)) {
            penalize(10, rule, `${layer.id} is outside safe area.`, "Keep footer stack inside bottom safe zone.");
          }
          if (area(layer.bounds) / canvasArea > 0.08) {
            penalize(8, rule, `${layer.id} is too large for footer information.`, "Compress footer into a compact system.");
          }
        }
        break;
      }
      case "NO_SCATTERED_METADATA": {
        for (const layer of [dateBlock, artistBlock, footerTitle, offerLine, addressLine].filter(Boolean) as TextLayer[]) {
          if (Math.abs(layer.letterSpacing) > 6) {
            penalize(14, rule, `${layer.id} uses excessive tracking.`, "Use phrase blocks, not scattered letters.");
          }
        }
        break;
      }
      case "LIMIT_LARGE_TEXT_MOMENTS": {
        const largeText = candidate.layers.filter(isTextLayer).filter((layer) => area(layer.bounds) / canvasArea > 0.1);
        if (largeText.length > 2) {
          penalize(18, rule, "Too many large text moments.", "Keep one ghost title plus one expressive script/accent.");
        }
        break;
      }
      case "LOWER_THIRD_NOT_CLUTTERED": {
        const lowerThird = { x: 0, y: size.height * 0.68, width: size.width, height: size.height * 0.32 };
        const lowerTextArea =
          candidate.layers
            .filter(isTextLayer)
            .filter((layer) => intersects(layer.bounds, lowerThird))
            .reduce((sum, layer) => sum + area(layer.bounds) * layer.opacity, 0) / canvasArea;
        if (lowerTextArea > 0.22) {
          penalize(16, rule, "Lower third is cluttered.", "Compress offer, footer title, and address into a tighter hierarchy.");
        }
        break;
      }
      case "SCRIPT_CROSSES_SUBJECT": {
        if (script && subjectLayer && !intersects(script.bounds, subjectLayer.bounds)) {
          penalize(10, rule, "Script accent does not interact with subject.", "Move script accent across the subject or torso for depth.");
        }
        break;
      }
    }
  }

  score = clampScore(score);
  return {
    passed: score >= 74 && failures.length <= 2,
    score,
    failures,
    fixes,
  };

  function penalize(amount: number, rule: BlueprintRule, failure: string, fix: string) {
    score -= amount * rule.weight;
    failures.push(failure);
    fixes.push(fix);
  }
}

function resolveSlotText(type: BlueprintSlotType, brief: CreativeBrief, blueprint: PosterBlueprint): string {
  switch (type) {
    case "presenter":
      return brief.socials?.[0]
        ? `${brief.socials[0].replace("@", "").toUpperCase()} PRESENTS`
        : brandFromVenue(brief.venue) || "PRESENTS";
    case "ghostTitle":
      return getGhostTitleText(brief).toUpperCase();
    case "scriptAccent":
      return brief.accentTitle || getScriptAccentFallback(brief);
    case "dateBlock":
      return makeDateBlock(brief);
    case "artistBlock":
      return makeArtistBlock(brief);
    case "offerLine":
      return makeOfferLine(brief);
    case "footerTitle":
      return makeFooterTitle(brief, blueprint);
    case "addressLine":
      return [brief.venue, brief.location].filter(Boolean).join(" - ").toUpperCase();
    default:
      return "";
  }
}

function getGhostTitleText(brief: CreativeBrief): string {
  const title = brief.title.trim();
  const words = title.split(/\s+/).filter(Boolean);
  const dayWord = words.find((word) => /monday|tuesday|wednesday|thursday|friday|saturday|sunday/i.test(word));
  if (dayWord) return dayWord;
  const strong = words.find((word) => word.length >= 5);
  return strong ?? words[0] ?? title;
}

function getScriptAccentFallback(brief: CreativeBrief): string {
  const title = brief.title.trim();
  const words = title.split(/\s+/).filter(Boolean);
  if (words.length > 1) return words.slice(1).join(" ");
  if (brief.vibe === "latin_night") return "Latin Night";
  if (brief.vibe === "afrobeats") return "Afro Vibes";
  if (brief.vibe === "miami_luxe") return "VIP Edition";
  return "All Night";
}

function makeDateBlock(brief: CreativeBrief): string {
  const date = brief.date ?? "";
  const time = brief.time ?? "";
  const dayMatch = date.match(/\b(\d{1,2})\b/);
  const monthMatch = date.match(/\b(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC|JANUARY|FEBRUARY|MARCH|APRIL|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER)\b/i);
  const day = dayMatch?.[1] ?? date;
  const month = monthMatch?.[1]?.slice(0, 3).toUpperCase() ?? "";
  return [month, day, time].filter(Boolean).join("\n").toUpperCase();
}

function makeArtistBlock(brief: CreativeBrief): string {
  if (!brief.lineup?.length) return "";
  return ["MUSIC BY:", ...brief.lineup].join("\n").toUpperCase();
}

function makeOfferLine(brief: CreativeBrief): string {
  return [brief.price, brief.callToAction].filter(Boolean).join("  |  ").toUpperCase();
}

function makeFooterTitle(brief: CreativeBrief, blueprint: PosterBlueprint): string {
  if (brief.eventType === "restaurant") return "DRINKS - FOOD - MUSIC";
  if (brief.vibe === "afrobeats") return "DRINKS - HOOKAH - FOOD";
  if (brief.vibe === "latin_night") return "REGGAETON - LATIN - DANCE";
  if (brief.vibe === "miami_luxe") return "VIP - BOTTLES - TABLES";
  if (blueprint.id === "RED_ONLY_CENTER_HERO") return "DRINKS - HOOKAH - FOOD";
  return "DRINKS - MUSIC - VIBES";
}

function brandFromVenue(venue?: string): string {
  if (!venue) return "";
  return `${venue.toUpperCase()} PRESENTS`;
}

function textSlot(
  type: BlueprintSlotType,
  required: boolean,
  zIndex: number,
  rect: AnchorRect,
  semanticImportance: number,
  textStyle: BlueprintTextStyle,
  allowCrop = false
): BlueprintSlot {
  return { type, required, zIndex, rect, semanticImportance, textStyle, allowCrop };
}

function imageSlot(
  type: BlueprintSlotType,
  required: boolean,
  zIndex: number,
  rect: AnchorRect,
  semanticImportance: number,
  imageStyle: BlueprintImageStyle
): BlueprintSlot {
  return { type, required, zIndex, rect, semanticImportance, imageStyle };
}

function mapTextSlotToLayerType(type: BlueprintSlotType): TextLayer["type"] {
  if (type === "ghostTitle") return "ghostText";
  if (type === "scriptAccent") return "scriptAccent";
  if (type === "footerTitle" || type === "addressLine" || type === "offerLine") return "footer";
  return "metadata";
}

function mapImageSlotToLayerType(type: BlueprintSlotType): ImageLayer["type"] {
  if (type === "background") return "background";
  if (type === "subject") return "subject";
  if (type === "texture") return "texture";
  if (type === "vignette") return "fx";
  if (type === "fog") return "atmosphere";
  return "accent";
}

function isTextLayer(layer: SceneLayer): layer is TextLayer {
  return ["ghostText", "headline", "scriptAccent", "metadata", "footer"].includes(layer.type);
}

function isSubjectShadowLayer(layer: SceneLayer): boolean {
  if (layer.type !== "subject") return false;
  const role = String(layer.meta?.role ?? "").toLowerCase();
  const depthKind = String(layer.meta?.depthKind ?? "").toLowerCase();
  return role.includes("shadow") || depthKind.includes("shadow") || layer.id.toLowerCase().includes("shadow");
}

function toAbsoluteRect(rect: AnchorRect, size: PosterSize): Rect {
  return {
    x: rect.x * size.width,
    y: rect.y * size.height,
    width: rect.w * size.width,
    height: rect.h * size.height,
  };
}

function jitterRect(rect: Rect, slot: BlueprintSlot, seed: number): Rect {
  if (slot.semanticImportance >= 8) {
    return {
      ...rect,
      x: rect.x + randomFromSeed(seed + slot.zIndex, -rect.width * 0.012, rect.width * 0.012),
      y: rect.y + randomFromSeed(seed + slot.zIndex + 9, -rect.height * 0.015, rect.height * 0.015),
    };
  }
  if (slot.semanticImportance <= 3) return rect;
  return {
    ...rect,
    x: rect.x + randomFromSeed(seed + slot.zIndex, -rect.width * 0.018, rect.width * 0.018),
    y: rect.y + randomFromSeed(seed + slot.zIndex + 9, -rect.height * 0.018, rect.height * 0.018),
  };
}

function fullRect(size: PosterSize): Rect {
  return { x: 0, y: 0, width: size.width, height: size.height };
}

function getSafeArea(size: PosterSize): Rect {
  return {
    x: size.width * 0.055,
    y: size.height * 0.045,
    width: size.width * 0.89,
    height: size.height * 0.91,
  };
}

function scaleRectFromCenter(rect: Rect, sx: number, sy: number): void {
  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;
  rect.width *= sx;
  rect.height *= sy;
  rect.x = cx - rect.width / 2;
  rect.y = cy - rect.height / 2;
}

function normalizedRectToAbsolute(normalized: Rect, container: Rect): Rect {
  return {
    x: container.x + normalized.x * container.width,
    y: container.y + normalized.y * container.height,
    width: normalized.width * container.width,
    height: normalized.height * container.height,
  };
}

function area(rect: Rect): number {
  return Math.max(0, rect.width) * Math.max(0, rect.height);
}

function intersects(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function intersectRect(a: Rect, b: Rect): Rect {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.width, b.x + b.width);
  const y2 = Math.min(a.y + a.height, b.y + b.height);
  return { x: x1, y: y1, width: Math.max(0, x2 - x1), height: Math.max(0, y2 - y1) };
}

function overlapRatio(a: Rect, b: Rect): number {
  const denom = Math.max(1, Math.min(area(a), area(b)));
  return area(intersectRect(a, b)) / denom;
}

function isInside(inner: Rect, outer: Rect): boolean {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.width <= outer.x + outer.width &&
    inner.y + inner.height <= outer.y + outer.height
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function clampScore(value: number): number {
  return Math.round(clamp(value, 0, 100));
}

function randomFromSeed(seed: number, min: number, max: number): number {
  const x = Math.sin(seed * 9999.123) * 10000;
  const t = x - Math.floor(x);
  return min + t * (max - min);
}

function pick<T>(items: T[] | undefined, seed: number): T | undefined {
  if (!items?.length) return undefined;
  return items[Math.abs(seed) % items.length];
}

function sortLayers(layers: SceneLayer[]): SceneLayer[] {
  return [...layers].sort((a, b) => a.zIndex - b.zIndex);
}

function cloneCandidate(candidate: PosterCandidate): PosterCandidate {
  return {
    ...candidate,
    layers: candidate.layers.map((layer) => ({
      ...layer,
      bounds: { ...layer.bounds },
      meta: { ...layer.meta },
    })) as SceneLayer[],
  };
}

function makeLayoutScore(critique: CritiqueResult): LayoutScore {
  return {
    hierarchy: critique.score,
    readability: critique.score,
    subjectDominance: critique.score,
    styleMatch: critique.score,
    balance: critique.score,
    premiumFeel: critique.score,
    total: critique.score,
    rejected: !critique.passed,
    failures: critique.failures,
    notes: [...critique.failures, ...critique.fixes],
  };
}

function blueprintToPreset(blueprint: PosterBlueprint, vibe: Vibe): ArtDirectionPreset {
  return {
    id: vibe,
    label: blueprint.label,
    defaultComposition: [blueprint.compositionMode],
    palette: [
      blueprint.palette.background,
      blueprint.palette.primary,
      blueprint.palette.secondary,
      blueprint.palette.text,
    ],
    typography: {
      displayFont: "Anton",
      supportFont: "Montserrat",
      scriptFont: "Great Vibes",
      headlineCase: "uppercase",
      headlineTracking: -6,
      metadataTracking: 2,
    },
    metadataStyle: "footer_system",
    dna: {
      scaleDrama: 9,
      textOverlap: 8,
      glowAmount: 8,
      negativeSpace: 4,
      symmetry: 5,
      luxuryRestraint: 4,
      chaos: 5,
      typographyAggression: 9,
      density: 8,
    },
    layerRecipe: [],
  };
}
