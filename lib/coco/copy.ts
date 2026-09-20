export type CocoGeneratedCopy = {
  presenter: string;
  headline: string;
  subheadline: string;
  details: string;
  details2: string;
  venue: string;
  date: string;
  price: string;
  socials: string;
  subtag: string;
  compliance: string;
  djLineup: string;
  musicPolicy: string;
  rsvpContact: string;
  addons: string;
};

export type CocoCopyEventBriefLike = {
  address?: unknown;
  ageRequirement?: unknown;
  bookingContact?: unknown;
  date?: unknown;
  djs?: unknown;
  endTime?: unknown;
  entryFee?: unknown;
  presenterName?: unknown;
  rsvpContact?: unknown;
  socials?: unknown;
  startTime?: unknown;
  venueName?: unknown;
};

export const COCO_COPY_FIELDS = [
  "presenter",
  "headline",
  "subheadline",
  "details",
  "details2",
  "venue",
  "date",
  "price",
  "socials",
  "subtag",
  "compliance",
  "djLineup",
  "musicPolicy",
  "rsvpContact",
  "addons",
] as const;

type CocoCopyField = (typeof COCO_COPY_FIELDS)[number];
type CocoCopyContext = {
  nightlifeStyle?: string | null;
  photoHints?: string[];
  eventDescription?: string | null;
};

const COCO_COPY_LINE_LIMITS: Record<CocoCopyField, number> = {
  presenter: 2,
  headline: 2,
  subheadline: 2,
  details: 5,
  details2: 5,
  venue: 3,
  date: 3,
  price: 2,
  socials: 2,
  subtag: 1,
  compliance: 1,
  djLineup: 3,
  musicPolicy: 2,
  rsvpContact: 2,
  addons: 2,
};

const COCO_COPY_CHAR_LIMITS: Record<CocoCopyField, number> = {
  presenter: 42,
  headline: 32,
  subheadline: 32,
  details: 150,
  details2: 150,
  venue: 80,
  date: 40,
  price: 28,
  socials: 38,
  subtag: 48,
  compliance: 22,
  djLineup: 72,
  musicPolicy: 64,
  rsvpContact: 64,
  addons: 64,
};

const COCO_COPY_LINE_CHAR_LIMITS: Record<CocoCopyField, number> = {
  presenter: 42,
  headline: 18,
  subheadline: 18,
  details: 28,
  details2: 28,
  venue: 24,
  date: 14,
  price: 14,
  socials: 18,
  subtag: 48,
  compliance: 22,
  djLineup: 24,
  musicPolicy: 32,
  rsvpContact: 32,
  addons: 32,
};

/**
 * These roles contain event facts, not creative filler. An omitted fact should
 * remove the role from the flyer instead of displaying a plausible-looking
 * placeholder that a guest could mistake for real event information.
 */
const COCO_OPTIONAL_FACT_FIELDS = new Set<CocoCopyField>([
  "presenter",
  "venue",
  "date",
  "price",
  "socials",
  "compliance",
  "djLineup",
  "rsvpContact",
  "addons",
]);

const COCO_FACT_PLACEHOLDERS: Partial<Record<CocoCopyField, RegExp>> = {
  presenter: /^presenter here$/i,
  venue: /^venue name(?:\s+address)?$/i,
  date: /^date(?:\s+10\s*p\.?m\.?)?$/i,
  socials: /^@?your\s*handle$/i,
  djLineup: /^(?:music by\s+)?dj name$/i,
  rsvpContact: /^rsvp\s*\/?\s*tables?\s+0{0,2}123456789$/i,
};

export function normalizeCocoEventName(value: unknown) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

function splitEventName(value: string) {
  const eventName = normalizeCocoEventName(value) || "EVENT NAME";
  const words = eventName.split(" ").filter(Boolean);
  if (words.length === 1) {
    return { headline: words[0], subheadline: "" };
  }
  if (words.length === 2) {
    return { headline: words[0], subheadline: words[1] };
  }

  const midpoint = Math.ceil(words.length / 2);
  return {
    headline: words.slice(0, midpoint).join(" "),
    subheadline: words.slice(midpoint).join(" "),
  };
}

const COCO_COPY_UPPERCASE_WORDS = new Set(["DJ", "EDM", "LA", "NYC", "R&B", "VIP"]);

function titleCaseCocoCopyLine(value: string) {
  return String(value || "")
    .split("\n")
    .map((line) =>
      line
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => {
          const upper = word.toUpperCase();
          if (COCO_COPY_UPPERCASE_WORDS.has(upper)) return upper;
          if (/[a-z]/.test(word) && /[A-Z]/.test(word.slice(1)) && !/^[A-Z][a-z]+$/.test(word)) {
            return word;
          }
          const lower = word.toLowerCase();
          return lower.charAt(0).toUpperCase() + lower.slice(1);
        })
        .join(" ")
    )
    .join("\n")
    .trim();
}

function normalizeCocoCopyContext(context?: CocoCopyContext | string | null): CocoCopyContext {
  if (typeof context === "string") return { nightlifeStyle: context };
  return {
    nightlifeStyle: context?.nightlifeStyle ?? null,
    eventDescription: String(context?.eventDescription ?? "").trim().slice(0, 600),
    photoHints: Array.isArray(context?.photoHints)
      ? context.photoHints.map((hint) => String(hint || "").toLowerCase()).filter(Boolean)
      : [],
  };
}

function hasCopyHint(context: CocoCopyContext, pattern: RegExp) {
  return (context.photoHints ?? []).some((hint) => pattern.test(hint));
}

function fallbackCocoSubtag(lower: string, style: string, eventDescription: string) {
  if (/\ball[ -]?white\b/.test(lower)) {
    return "All White • After Dark";
  }
  if (/\b(?:clean\s+understated|calm\s+polished)\b/.test(lower)) {
    return "Understated • After Dark";
  }
  if (/(martini|cocktail|margarita|drinks?|mixology)/.test(lower)) {
    return "Signature Cocktails After Dark";
  }
  if (/(ladies|girls|women|queen|baddie)/.test(lower) || style === "ladies-night") {
    return "Glamour After Dark";
  }
  if (/(tropical|mojito|latin|island|summer|beach|rooftop)/.test(lower)) {
    return "Sunset Rhythms • Open Air";
  }
  if (/(retro|throwback|old school|disco|classic)/.test(lower)) {
    return "Classics Back In Rotation";
  }
  if (/(vip|lux|luxe|black tie|champagne)/.test(lower) || style === "luxury-club" || style === "bottle-service") {
    return "Champagne After Dark";
  }
  if (/(dj|techno|house|edm|rave|bass)/.test(lower) || /^(edm|techno|house)$/.test(style)) {
    return "Lights Low • System Loud";
  }
  if (/(afro|afrobeats|amapiano|dancehall)/.test(lower) || style === "afrobeats") {
    return "Warm Rhythms All Night";
  }
  if (/(r&b|rnb|lounge|slow jams)/.test(lower) || style === "rnb-lounge") {
    return "Slow Grooves • Late Hours";
  }
  if (/(brunch|sunday|sundays)/.test(lower) || style === "brunch") {
    return "Weekend Mode In Full Color";
  }
  if (style === "hip-hop") return "Bottles • Beats • Late Night";

  const description = String(eventDescription || "")
    .replace(/\r\n?/g, " ")
    .split(/[.!?;|]/)[0]
    .replace(/^\s*(?:join us|get ready|come out|do not miss|don't miss)(?:\s+for)?\s+/i, "")
    .replace(/^\s*(?:an?\s+)?(?:unforgettable\s+)?night\s+(?:designed\s+)?for\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
  const compact = truncateAtWord(description.split(" ").slice(0, 7).join(" "), 48);
  return compact ? titleCaseCocoCopyLine(compact) : "Late Night Energy";
}

export function fallbackCocoGeneratedCopy(
  eventName: string,
  context?: CocoCopyContext | string | null
): CocoGeneratedCopy {
  const title = splitEventName(eventName);
  const copyContext = normalizeCocoCopyContext(context);
  const lower = [normalizeCocoEventName(eventName), copyContext.eventDescription]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const style = String(copyContext.nightlifeStyle || "").toLowerCase();
  let details = "LATE NIGHT ENERGY\nDANCE FLOOR VIBES\nCOCKTAILS AND\nCLUB MOMENTS";
  let details2 = "MUSIC FOR THE ROOM\nFRIENDS IN MOTION\nVIP TABLES\nALL NIGHT";

  if (/\ball[ -]?white\b/.test(lower)) {
    details = "ALL WHITE ATMOSPHERE\nCLEAN LATE NIGHT\nPOLISHED ENERGY";
    details2 = "MUSIC AND MOMENTS\nCONFIDENT ENERGY\nAFTER DARK";
  } else if (/\b(?:clean\s+understated|calm\s+polished)\b/.test(lower)) {
    details = "POLISHED LATE NIGHT\nMUSIC AND MOMENTS\nCALM CONFIDENT ENERGY";
    details2 = "CLEAN ATMOSPHERE\nSOCIAL ENERGY\nAFTER DARK";
  } else if (/(martini|cocktail|margarita|drinks?|mixology)/.test(lower) || hasCopyHint(copyContext, /cocktail|drink/)) {
    details = "HANDCRAFTED MARTINIS\nCOCKTAILS ALL NIGHT\nLOUNGE ENERGY\nSIP IN STYLE";
    details2 = "FRIENDS AND DRINKS\nSMOOTH R&B VIBES\nVIP TABLES\nGOOD MUSIC";
  } else if (/(ladies|girls|women|queen|baddie)/.test(lower) || style === "ladies-night") {
    details = "GLAM NIGHT ENERGY\nCOCKTAILS AND\nCAMERA MOMENTS\nVIP TABLES";
    details2 = "LADIES FIRST\nFRIENDS IN STYLE\nDANCE FLOOR VIBES\nALL NIGHT";
  } else if (/(tropical|mojito|latin|island|summer|beach|rooftop)/.test(lower)) {
    details = "TROPICAL RHYTHMS\nAFROBEATS LATIN\nCOCKTAILS AND\nISLAND ENERGY";
    details2 = "WARM NIGHT VIBES\nDANCEHALL FLOW\nROOFTOP FEEL\nALL NIGHT";
  } else if (/(retro|throwback|old school|disco|classic)/.test(lower)) {
    details = "THROWBACK ANTHEMS\nOLD SCHOOL HEAT\nRETRO DANCE FLOOR\nCLASSIC NIGHT";
    details2 = "90S AND 2000S\nSING ALONG MOMENTS\nDRESS TO MOVE\nALL NIGHT";
  } else if (/(vip|lux|luxe|black tie|champagne)/.test(lower) || style === "luxury-club" || style === "bottle-service") {
    details = "UPSCALE NIGHTLIFE\nCHAMPAGNE ENERGY\nVELVET ROOM VIBES\nDRESS SHARP";
    details2 = "VIP TABLES\nBOTTLE SERVICE\nPRIVATE MOMENTS\nPREMIUM CROWD";
  } else if (/(dj|techno|house|edm|rave|bass)/.test(lower) || /^(edm|techno|house)$/.test(style)) {
    details = "BASS HEAVY SOUND\nLASERS AND SMOKE\nDANCE FLOOR PRESSURE\nCLUB SYSTEM";
    details2 = "HOUSE TECHNO ENERGY\nLATE SETS\nLOUD ROOM\nALL NIGHT";
  } else if (/(afro|afrobeats|amapiano|dancehall)/.test(lower) || style === "afrobeats") {
    details = "AFROBEATS ALL NIGHT\nWARM RHYTHMS\nCOCKTAILS AND DANCE\nISLAND HEAT";
    details2 = "AMAPIANO FLOW\nSOCIAL ENERGY\nGOOD PEOPLE\nGOOD MUSIC";
  } else if (/(latin|salsa|bachata|reggaeton)/.test(lower) || style === "latin-night") {
    details = "LATIN HEAT\nDANCE FLOOR RHYTHMS\nCOCKTAILS AND\nLATE NIGHT ENERGY";
    details2 = "SALSA REGGAETON\nFRIENDS IN MOTION\nWARM LIGHTS\nALL NIGHT";
  } else if (/(r&b|rnb|lounge|slow jams)/.test(lower) || style === "rnb-lounge") {
    details = "R&B LOUNGE ENERGY\nCRAFT COCKTAILS\nSMOOTH GROOVES\nSOCIAL HOUR";
    details2 = "INTIMATE ATMOSPHERE\nFRIENDS AND DRINKS\nVIP TABLES\nDRESS TO IMPRESS";
  } else if (/(brunch|sunday|sundays)/.test(lower) || style === "brunch") {
    details = "SUNDAY NIGHT ENERGY\nR&B AFROBEATS\nCOCKTAILS AND\nDANCE FLOOR VIBES";
    details2 = "WEEKEND RESET\nFRIENDS AND DRINKS\nVIP TABLES\nGOOD MUSIC";
  } else if (style === "hip-hop") {
    details = "HIP HOP ENERGY\nBOTTLES AND BEATS\nCLUB ANTHEMS\nLATE NIGHT CROWD";
    details2 = "DJS IN ROTATION\nFRIENDS IN MOTION\nVIP TABLES\nALL NIGHT";
  } else if (style === "rooftop") {
    details = "ROOFTOP ENERGY\nCITY VIEWS\nCOCKTAILS AND\nSUNSET VIBES";
    details2 = "OPEN AIR MOMENTS\nFRIENDS AND MUSIC\nVIP TABLES\nALL NIGHT";
  }

  return {
    presenter: "",
    headline: titleCaseCocoCopyLine(title.headline),
    subheadline: titleCaseCocoCopyLine(title.subheadline),
    details,
    details2,
    venue: "",
    date: "",
    price: "",
    socials: "",
    subtag: fallbackCocoSubtag(lower, style, copyContext.eventDescription || ""),
    compliance: "",
    djLineup: "",
    musicPolicy:
      /(tropical|mojito|latin|island|summer|beach|rooftop)/.test(lower)
        ? "AFROBEATS • LATIN • OPEN FORMAT"
        : /(dj|techno|house|edm|rave|bass)/.test(lower)
          ? "HOUSE • TECHNO • OPEN FORMAT"
          : "HIP HOP • AFROBEATS • OPEN FORMAT",
    rsvpContact: "",
    addons: "",
  };
}

function truncateAtWord(value: string, limit: number) {
  if (value.length <= limit) return value;
  const sliced = value.slice(0, limit).trimEnd();
  const lastSpace = sliced.lastIndexOf(" ");
  if (lastSpace > Math.floor(limit * 0.55)) {
    return sliced.slice(0, lastSpace).trimEnd();
  }
  return sliced;
}

function sanitizeCocoCopyField(value: unknown, field: CocoCopyField, fallback: string) {
  const source = typeof value === "string" ? value : fallback;
  const lines = source
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .slice(0, COCO_COPY_LINE_LIMITS[field])
    .map((line) => truncateAtWord(line, COCO_COPY_LINE_CHAR_LIMITS[field]))
    .filter(Boolean);
  const joined = lines.join("\n").slice(0, COCO_COPY_CHAR_LIMITS[field]);
  return joined.trim();
}

function hasSentencePunctuation(value: string) {
  return /[.!?,;]/.test(value);
}

function maxWordsPerLine(value: string) {
  return value
    .split("\n")
    .reduce((max, line) => Math.max(max, line.trim().split(/\s+/).filter(Boolean).length), 0);
}

function lineExceedsLimit(value: string, field: CocoCopyField) {
  return value
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .some((line) => line.replace(/\s+/g, " ").trim().length > COCO_COPY_LINE_CHAR_LIMITS[field]);
}

function shouldUseFallbackField(field: CocoCopyField, raw: unknown, sanitized: string) {
  if (!sanitized) return false;
  if (typeof raw !== "string") return false;
  const source = raw.trim();
  if (!source) return false;

  if (field === "headline" || field === "subheadline") {
    return hasSentencePunctuation(source) || maxWordsPerLine(source) > 3 || lineExceedsLimit(source, field);
  }

  if (field === "details" || field === "details2" || field === "presenter") {
    return (
      hasSentencePunctuation(source) ||
      maxWordsPerLine(source) > 4 ||
      lineExceedsLimit(source, field) ||
      /join us|come out|get ready|don't miss|do not miss|tickets available|buy now/i.test(source) ||
      /\b(chill vibes|refreshment|savor our signature)\b/i.test(source)
    );
  }

  if (field === "venue") {
    // Venue names and postal addresses are factual user input. Valid values are
    // often short ("Studio 47") and addresses routinely contain punctuation,
    // so neither is evidence that the copy is generic prose.
    return /favorite|your venue|nightlife spot|near you/i.test(source);
  }

  if (field === "date") {
    return /every|night$/i.test(source) || hasSentencePunctuation(source);
  }

  if (field === "price") {
    return /applies|charge|cover$/i.test(source) || hasSentencePunctuation(source);
  }

  if (field === "socials") {
    return !sanitized.startsWith("@");
  }

  if (field === "subtag") {
    const compactSource = source.replace(/\s+/g, " ").trim();
    return (
      sanitized.startsWith("#") ||
      /[.!?;]/.test(source) ||
      compactSource.length > COCO_COPY_CHAR_LIMITS.subtag ||
      compactSource.split(" ").filter(Boolean).length > 7 ||
      /join us|come out|get ready|don't miss|do not miss|tickets available|buy now/i.test(source)
    );
  }

  if (field === "djLineup") {
    return hasSentencePunctuation(source) || !/\bdj\b/i.test(source);
  }

  if (field === "musicPolicy" || field === "addons") {
    return hasSentencePunctuation(source) || maxWordsPerLine(source) > 7;
  }

  if (field === "rsvpContact") {
    return hasSentencePunctuation(source) || !/rsvp|table|contact|\d/i.test(source);
  }

  return false;
}

export function sanitizeCocoGeneratedCopy(
  value: unknown,
  eventName: string,
  context?: CocoCopyContext | string | null
): CocoGeneratedCopy {
  const fallback = fallbackCocoGeneratedCopy(eventName, context);
  const source = value && typeof value === "object" ? (value as Partial<Record<CocoCopyField, unknown>>) : {};
  const fieldValue = (field: CocoCopyField) => {
    if (COCO_OPTIONAL_FACT_FIELDS.has(field)) {
      const rawFact = source[field];
      if (typeof rawFact !== "string" || !rawFact.trim()) return "";
      const factualValue = sanitizeCocoCopyField(rawFact, field, "");
      const placeholder = COCO_FACT_PLACEHOLDERS[field];
      return placeholder?.test(factualValue.replace(/\s+/g, " ").trim()) ? "" : factualValue;
    }
    const sanitized = sanitizeCocoCopyField(source[field], field, fallback[field]);
    if (!sanitized) return fallback[field];
    return shouldUseFallbackField(field, source[field], sanitized) ? fallback[field] : sanitized;
  };
  const headline = titleCaseCocoCopyLine(fieldValue("headline"));
  const subheadline = titleCaseCocoCopyLine(fieldValue("subheadline"));
  const rawMusicPolicy = fieldValue("musicPolicy");
  const musicPolicy = rawMusicPolicy.includes("\n")
    ? rawMusicPolicy
    : (() => {
        const parts = rawMusicPolicy.split(/\s*•\s*/).filter(Boolean);
        if (parts.length < 2) return rawMusicPolicy;
        const midpoint = Math.ceil(parts.length / 2);
        return `${parts.slice(0, midpoint).join(" • ")}\n${parts.slice(midpoint).join(" • ")}`;
      })();

  return {
    presenter: fieldValue("presenter"),
    headline,
    subheadline,
    details: fieldValue("details"),
    details2: fieldValue("details2"),
    venue: fieldValue("venue"),
    date: fieldValue("date"),
    price: fieldValue("price"),
    socials: fieldValue("socials"),
    subtag: fieldValue("subtag"),
    compliance: fieldValue("compliance"),
    djLineup: fieldValue("djLineup"),
    musicPolicy,
    rsvpContact: fieldValue("rsvpContact"),
    addons: fieldValue("addons"),
  };
}

const cocoBriefFact = (value: unknown) =>
  typeof value === "string" ? value.replace(/\r\n?/g, "\n").trim() : "";

/**
 * Materializes generated copy against the authoritative event brief. Creative
 * fields are sanitized normally; factual roles are copied only from the brief.
 * This makes an omitted fact truly optional and prevents model or fallback
 * placeholders from reaching a finished flyer.
 */
export function materializeCocoComposerCopy(
  value: unknown,
  eventName: string,
  eventBrief: CocoCopyEventBriefLike | null | undefined,
  context?: CocoCopyContext | string | null
): CocoGeneratedCopy {
  const copy = sanitizeCocoGeneratedCopy(value, eventName, context);
  const brief = eventBrief ?? {};
  const venueName = cocoBriefFact(brief.venueName);
  const address = cocoBriefFact(brief.address);
  const date = cocoBriefFact(brief.date);
  const startTime = cocoBriefFact(brief.startTime);
  const endTime = cocoBriefFact(brief.endTime);

  return {
    ...copy,
    presenter: cocoBriefFact(brief.presenterName),
    venue: [venueName, address].filter(Boolean).join("\n"),
    date: [date, [startTime, endTime].filter(Boolean).join(" — ")].filter(Boolean).join("\n"),
    price: cocoBriefFact(brief.entryFee),
    socials: cocoBriefFact(brief.socials),
    compliance: cocoBriefFact(brief.ageRequirement),
    djLineup: cocoBriefFact(brief.djs),
    rsvpContact: cocoBriefFact(brief.rsvpContact) || cocoBriefFact(brief.bookingContact),
  };
}
