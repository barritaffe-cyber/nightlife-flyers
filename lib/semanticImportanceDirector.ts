import type {
  LayoutScore,
  PosterCandidate,
  PosterSize,
  Rect,
  SceneLayer,
  TextLayer,
} from "./artDirectorEngine";

export type SemanticPriority = "hero" | "support" | "metadata" | "fineprint" | "suppressed";

export type SemanticContentType =
  | "eventTitle"
  | "accentTitle"
  | "date"
  | "lineup"
  | "promotion"
  | "contact"
  | "venue"
  | "presenter"
  | "unknown";

export type SemanticDecision = {
  priority: SemanticPriority;
  contentType: SemanticContentType;
  visualWeight: number;
  treatment: "heroScale" | "supportScale" | "metadataModule" | "fineprintLine" | "compress";
  reason: string;
};

export type SemanticImportanceOptions = {
  compressPromotions?: boolean;
  suppressLongPromotions?: boolean;
};

export function applySemanticImportanceDirector(
  candidate: PosterCandidate,
  options: SemanticImportanceOptions = {}
): PosterCandidate {
  const c = cloneCandidate(candidate);
  const issues: string[] = [];

  for (const layer of c.layers) {
    if (!isTextLayer(layer)) continue;

    const role = getSemanticRole(layer);
    const decision = classifyTextContentSemanticPriority(layer.text, role);
    layer.meta = {
      ...layer.meta,
      semanticPriority: decision.priority,
      semanticContentType: decision.contentType,
      semanticVisualWeight: decision.visualWeight,
      semanticTreatment: decision.treatment,
      semanticReason: decision.reason,
    };

    applySemanticTreatment(layer, role, decision, c.size, options);

    if (decision.priority === "suppressed" || decision.treatment === "compress") {
      issues.push(`${layer.id}: ${decision.reason}`);
    }
  }

  c.score = mergeSemanticScore(c.score, issues);
  c.layers = c.layers.sort((a, b) => a.zIndex - b.zIndex);
  return c;
}

export function classifyTextContentSemanticPriority(text: string, role = "unknown"): SemanticDecision {
  const value = normalizeText(text);
  const normalizedRole = normalizeRole(role);
  const wordCount = value ? value.split(/\s+/).length : 0;

  if (!value) {
    return decision("suppressed", "unknown", 0, "compress", "Empty text has no visual priority.");
  }

  if (isContactText(value)) {
    return decision("fineprint", "contact", 0.18, "fineprintLine", "Phone/contact text is fineprint, not headline.");
  }

  if (isPromotionText(value)) {
    const longPromotion = value.length > 28 || wordCount > 4;
    return longPromotion
      ? decision("suppressed", "promotion", 0.2, "compress", "Long promotion is marketing-important but visually suppressed.")
      : decision("metadata", "promotion", 0.34, "metadataModule", "Short promotion is metadata, not hero typography.");
  }

  if (normalizedRole === "ghostTitle" || normalizedRole === "primaryTitle") {
    return decision("hero", "eventTitle", 1, "heroScale", "Primary event title owns hero priority.");
  }

  if (normalizedRole === "scriptAccent") {
    return decision("support", "accentTitle", 0.62, "supportScale", "Accent title supports the hero.");
  }

  if (normalizedRole === "dateBlock" || looksLikeDateText(value)) {
    return decision("metadata", "date", 0.42, "metadataModule", "Date/time belongs in metadata.");
  }

  if (normalizedRole === "artistBlock") {
    return decision("metadata", "lineup", 0.4, "metadataModule", "Lineup belongs in metadata.");
  }

  if (normalizedRole === "footerTitle" || normalizedRole === "addressLine") {
    return decision("metadata", "venue", 0.32, "metadataModule", "Venue/footer belongs in metadata.");
  }

  if (normalizedRole === "presenter") {
    return decision("fineprint", "presenter", 0.2, "fineprintLine", "Presenter copy should be small.");
  }

  return decision("metadata", "unknown", 0.3, "metadataModule", "Unclassified text defaults to metadata.");
}

export function compressPromotionText(text: string): string {
  const value = text.replace(/\s+/g, " ").trim();
  if (!value) return "";

  return value
    .replace(/\bCOMPLIMENTARY\b/gi, "COMPLIMENTARY")
    .replace(/\bDRINKS?\s+FOR\s+LADIES\b/gi, "DRINKS")
    .replace(/\bLADIES\s+FREE\b/gi, "LADIES FREE")
    .replace(/\s+\|\s+/g, " / ")
    .slice(0, 42)
    .trim();
}

function applySemanticTreatment(
  layer: TextLayer,
  role: string,
  decision: SemanticDecision,
  size: PosterSize,
  options: SemanticImportanceOptions
): void {
  const compressPromotions = options.compressPromotions ?? true;
  const suppressLongPromotions = options.suppressLongPromotions ?? true;

  switch (decision.priority) {
    case "hero":
      layer.fontSize = clamp(layer.fontSize, size.width * 0.1, size.width * 0.26);
      layer.opacity = Math.max(layer.opacity, 0.9);
      break;

    case "support":
      layer.fontSize = Math.min(layer.fontSize, size.width * 0.095);
      layer.opacity = Math.min(Math.max(layer.opacity, 0.86), 1);
      break;

    case "metadata":
      layer.fontSize = Math.min(layer.fontSize, role === "offerLine" ? size.width * 0.026 : size.width * 0.042);
      layer.opacity = Math.min(layer.opacity, 0.96);
      break;

    case "fineprint":
      layer.fontSize = Math.min(layer.fontSize, size.width * 0.022);
      layer.opacity = Math.min(layer.opacity, 0.86);
      break;

    case "suppressed":
      if (compressPromotions && decision.contentType === "promotion") {
        layer.text = compressPromotionText(layer.text);
      }
      layer.fontSize = Math.min(layer.fontSize, size.width * 0.02);
      layer.opacity = Math.min(layer.opacity, 0.82);
      layer.lineHeight = Math.max(layer.lineHeight, 1);
      layer.letterSpacing = clamp(layer.letterSpacing, 0, 3);
      if (suppressLongPromotions) {
        layer.bounds = role === "offerLine" ? abs(size, 0.16, 0.79, 0.68, 0.035) : layer.bounds;
      }
      break;
  }

  if (decision.priority !== "hero") {
    layer.meta = {
      ...layer.meta,
      noCharacterDistribution: true,
      canDominatePoster: false,
    };
  }
}

function mergeSemanticScore(score: LayoutScore | undefined, issues: string[]): LayoutScore | undefined {
  if (!score) return undefined;
  if (!issues.length) return score;
  return {
    ...score,
    hierarchy: Math.max(score.hierarchy, 84),
    balance: Math.max(score.balance, 82),
    total: Math.round(score.total * 0.94 + Math.max(score.hierarchy, 84) * 0.06),
    notes: [...score.notes, ...issues],
  };
}

function decision(
  priority: SemanticPriority,
  contentType: SemanticContentType,
  visualWeight: number,
  treatment: SemanticDecision["treatment"],
  reason: string
): SemanticDecision {
  return { priority, contentType, visualWeight, treatment, reason };
}

function getSemanticRole(layer: TextLayer): string {
  return String(layer.meta?.role ?? layer.meta?.blueprintSlot ?? layer.type ?? "unknown");
}

function normalizeRole(role: string): string {
  const value = role.trim();
  if (value === "ghostText" || value === "headline" || value === "primary_title") return "primaryTitle";
  if (value === "ghostTitle" || value === "oversized_ghost_title") return "ghostTitle";
  if (value === "scriptAccent" || value === "accent_title") return "scriptAccent";
  if (value === "dateBlock" || value === "date_time_rail") return "dateBlock";
  if (value === "artistBlock" || value === "artist_block") return "artistBlock";
  if (value === "offerLine") return "offerLine";
  if (value === "footerTitle" || value === "footer_info_system") return "footerTitle";
  if (value === "addressLine") return "addressLine";
  return value || "unknown";
}

function normalizeText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function isPromotionText(text: string): boolean {
  return /\b(complimentary|free|drinks?|special|offer|bottles?|hookah|vip|tables?|cover|entry|before\s+\d{1,2})\b/i.test(
    text
  );
}

function isContactText(text: string): boolean {
  return /(?:\+?\d[\d\s().-]{6,}\d)|\b(rsvp|reservations?|tables?|call|text|whatsapp|dm)\b/i.test(text);
}

function looksLikeDateText(text: string): boolean {
  return /\b(mon|tue|wed|thu|fri|sat|sun|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{1,2}:\d{2})\b/i.test(
    text
  );
}

function isTextLayer(layer: SceneLayer): layer is TextLayer {
  return ["ghostText", "headline", "scriptAccent", "metadata", "footer"].includes(layer.type);
}

function cloneCandidate(candidate: PosterCandidate): PosterCandidate {
  return {
    ...candidate,
    score: candidate.score
      ? {
          ...candidate.score,
          failures: [...candidate.score.failures],
          notes: [...candidate.score.notes],
        }
      : undefined,
    layers: candidate.layers.map((layer) => {
      if (isTextLayer(layer)) {
        return {
          ...layer,
          bounds: { ...layer.bounds },
          meta: { ...layer.meta },
          shadow: layer.shadow ? { ...layer.shadow } : undefined,
          stroke: layer.stroke ? { ...layer.stroke } : undefined,
        };
      }
      return {
        ...layer,
        bounds: { ...layer.bounds },
        meta: { ...layer.meta },
        filter: layer.filter ? { ...layer.filter } : undefined,
      };
    }) as SceneLayer[],
  };
}

function abs(size: PosterSize, x: number, y: number, w: number, h: number): Rect {
  return {
    x: size.width * x,
    y: size.height * y,
    width: size.width * w,
    height: size.height * h,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
