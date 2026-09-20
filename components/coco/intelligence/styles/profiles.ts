import type {
  CocoNightlifeStyle,
  CocoPhotoSignal,
  CocoStyleDecision,
  CocoStyleDecisionSource,
  CocoStyleProfile,
  CocoStyleScore,
} from "../types";
import type { CocoTone } from "../../types";

export const COCO_NIGHTLIFE_STYLE_PROFILES: Record<CocoNightlifeStyle, CocoStyleProfile> = {
  afrobeats: {
    avoid: ["cold monochrome palettes", "overly rigid grids", "sterile minimalism"],
    composition: ["organic movement", "lifestyle subject presence", "warm open space"],
    effects: ["soft glow", "sunset haze", "warm bloom"],
    energy: "warm",
    id: "afrobeats",
    lighting: ["warm side light", "golden ambience", "sunset color cast"],
    mood: ["warm", "social", "alive"],
    palette: ["orange", "gold", "sunset pink", "deep green"],
    texture: ["soft grain", "tropical haze", "subtle fabric or paper texture"],
    typography: ["bold display headline", "clean readable information font"],
  },
  "bottle-service": {
    avoid: ["crowded details", "random neon colors", "cheap glow stacks"],
    composition: ["centered hierarchy", "premium margins", "clear price or VIP emphasis"],
    effects: ["controlled metallic shine", "subtle glass reflection", "restrained glow"],
    energy: "elevated",
    id: "bottle-service",
    lighting: ["spotlight", "gold rim light", "dark lounge ambience"],
    mood: ["exclusive", "polished", "aspirational"],
    palette: ["black", "gold", "champagne", "deep neutral"],
    texture: ["satin", "glass", "metallic restraint"],
    typography: ["elegant serif", "wide tracking", "restrained sans"],
  },
  brunch: {
    avoid: ["heavy nightclub darkness", "aggressive techno effects", "overcrowded copy"],
    composition: ["airy spacing", "friendly subject crop", "clear daytime details"],
    effects: ["soft highlight", "gentle grain", "light bloom"],
    energy: "warm",
    id: "brunch",
    lighting: ["daylight", "warm fill", "soft natural highlights"],
    mood: ["social", "fresh", "approachable"],
    palette: ["cream", "coral", "gold", "fresh green"],
    texture: ["paper", "soft grain", "sunlit wash"],
    typography: ["friendly display", "clean rounded sans", "simple info font"],
  },
  edm: {
    avoid: ["low contrast text", "muddy glow", "too many equal accents"],
    composition: ["high contrast center energy", "diagonal motion", "deep stage layers"],
    effects: ["electric glow", "fog", "particles", "motion streaks"],
    energy: "explosive",
    id: "edm",
    lighting: ["laser color", "hard backlight", "stage fog"],
    mood: ["electric", "high-impact", "kinetic"],
    palette: ["cyan", "magenta", "violet", "acid green"],
    texture: ["digital noise", "light haze", "particle depth"],
    typography: ["condensed display", "sharp geometric sans", "high contrast type"],
  },
  "general-nightlife": {
    avoid: ["unreadable text", "accidental alignment", "too many competing effects"],
    composition: ["clear hero", "phone-first hierarchy", "safe margins"],
    effects: ["controlled glow", "shadow for readability", "subtle depth"],
    energy: "elevated",
    id: "general-nightlife",
    lighting: ["club ambience", "rim light", "background separation"],
    mood: ["social", "bold", "clear"],
    palette: ["black", "white", "accent color", "deep saturated color"],
    texture: ["light grain", "subtle haze", "clean overlays"],
    typography: ["bold headline", "simple information font"],
  },
  "hip-hop": {
    avoid: ["delicate low-energy type", "overly corporate spacing", "weak subject presence"],
    composition: ["strong subject crop", "assertive headline", "street-poster balance"],
    effects: ["hard shadow", "grit texture", "controlled sticker energy"],
    energy: "elevated",
    id: "hip-hop",
    lighting: ["hard contrast", "street light", "dramatic rim"],
    mood: ["confident", "direct", "raw"],
    palette: ["black", "white", "red", "chrome", "deep blue"],
    texture: ["grain", "paper wear", "photocopy edge"],
    typography: ["bold condensed", "heavy grotesk", "clean details font"],
  },
  house: {
    avoid: ["visual clutter", "overly aggressive type", "uncontrolled neon"],
    composition: ["rhythmic repetition", "clean movement", "balanced negative space"],
    effects: ["soft glow", "wave texture", "subtle motion blur"],
    energy: "elevated",
    id: "house",
    lighting: ["club warmth", "colored ambience", "soft edge light"],
    mood: ["groove", "movement", "late-night"],
    palette: ["deep blue", "magenta", "warm amber", "black"],
    texture: ["vinyl grain", "soft noise", "light trails"],
    typography: ["geometric sans", "wide tracking", "clear hierarchy"],
  },
  "ladies-night": {
    avoid: ["cheap pink overload", "crowded glamour effects", "tiny key details"],
    composition: ["glam hero", "clear offer", "clean event info"],
    effects: ["soft bloom", "controlled sparkle", "gloss highlight"],
    energy: "elevated",
    id: "ladies-night",
    lighting: ["beauty light", "pink ambience", "soft rim"],
    mood: ["glam", "social", "bright"],
    palette: ["pink", "white", "champagne", "black"],
    texture: ["gloss", "silk", "subtle sparkle"],
    typography: ["bold display", "script accent", "clean sans details"],
  },
  "latin-night": {
    avoid: ["cold sterile color", "lifeless composition", "overly minimal mood"],
    composition: ["dance movement", "warm rhythm", "clear date and venue"],
    effects: ["warm glow", "motion accents", "sunlit color"],
    energy: "warm",
    id: "latin-night",
    lighting: ["warm stage light", "sunset cast", "golden highlights"],
    mood: ["dance", "heat", "celebration"],
    palette: ["red", "orange", "gold", "teal"],
    texture: ["paper grain", "fabric movement", "warm haze"],
    typography: ["expressive display", "clean information font"],
  },
  "luxury-club": {
    avoid: ["busy gradients", "random neon colors", "too many type styles"],
    composition: ["large breathing room", "centered hierarchy", "clean margins"],
    effects: ["subtle metallic shine", "restrained shadow", "controlled glow"],
    energy: "calm",
    id: "luxury-club",
    lighting: ["low-key light", "gold rim", "soft spotlight"],
    mood: ["exclusive", "minimal", "elegant"],
    palette: ["black", "gold", "cream", "deep neutral"],
    texture: ["satin", "marble", "subtle grain"],
    typography: ["elegant serif", "wide tracking", "minimal sans"],
  },
  "rnb-lounge": {
    avoid: ["harsh rave effects", "overcrowded typography", "cold industrial tone"],
    composition: ["smooth subject flow", "moody space", "readable details"],
    effects: ["soft bloom", "velvet shadow", "subtle haze"],
    energy: "calm",
    id: "rnb-lounge",
    lighting: ["warm low light", "soft rim", "lounge ambience"],
    mood: ["smooth", "romantic", "intimate"],
    palette: ["burgundy", "violet", "gold", "black"],
    texture: ["velvet", "grain", "soft smoke"],
    typography: ["elegant display", "clean sans", "wide tracking"],
  },
  rooftop: {
    avoid: ["heavy dark crowding", "overly aggressive effects", "buried venue info"],
    composition: ["skyline space", "open top area", "clear venue/date"],
    effects: ["sunset haze", "soft light leak", "gentle grain"],
    energy: "warm",
    id: "rooftop",
    lighting: ["golden hour", "city glow", "soft sky light"],
    mood: ["open", "elevated", "social"],
    palette: ["sunset orange", "sky blue", "gold", "deep navy"],
    texture: ["haze", "film grain", "soft gradient light"],
    typography: ["clean display", "wide tracking", "simple details font"],
  },
  techno: {
    avoid: ["soft glamour cues", "random rainbow color", "decorative scripts"],
    composition: ["strict grid", "asymmetry", "industrial negative space"],
    effects: ["scanlines", "hard blur", "monochrome texture"],
    energy: "elevated",
    id: "techno",
    lighting: ["cold light", "hard contrast", "industrial shadow"],
    mood: ["minimal", "underground", "precise"],
    palette: ["black", "white", "acid green", "steel blue"],
    texture: ["concrete", "noise", "machine grain"],
    typography: ["condensed sans", "monospace accent", "strict grid type"],
  },
  throwback: {
    avoid: ["too-clean corporate polish", "unreadable nostalgia effects", "modern rave clutter"],
    composition: ["clear era cue", "poster rhythm", "strong title/date"],
    effects: ["halftone", "print grain", "retro shadow"],
    energy: "elevated",
    id: "throwback",
    lighting: ["warm flash", "vintage wash", "soft contrast"],
    mood: ["nostalgic", "fun", "recognizable"],
    palette: ["cream", "red", "teal", "yellow", "deep brown"],
    texture: ["paper", "halftone", "worn ink"],
    typography: ["retro display", "bold sans", "simple info font"],
  },
};

export function inferCocoNightlifeStyle({
  templateId,
  templateLabel,
  tone,
}: {
  templateId?: string | null;
  templateLabel?: string | null;
  tone?: CocoTone;
}): CocoNightlifeStyle {
  const key = `${templateId ?? ""} ${templateLabel ?? ""}`.toLowerCase();

  if (/(afro|afrobeats)/.test(key)) return "afrobeats";
  if (/(bottle|vip|service)/.test(key)) return "bottle-service";
  if (/(brunch|day party|dayparty)/.test(key)) return "brunch";
  if (/(edm|rave|festival|co2|bass)/.test(key)) return "edm";
  if (/(hip hop|trap|drill|showcase|artist|street)/.test(key)) return "hip-hop";
  if (/(house|deep house)/.test(key)) return "house";
  if (/(ladies|girls|soiree|soirée|pink|sugar|glam)/.test(key)) return "ladies-night";
  if (/(latin|salsa|bachata|reggaeton)/.test(key)) return "latin-night";
  if (/(luxe|luxury|black tie|gold|premium|lounge)/.test(key)) return "luxury-club";
  if (/(rnb|r&b|velvet)/.test(key)) return "rnb-lounge";
  if (/(rooftop|skyline|terrace)/.test(key)) return "rooftop";
  if (/(techno|industrial|warehouse)/.test(key)) return "techno";
  if (/(throwback|retro|90s|80s|old school|disco)/.test(key)) return "throwback";

  if (tone === "premium") return "luxury-club";
  if (tone === "glam") return "ladies-night";
  if (tone === "retro") return "throwback";
  if (tone === "street") return "hip-hop";
  if (tone === "tropical") return "afrobeats";

  return "general-nightlife";
}

const STYLE_KEYWORDS: Record<CocoNightlifeStyle, RegExp[]> = {
  afrobeats: [/\bafro(?:beats?)?\b/, /\bamapiano\b/, /\bsoca\b/, /\bdancehall\b/, /\btropical\b/, /\bisland\b/],
  "bottle-service": [/\bbottle\b/, /\bvip\b/, /\btable\b/, /\bchampagne\b/, /\bservice\b/],
  brunch: [/\bbrunch\b/, /\bmimosa\b/, /\bday\s*party\b/, /\bsunday\b/, /\bdayparty\b/],
  edm: [/\bedm\b/, /\brave\b/, /\bbass\b/, /\bfestival\b/, /\blaser\b/, /\bco2\b/],
  "general-nightlife": [/\bparty\b/, /\bnight\b/, /\bclub\b/, /\bsocial\b/],
  "hip-hop": [/\bhip\s*hop\b/, /\btrap\b/, /\bdrill\b/, /\bshowcase\b/, /\bcypher\b/, /\brap\b/],
  house: [/\bhouse\b/, /\bdeep\s*house\b/, /\bdance\s*music\b/],
  "ladies-night": [/\bladies\b/, /\bgirls\b/, /\bsoiree\b/, /\bsoirée\b/, /\bglam\b/, /\bsugar\b/],
  "latin-night": [/\blatin\b/, /\bsalsa\b/, /\bbachata\b/, /\breggaeton\b/, /\bmerengue\b/],
  "luxury-club": [/\bluxe\b/, /\bluxury\b/, /\bblack\s*tie\b/, /\bgold\b/, /\bpremium\b/, /\bvelvet\b/],
  "rnb-lounge": [/\br&b\b/, /\brnb\b/, /\blounge\b/, /\bslow\s*jams\b/, /\bvelvet\b/],
  rooftop: [/\brooftop\b/, /\bskyline\b/, /\bterrace\b/, /\bsunset\b/, /\bhigh\b/, /\belevated\b/],
  techno: [/\btechno\b/, /\bwarehouse\b/, /\bunderground\b/, /\bindustrial\b/],
  throwback: [/\bthrowback\b/, /\bretro\b/, /\bold\s*school\b/, /\b90s\b/, /\b80s\b/, /\bdisco\b/],
};

const PHOTO_HINT_WEIGHTS: Record<string, Partial<Record<CocoNightlifeStyle, number>>> = {
  beach: { afrobeats: 0.16, brunch: 0.08, "latin-night": 0.12, rooftop: 0.08 },
  bottle: { "bottle-service": 0.22, "luxury-club": 0.16 },
  brunch: { brunch: 0.28 },
  champagne: { "bottle-service": 0.2, "luxury-club": 0.14 },
  cocktail: { brunch: 0.1, "ladies-night": 0.1, "luxury-club": 0.1, rooftop: 0.08 },
  crowd: { edm: 0.1, "general-nightlife": 0.08, house: 0.08 },
  dj: { edm: 0.16, house: 0.14, techno: 0.16 },
  food: { brunch: 0.22 },
  laser: { edm: 0.24, techno: 0.12 },
  lounge: { "luxury-club": 0.16, "rnb-lounge": 0.18 },
  skyline: { rooftop: 0.26 },
  stage: { edm: 0.14, house: 0.08, techno: 0.12 },
  sunset: { afrobeats: 0.14, rooftop: 0.2, "latin-night": 0.08 },
  warehouse: { techno: 0.26, house: 0.08 },
};

function addScore(
  scores: Map<CocoNightlifeStyle, CocoStyleScore>,
  style: CocoNightlifeStyle,
  amount: number,
  evidence: string
) {
  const current = scores.get(style) ?? { evidence: [], score: 0, style };
  current.score += amount;
  current.evidence.push(evidence);
  scores.set(style, current);
}

function normalizeScore(score: number) {
  return Math.max(0, Math.min(0.98, score));
}

function styleMood(style: CocoNightlifeStyle) {
  const profile = COCO_NIGHTLIFE_STYLE_PROFILES[style];
  return profile.mood.slice(0, 3).join(", ");
}

export function scoreCocoNightlifeStyles({
  eventName,
  photoSignals = [],
  templateId,
  templateLabel,
  tone,
}: {
  eventName?: string | null;
  photoSignals?: CocoPhotoSignal[];
  templateId?: string | null;
  templateLabel?: string | null;
  tone?: CocoTone;
}): CocoStyleScore[] {
  const scores = new Map<CocoNightlifeStyle, CocoStyleScore>();
  const eventKey = String(eventName ?? "").toLowerCase();
  const templateKey = `${templateId ?? ""} ${templateLabel ?? ""}`.toLowerCase();

  Object.entries(STYLE_KEYWORDS).forEach(([styleKey, patterns]) => {
    const style = styleKey as CocoNightlifeStyle;
    patterns.forEach((pattern) => {
      if (eventKey && pattern.test(eventKey)) {
        addScore(scores, style, 0.3, `event name matches ${pattern.source}`);
      }
      if (templateKey && pattern.test(templateKey)) {
        addScore(scores, style, 0.2, `template matches ${pattern.source}`);
      }
    });
  });

  photoSignals.forEach((signal, index) => {
    const label = signal.role ?? `photo ${index + 1}`;
    signal.dominantHints?.forEach((hint) => {
      const weights = PHOTO_HINT_WEIGHTS[hint.toLowerCase()];
      if (!weights) return;
      Object.entries(weights).forEach(([styleKey, amount]) => {
        if (!amount) return;
        addScore(scores, styleKey as CocoNightlifeStyle, amount, `${label} suggests ${hint}`);
      });
    });

    if (signal.brightness === "bright" && signal.temperature === "warm") {
      addScore(scores, "brunch", 0.1, `${label} is bright and warm`);
      addScore(scores, "rooftop", 0.08, `${label} is bright and warm`);
      addScore(scores, "afrobeats", 0.08, `${label} is bright and warm`);
    }
    if (signal.brightness === "dark" && signal.saturation === "vivid") {
      addScore(scores, "edm", 0.1, `${label} is dark with vivid color`);
      addScore(scores, "general-nightlife", 0.08, `${label} is dark with vivid color`);
    }
    if (signal.brightness === "dark" && signal.saturation === "muted") {
      addScore(scores, "luxury-club", 0.1, `${label} is dark and restrained`);
      addScore(scores, "techno", 0.08, `${label} is dark and restrained`);
    }
    if (signal.temperature === "cool" && signal.contrast === "high") {
      addScore(scores, "techno", 0.1, `${label} has cool high-contrast light`);
      addScore(scores, "edm", 0.08, `${label} has cool high-contrast light`);
    }
  });

  const inferred = inferCocoNightlifeStyle({ templateId, templateLabel, tone });
  if (inferred !== "general-nightlife") {
    addScore(scores, inferred, 0.18, `guide tone suggests ${inferred}`);
  }

  if (scores.size === 0) {
    addScore(scores, "general-nightlife", 0.42, "no strong style signal");
  }

  return Array.from(scores.values())
    .map((score) => ({ ...score, score: normalizeScore(score.score) }))
    .sort((a, b) => b.score - a.score);
}

export function decideCocoNightlifeStyleLocal({
  eventName,
  photoSignals = [],
  source = "local",
  templateId,
  templateLabel,
  tone,
}: {
  eventName?: string | null;
  photoSignals?: CocoPhotoSignal[];
  source?: CocoStyleDecisionSource;
  templateId?: string | null;
  templateLabel?: string | null;
  tone?: CocoTone;
}): CocoStyleDecision {
  const scores = scoreCocoNightlifeStyles({
    eventName,
    photoSignals,
    templateId,
    templateLabel,
    tone,
  });
  const top = scores[0] ?? { evidence: ["no strong style signal"], score: 0.42, style: "general-nightlife" as const };
  const second = scores[1];
  const gap = top.score - (second?.score ?? 0);
  const ambiguous = top.score < 0.65 || gap < 0.16;

  return {
    askUser: ambiguous,
    confidence: top.score,
    evidence: top.evidence.slice(0, 5),
    mood: styleMood(top.style),
    reason: ambiguous
      ? "The event name and photos can support more than one nightlife direction."
      : `The strongest signals point to ${top.style}.`,
    scores: scores.slice(0, 4),
    source,
    style: top.style,
  };
}
