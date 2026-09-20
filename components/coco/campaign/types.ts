import type {
  CocoArtDirectionEffectsPolicyId,
  CocoArtDirectionId,
  CocoArtDirectionPalettePolicyId,
} from "../artDirections/types.ts";
import type {
  CocoCompositionPatternId,
  CocoTournamentAlign,
  CocoTournamentFormat,
  CocoTournamentLayoutId,
} from "../layoutTournament/types.ts";
import type { TypePersonality } from "../typographyDirector/types.ts";

export type CocoCampaignFormat = CocoTournamentFormat;

export type CocoCampaignCopy = Readonly<{
  addons?: string;
  compliance?: string;
  date?: string;
  details?: string;
  details2?: string;
  djLineup?: string;
  headline: string;
  musicPolicy?: string;
  presenter?: string;
  price?: string;
  rsvpContact?: string;
  socials?: string;
  subheadline?: string;
  subtag?: string;
  venue?: string;
}>;

export type CocoCampaignPalette = Readonly<{
  accent: string;
  backgroundFrom: string;
  backgroundTo: string;
  details: string;
  headline: string;
  neutral: string;
  policyId: CocoArtDirectionPalettePolicyId;
  utility: string;
}>;

export type CocoCampaignFontSystem = Readonly<{
  accent: string;
  body: string;
  headline: string;
  maxFamilies: 2 | 3;
  personality: TypePersonality;
  utility: string;
}>;

export type CocoCampaignEffects = Readonly<{
  grain?: number;
  glow?: number;
  haze?: number;
  intensity: "restrained" | "moderate" | "high-energy";
  policyId: CocoArtDirectionEffectsPolicyId;
  texture?: number;
  vignette?: number;
}>;

export type CocoCampaignAssetRole =
  | "background"
  | "decoration"
  | "logo"
  | "qr"
  | "sponsor"
  | "subject";

export type CocoCampaignAsset = Readonly<{
  focalPoint?: Readonly<{ x: number; y: number }>;
  id: string;
  preserveAcrossFormats: boolean;
  role: CocoCampaignAssetRole;
  src: string;
}>;

export type CocoCampaignSharedSpec = Readonly<{
  assets: readonly CocoCampaignAsset[];
  copy: CocoCampaignCopy;
  directionId: CocoArtDirectionId;
  effects: CocoCampaignEffects;
  fonts: CocoCampaignFontSystem;
  palette: CocoCampaignPalette;
}>;

export type CocoCampaignFormatLayout = Readonly<{
  alignment: CocoTournamentAlign;
  canvas: Readonly<{ height: number; width: number }>;
  compositionPattern: CocoCompositionPatternId;
  format: CocoCampaignFormat;
  layoutId: CocoTournamentLayoutId;
  layoutVariantId?: string;
  referenceTemplateId: string;
  safeMarginPct: number;
  subjectPlacement: CocoTournamentAlign;
}>;

export type CocoCampaignSpec = Readonly<{
  id: string;
  layouts: Readonly<Record<CocoCampaignFormat, CocoCampaignFormatLayout>>;
  shared: CocoCampaignSharedSpec;
}>;

export type CocoCampaignLayoutChoice = Readonly<{
  layoutVariantId?: string;
  referenceTemplateId?: string;
}>;

export type CreateCocoCampaignSpecInput = Readonly<{
  id: string;
  layouts?: Partial<Record<CocoCampaignFormat, CocoCampaignLayoutChoice>>;
  shared: CocoCampaignSharedSpec;
}>;

export type CocoCampaignValidationIssue = Readonly<{
  code:
    | "asset-id"
    | "direction"
    | "effects"
    | "font"
    | "format"
    | "id"
    | "layout"
    | "palette"
    | "reference"
    | "text";
  format?: CocoCampaignFormat;
  message: string;
}>;
