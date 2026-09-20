import {
  CENTER_REFERENCE_LAYOUTS,
  type CenterReferenceLayout,
} from "./centerReferenceLayouts.ts";

export const CENTER07_EDITORIAL_REFERENCE_ID = "center-07-geometric-title" as const;

export type Center07EditorialFormat = "square" | "story";
export type Center07EditorialAlign = "left" | "center" | "right";

export type Center07EditorialRect = Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
  align: Center07EditorialAlign;
}>;

export type Center07EditorialZoneId =
  | "presenter"
  | "date"
  | "headline"
  | "headline2"
  | "subtag"
  | "details"
  | "details2"
  | "venue";

export type Center07EditorialZones = Readonly<
  Record<Center07EditorialZoneId, Center07EditorialRect>
>;

export type Center07EditorialTextFx = Readonly<{
  uppercase: boolean;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  tracking: number;
  gradient: boolean;
  gradFrom: string;
  gradTo: string;
  color: string;
  strokeWidth: number;
  strokeColor: string;
  shadow: number;
  glow: number;
  glowColor: string;
  shadowColor: string;
  shadowEnabled: boolean;
}>;

export const CENTER07_EDITORIAL_DISABLED_HEADLINE_EFFECTS = [
  "headSliceEnabled",
  "headRushEnabled",
  "headLineEnabled",
  "headGlassEnabled",
  "headKineticEnabled",
  "headDashStrokeEnabled",
  "headColorStrokeEnabled",
  "headPure3dEnabled",
  "headGoldBlockEnabled",
  "headCyberEmbossEnabled",
  "headRetroShadowEnabled",
  "headQuantumEnabled",
  "headQuantumGlowEnabled",
  "headVerticalStretchEnabled",
  "headGlitchEnabled",
  "headNeonGlowEnabled",
  "headMiamiHeatEnabled",
  "headShadow",
] as const;

export type Center07EditorialDisabledHeadlineEffect =
  (typeof CENTER07_EDITORIAL_DISABLED_HEADLINE_EFFECTS)[number];

export type Center07EditorialPatch = Readonly<{
  format: Center07EditorialFormat;
  cocoSubjectLayoutId: "subject-center";
  cocoCenterLayoutOptionId: "subject-center";
  cocoCenterLayoutVersion: 55;

  palette: Readonly<{
    bgFrom: string;
    bgTo: string;
    primary: string;
    secondary: string;
    accent: string;
    neutral: string;
  }>;

  vignette: true;
  vignetteStrength: number;
  textureOpacity: 0;
  haze: 0;
  grade: 0;
  clarity: 0;
  exp: 1;
  contrast: number;
  saturation: number;
  warmth: number;
  tint: 0;
  gamma: 1;
  grain: number;
  vibrance: 0;
  filmGrade: 0;

  headlineFamily: string;
  headColor: string;
  headX: number;
  headY: number;
  headlineSize: number;
  headSize: number;
  headMaxPx: number;
  headSizeAuto: boolean;
  headAlign: "center";
  align: "center";
  textAlign: "center";
  textColWidth: number;
  lineHeight: number;
  textFx: Center07EditorialTextFx;
  headBehindPortrait: false;
  headRotate: 0;
  headSkew: 0;

  head2Family: string;
  head2Color: string;
  head2X: number;
  head2Y: number;
  head2Size: number;
  head2SizePx: number;
  head2ColWidth: number;
  head2Align: "center";
  head2LineHeight: number;
  head2Tracking: number;
  head2Fx: Center07EditorialTextFx;
  head2Rotate: 0;
  head2Skew: 0;
  head2Gradient: false;
  head2Glow: 0;
  head2Shadow: false;
  head2ShadowStrength: 0;

  presenterFamily: string;
  presenterColor: string;
  presenterX: number;
  presenterY: number;
  presenterWidth: number;
  presenterSize: number;
  presenterAlign: "center";
  presenterLineHeight: number;
  presenterRotation: 0;

  dateFamily: string;
  dateColor: string;
  dateX: number;
  dateY: number;
  dateSize: number;
  dateAlign: "left";
  dateLineHeight: number;
  dateRotation: 0;

  detailsFamily: string;
  detailsColor: string;
  bodyColor: string;
  detailsX: number;
  detailsY: number;
  detailsSize: number;
  bodySize: number;
  detailsAlign: "left";
  detailsLineHeight: number;
  detailsRotate: 0;
  detailsLabel: "";
  detailsLabelBgColor: string;
  detailsLabelColor: string;
  detailsShadow: false;
  detailsShadowStrength: 0;
  bodyBold: true;
  bodyTracking: number;

  details2Family: string;
  details2Color: string;
  details2X: number;
  details2Y: number;
  details2Size: number;
  details2Align: "right";
  details2LineHeight: number;
  details2Rotate: 0;
  details2LetterSpacing: number;
  details2Bold: true;
  details2Shadow: false;
  details2ShadowStrength: 0;
  djLineupLabel: "";
  djLineupLabelBgColor: string;
  djLineupLabelColor: string;

  subtagFamily: string;
  subtagTextColor: string;
  subtagBgColor: string;
  subtagX: number;
  subtagY: number;
  subtagSize: number;
  subtagAlign: "center";
  subtagAlpha: 1;
  subtagRotate: 0;
  subtagBold: true;
  subtagShadow: false;
  subtagShadowStrength: 0;
  pillAlpha: 0;

  venueFamily: string;
  venueColor: string;
  venueX: number;
  venueY: number;
  venueSize: number;
  venueAlign: "center";
  venueLineHeight: number;
  venueRotate: 0;
  venueBold: false;
  venueShadow: false;
  venueShadowStrength: 0;

  priceEnabled: false;
  complianceEnabled: false;
  qrEnabled: false;
  leftRailEnabled: false;
  rightRailEnabled: false;
  socialHandleEnabled: false;
  cocoSocialHandleEnabled: false;
  mobileHeadlineStyleFocus: null;
} & Readonly<Record<Center07EditorialDisabledHeadlineEffect, false>>>;

export type Center07EditorialComposition = Readonly<{
  referenceLayoutId: typeof CENTER07_EDITORIAL_REFERENCE_ID;
  format: Center07EditorialFormat;
  faceProtection: Center07EditorialRect;
  zones: Center07EditorialZones;
  patch: Center07EditorialPatch;
  measurement: Readonly<{
    sourceUrl: string;
    sourceAspectRatio: number;
    faceAnchor: Readonly<{ x: number; y: number; width: number; height: number }>;
    zones: CenterReferenceLayout["zones"];
  }>;
  assetPolicy: Readonly<{
    keepSubject: true;
    keepUserLogo: true;
    autoAddSocials: false;
    autoAddFeatures: false;
    autoAddComplianceRing: false;
    autoAddFooterFlare: false;
  }>;
}>;

const COLORS = {
  backgroundFrom: "#050304",
  backgroundTo: "#19080D",
  ivory: "#FFF8F0",
  support: "#F4ECE5",
  oxblood: "#781D2D",
  champagne: "#D8B45A",
} as const;

const FONTS = {
  headline: "LEMONMILK-Bold",
  presenter: "LEMONMILK-Light",
  utility: "Bebas Neue",
  venue: "LEMONMILK-Light",
} as const;

type FormatBlueprint = Readonly<{
  faceProtection: Center07EditorialRect;
  zones: Center07EditorialZones;
  sizes: Readonly<{
    headline: number;
    headline2: number;
    presenter: number;
    date: number;
    subtag: number;
    details: number;
    details2: number;
    venue: number;
  }>;
}>;

const FORMAT_BLUEPRINTS: Readonly<Record<Center07EditorialFormat, FormatBlueprint>> = {
  story: {
    // The source's face anchor is 42/15/22/23. The editorial adaptation adds
    // recognition-safe padding, then starts the hero immediately below it.
    faceProtection: { x: 39, y: 12, width: 28, height: 29, align: "center" },
    zones: {
      presenter: { x: 36, y: 3, width: 28, height: 6, align: "center" },
      date: { x: 16, y: 16, width: 22, height: 10, align: "left" },
      headline: { x: 14, y: 44, width: 72, height: 10, align: "center" },
      headline2: { x: 9, y: 53.5, width: 82, height: 11, align: "center" },
      subtag: { x: 15, y: 65.5, width: 70, height: 5, align: "center" },
      details: { x: 12, y: 74, width: 34, height: 13, align: "left" },
      details2: { x: 54, y: 74, width: 34, height: 13, align: "right" },
      venue: { x: 17, y: 91, width: 66, height: 6, align: "center" },
    },
    sizes: {
      headline: 106,
      headline2: 106,
      presenter: 10,
      date: 22,
      subtag: 14,
      details: 12,
      details2: 12,
      venue: 11,
    },
  },
  square: {
    // Square keeps the same campaign hierarchy but composes it independently;
    // it is not a crop of the taller reference or Story canvas.
    faceProtection: { x: 35, y: 10, width: 30, height: 32, align: "center" },
    zones: {
      presenter: { x: 34, y: 4, width: 32, height: 6, align: "center" },
      date: { x: 7, y: 14, width: 24, height: 12, align: "left" },
      headline: { x: 9, y: 45, width: 82, height: 11, align: "center" },
      headline2: { x: 6, y: 56, width: 88, height: 12, align: "center" },
      subtag: { x: 15, y: 74.5, width: 70, height: 5, align: "center" },
      details: { x: 7, y: 81, width: 39, height: 11, align: "left" },
      details2: { x: 54, y: 81, width: 39, height: 11, align: "right" },
      venue: { x: 17, y: 94.5, width: 66, height: 4, align: "center" },
    },
    sizes: {
      headline: 88,
      headline2: 92,
      presenter: 10,
      date: 20,
      subtag: 13,
      details: 11,
      details2: 11,
      venue: 10,
    },
  },
};

const center07Reference = () => {
  const reference = CENTER_REFERENCE_LAYOUTS.find(
    (layout) => layout.id === CENTER07_EDITORIAL_REFERENCE_ID
  );
  if (!reference) {
    throw new Error(`Missing Coco reference layout ${CENTER07_EDITORIAL_REFERENCE_ID}.`);
  }
  return reference;
};

const cloneRect = <T extends { x: number; y: number; width: number; height: number }>(
  value: T
) => ({ ...value });

const cloneZones = (zones: Center07EditorialZones): Center07EditorialZones =>
  Object.fromEntries(
    Object.entries(zones).map(([role, zone]) => [role, { ...zone }])
  ) as unknown as Center07EditorialZones;

const anchorX = (zone: Center07EditorialRect) => {
  if (zone.align === "right") return zone.x + zone.width;
  if (zone.align === "center") return zone.x + zone.width / 2;
  return zone.x;
};

const flatTextFx = (color: string, tracking: number): Center07EditorialTextFx => ({
  uppercase: true,
  bold: true,
  italic: false,
  underline: false,
  tracking,
  gradient: false,
  gradFrom: color,
  gradTo: color,
  color,
  strokeWidth: 0,
  strokeColor: COLORS.backgroundFrom,
  shadow: 0,
  glow: 0,
  glowColor: color,
  shadowColor: COLORS.backgroundFrom,
  shadowEnabled: false,
});

/**
 * Adapts the measured center07 editorial hierarchy into an editable Coco v55
 * Layout 1 patch. Copy remains owned by the event brief and live editor; this
 * helper supplies only coordinated geometry, typography, color and restraint.
 */
export function buildCenter07EditorialComposition(
  format: Center07EditorialFormat
): Center07EditorialComposition {
  const reference = center07Reference();
  const blueprint = FORMAT_BLUEPRINTS[format];
  const zones = cloneZones(blueprint.zones);
  const { sizes } = blueprint;
  const headlineFx = flatTextFx(COLORS.ivory, -0.045);
  const headline2Fx = flatTextFx(COLORS.ivory, -0.04);

  const disabledEffects = Object.fromEntries(
    CENTER07_EDITORIAL_DISABLED_HEADLINE_EFFECTS.map((field) => [field, false])
  ) as Readonly<Record<Center07EditorialDisabledHeadlineEffect, false>>;

  const patch: Center07EditorialPatch = {
    ...disabledEffects,
    format,
    cocoSubjectLayoutId: "subject-center",
    cocoCenterLayoutOptionId: "subject-center",
    cocoCenterLayoutVersion: 55,
    palette: {
      bgFrom: COLORS.backgroundFrom,
      bgTo: COLORS.backgroundTo,
      primary: COLORS.ivory,
      secondary: COLORS.oxblood,
      accent: COLORS.champagne,
      neutral: COLORS.support,
    },
    vignette: true,
    vignetteStrength: format === "story" ? 0.34 : 0.3,
    textureOpacity: 0,
    haze: 0,
    grade: 0,
    clarity: 0,
    exp: 1,
    contrast: 1.06,
    saturation: 0.82,
    warmth: 0.03,
    tint: 0,
    gamma: 1,
    grain: 0.035,
    vibrance: 0,
    filmGrade: 0,

    headlineFamily: FONTS.headline,
    headColor: COLORS.ivory,
    headX: anchorX(zones.headline),
    headY: zones.headline.y,
    headlineSize: sizes.headline,
    headSize: sizes.headline,
    headMaxPx: sizes.headline,
    // This is a measured editorial lockup, not a generic tournament zone.
    // Letting the global Coco fitter re-own it after application shrinks the
    // hero title back to utility-copy scale.
    headSizeAuto: false,
    headAlign: "center",
    align: "center",
    textAlign: "center",
    textColWidth: zones.headline.width,
    lineHeight: 0.76,
    textFx: headlineFx,
    headBehindPortrait: false,
    headRotate: 0,
    headSkew: 0,

    head2Family: FONTS.headline,
    head2Color: COLORS.ivory,
    head2X: anchorX(zones.headline2),
    head2Y: zones.headline2.y,
    head2Size: sizes.headline2,
    head2SizePx: sizes.headline2,
    head2ColWidth: zones.headline2.width,
    head2Align: "center",
    head2LineHeight: 0.78,
    head2Tracking: -0.04,
    head2Fx: headline2Fx,
    head2Rotate: 0,
    head2Skew: 0,
    head2Gradient: false,
    head2Glow: 0,
    head2Shadow: false,
    head2ShadowStrength: 0,

    presenterFamily: FONTS.presenter,
    presenterColor: COLORS.support,
    presenterX: anchorX(zones.presenter),
    presenterY: zones.presenter.y,
    presenterWidth: zones.presenter.width,
    presenterSize: sizes.presenter,
    presenterAlign: "center",
    presenterLineHeight: 1,
    presenterRotation: 0,

    dateFamily: FONTS.utility,
    dateColor: COLORS.support,
    dateX: anchorX(zones.date),
    dateY: zones.date.y,
    dateSize: sizes.date,
    dateAlign: "left",
    dateLineHeight: 0.92,
    dateRotation: 0,

    detailsFamily: FONTS.utility,
    detailsColor: COLORS.support,
    bodyColor: COLORS.support,
    detailsX: anchorX(zones.details),
    detailsY: zones.details.y,
    detailsSize: sizes.details,
    bodySize: sizes.details,
    detailsAlign: "left",
    detailsLineHeight: 0.98,
    detailsRotate: 0,
    detailsLabel: "",
    detailsLabelBgColor: COLORS.backgroundFrom,
    detailsLabelColor: COLORS.support,
    detailsShadow: false,
    detailsShadowStrength: 0,
    bodyBold: true,
    bodyTracking: 0.035,

    details2Family: FONTS.utility,
    details2Color: COLORS.support,
    details2X: anchorX(zones.details2),
    details2Y: zones.details2.y,
    details2Size: sizes.details2,
    details2Align: "right",
    details2LineHeight: 0.98,
    details2Rotate: 0,
    details2LetterSpacing: 0.035,
    details2Bold: true,
    details2Shadow: false,
    details2ShadowStrength: 0,
    djLineupLabel: "",
    djLineupLabelBgColor: COLORS.backgroundFrom,
    djLineupLabelColor: COLORS.support,

    subtagFamily: FONTS.utility,
    subtagTextColor: COLORS.champagne,
    subtagBgColor: COLORS.backgroundFrom,
    // Center subtags render as a fixed 70%-wide band whose X is its left edge.
    subtagX: zones.subtag.x,
    subtagY: zones.subtag.y,
    subtagSize: sizes.subtag,
    subtagAlign: "center",
    subtagAlpha: 1,
    subtagRotate: 0,
    subtagBold: true,
    subtagShadow: false,
    subtagShadowStrength: 0,
    pillAlpha: 0,

    venueFamily: FONTS.venue,
    venueColor: COLORS.support,
    venueX: anchorX(zones.venue),
    venueY: zones.venue.y,
    venueSize: sizes.venue,
    venueAlign: "center",
    venueLineHeight: 1.05,
    venueRotate: 0,
    venueBold: false,
    venueShadow: false,
    venueShadowStrength: 0,

    priceEnabled: false,
    complianceEnabled: false,
    qrEnabled: false,
    leftRailEnabled: false,
    rightRailEnabled: false,
    socialHandleEnabled: false,
    cocoSocialHandleEnabled: false,
    mobileHeadlineStyleFocus: null,
  };

  return {
    referenceLayoutId: CENTER07_EDITORIAL_REFERENCE_ID,
    format,
    faceProtection: { ...blueprint.faceProtection },
    zones,
    patch,
    measurement: {
      sourceUrl: reference.sourceUrl,
      sourceAspectRatio: reference.aspectRatio,
      faceAnchor: cloneRect(reference.faceAnchor),
      zones: Object.fromEntries(
        Object.entries(reference.zones).map(([role, zone]) => [
          role,
          zone ? cloneRect(zone) : zone,
        ])
      ),
    },
    assetPolicy: {
      keepSubject: true,
      keepUserLogo: true,
      autoAddSocials: false,
      autoAddFeatures: false,
      autoAddComplianceRing: false,
      autoAddFooterFlare: false,
    },
  };
}
