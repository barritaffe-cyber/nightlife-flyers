import type {
  ColorRenderModel,
  ColorRole,
  ColorScore,
  Hex,
  PalettePolicy,
} from "../../../coco-color-director/index.ts";

export const COCO_CAMPAIGN_COLOR_ROLES = [
  "background",
  "backgroundSecondary",
  "headline",
  "accent",
  "metadata",
  "dateTime",
  "venue",
  "badgeBackground",
  "badgeText",
  "presenter",
  "footer",
  "stroke",
  "glow",
  "neutral",
  "utility",
] as const satisfies readonly ColorRole[];

export type CocoCampaignColorRole = (typeof COCO_CAMPAIGN_COLOR_ROLES)[number];

export type CocoCampaignColorRoles = Record<CocoCampaignColorRole, Hex>;

/**
 * The only legacy palette shape the current editor should receive from the
 * campaign palette domain. `secondary` intentionally means the dark/base
 * field here; Color Director's semantic accent must never leak into it.
 */
export type CocoLegacyPalette = {
  bgFrom: Hex;
  bgTo: Hex;
  primary: Hex;
  secondary: Hex;
  accent: Hex;
  neutral: Hex;
};

export type CocoCampaignFormat = "square" | "story";

export type CocoCampaignPaletteCandidate = {
  id: string;
  name: string;
  policy: PalettePolicy;
  renderModel: ColorRenderModel;
  roles: CocoCampaignColorRoles;
  score: ColorScore;
  strongColors: Hex[];
};

export type CocoColorSelection = {
  version: 1;
  inputHash: string;
  candidates: CocoCampaignPaletteCandidate[];
  selectedId: string;
  selectedIndex: number;
};

export type CocoCampaignFormatPalettes = Record<CocoCampaignFormat, CocoLegacyPalette>;
