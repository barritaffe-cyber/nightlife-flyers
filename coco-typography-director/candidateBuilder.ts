import type {
  FontSupport,
  TypographyDirectorInput,
  TypographyPersonality,
  TypographyRole,
  TypographySystem,
} from "./types.ts";
import { inferPersonalityForRole } from "./personality.ts";
import { rankFontsForRole } from "./fontSelection.ts";
import { buildTypographyLayer } from "./layerBuilder.ts";
import { applyTypographySignatureMove } from "./signatureMove.ts";
import { scoreTypographySystem } from "./scoring.ts";
import { slug, unique } from "./utils.ts";

export function buildTypographyCandidate(
  input: TypographyDirectorInput,
  fonts: FontSupport[],
  variantIndex: number
): TypographySystem {
  const roles: TypographyRole[] = [
    "headline",
    "accent",
    "metadata",
    "dateTime",
    "venue",
    "badge",
    "presenter",
    "footer",
  ];

  const personalities = Object.fromEntries(
    roles.map((role) => [
      role,
      personalityVariant(inferPersonalityForRole(role, input.scene, input.creativeDirection), role, variantIndex),
    ])
  ) as Record<TypographyRole, TypographyPersonality>;

  const choices = Object.fromEntries(
    roles.map((role) => {
      const ranked = rankFontsForRole(fonts, role, personalities[role], input);
      return [role, ranked[Math.min(variantIndex % Math.max(1, ranked.length), Math.max(0, ranked.length - 1))] ?? ranked[0]];
    })
  ) as Record<TypographyRole, ReturnType<typeof rankFontsForRole>[number]>;

  if (!choices.headline) {
    throw new Error("No usable headline font was found.");
  }

  const groups = input.copyArchitecture.groups;

  const headline = buildTypographyLayer("headline", groups, personalities.headline, choices.headline, input);
  if (!headline) throw new Error("Typography candidate requires a headline layer.");

  const partial = {
    id: `type-${slug(choices.headline.font.family)}-${variantIndex + 1}`,
    name: `${choices.headline.font.family} / ${choices.accent?.font.family ?? choices.metadata?.font.family ?? "Support"} ${variantIndex + 1}`,
    headline,
    accent: choices.accent ? buildTypographyLayer("accent", groups, personalities.accent, choices.accent, input) : undefined,
    metadata: choices.metadata ? buildTypographyLayer("metadata", groups, personalities.metadata, choices.metadata, input) : undefined,
    dateTime: choices.dateTime ? buildTypographyLayer("dateTime", groups, personalities.dateTime, choices.dateTime, input) : undefined,
    venue: choices.venue ? buildTypographyLayer("venue", groups, personalities.venue, choices.venue, input) : undefined,
    badge: choices.badge ? buildTypographyLayer("badge", groups, personalities.badge, choices.badge, input) : undefined,
    presenter: choices.presenter ? buildTypographyLayer("presenter", groups, personalities.presenter, choices.presenter, input) : undefined,
    footer: choices.footer ? buildTypographyLayer("footer", groups, personalities.footer, choices.footer, input) : undefined,
    fontFamilies: [] as string[],
    personalities: unique(Object.values(personalities)),
    maxFontFamilies:
      input.userPreferences?.maxFontFamilies ??
      input.creativeDirection?.typography?.maxFontFamilies ??
      2,
    hierarchy: resolveHierarchy(input),
    signatureMove: undefined,
    reasoning: [
      `Variant ${variantIndex + 1}.`,
      `Headline personality: ${personalities.headline}.`,
      `Accent personality: ${personalities.accent}.`,
      `Body personality: ${personalities.metadata}.`,
    ],
    warnings: [] as string[],
  };

  partial.fontFamilies = unique(
    [
      partial.headline,
      partial.accent,
      partial.metadata,
      partial.dateTime,
      partial.venue,
      partial.badge,
      partial.presenter,
      partial.footer,
    ]
      .filter(Boolean)
      .map((layer) => layer!.fontFamily)
  );

  const withSignature = applyTypographySignatureMove(partial, input);
  withSignature.warnings = buildWarnings(withSignature);
  const score = scoreTypographySystem(input, withSignature);

  return { ...withSignature, score };
}

function personalityVariant(
  personality: TypographyPersonality,
  role: TypographyRole,
  variantIndex: number
): TypographyPersonality {
  if (variantIndex === 0) return personality;
  if (role === "headline") {
    const alternatives: Record<TypographyPersonality, TypographyPersonality[]> = {
      "condensed-editorial": ["geometric-modern", "clean-grotesk"],
      "luxury-serif": ["fashion-serif", "condensed-editorial"],
      "clean-grotesk": ["geometric-modern", "condensed-editorial"],
      "organic-script": ["humanist-lifestyle", "clean-grotesk"],
      "humanist-lifestyle": ["clean-grotesk", "geometric-modern"],
      "urban-heavy": ["condensed-editorial", "electric-display"],
      "retro-display": ["luxury-serif", "condensed-editorial"],
      "industrial-minimal": ["geometric-modern", "condensed-editorial"],
      "electric-display": ["condensed-editorial", "geometric-modern"],
      "fashion-serif": ["luxury-serif", "condensed-editorial"],
      "geometric-modern": ["clean-grotesk", "condensed-editorial"],
      "classic-sans": ["clean-grotesk", "geometric-modern"],
    };
    return alternatives[personality][(variantIndex - 1) % alternatives[personality].length];
  }

  if (role === "accent" && variantIndex % 3 === 2) return "clean-grotesk";
  return personality;
}

function resolveHierarchy(input: TypographyDirectorInput) {
  const h = input.creativeDirection?.hierarchy ?? input.scene?.creativeDecisions?.hierarchy ?? {};
  return {
    headlinePower: h.headlinePower ?? 100,
    accentMaxRatio: h.accentMaxRatio ?? 0.44,
    bodyMaxRatio: h.bodyMaxRatio ?? 0.29,
    dateMaxRatio: h.dateMaxRatio ?? 0.27,
    venueMaxRatio: h.venueMaxRatio ?? 0.22,
    badgeMaxRatio: h.badgeMaxRatio ?? 0.24,
    presenterMaxRatio: h.presenterMaxRatio ?? 0.15,
    headlineMustWinBy: input.creativeDirection?.hierarchy?.headlineMustWinBy ?? 1.8,
  };
}

function buildWarnings(system: Omit<TypographySystem, "score">): string[] {
  const warnings: string[] = [];
  if (system.fontFamilies.length > system.maxFontFamilies) warnings.push("Too many font families.");
  if (system.accent && system.accent.visualPower > system.headline.visualPower * system.hierarchy.accentMaxRatio) {
    warnings.push("Accent exceeds hierarchy cap.");
  }
  if (system.metadata && system.metadata.visualPower > system.headline.visualPower * system.hierarchy.bodyMaxRatio) {
    warnings.push("Metadata exceeds hierarchy cap.");
  }
  return warnings;
}
