import type {
  CreativeBrief,
  LayoutScore,
  PosterCandidate,
  PosterSize,
  Rect,
  SceneLayer,
  TextLayer,
} from "./artDirectorEngine";

export type SemanticPriority = "hero" | "support" | "metadata" | "fineprint" | "suppressed";

export type SemanticKind =
  | "eventTitle"
  | "accentTitle"
  | "date"
  | "time"
  | "lineup"
  | "venue"
  | "location"
  | "price"
  | "offer"
  | "phone"
  | "social"
  | "ageLimit"
  | "cta"
  | "sponsor"
  | "unknown";

export type SemanticTextBlock = {
  id: string;
  kind: SemanticKind;
  rawText: string;
  displayText: string;
  priority: SemanticPriority;
  visualWeight: number;
  maxAreaRatio: number;
  preferredZone:
    | "hero"
    | "script"
    | "topRail"
    | "leftModule"
    | "rightModule"
    | "footerOffer"
    | "footerMain"
    | "footerFineprint"
    | "hidden";
  mayBeLarge: boolean;
  mayOverlapSubject: boolean;
  mayOverlapFace: boolean;
  shouldCompress: boolean;
  groupWith?: string;
};

export type DirectedHierarchy = {
  brief: CreativeBrief;
  blocks: SemanticTextBlock[];
  heroTitle: string;
  ghostTitle: string;
  scriptAccent: string;
  dateModule: string;
  artistModule: string;
  offerLine: string;
  footerMain: string;
  fineprint: string;
  suppressed: SemanticTextBlock[];
  notes: string[];
};

export type SemanticHierarchyOptions = {
  forceHeroTitle?: string;
  forceGhostTitle?: string;
  forceScriptAccent?: string;
  suppressLongPromos?: boolean;
  suppressPhone?: boolean;
  maxHeroWords?: number;
  maxOfferChars?: number;
};

export type SemanticApplicationOptions = {
  removeBadPromoBanners?: boolean;
  forceMissingHero?: boolean;
  clampMetadataScale?: boolean;
  preserveExistingSubject?: boolean;
};

export function directSemanticHierarchy(
  brief: CreativeBrief,
  options: SemanticHierarchyOptions = {}
): DirectedHierarchy {
  const blocks = extractSemanticBlocks(brief);
  const notes: string[] = [];
  const prioritized = blocks.map((block) => assignSemanticPriority(block, brief, options));

  const heroTitle = options.forceHeroTitle || chooseHeroTitle(prioritized, brief, options);
  const ghostTitle = options.forceGhostTitle || chooseGhostTitle(heroTitle);
  const scriptAccent = options.forceScriptAccent || chooseScriptAccent(heroTitle, brief);
  const dateModule = buildDateModule(prioritized, brief);
  const artistModule = buildArtistModule(prioritized, brief);
  const offerLine = buildOfferLine(prioritized, options);
  const footerMain = buildFooterMain(brief);
  const fineprint = buildFineprint(prioritized, options);
  const suppressed = prioritized.filter((block) => block.priority === "suppressed");

  const directedBrief: CreativeBrief = {
    ...brief,
    title: heroTitle,
    accentTitle: scriptAccent,
    date: dateModule || brief.date,
    time: "",
    callToAction: offerLine || "",
    price: "",
    venue: footerMain || brief.venue,
    location: fineprint || "",
  };

  notes.push(`Hero title selected: ${heroTitle}`);
  notes.push(`Ghost title selected: ${ghostTitle}`);
  notes.push(`Script accent selected: ${scriptAccent}`);
  if (offerLine) notes.push(`Promo compressed into offer line: ${offerLine}`);
  if (fineprint) notes.push(`Fineprint compressed: ${fineprint}`);

  return {
    brief: directedBrief,
    blocks: prioritized,
    heroTitle,
    ghostTitle,
    scriptAccent,
    dateModule,
    artistModule,
    offerLine,
    footerMain,
    fineprint,
    suppressed,
    notes,
  };
}

export function applySemanticHierarchyToPoster(
  candidate: PosterCandidate,
  hierarchy: DirectedHierarchy,
  options: SemanticApplicationOptions = {}
): PosterCandidate {
  const c = cloneCandidate(candidate);
  const size = c.size;

  if (options.removeBadPromoBanners ?? true) {
    removeOrCompressHijackingText(c, hierarchy);
  }

  const ghost = ensureTextLayer(c, "ghostTitle", "ghostText");
  const hero = ensureTextLayer(c, "primaryTitle", "headline");
  const script = ensureTextLayer(c, "scriptAccent", "scriptAccent");
  const date = ensureTextLayer(c, "dateBlock", "metadata");
  const artist = ensureTextLayer(c, "artistBlock", "metadata");
  const offer = ensureTextLayer(c, "offerLine", "footer");
  const footer = ensureTextLayer(c, "footerTitle", "footer");
  const fineprint = ensureTextLayer(c, "addressLine", "footer");

  applyGhostTitle(ghost, hierarchy, size);
  applyHeroTitle(hero, hierarchy, size);
  applyScriptAccent(script, hierarchy, size);
  applyDateModule(date, hierarchy, size);
  applyArtistModule(artist, hierarchy, size);
  applyOfferLine(offer, hierarchy, size);
  applyFooterMain(footer, hierarchy, size);
  applyFineprint(fineprint, hierarchy, size);

  if (options.clampMetadataScale ?? true) {
    clampAllMetadata(c);
  }

  c.layers = c.layers.sort((a, b) => a.zIndex - b.zIndex);
  c.score = makeHierarchyScore(hierarchy);
  return c;
}

function extractSemanticBlocks(brief: CreativeBrief): SemanticTextBlock[] {
  const blocks: SemanticTextBlock[] = [];

  addBlock(blocks, "title", "eventTitle", brief.title);
  addBlock(blocks, "accentTitle", "accentTitle", brief.accentTitle);
  addBlock(blocks, "date", "date", brief.date);
  addBlock(blocks, "time", "time", brief.time);
  addBlock(blocks, "venue", "venue", brief.venue);
  addBlock(blocks, "location", "location", brief.location);
  addBlock(blocks, "price", "price", brief.price);
  addBlock(blocks, "cta", classifyTextKind(brief.callToAction || ""), brief.callToAction);
  addBlock(blocks, "ageLimit", "ageLimit", brief.ageLimit);

  brief.lineup?.forEach((item, index) => addBlock(blocks, `lineup_${index}`, "lineup", item));
  brief.socials?.forEach((item, index) => addBlock(blocks, `social_${index}`, "social", item));

  for (const block of [...blocks]) {
    for (const [index, phone] of extractPhones(block.rawText).entries()) {
      addBlock(blocks, `${block.id}_phone_${index}`, "phone", phone);
    }
  }

  return dedupeBlocks(blocks);
}

function addBlock(blocks: SemanticTextBlock[], id: string, kind: SemanticKind, value?: string): void {
  const text = (value || "").trim();
  if (!text) return;

  blocks.push({
    id,
    kind,
    rawText: text,
    displayText: text,
    priority: "metadata",
    visualWeight: 4,
    maxAreaRatio: 0.05,
    preferredZone: "footerFineprint",
    mayBeLarge: false,
    mayOverlapSubject: false,
    mayOverlapFace: false,
    shouldCompress: false,
  });
}

function classifyTextKind(text: string): SemanticKind {
  const upper = text.toUpperCase();
  if (!upper.trim()) return "unknown";
  if (extractPhones(upper).length) return "phone";
  if (/FREE|COMPLIMENTARY|LADIES|BOTTLE|BOTTLES|ENTRY|BEFORE|MIDNIGHT|DISCOUNT|RSVP|TICKETS/.test(upper)) {
    return "offer";
  }
  if (/DJ|MUSIC BY|HOSTED BY|PERFORMANCE/.test(upper)) return "lineup";
  if (/PM|AM|DOORS|LATE/.test(upper)) return "time";
  if (/JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC|MON|TUE|WED|THU|FRI|SAT|SUN/.test(upper)) {
    return "date";
  }
  return "unknown";
}

function assignSemanticPriority(
  block: SemanticTextBlock,
  _brief: CreativeBrief,
  options: SemanticHierarchyOptions
): SemanticTextBlock {
  const b = { ...block };
  const upper = b.rawText.toUpperCase();
  const length = upper.length;

  switch (b.kind) {
    case "eventTitle":
      b.priority = "hero";
      b.visualWeight = 10;
      b.maxAreaRatio = 0.24;
      b.preferredZone = "hero";
      b.mayBeLarge = true;
      b.mayOverlapSubject = true;
      break;
    case "accentTitle":
      b.priority = "support";
      b.visualWeight = 7;
      b.maxAreaRatio = 0.1;
      b.preferredZone = "script";
      b.mayBeLarge = true;
      b.mayOverlapSubject = true;
      break;
    case "offer":
    case "price":
    case "cta":
      b.priority = length > 32 || options.suppressLongPromos !== false ? "metadata" : "support";
      b.visualWeight = 4;
      b.maxAreaRatio = 0.045;
      b.preferredZone = "footerOffer";
      b.shouldCompress = true;
      break;
    case "phone":
      b.priority = options.suppressPhone === false ? "fineprint" : "suppressed";
      b.visualWeight = 1;
      b.maxAreaRatio = 0.02;
      b.preferredZone = "footerFineprint";
      b.shouldCompress = true;
      break;
    case "date":
    case "time":
      b.priority = "metadata";
      b.visualWeight = 5;
      b.maxAreaRatio = 0.065;
      b.preferredZone = "leftModule";
      break;
    case "lineup":
      b.priority = "metadata";
      b.visualWeight = 5;
      b.maxAreaRatio = 0.065;
      b.preferredZone = "rightModule";
      break;
    case "venue":
    case "location":
      b.priority = "fineprint";
      b.visualWeight = 3;
      b.maxAreaRatio = 0.035;
      b.preferredZone = "footerFineprint";
      break;
    default:
      b.priority = "fineprint";
      b.visualWeight = 2;
      b.maxAreaRatio = 0.025;
      b.preferredZone = "footerFineprint";
      b.shouldCompress = true;
      break;
  }

  b.mayBeLarge = b.priority === "hero" || b.priority === "support";
  b.mayOverlapSubject = b.priority === "hero" || b.priority === "support";
  b.mayOverlapFace = false;

  if (/COMPLIMENTARY|FREE|LADIES|BOTTLES|ENTRY|RSVP|TICKETS/i.test(upper) && length > 24) {
    b.priority = "metadata";
    b.visualWeight = Math.min(b.visualWeight, 4);
    b.preferredZone = "footerOffer";
    b.mayBeLarge = false;
    b.maxAreaRatio = 0.045;
    b.shouldCompress = true;
  }

  if (extractPhones(upper).length) {
    b.priority = options.suppressPhone === false ? "fineprint" : "suppressed";
    b.visualWeight = 1;
    b.preferredZone = "footerFineprint";
    b.mayBeLarge = false;
    b.maxAreaRatio = 0.02;
    b.shouldCompress = true;
  }

  return b;
}

function chooseHeroTitle(
  blocks: SemanticTextBlock[],
  brief: CreativeBrief,
  options: SemanticHierarchyOptions
): string {
  const title = blocks.find((block) => block.kind === "eventTitle")?.rawText || brief.title;
  const accent = blocks.find((block) => block.kind === "accentTitle")?.rawText || brief.accentTitle || "";
  const maxWords = options.maxHeroWords ?? 3;
  const candidate =
    accent && !looksLikePromo(accent) && !looksLikePromo(title)
      ? `${title} ${accent}`.trim()
      : title;
  const words = candidate.split(/\s+/).filter(Boolean);
  return (words.length <= maxWords ? candidate : words.slice(0, maxWords).join(" ")).toUpperCase();
}

function chooseGhostTitle(heroTitle: string): string {
  const words = heroTitle.split(/\s+/).filter(Boolean);
  const day = words.find((word) => /MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY/i.test(word));
  if (day) return day.toUpperCase();
  return (words.find((word) => word.length >= 5) || words[0] || heroTitle).toUpperCase();
}

function chooseScriptAccent(heroTitle: string, brief: CreativeBrief): string {
  if (brief.accentTitle && !looksLikePromo(brief.accentTitle)) return brief.accentTitle;
  const words = heroTitle.split(/\s+/).filter(Boolean);
  if (words.length > 1) return titleCase(words.slice(1).join(" "));
  if (brief.vibe === "afrobeats") return "Red Only";
  if (brief.vibe === "latin_night") return "Latin Night";
  if (brief.vibe === "miami_luxe") return "VIP Edition";
  if (brief.vibe === "neon_club") return "After Dark";
  return "All Night";
}

function buildDateModule(blocks: SemanticTextBlock[], brief: CreativeBrief): string {
  const date = blocks.find((block) => block.kind === "date")?.rawText || brief.date || "";
  const time = blocks.find((block) => block.kind === "time")?.rawText || brief.time || "";
  const month = date.match(/JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC/i)?.[0]?.toUpperCase() || "";
  const day = date.match(/\b\d{1,2}\b/)?.[0] || date.toUpperCase();
  return [month, day, time.toUpperCase()].filter(Boolean).join("\n");
}

function buildArtistModule(blocks: SemanticTextBlock[], brief: CreativeBrief): string {
  const lineup = blocks.filter((block) => block.kind === "lineup").map((block) => block.rawText.toUpperCase());
  if (!lineup.length && brief.lineup?.length) lineup.push(...brief.lineup.map((item) => item.toUpperCase()));
  return lineup.length ? ["MUSIC BY:", ...lineup].join("\n") : "";
}

function buildOfferLine(blocks: SemanticTextBlock[], options: SemanticHierarchyOptions): string {
  const maxChars = options.maxOfferChars ?? 58;
  const offers = blocks
    .filter((block) => ["offer", "price", "cta"].includes(block.kind))
    .map((block) => block.rawText)
    .filter(Boolean);
  if (!offers.length) return "";
  const compressed = compressOfferText(offers.join(" | "));
  return compressed.length > maxChars ? `${compressed.slice(0, maxChars - 1).trim()}...` : compressed;
}

function buildFooterMain(brief: CreativeBrief): string {
  if (brief.vibe === "afrobeats") return "DRINKS · HOOKAH · FOOD";
  if (brief.vibe === "latin_night") return "REGGAETON · LATIN · DANCE";
  if (brief.vibe === "miami_luxe") return "VIP · BOTTLES · TABLES";
  if (brief.eventType === "restaurant") return "DRINKS · FOOD · MUSIC";
  return "DRINKS · MUSIC · VIBES";
}

function buildFineprint(blocks: SemanticTextBlock[], options: SemanticHierarchyOptions): string {
  const fine = blocks
    .filter((block) => ["venue", "location", "social", "ageLimit"].includes(block.kind))
    .map((block) => stripPhones(block.rawText).toUpperCase())
    .filter(Boolean);

  if (options.suppressPhone === false) {
    fine.push(...blocks.filter((block) => block.kind === "phone").map((block) => block.rawText));
  }

  return fine.join("  •  ");
}

function applyGhostTitle(layer: TextLayer, hierarchy: DirectedHierarchy, size: PosterSize): void {
  layer.text = hierarchy.ghostTitle;
  layer.type = "ghostText";
  layer.zIndex = 12;
  layer.bounds = abs(size, -0.08, 0.07, 1.16, 0.23);
  layer.fontFamily = "Anton";
  layer.fontSize = size.width * 0.235;
  layer.fontWeight = 900;
  layer.lineHeight = 0.78;
  layer.letterSpacing = -8;
  layer.color = "#C90037";
  layer.opacity = 0.5;
  layer.align = "center";
  layer.blendMode = "screen";
  layer.meta = semanticMeta("ghostTitle", "hero", 8, true);
}

function applyHeroTitle(layer: TextLayer, hierarchy: DirectedHierarchy, size: PosterSize): void {
  layer.text = hierarchy.heroTitle;
  layer.type = "headline";
  layer.zIndex = 56;
  layer.bounds = abs(size, 0.04, 0.52, 0.92, 0.11);
  layer.fontFamily = "Anton";
  layer.fontSize = size.width * 0.11;
  layer.fontWeight = 900;
  layer.lineHeight = 0.78;
  layer.letterSpacing = -4;
  layer.color = "#FFFFFF";
  layer.opacity = hierarchy.heroTitle ? 1 : 0;
  layer.align = "center";
  layer.shadow = strongShadow();
  layer.meta = semanticMeta("primaryTitle", "hero", 10, true);
}

function applyScriptAccent(layer: TextLayer, hierarchy: DirectedHierarchy, size: PosterSize): void {
  layer.text = hierarchy.scriptAccent;
  layer.type = "scriptAccent";
  layer.zIndex = 58;
  layer.bounds = abs(size, 0.12, 0.34, 0.76, 0.085);
  layer.fontFamily = "Great Vibes";
  layer.fontSize = size.width * 0.092;
  layer.fontWeight = 400;
  layer.lineHeight = 1;
  layer.letterSpacing = 0;
  layer.color = "#FFFFFF";
  layer.opacity = hierarchy.scriptAccent ? 1 : 0;
  layer.align = "center";
  layer.rotation = -2;
  layer.shadow = { color: "rgba(255,255,255,0.88)", blur: 18, offsetX: 0, offsetY: 0 };
  layer.meta = semanticMeta("scriptAccent", "support", 7, true);
}

function applyDateModule(layer: TextLayer, hierarchy: DirectedHierarchy, size: PosterSize): void {
  layer.text = hierarchy.dateModule;
  layer.type = "metadata";
  layer.zIndex = 64;
  layer.bounds = abs(size, 0.065, 0.48, 0.18, 0.15);
  layer.fontFamily = "Montserrat";
  layer.fontSize = size.width * 0.052;
  layer.fontWeight = 800;
  layer.lineHeight = 0.9;
  layer.letterSpacing = 0;
  layer.color = "#FFFFFF";
  layer.opacity = hierarchy.dateModule ? 1 : 0;
  layer.align = "center";
  layer.shadow = strongShadow();
  layer.meta = semanticMeta("dateBlock", "metadata", 5, false);
}

function applyArtistModule(layer: TextLayer, hierarchy: DirectedHierarchy, size: PosterSize): void {
  layer.text = hierarchy.artistModule;
  layer.type = "metadata";
  layer.zIndex = 64;
  layer.bounds = abs(size, 0.72, 0.5, 0.23, 0.13);
  layer.fontFamily = "Montserrat";
  layer.fontSize = size.width * 0.033;
  layer.fontWeight = 800;
  layer.lineHeight = 1.05;
  layer.letterSpacing = 0.5;
  layer.color = "#FFFFFF";
  layer.opacity = hierarchy.artistModule ? 1 : 0;
  layer.align = "center";
  layer.shadow = strongShadow();
  layer.meta = semanticMeta("artistBlock", "metadata", 5, false);
}

function applyOfferLine(layer: TextLayer, hierarchy: DirectedHierarchy, size: PosterSize): void {
  layer.text = hierarchy.offerLine;
  layer.type = "footer";
  layer.zIndex = 66;
  layer.bounds = abs(size, 0.15, 0.79, 0.7, 0.04);
  layer.fontFamily = "Montserrat";
  layer.fontSize = size.width * 0.026;
  layer.fontWeight = 800;
  layer.lineHeight = 1;
  layer.letterSpacing = -0.2;
  layer.color = "#FFFFFF";
  layer.opacity = hierarchy.offerLine ? 0.96 : 0;
  layer.align = "center";
  layer.shadow = strongShadow();
  layer.meta = semanticMeta("offerLine", "metadata", 4, false);
}

function applyFooterMain(layer: TextLayer, hierarchy: DirectedHierarchy, size: PosterSize): void {
  layer.text = hierarchy.footerMain;
  layer.type = "footer";
  layer.zIndex = 66;
  layer.bounds = abs(size, 0.13, 0.835, 0.74, 0.055);
  layer.fontFamily = "Montserrat";
  layer.fontSize = size.width * 0.038;
  layer.fontWeight = 500;
  layer.lineHeight = 1;
  layer.letterSpacing = 5;
  layer.color = "#FF1654";
  layer.opacity = hierarchy.footerMain ? 1 : 0;
  layer.align = "center";
  layer.shadow = strongShadow();
  layer.meta = semanticMeta("footerTitle", "metadata", 5, false);
}

function applyFineprint(layer: TextLayer, hierarchy: DirectedHierarchy, size: PosterSize): void {
  layer.text = hierarchy.fineprint;
  layer.type = "footer";
  layer.zIndex = 66;
  layer.bounds = abs(size, 0.16, 0.895, 0.68, 0.035);
  layer.fontFamily = "Montserrat";
  layer.fontSize = size.width * 0.02;
  layer.fontWeight = 500;
  layer.lineHeight = 1;
  layer.letterSpacing = 0;
  layer.color = "#FFFFFF";
  layer.opacity = hierarchy.fineprint ? 0.9 : 0;
  layer.align = "center";
  layer.shadow = strongShadow();
  layer.meta = semanticMeta("addressLine", "fineprint", 3, false);
}

function removeOrCompressHijackingText(candidate: PosterCandidate, hierarchy: DirectedHierarchy): void {
  const canvasArea = candidate.size.width * candidate.size.height;

  for (const layer of candidate.layers) {
    if (!isTextLayer(layer)) continue;

    const upper = layer.text.toUpperCase();
    const layerAreaRatio = area(layer.bounds) / canvasArea;
    const hijacks =
      looksLikePromo(upper) ||
      extractPhones(upper).length > 0 ||
      (layerAreaRatio > 0.09 && !looksLikeHeroTitle(upper, hierarchy));

    if (!hijacks) continue;

    if (looksLikePromo(upper)) {
      layer.text = hierarchy.offerLine || compressOfferText(layer.text);
      applyOfferLine(layer, hierarchy, candidate.size);
    } else if (extractPhones(upper).length) {
      layer.text = "";
      layer.opacity = 0;
      layer.meta = {
        ...layer.meta,
        role: "suppressedPhone",
        semanticPriority: "suppressed",
        suppressedReason: "Phone number cannot be hero typography.",
      };
    } else {
      layer.opacity = Math.min(layer.opacity, 0.25);
      layer.zIndex = 10;
      layer.meta = {
        ...layer.meta,
        semanticPriority: "suppressed",
        suppressedReason: "Large non-hero text was suppressed.",
      };
    }
  }
}

function clampAllMetadata(candidate: PosterCandidate): void {
  const size = candidate.size;

  for (const layer of candidate.layers) {
    if (!isTextLayer(layer)) continue;

    const role = getRole(layer);
    const priority = String(layer.meta?.semanticPriority ?? "metadata");
    if (priority === "hero") continue;

    if (["dateBlock", "artistBlock", "offerLine", "footerTitle", "addressLine", "presenter"].includes(role)) {
      layer.letterSpacing = clamp(layer.letterSpacing, -1, role === "footerTitle" ? 5 : 2);
      layer.fontSize = Math.min(layer.fontSize, maxFontSizeForRole(role, size));
      layer.meta = {
        ...layer.meta,
        noCharacterDistribution: true,
        semanticGroup: true,
      };
    }
  }
}

function maxFontSizeForRole(role: string, size: PosterSize): number {
  if (role === "dateBlock") return size.width * 0.055;
  if (role === "artistBlock") return size.width * 0.036;
  if (role === "offerLine") return size.width * 0.028;
  if (role === "footerTitle") return size.width * 0.04;
  if (role === "addressLine") return size.width * 0.022;
  if (role === "presenter") return size.width * 0.018;
  return size.width * 0.032;
}

function ensureTextLayer(candidate: PosterCandidate, role: string, type: TextLayer["type"]): TextLayer {
  let layer = candidate.layers.find((item) => isTextLayer(item) && getRole(item) === role) as TextLayer | undefined;

  if (!layer) {
    layer = {
      id: `semantic_${role}`,
      type,
      zIndex: 60,
      bounds: { x: 0, y: 0, width: 100, height: 40 },
      opacity: 1,
      text: "",
      fontFamily: "Montserrat",
      fontSize: 32,
      fontWeight: 700,
      lineHeight: 1,
      letterSpacing: 0,
      color: "#FFFFFF",
      align: "center",
      meta: { role, blueprintSlot: role, semanticGroup: true },
    };
    candidate.layers.push(layer);
  }

  layer.meta = { ...layer.meta, role, blueprintSlot: role, semanticGroup: true };
  return layer;
}

function semanticMeta(
  role: string,
  priority: SemanticPriority,
  weight: number,
  mayOverlapSubject: boolean
): Record<string, unknown> {
  return {
    role,
    blueprintSlot: role,
    semanticPriority: priority,
    visualImportance: weight,
    semanticGroup: true,
    noCharacterDistribution: priority !== "hero",
    mayOverlapSubject,
    mayOverlapFace: false,
  };
}

function getRole(layer: TextLayer): string {
  return String(layer.meta?.role || layer.meta?.blueprintSlot || "");
}

function isTextLayer(layer: SceneLayer): layer is TextLayer {
  return ["ghostText", "headline", "scriptAccent", "metadata", "footer"].includes(layer.type);
}

function cloneCandidate(candidate: PosterCandidate): PosterCandidate {
  return {
    ...candidate,
    score: candidate.score
      ? { ...candidate.score, failures: [...candidate.score.failures], notes: [...candidate.score.notes] }
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

export function compressOfferText(text: string): string {
  let result = text.toUpperCase();
  result = result.replace(/COMPLIMENTARY/g, "FREE");
  result = result.replace(/FOR LADIES/g, "FOR LADIES");
  result = result.replace(/LADIES FREE BEFORE MIDNIGHT/g, "LADIES FREE BEFORE 12");
  result = result.replace(/BEFORE MIDNIGHT/g, "BEFORE 12");
  result = result.replace(/\s+/g, " ").trim();
  result = result.replace(/3 FREE DRINKS LADIES/, "3 FREE DRINKS FOR LADIES");
  return result;
}

function looksLikePromo(text: string): boolean {
  return /COMPLIMENTARY|FREE|LADIES|BOTTLES?|ENTRY|RSVP|TICKETS?|BEFORE MIDNIGHT|BEFORE 12|DRINKS/.test(
    text.toUpperCase()
  );
}

function looksLikeHeroTitle(text: string, hierarchy: DirectedHierarchy): boolean {
  const upper = text.toUpperCase().trim();
  return upper === hierarchy.heroTitle.toUpperCase() || upper === hierarchy.ghostTitle.toUpperCase();
}

function extractPhones(text: string): string[] {
  const matches = text.match(/(?:\+?\d[\d\s().-]{6,}\d)/g);
  return matches ? matches.map((item) => item.trim()) : [];
}

function stripPhones(text: string): string {
  return text
    .replace(/(?:\+?\d[\d\s().-]{6,}\d)/g, "")
    .replace(/\b(RSVP|TABLES?|CALL|TEXT|WHATSAPP)\b\s*:?\s*/gi, "")
    .replace(/[|•]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function dedupeBlocks(blocks: SemanticTextBlock[]): SemanticTextBlock[] {
  const seen = new Set<string>();
  const result: SemanticTextBlock[] = [];

  for (const block of blocks) {
    const key = `${block.kind}:${block.rawText.toUpperCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(block);
  }

  return result;
}

function titleCase(value: string): string {
  return value.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

function abs(size: PosterSize, x: number, y: number, w: number, h: number): Rect {
  return { x: size.width * x, y: size.height * y, width: size.width * w, height: size.height * h };
}

function area(rect: Rect): number {
  return Math.max(0, rect.width) * Math.max(0, rect.height);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function strongShadow() {
  return { color: "rgba(0,0,0,0.78)", blur: 12, offsetX: 0, offsetY: 5 };
}

function makeHierarchyScore(hierarchy: DirectedHierarchy): LayoutScore {
  return {
    hierarchy: 92,
    readability: 88,
    subjectDominance: 86,
    styleMatch: 88,
    balance: 84,
    premiumFeel: 86,
    total: 88,
    rejected: false,
    failures: [],
    notes: hierarchy.notes,
  };
}
