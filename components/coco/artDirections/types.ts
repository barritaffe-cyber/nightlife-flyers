import type { CocoCatalogRecipeId } from "../../../lib/coco/recipeCatalog.ts";
import type { CocoNightlifeStyle } from "../intelligence/types.ts";
import type {
  CocoCompositionPatternId,
  CocoTournamentAlign,
  CocoTournamentFormat,
  CocoTournamentLayoutId,
} from "../layoutTournament/types.ts";
import type { TypePersonality } from "../typographyDirector/types.ts";

export type CocoArtDirectionId =
  | CocoCatalogRecipeId
  | "mojito-monday"
  | "yacht-escape"
  | "black-gold-party"
  | "baddies-n-bundles"
  | "city-nights"
  | "pulse"
  | "space-neon"
  | "zona-de-perreo"
  | "summer-sunset"
  | "diabla-all-white"
  | "rnb-thursdays"
  | "reggae-jams"
  | "amapiano-night"
  | "como-una-boa"
  | "i-love-thursday"
  | "elite-monday"
  | "we-outside"
  | "brunch-saturday"
  | "brunch-vibes"
  | "grey-rave-festival"
  | "dodge-night-rides"
  | "cinematic-lounge"
  | "fashion-club-vertical"
  | "golden-hero-editorial"
  | "glow-in-the-dark"
  | "modern-minimal"
  | "neon-night-shift"
  | "punta-cana-sundays"
  | "sensual-night"
  | "tropical-rooftop"
  | "retro-celebration"
  | "luxury-editorial"
  | "high-energy-club"
  | "underground-edge";

export type CocoArtDirectionVisualRecipeId =
  | CocoCatalogRecipeId
  | "mojito-monday"
  | "yacht-escape"
  | "black-gold-party"
  | "baddies-n-bundles"
  | "city-nights"
  | "pulse"
  | "space-neon"
  | "zona-de-perreo"
  | "summer-sunset"
  | "diabla-all-white"
  | "rnb-thursdays"
  | "reggae-jams"
  | "amapiano-night"
  | "como-una-boa"
  | "i-love-thursday"
  | "elite-monday"
  | "we-outside"
  | "brunch-saturday"
  | "brunch-vibes"
  | "grey-rave-festival"
  | "dodge-night-rides"
  | "fashion-club-vertical"
  | "glow-in-the-dark"
  | "golden-hero-editorial"
  | "ladies-css-editorial"
  | "neon-night-shift"
  | "punta-cana-sundays"
  | "rush-night-css";

export type CocoArtDirectionPalettePolicyId =
  | "champagne-black"
  | "neon-contrast"
  | "black-electric"
  | "deep-red-gold"
  | "mono-accent"
  | "burgundy-rose"
  | "tropical-emerald"
  | "retro-pop";

export type CocoArtDirectionEffectsPolicyId =
  | "soft-glow"
  | "light-beams"
  | "grain-glitch"
  | "haze-vignette"
  | "subtle-texture"
  | "soft-bloom"
  | "sunset-haze"
  | "analog-glow";

export type CocoArtDirectionLayoutPolicy = Readonly<{
  alignment: CocoTournamentAlign;
  compositionPattern: CocoCompositionPatternId;
  density: "minimal" | "low" | "medium";
  layoutId: CocoTournamentLayoutId;
  safeMarginPct: number;
}>;

export type CocoArtDirectionPalettePolicy = Readonly<{
  id: CocoArtDirectionPalettePolicyId;
  maxStrongColors: 2 | 3;
  preserveSkinTone: boolean;
  source: "direction-led" | "image-aware";
  saturation: "restrained" | "balanced" | "vivid";
}>;

export type CocoArtDirectionEffectsPolicy = Readonly<{
  id: CocoArtDirectionEffectsPolicyId;
  intensity: "restrained" | "moderate" | "high-energy";
  oneSignatureEffect: boolean;
}>;

export type CocoArtDirectionSubjectPolicy = Readonly<{
  faceProtection: "strict";
  headlineOverlap: "none" | "controlled";
  mode: "none" | "optional-hero" | "preferred-hero";
  preserveIdentity: true;
  preferredPlacement: Readonly<Record<CocoTournamentFormat, CocoTournamentAlign>>;
}>;

export type CocoArtDirectionReferenceTemplateIds = Readonly<
  Record<CocoTournamentFormat, readonly [string, ...string[]]>
>;

export type CocoArtDirection = Readonly<{
  /** Whether this recipe requires a separate editable portrait layer.
   * People baked into backgrounds do not count as portraits. */
  containsSubject?: boolean;
  effectsPolicy: CocoArtDirectionEffectsPolicy;
  eligibleNightlifeStyles: readonly CocoNightlifeStyle[];
  id: CocoArtDirectionId;
  layoutByFormat: Readonly<Record<CocoTournamentFormat, CocoArtDirectionLayoutPolicy>>;
  name: string;
  palettePolicy: CocoArtDirectionPalettePolicy;
  referenceTemplateIds: CocoArtDirectionReferenceTemplateIds;
  subjectPolicy: CocoArtDirectionSubjectPolicy;
  typographyPersonality: TypePersonality;
  visualRecipeId?: CocoArtDirectionVisualRecipeId;
}>;
