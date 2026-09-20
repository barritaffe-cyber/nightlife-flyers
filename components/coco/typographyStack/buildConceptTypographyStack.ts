import { buildTypographyStackModel } from "./buildTypographyStackModel.ts";
import type {
  CocoConceptEffectsLike,
  CocoConceptPaletteLike,
  CocoFlyerConcept,
} from "../conceptDirector/types";
import type { CocoTournamentFormat, CocoTournamentRect, CocoTournamentText } from "../layoutTournament/types";
import type { CocoCreativeStoryId } from "../layoutTournament/types";
import type {
  CocoTypographyDecision,
  TypographyLayerDecision,
  TypographyTransform,
} from "../typographyDirector/types";
import type {
  CocoTypographyStackModel,
  CocoTypographyStackStyle,
  CocoTypographyStackStyleMap,
} from "./types";
import type { CocoSignatureMove } from "../signatureMove/types";

export function buildConceptTypographyStack<
  TPalette extends CocoConceptPaletteLike,
  TEffects extends CocoConceptEffectsLike,
>(input: {
  concept: Pick<CocoFlyerConcept<TPalette, TEffects>, "brief" | "layout" | "moodProfile" | "name">;
  debugReason?: string;
  faceZone?: CocoTournamentRect | null;
  format: CocoTournamentFormat;
  palette: TPalette;
  signatureMove?: CocoSignatureMove | null;
  text: CocoTournamentText;
  typography: CocoTypographyDecision;
}): CocoTypographyStackModel | null {
  const composition = input.concept.layout.composition;
  if (!composition) return null;

  return buildTypographyStackModel({
    boundsPolicy: "scale-to-fit",
    composition,
    debugReason:
      input.debugReason ?? "Concept built CocoTypographyStackModel before tournament scoring.",
    enabled: {
      date: Boolean(input.text.date),
      details: Boolean(input.text.details),
      details2: Boolean(input.text.details2),
      headline: Boolean(input.text.headline),
      script: Boolean(input.text.script),
      venue: Boolean(input.text.venue),
    },
    eventName: input.concept.name,
    format: input.format,
    faceZone: input.faceZone,
    hasSubject: input.concept.brief.scene.subjectCount > 0,
    minReadableSize: 10,
    mood: input.concept.moodProfile.vector,
    nightlifeStyle: input.concept.brief.storyId ?? null,
    signatureMove: input.signatureMove ?? null,
    story: input.concept.brief.story.oneLine,
    styles: typographyStackStyles(input.typography, input.palette, {
      patternId: composition.patternId,
      storyId: input.concept.brief.storyId,
    }),
    subjectZone: input.concept.layout.zones.subject,
    text: input.text,
  });
}

type TypographyStackStyleContext = {
  patternId?: string | null;
  storyId?: CocoCreativeStoryId | null;
};

function typographyStackStyles(
  typography: CocoTypographyDecision,
  palette: CocoConceptPaletteLike,
  context: TypographyStackStyleContext
): CocoTypographyStackStyleMap {
  const headlineColor = palette.headline ?? palette.palette?.primary ?? "#fff3a5";
  const accentColor = palette.subheadline ?? palette.palette?.accent ?? palette.details ?? "#ffffff";
  const metadataColor = palette.details ?? palette.palette?.neutral ?? "#ffffff";
  const dateColor = palette.date ?? palette.utility ?? metadataColor;
  const venueColor = palette.venue ?? metadataColor;
  const presenterColor = palette.presenter ?? accentColor;
  const badgeColor = palette.price ?? palette.palette?.accent ?? dateColor;
  const taglineColor = palette.subtag ?? palette.details2 ?? metadataColor;
  const complianceColor = palette.utility ?? dateColor;

  const styles: CocoTypographyStackStyleMap = {
    accent: layerStyle(typography.subheadline, {
      color: accentColor,
      fallbackFamily: typography.subheadline.fontFamily || typography.headline.fontFamily,
      fallbackSize: 46,
      fallbackWeight: 900,
    }),
    badge: {
      ...layerStyle(typography.price, {
        color: badgeColor,
        fallbackFamily:
          typography.price.fontFamily || typography.date.fontFamily || typography.details.fontFamily,
        fallbackSize: 22,
        fallbackWeight: 800,
      }),
      fontWeight: clampRoleWeight(typography.price.weight, 800, 800, 900),
    },
    compliance: {
      ...layerStyle(typography.price, {
        color: complianceColor,
        fallbackFamily:
          typography.price.fontFamily || typography.date.fontFamily || typography.details.fontFamily,
        fallbackSize: 18,
        fallbackWeight: 700,
      }),
      fontWeight: clampRoleWeight(typography.price.weight, 700, 700, 800),
    },
    dateTime: layerStyle(typography.date, {
      color: dateColor,
      fallbackFamily: typography.date.fontFamily || typography.details.fontFamily,
      fallbackSize: 28,
      fallbackWeight: 900,
    }),
    footer: layerStyle(typography.details2, {
      color: palette.details2 ?? metadataColor,
      fallbackFamily: typography.details2.fontFamily || typography.details.fontFamily,
      fallbackSize: 22,
      fallbackWeight: 700,
    }),
    headline: {
      ...layerStyle(typography.headline, {
        color: headlineColor,
        fallbackFamily: typography.headline.fontFamily,
        fallbackSize: 96,
        fallbackWeight: typography.headline.weight || 900,
      }),
      shadow: typography.headline.shadow
        ? `0 0 ${Math.round(typography.headline.shadow * 12)}px rgba(0,0,0,.38)`
        : "none",
      strokeWidth: Math.max(0, Number(typography.headline.strokeWidth ?? 0)),
    },
    metadata: layerStyle(typography.details, {
      color: metadataColor,
      fallbackFamily: typography.details.fontFamily,
      fallbackSize: 28,
      fallbackWeight: 800,
    }),
    presenter: {
      ...layerStyle(typography.presenter, {
        color: presenterColor,
        fallbackFamily: typography.presenter.fontFamily || typography.details.fontFamily,
        fallbackSize: 20,
        fallbackWeight: 700,
      }),
      fontWeight: clampRoleWeight(typography.presenter.weight, 700, 700, 800),
    },
    tagline: {
      ...layerStyle(typography.subtag, {
        color: taglineColor,
        fallbackFamily:
          typography.subtag.fontFamily || typography.details2.fontFamily || typography.venue.fontFamily,
        fallbackSize: 20,
        fallbackWeight: 500,
      }),
      fontWeight: clampRoleWeight(typography.subtag.weight, 500, 400, 600),
    },
    venue: layerStyle(typography.venue, {
      color: venueColor,
      fallbackFamily: typography.venue.fontFamily || typography.details.fontFamily,
      fallbackSize: 20,
      fallbackWeight: 800,
    }),
  };

  return applyLifestyleStackPolicy(styles, context);
}

function clampRoleWeight(weight: number, fallback: number, min: number, max: number) {
  const resolved = Number.isFinite(weight) ? weight : fallback;
  return Math.max(min, Math.min(max, resolved));
}

function applyLifestyleStackPolicy(
  styles: CocoTypographyStackStyleMap,
  context: TypographyStackStyleContext
): CocoTypographyStackStyleMap {
  if (!isLuxuryBrunchSideStack(context)) return styles;

  const headlineFamily = normalizeFontFamily(styles.headline?.fontFamily);
  const headlineFontFamily = isPremiumLifestyleHeadline(headlineFamily)
    ? headlineFamily
    : "LEMONMILK-Bold";

  return {
    ...styles,
    accent: {
      ...styles.accent,
      fontFamily: isScriptAccent(styles.accent?.fontFamily) ? styles.accent?.fontFamily ?? "Good Brush" : "Good Brush",
      fontWeight: 500,
      letterSpacingEm: 0,
      lineHeight: Math.max(0.86, Number(styles.accent?.lineHeight ?? 0)),
      textTransform: "titlecase",
    },
    dateTime: {
      ...styles.dateTime,
      fontFamily: "LEMONMILK-Regular",
      fontWeight: 620,
      letterSpacingEm: Math.max(0.05, Number(styles.dateTime?.letterSpacingEm ?? 0)),
      lineHeight: Math.max(0.88, Number(styles.dateTime?.lineHeight ?? 0)),
    },
    footer: {
      ...styles.footer,
      fontFamily: "LEMONMILK-Regular",
      fontWeight: 520,
      letterSpacingEm: Math.max(0.11, Number(styles.footer?.letterSpacingEm ?? 0)),
      lineHeight: Math.max(0.92, Number(styles.footer?.lineHeight ?? 0)),
    },
    headline: {
      ...styles.headline,
      fontFamily: headlineFontFamily,
      fontWeight: 900,
      letterSpacingEm: Math.max(0.015, Number(styles.headline?.letterSpacingEm ?? 0)),
      lineHeight: Math.max(0.84, Number(styles.headline?.lineHeight ?? 0)),
      strokeWidth: Math.min(0.18, Number(styles.headline?.strokeWidth ?? 0)),
    },
    metadata: {
      ...styles.metadata,
      fontFamily: "LEMONMILK-Regular",
      fontWeight: 580,
      letterSpacingEm: Math.max(0.09, Number(styles.metadata?.letterSpacingEm ?? 0)),
      lineHeight: Math.max(0.92, Number(styles.metadata?.lineHeight ?? 0)),
    },
    venue: {
      ...styles.venue,
      fontFamily: "LEMONMILK-Regular",
      fontWeight: 520,
      letterSpacingEm: Math.max(0.12, Number(styles.venue?.letterSpacingEm ?? 0)),
      lineHeight: Math.max(0.9, Number(styles.venue?.lineHeight ?? 0)),
    },
  };
}

function isLuxuryBrunchSideStack(context: TypographyStackStyleContext) {
  return (
    context.storyId === "luxury-tropical-brunch" &&
    (context.patternId === "left-premium-stack" || context.patternId === "right-premium-stack")
  );
}

function normalizeFontFamily(fontFamily: unknown) {
  return String(fontFamily ?? "")
    .split(",")[0]
    ?.trim()
    .replace(/^["']|["']$/g, "") ?? "";
}

function isPremiumLifestyleHeadline(fontFamily: unknown) {
  const family = normalizeFontFamily(fontFamily);
  if (!family) return false;
  if (
    /(script|brush|paint|signature|hand|magiel|bigtimes|avigea|designer|tropical|african|chetta|squid|alien|galax|glitch|digital|pixel|minecrafter|mandalore|techno|dune|azonix|monoton|road rage|payback|grunge|broken|glass|bad coma|horror|satan|oups|nancy|decorative|display)/i.test(
      family
    )
  ) {
    return false;
  }
  return /(lemonmilk|lemon|helvetica|arial|avenir|futura|montserrat|poppins|oswald|archivo|roboto|league|gothic|bebas|anton|coolvetica|cond|narrow)/i.test(
    family
  );
}

function isScriptAccent(fontFamily: unknown) {
  return /(script|brush|paint|signature|hand|good brush|openscript|adelia|lacheyard|dear|satisfy|vibes|cursive)/i.test(
    normalizeFontFamily(fontFamily)
  );
}

function layerStyle(
  layer: TypographyLayerDecision,
  fallback: {
    color: string;
    fallbackFamily: string;
    fallbackSize: number;
    fallbackWeight: number;
  }
): Partial<CocoTypographyStackStyle> {
  return {
    color: fallback.color,
    fontFamily: safeCocoStackFontFamily(
      layer.fontFamily || fallback.fallbackFamily || "LEMONMILK-Regular",
      fallback.fallbackFamily || "LEMONMILK-Regular"
    ),
    fontSize: Math.max(10, Math.round(fallback.fallbackSize * Number(layer.sizeScale || 1))),
    fontWeight: layer.weight || fallback.fallbackWeight,
    letterSpacingEm: Number(layer.letterSpacing ?? 0),
    lineHeight: Number(layer.lineHeight || 1),
    textTransform: stackTransform(layer.transform),
  };
}

function safeCocoStackFontFamily(fontFamily: string, fallbackFamily: string) {
  const strip = (value: string) => String(value || "")
    .split(",")
    .map((family) => family.trim())
    .filter(
      (family) => family.replace(/^['"]|['"]$/g, "").toLowerCase() !== "inter"
    );
  const preferred = strip(fontFamily);
  if (preferred.length) return preferred.join(", ");
  const fallback = strip(fallbackFamily);
  return fallback.length ? fallback.join(", ") : "LEMONMILK-Regular";
}

function stackTransform(
  value: TypographyTransform | undefined
): NonNullable<CocoTypographyStackStyle["textTransform"]> {
  if (value === "uppercase" || value === "titlecase" || value === "lowercase") {
    return value === "lowercase" ? "none" : value;
  }
  return "uppercase";
}
