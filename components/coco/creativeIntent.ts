import type {
  CocoArtDirectionEffectsPolicyId,
  CocoArtDirectionId,
  CocoArtDirectionPalettePolicyId,
} from "./artDirections/types.ts";
import type { CocoNightlifeStyle } from "./intelligence/types.ts";
import type {
  TypePersonality,
  TypographyTreatment,
} from "./typographyDirector/types.ts";

export type CocoCreativeIntentInput = Readonly<{
  eventDescription?: string | null;
  eventName?: string | null;
}>;

export type CocoCreativeIntentPresetId =
  | "all-white-minimal"
  | "clean-minimal"
  | "black-gold-luxury"
  | "neon-electric"
  | "retro-disco";

export type CocoCreativeIntentSource = "event-description" | "event-name";

export type CocoCreativeIntentPaletteFamily =
  | "white-monochrome"
  | "neutral-minimal"
  | "black-gold"
  | "electric-neon"
  | "retro-pop";

export type CocoCreativeIntentContract = Readonly<{
  authority: "explicit-user-brief";
  directionId: CocoArtDirectionId;
  evidence: readonly string[];
  palette: Readonly<{
    allowPureBlack: boolean;
    allowPureWhite: boolean;
    family: CocoCreativeIntentPaletteFamily;
    forbiddenTones: readonly string[];
    imagePaletteInfluence: "none" | "supporting";
    maxStrongColors: 1 | 2 | 3;
    policyId: CocoArtDirectionPalettePolicyId;
    requiredTones: readonly string[];
    saturation: "restrained" | "balanced" | "vivid";
  }>;
  presetId: CocoCreativeIntentPresetId;
  source: CocoCreativeIntentSource;
  typography: Readonly<{
    forbiddenTreatments: readonly TypographyTreatment[];
    headlineTreatment: TypographyTreatment;
    maxFontFamilies: 2 | 3;
    personality: TypePersonality;
  }>;
  effects: Readonly<{
    allowGlow: boolean;
    intensity: "restrained" | "moderate" | "high-energy";
    maxIntensity: number;
    oneSignatureEffect: boolean;
    policyId: CocoArtDirectionEffectsPolicyId;
  }>;
  version: 1;
}>;

export type CocoCreativeIntentRoleColors = Readonly<{
  accent: `#${string}`;
  background: `#${string}`;
  backgroundSecondary: `#${string}`;
  badgeBackground: `#${string}`;
  badgeText: `#${string}`;
  dateTime: `#${string}`;
  footer: `#${string}`;
  glow: `#${string}`;
  headline: `#${string}`;
  metadata: `#${string}`;
  neutral: `#${string}`;
  presenter: `#${string}`;
  stroke: `#${string}`;
  utility: `#${string}`;
  venue: `#${string}`;
}>;

export type CocoCreativeIntentColorway = Readonly<{
  id: string;
  name: string;
  roles: CocoCreativeIntentRoleColors;
  strongColors: readonly `#${string}`[];
}>;

export type CocoCreativeIntentPresentation = Readonly<{
  colorways: readonly [
    CocoCreativeIntentColorway,
    CocoCreativeIntentColorway,
    CocoCreativeIntentColorway,
    CocoCreativeIntentColorway,
  ];
  effects: Readonly<{
    clarity: number;
    contrast: number;
    filmGrade: number;
    grade: number;
    grain: number;
    haze: number;
    leak: number;
    saturation: number;
    vibrance: number;
    vignetteStrength: number;
    warmth: number;
  }>;
  fonts: Readonly<{
    body: readonly string[];
    headline: readonly string[];
    headline2: readonly string[];
  }>;
  headline: Readonly<{
    gradient: boolean;
    glow: number;
    shadow: number;
    shadowEnabled: boolean;
    strokeWidth: number;
  }>;
}>;

type IntentRule = Readonly<{
  contract: Omit<CocoCreativeIntentContract, "evidence" | "source">;
  id: CocoCreativeIntentPresetId;
  matches: (text: string) => boolean;
}>;

const STRONG_WHITE_REQUEST = /\b(?:all|everything|only|mostly)(?:\s+|-)white\b|\bwhite\s+party\b|\b(?:make|keep|want)\s+(?:it|the\s+(?:(?:whole|entire)\s+)?(?:flyer|design|artwork)|everything)\s*(?:all\s+)?white\b|\buse\s+white\s+(?:for\s+)?(?:everything|all\s+over|throughout)\b/i;
const WHITE_VISUAL_CUE = /\b(?:white|monochrome|black\s*(?:and|&)\s*white)\b/i;
const WHITE_TEXT_ROLE = /\bwhite\s+(?:letters?|text|title|headline|logo|words?|type)\b/i;
const CHROMATIC_VISUAL_CUE = /\b(?:cyan|red|blue|green|pink|purple|orange|yellow|magenta|teal|turquoise)\b/i;
const SIMPLE_VISUAL_CUE = /\b(?:minimal(?:ist)?|simple|clean|plain|uncluttered|calm|easy\s+to\s+read|neat|sleek|basic|not\s+(?:too\s+)?busy|not\s+(?:too\s+)?crowded|not\s+messy|nothing\s+flashy|not\s+flashy|lots?\s+of\s+(?:room|space)|plenty\s+of\s+(?:room|space)|quiet\s+design|make\s+it\s+new|look\s+new\s+and\s+clean)\b/i;
const LUXURY = /\b(?:luxury|luxe|luxurious|upscale|premium|fancy|expensive|dress[ -]?up|dressy|champagne|posh|black[ -]?tie|classy|elegant|grown[ -]?up|rich|high[ -]?end|sophisticated)\b/i;
const NEON_ELECTRIC = /\b(?:neon|electric|laser|neon\s+glow|electric\s+glow|glowing\s+neon|bright\s+club|huge\s+dance\s+party|full\s+of\s+energy)\b/i;
const RETRO_DISCO = /\b(?:retro|disco|throwback|old[ -]?school|old\s+party\s+poster|vintage|back\s+in\s+the\s+day|70s|80s|90s|2000s|00s|seventies|eighties|nineties|y2k)\b/i;

const NEGATED_CUE_PREFIX = /\b(?:no|not|without|avoid|don(?:'|’)t(?:\s+use)?|do\s+not(?:\s+use)?|anything\s+but|stay\s+away\s+from)(?:\s+\w+){0,5}\s*$/i;

function hasAffirmedCue(text: string, pattern: RegExp) {
  const matcher = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`);
  let match: RegExpExecArray | null;
  while ((match = matcher.exec(text))) {
    const prefix = text.slice(Math.max(0, match.index - 96), match.index);
    if (!NEGATED_CUE_PREFIX.test(prefix)) return true;
    if (!match[0].length) matcher.lastIndex += 1;
  }
  return false;
}

function hasNegatedVisual(text: string, terms: string) {
  return new RegExp(
    `\\b(?:no|not|without|avoid|don(?:'|’)t(?:\\s+use)?|do\\s+not(?:\\s+use)?|anything\\s+but|stay\\s+away\\s+from)\\s+(?:any\\s+|too\\s+)?(?:\\w+\\s+){0,5}(?:${terms})\\b`,
    "i"
  ).test(text);
}

function wantsAllWhiteMinimal(text: string) {
  if (hasNegatedVisual(text, "white|minimal|simple|clean")) return false;
  const wholeFlyerWhite = hasAffirmedCue(text, STRONG_WHITE_REQUEST);
  if (
    !wholeFlyerWhite &&
    (WHITE_TEXT_ROLE.test(text) || CHROMATIC_VISUAL_CUE.test(text))
  ) return false;
  return wholeFlyerWhite ||
    (hasAffirmedCue(text, WHITE_VISUAL_CUE) && hasAffirmedCue(text, SIMPLE_VISUAL_CUE));
}

function wantsCleanMinimal(text: string) {
  if (hasNegatedVisual(text, "minimal|simple|clean")) return false;
  return hasAffirmedCue(text, SIMPLE_VISUAL_CUE);
}

function wantsBlackGoldLuxury(text: string) {
  const asksForBlackAndGold =
    hasAffirmedCue(text, /\bblack\b/i) && hasAffirmedCue(text, /\bgold\b/i);
  return asksForBlackAndGold || hasAffirmedCue(text, LUXURY);
}

function wantsNeonElectric(text: string) {
  return hasAffirmedCue(text, NEON_ELECTRIC);
}

function wantsRetroDisco(text: string) {
  return hasAffirmedCue(text, RETRO_DISCO);
}

const INTENT_RULE_PRIORITY: readonly CocoCreativeIntentPresetId[] = [
  "all-white-minimal",
  "black-gold-luxury",
  "neon-electric",
  "retro-disco",
  "clean-minimal",
];

function matchingIntentRule(text: string) {
  return INTENT_RULE_PRIORITY
    .map((id) => INTENT_RULES.find((candidate) => candidate.id === id))
    .find((candidate) => candidate?.matches(text)) ?? null;
}

const INTENT_RULES: readonly IntentRule[] = [
  {
    id: "all-white-minimal",
    matches: wantsAllWhiteMinimal,
    contract: {
      authority: "explicit-user-brief",
      directionId: "modern-minimal",
      effects: {
        allowGlow: false,
        intensity: "restrained",
        maxIntensity: 0.08,
        oneSignatureEffect: false,
        policyId: "subtle-texture",
      },
      palette: {
        allowPureBlack: false,
        allowPureWhite: true,
        family: "white-monochrome",
        forbiddenTones: ["cyan", "magenta", "neon", "acid", "gold"],
        imagePaletteInfluence: "none",
        maxStrongColors: 1,
        policyId: "mono-accent",
        requiredTones: ["pure-white", "soft-white", "neutral-gray"],
        saturation: "restrained",
      },
      presetId: "all-white-minimal",
      typography: {
        forbiddenTreatments: ["chrome", "distressed", "glass", "glow", "serifLuxury"],
        headlineTreatment: "clean",
        maxFontFamilies: 2,
        personality: "minimal",
      },
      version: 1,
    },
  },
  {
    id: "clean-minimal",
    matches: wantsCleanMinimal,
    contract: {
      authority: "explicit-user-brief",
      directionId: "modern-minimal",
      effects: {
        allowGlow: false,
        intensity: "restrained",
        maxIntensity: 0.1,
        oneSignatureEffect: false,
        policyId: "subtle-texture",
      },
      palette: {
        allowPureBlack: true,
        allowPureWhite: true,
        family: "neutral-minimal",
        forbiddenTones: ["neon", "acid", "multicolor"],
        imagePaletteInfluence: "supporting",
        maxStrongColors: 2,
        policyId: "mono-accent",
        requiredTones: ["neutral", "single-accent"],
        saturation: "restrained",
      },
      presetId: "clean-minimal",
      typography: {
        forbiddenTreatments: ["chrome", "distressed", "glass", "glow", "serifLuxury"],
        headlineTreatment: "clean",
        maxFontFamilies: 2,
        personality: "minimal",
      },
      version: 1,
    },
  },
  {
    id: "black-gold-luxury",
    matches: wantsBlackGoldLuxury,
    contract: {
      authority: "explicit-user-brief",
      directionId: "luxury-editorial",
      effects: {
        allowGlow: true,
        intensity: "restrained",
        maxIntensity: 0.14,
        oneSignatureEffect: true,
        policyId: "soft-glow",
      },
      palette: {
        allowPureBlack: true,
        allowPureWhite: true,
        family: "black-gold",
        forbiddenTones: ["cyan", "magenta", "acid", "neon"],
        imagePaletteInfluence: "supporting",
        maxStrongColors: 2,
        policyId: "champagne-black",
        requiredTones: ["black", "champagne-gold", "warm-ivory"],
        saturation: "restrained",
      },
      presetId: "black-gold-luxury",
      typography: {
        forbiddenTreatments: ["chrome", "distressed", "glow"],
        headlineTreatment: "serifLuxury",
        maxFontFamilies: 2,
        personality: "luxury",
      },
      version: 1,
    },
  },
  {
    id: "neon-electric",
    matches: wantsNeonElectric,
    contract: {
      authority: "explicit-user-brief",
      directionId: "high-energy-club",
      effects: {
        allowGlow: true,
        intensity: "high-energy",
        maxIntensity: 0.42,
        oneSignatureEffect: true,
        policyId: "light-beams",
      },
      palette: {
        allowPureBlack: true,
        allowPureWhite: true,
        family: "electric-neon",
        forbiddenTones: ["muted-beige", "pastel-only"],
        imagePaletteInfluence: "supporting",
        maxStrongColors: 3,
        policyId: "neon-contrast",
        requiredTones: ["electric-cyan", "hot-magenta", "deep-black"],
        saturation: "vivid",
      },
      presetId: "neon-electric",
      typography: {
        forbiddenTreatments: ["serifLuxury"],
        headlineTreatment: "glow",
        maxFontFamilies: 3,
        personality: "nightclub",
      },
      version: 1,
    },
  },
  {
    id: "retro-disco",
    matches: wantsRetroDisco,
    contract: {
      authority: "explicit-user-brief",
      directionId: "retro-celebration",
      effects: {
        allowGlow: true,
        intensity: "moderate",
        maxIntensity: 0.28,
        oneSignatureEffect: true,
        policyId: "analog-glow",
      },
      palette: {
        allowPureBlack: true,
        allowPureWhite: false,
        family: "retro-pop",
        forbiddenTones: ["cyber-cyan-only", "industrial-monochrome"],
        imagePaletteInfluence: "supporting",
        maxStrongColors: 3,
        policyId: "retro-pop",
        requiredTones: ["cream", "warm-red", "teal", "disco-gold"],
        saturation: "vivid",
      },
      presetId: "retro-disco",
      typography: {
        forbiddenTreatments: ["serifLuxury", "glass"],
        headlineTreatment: "distressed",
        maxFontFamilies: 3,
        personality: "throwback",
      },
      version: 1,
    },
  },
] as const;

function resolvedIntentContract(
  rule: IntentRule,
  text: string,
  source: CocoCreativeIntentSource
): CocoCreativeIntentContract {
  const avoidsGold =
    rule.id === "black-gold-luxury" && hasNegatedVisual(text, "gold");
  return {
    ...rule.contract,
    evidence: [rule.id, text],
    palette: avoidsGold
      ? {
          ...rule.contract.palette,
          forbiddenTones: Array.from(
            new Set([...rule.contract.palette.forbiddenTones, "gold"])
          ),
          requiredTones: ["black", "silver", "warm-ivory"],
        }
      : rule.contract.palette,
    source,
  };
}

/**
 * Resolves explicit visual language before Coco considers style inference,
 * photography, learned taste, or generic nightlife defaults.
 *
 * Event-description matches intentionally outrank event-name matches: a name
 * such as "Neon Nights" is brand copy, while "all white minimal" in the
 * description is a direct art-direction instruction.
 */
export function resolveCocoCreativeIntent(
  input: CocoCreativeIntentInput
): CocoCreativeIntentContract | null {
  const description = normalizeCreativeIntentText(input.eventDescription);
  const eventName = normalizeCreativeIntentText(input.eventName);
  const descriptionRule = description ? matchingIntentRule(description) : null;
  if (descriptionRule) {
    return resolvedIntentContract(descriptionRule, description, "event-description");
  }

  const nameRule = eventName
    ? INTENT_RULE_PRIORITY
      .map((id) => INTENT_RULES.find((candidate) => candidate.id === id))
      .find((candidate) => {
        if (!candidate) return false;
        if (!candidate.matches(eventName)) return false;
        if (!description) return true;
        if (
          candidate.id === "neon-electric" &&
          hasNegatedVisual(description, "neon|electric|bright|glow|glowing|laser")
        ) return false;
        if (
          candidate.id === "black-gold-luxury" &&
          hasNegatedVisual(description, "gold|luxury|fancy|expensive")
        ) return false;
        if (
          (candidate.id === "all-white-minimal" || candidate.id === "clean-minimal") &&
          hasNegatedVisual(description, "white|minimal|simple|clean")
        ) return false;
        if (
          candidate.id === "retro-disco" &&
          hasNegatedVisual(description, "retro|disco|old|throwback")
        ) return false;
        return true;
      })
    : null;
  if (nameRule) {
    return resolvedIntentContract(nameRule, eventName, "event-name");
  }

  return null;
}

export function normalizeCreativeIntentText(value: unknown): string {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/[’']/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * Keeps visual instructions out of flyer copy. The same one-box brief can say
 * "make it simple and white" without printing that command on the artwork.
 */
export function eventCopyDescriptionForCocoIntent(
  value: unknown,
  intent: CocoCreativeIntentContract | null | undefined
): string {
  const source = String(value ?? "").replace(/\s+/g, " ").trim();
  if (!source) return source;
  const eventLanguage = /\b(?:party|night|event|music|dj|lounge|rooftop|brunch|warehouse|cocktails?|champagne|guests?|dance|show|concert|celebration|venue|club|dinner|festival|performance|birthday|wedding|anniversary|graduation|fundraiser|gala|launch|opening|happy\s+hour|afrobeats?|hip[ -]?hop|r\s*(?:&|and)\s*b|house|techno|jazz|salsa|reggaeton|dancehall|karaoke)\b/i;
  const visualLanguage = /\b(?:white|black|gold|silver|red|blue|green|pink|purple|orange|yellow|neon|electric|bright|dark|light|color|colour|colorful|colourful|simple|minimal|clean|plain|flashy|busy|playful|fun|serious|moody|elegant|fancy|expensive|loud|quiet|font|headline|layout|design|flyer|artwork|cinematic|retro|modern|luxury|glow|gradient|photo|picture|image|style|look)\b/i;
  const directInstruction = /^\s*(?:please\s+)?(?:do\s+not|don(?:'|’)t|no\b|avoid\b|make\b|keep\b|use\b|nothing\b|not\s+too\s+busy\b|(?:i|we)\s+(?:want|need|would\s+(?:like|love))\b|(?:can|could|would)\s+you\b|(?:it|this|the\s+(?:flyer|design|artwork))\s+(?:should|needs?\s+to|has\s+to)\b|(?:give|show)\s+me\b)/i;
  const separatedSource = source.replace(
    /\s*(?:,|\band\b|\bbut\b)\s+(?=(?:(?:i|we)\s+(?:want|need|would\s+(?:like|love))|(?:can|could|would)\s+you|(?:please\s+)?(?:do\s+not|don(?:'|’)t|avoid|make|keep|use)|(?:it|this|the\s+(?:flyer|design|artwork))\s+(?:should|needs?\s+to|has\s+to)|(?:give|show)\s+me)\b)/gi,
    ". "
  );
  const copyDescription = separatedSource
    .split(/(?<=[.!?;])\s+|\s*[|]\s*/)
    .map((clause) => clause.trim())
    .filter(Boolean)
    .filter((clause) => !directInstruction.test(clause))
    .filter((clause) => eventLanguage.test(clause) || !visualLanguage.test(clause))
    .join(" ")
    .trim();
  if (copyDescription || !intent) return copyDescription;

  switch (intent.presetId) {
    case "all-white-minimal":
      return "Clean understated atmosphere.";
    case "clean-minimal":
      return "Calm polished atmosphere.";
    case "black-gold-luxury":
      return "Elegant grown-up atmosphere.";
    case "neon-electric":
      return "Bright high-energy dance night.";
    case "retro-disco":
      return "Lively throwback celebration.";
  }
}

/** Prevents copy fallbacks from contradicting an authoritative visual brief. */
export function nightlifeStyleForCocoIntentCopy(
  intent: CocoCreativeIntentContract | null | undefined,
  fallback: CocoNightlifeStyle
): CocoNightlifeStyle {
  switch (intent?.presetId) {
    case "all-white-minimal":
    case "clean-minimal":
      return "general-nightlife";
    case "black-gold-luxury":
      return "luxury-club";
    case "neon-electric":
      return "edm";
    case "retro-disco":
      return "throwback";
    default:
      return fallback;
  }
}

type IntentHex = `#${string}`;

function creativeIntentRoles(input: {
  accent: IntentHex;
  background: IntentHex;
  backgroundSecondary: IntentHex;
  headline: IntentHex;
  metadata: IntentHex;
  neutral?: IntentHex;
  stroke?: IntentHex;
}): CocoCreativeIntentRoleColors {
  return {
    accent: input.accent,
    background: input.background,
    backgroundSecondary: input.backgroundSecondary,
    badgeBackground: input.backgroundSecondary,
    badgeText: input.headline,
    dateTime: input.metadata,
    footer: input.metadata,
    glow: input.accent,
    headline: input.headline,
    metadata: input.metadata,
    neutral: input.neutral ?? input.metadata,
    presenter: input.metadata,
    stroke: input.stroke ?? input.background,
    utility: input.metadata,
    venue: input.metadata,
  };
}

const WHITE_MINIMAL_COLORWAYS = [
  {
    id: "pure-white",
    name: "Pure White",
    roles: creativeIntentRoles({
      accent: "#F2F2EE",
      background: "#080808",
      backgroundSecondary: "#181818",
      headline: "#FFFFFF",
      metadata: "#F8F8F5",
      neutral: "#E4E4E0",
      stroke: "#101010",
    }),
    strongColors: ["#FFFFFF"],
  },
  {
    id: "gallery-white",
    name: "Gallery White",
    roles: creativeIntentRoles({
      accent: "#E8ECEF",
      background: "#0B0C0D",
      backgroundSecondary: "#202225",
      headline: "#FFFFFF",
      metadata: "#F4F6F7",
      neutral: "#D8DDE0",
      stroke: "#111315",
    }),
    strongColors: ["#FFFFFF"],
  },
  {
    id: "warm-white",
    name: "Warm White",
    roles: creativeIntentRoles({
      accent: "#F2EFE7",
      background: "#0B0A09",
      backgroundSecondary: "#201E1B",
      headline: "#FFFDF7",
      metadata: "#F8F5EE",
      neutral: "#DEDAD0",
      stroke: "#151310",
    }),
    strongColors: ["#FFFDF7"],
  },
  {
    id: "silver-white",
    name: "Silver White",
    roles: creativeIntentRoles({
      accent: "#D9DCE0",
      background: "#08090A",
      backgroundSecondary: "#1B1D20",
      headline: "#FFFFFF",
      metadata: "#ECEEF0",
      neutral: "#CFD3D7",
      stroke: "#101214",
    }),
    strongColors: ["#FFFFFF"],
  },
] as const satisfies CocoCreativeIntentPresentation["colorways"];

const CLEAN_MINIMAL_COLORWAYS = [
  ["ink-blue", "Ink Blue", "#F8FAFC", "#7FA8C9", "#0B1015", "#E8EDF1"],
  ["gallery-sage", "Gallery Sage", "#FCFCF8", "#8FA89B", "#0D1110", "#E9EDE9"],
  ["stone", "Warm Stone", "#FFFDF8", "#B29D84", "#12100D", "#EEE9E1"],
  ["silver", "Soft Silver", "#FFFFFF", "#A9B0B8", "#0D0F12", "#ECEFF2"],
].map(([id, name, headline, accent, background, metadata]) => ({
  id,
  name,
  roles: creativeIntentRoles({
    accent: accent as IntentHex,
    background: background as IntentHex,
    backgroundSecondary: "#20242A",
    headline: headline as IntentHex,
    metadata: metadata as IntentHex,
    neutral: "#D8DCE0",
    stroke: "#111418",
  }),
  strongColors: [headline as IntentHex, accent as IntentHex],
})) as unknown as CocoCreativeIntentPresentation["colorways"];

const BLACK_GOLD_COLORWAYS = [
  ["champagne", "Champagne Black", "#F5E6AD", "#0A0907", "#211A10", "#F7F1E3"],
  ["antique", "Antique Gold", "#D9BC70", "#080807", "#211C13", "#F3EBDD"],
  ["ivory", "Ivory Gold", "#FFF0BD", "#0B0906", "#261B0D", "#FFF9EC"],
  ["bronze", "Soft Bronze", "#D6A866", "#090807", "#25170D", "#F4EADF"],
].map(([id, name, accent, background, backgroundSecondary, headline]) => ({
  id,
  name,
  roles: creativeIntentRoles({
    accent: accent as IntentHex,
    background: background as IntentHex,
    backgroundSecondary: backgroundSecondary as IntentHex,
    headline: headline as IntentHex,
    metadata: "#F4EFE5",
    stroke: "#171008",
  }),
  strongColors: [accent as IntentHex, headline as IntentHex],
})) as unknown as CocoCreativeIntentPresentation["colorways"];

const BLACK_SILVER_COLORWAYS = [
  ["silver-ivory", "Silver Ivory", "#DDE3EA", "#090A0C", "#1A1D22", "#FFFDF7"],
  ["pearl-black", "Pearl Black", "#F0EEE8", "#08090A", "#202126", "#FFFFFF"],
  ["platinum", "Soft Platinum", "#C7CDD5", "#080A0D", "#1B2027", "#F7F9FC"],
  ["smoke-ivory", "Smoke Ivory", "#E2DED5", "#0B0A0A", "#242120", "#FFF9EE"],
].map(([id, name, accent, background, backgroundSecondary, headline]) => ({
  id,
  name,
  roles: creativeIntentRoles({
    accent: accent as IntentHex,
    background: background as IntentHex,
    backgroundSecondary: backgroundSecondary as IntentHex,
    headline: headline as IntentHex,
    metadata: "#EEF1F4",
    stroke: "#111318",
  }),
  strongColors: [accent as IntentHex, headline as IntentHex],
})) as unknown as CocoCreativeIntentPresentation["colorways"];

const ELECTRIC_NEON_COLORWAYS = [
  ["cyan-magenta", "Cyan Magenta", "#45F6FF", "#FF42D0", "#050716"],
  ["acid-violet", "Acid Violet", "#D9FF35", "#B65CFF", "#070612"],
  ["blue-pink", "Electric Blue", "#58A6FF", "#FF4D9D", "#050916"],
  ["lime-cyan", "Laser Lime", "#BFFF37", "#39F3FF", "#050A0C"],
].map(([id, name, headline, accent, background]) => ({
  id,
  name,
  roles: creativeIntentRoles({
    accent: accent as IntentHex,
    background: background as IntentHex,
    backgroundSecondary: "#17102A",
    headline: headline as IntentHex,
    metadata: "#FFFFFF",
    neutral: "#EAF4FF",
    stroke: "#07101C",
  }),
  strongColors: [headline as IntentHex, accent as IntentHex],
})) as unknown as CocoCreativeIntentPresentation["colorways"];

const RETRO_COLORWAYS = [
  ["sunset-pop", "Sunset Pop", "#FFF0A8", "#F05B78", "#102F35"],
  ["disco-teal", "Disco Teal", "#FFF2C8", "#36C4B5", "#22122B"],
  ["orange-cream", "Orange Cream", "#FFF1CF", "#F38B4A", "#2B1722"],
  ["rose-gold", "Rose Gold Pop", "#FFE7B1", "#E26088", "#16313A"],
].map(([id, name, headline, accent, background]) => ({
  id,
  name,
  roles: creativeIntentRoles({
    accent: accent as IntentHex,
    background: background as IntentHex,
    backgroundSecondary: "#30203A",
    headline: headline as IntentHex,
    metadata: "#FFF8E8",
    neutral: "#F2DEC5",
    stroke: "#241526",
  }),
  strongColors: [headline as IntentHex, accent as IntentHex],
})) as unknown as CocoCreativeIntentPresentation["colorways"];

/** Concrete renderer tokens for an already-resolved explicit brief. */
export function presentationForCocoCreativeIntent(
  intent: CocoCreativeIntentContract
): CocoCreativeIntentPresentation {
  if (intent.presetId === "all-white-minimal") {
    return {
      colorways: WHITE_MINIMAL_COLORWAYS,
      effects: {
        clarity: 0.12,
        contrast: 1.08,
        filmGrade: 0.18,
        grade: 0.18,
        grain: 0.04,
        haze: 0.04,
        leak: 0,
        saturation: 0.22,
        vibrance: 0,
        vignetteStrength: 0.42,
        warmth: 0,
      },
      fonts: {
        body: ["LEMONMILK-Regular", "LEMONMILK-Light", "Coolvetica Rg Cond"],
        headline: ["LEMONMILK-Bold", "Nexa-Heavy", "Bebas Neue"],
        headline2: ["LEMONMILK-Regular", "LEMONMILK-Light", "Nexa-ExtraLight"],
      },
      headline: {
        gradient: false,
        glow: 0,
        shadow: 0.16,
        shadowEnabled: true,
        strokeWidth: 0,
      },
    };
  }

  if (intent.presetId === "clean-minimal") {
    return {
      colorways: CLEAN_MINIMAL_COLORWAYS,
      effects: {
        clarity: 0.12,
        contrast: 1.07,
        filmGrade: 0.2,
        grade: 0.2,
        grain: 0.04,
        haze: 0.04,
        leak: 0,
        saturation: 0.72,
        vibrance: 0.02,
        vignetteStrength: 0.38,
        warmth: 0,
      },
      fonts: {
        body: ["LEMONMILK-Regular", "LEMONMILK-Light", "Coolvetica Rg Cond"],
        headline: ["LEMONMILK-Bold", "Nexa-Heavy", "Bebas Neue"],
        headline2: ["LEMONMILK-Regular", "LEMONMILK-Light", "Nexa-ExtraLight"],
      },
      headline: {
        gradient: false,
        glow: 0,
        shadow: 0.16,
        shadowEnabled: true,
        strokeWidth: 0,
      },
    };
  }

  if (intent.presetId === "black-gold-luxury") {
    const avoidsGold = intent.palette.forbiddenTones.includes("gold");
    return {
      colorways: avoidsGold ? BLACK_SILVER_COLORWAYS : BLACK_GOLD_COLORWAYS,
      effects: {
        clarity: 0.14,
        contrast: 1.12,
        filmGrade: 0.62,
        grade: 0.56,
        grain: 0.06,
        haze: 0.06,
        leak: 0,
        saturation: 0.82,
        vibrance: 0.04,
        vignetteStrength: 0.68,
        warmth: 0.08,
      },
      fonts: {
        body: ["LEMONMILK-Regular", "LEMONMILK-Light", "Bebas Neue"],
        headline: ["Avigea", "Magiel Black", "LEMONMILK-Bold"],
        headline2: ["LEMONMILK-Light", "OpenScript", "LEMONMILK-Regular"],
      },
      headline: { gradient: false, glow: 0.08, shadow: 0.24, shadowEnabled: true, strokeWidth: 0 },
    };
  }

  if (intent.presetId === "neon-electric") {
    return {
      colorways: ELECTRIC_NEON_COLORWAYS,
      effects: {
        clarity: 0.2,
        contrast: 1.18,
        filmGrade: 0.48,
        grade: 0.58,
        grain: 0.08,
        haze: 0.22,
        leak: 0.12,
        saturation: 1.22,
        vibrance: 0.28,
        vignetteStrength: 0.62,
        warmth: -0.04,
      },
      fonts: {
        body: ["Bebas Neue", "LEMONMILK-Bold", "Coolvetica Rg Cond"],
        headline: ["Azonix", "Dune_Rise", "Moderniz", "Nexa-Heavy"],
        headline2: ["TR2N", "Dune_Rise", "Bebas Neue"],
      },
      headline: { gradient: true, glow: 0.32, shadow: 0.34, shadowEnabled: true, strokeWidth: 0 },
    };
  }

  return {
    colorways: RETRO_COLORWAYS,
    effects: {
      clarity: 0.12,
      contrast: 1.1,
      filmGrade: 0.42,
      grade: 0.4,
      grain: 0.14,
      haze: 0.1,
      leak: 0.06,
      saturation: 1.08,
      vibrance: 0.18,
      vignetteStrength: 0.5,
      warmth: 0.1,
    },
    fonts: {
      body: ["Coolvetica Rg Cond", "Bebas Neue", "LEMONMILK-Regular"],
      headline: ["Monoton", "Coolvetica Hv Comp", "Octin College Rg"],
      headline2: ["Good Brush", "OpenScript", "Road Rage"],
    },
    headline: { gradient: true, glow: 0.16, shadow: 0.28, shadowEnabled: true, strokeWidth: 0 },
  };
}
