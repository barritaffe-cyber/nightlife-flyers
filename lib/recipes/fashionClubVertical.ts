import type {
  VisualRecipe,
  VisualRecipeRect,
} from "./types.ts";

function deepFreeze<T>(value: T): T {
  if (
    value === null ||
    (typeof value !== "object" && typeof value !== "function") ||
    Object.isFrozen(value)
  ) {
    return value;
  }

  for (const key of Reflect.ownKeys(value as object)) {
    deepFreeze((value as Record<PropertyKey, unknown>)[key]);
  }
  return Object.freeze(value) as T;
}

export type FashionClubVerticalFormat = "square" | "story";

export type FashionClubVerticalZoneId =
  | "presenter"
  | "headlinePrimary"
  | "headlineSecondary"
  | "primaryMeta"
  | "talentPolicy"
  | "date"
  | "doors"
  | "venue"
  | "optionalBadge"
  | "reservation"
  | "compliance";

export type FashionClubVerticalAssetGeometry = {
  fieldHeightPct: number;
  fieldY: number;
  frameHeightPct: number;
  frameWidthPct: number;
  frameX: number;
  frameY: number;
  glowScale: number;
  glowOpacity: number;
  glowX: number;
  glowY: number;
  paintRotation: number;
  paintScale: number;
  paintOpacity: number;
  paintX: number;
  paintY: number;
};

export type FashionClubVerticalFormatRecipe = {
  textColumn: VisualRecipeRect;
  subjectRect: VisualRecipeRect;
  imageFit: {
    focalTarget: { x: number; y: number };
    scale: number;
    preserveUserScale: boolean;
  };
  faceTarget: {
    centerX: number;
    centerY: number;
    heightMin: number;
    heightMax: number;
    protectionPadding: number;
  };
  zones: Record<FashionClubVerticalZoneId, VisualRecipeRect>;
  railFit: {
    primaryHeightRatio: number;
    secondaryHeightRatio: number;
    primaryMaximum: number;
    secondaryMaximum: number;
    primaryAxisScale: number;
    secondaryAxisScale: number;
    primaryCrossAxisScale: number;
    secondaryCrossAxisScale: number;
    minimum: number;
  };
  variant: Record<string, unknown>;
  assets: FashionClubVerticalAssetGeometry;
};

export type FashionClubVerticalVisualRecipe = VisualRecipe & {
  runtime: {
    directionId: "fashion-club-vertical";
    compositionPattern: "fashion-club-vertical";
    railRotation: -90;
    palette: {
      bgFrom: string;
      bgTo: string;
      primary: string;
      secondary: string;
      accent: string;
      neutral: string;
    };
    fonts: {
      headline: string;
      support: string;
      utility: string;
    };
    assetPolicy: {
      autoAddComplianceRing: boolean;
      autoAddFooterFlare: boolean;
      autoAddGenericSocialIcons: boolean;
      autoAddPriceBadge: boolean;
      autoAddQr: boolean;
    };
    copyPolicy: {
      headlineSplit: "balanced-glyph-width";
      descriptionUsage: "creative-direction-only";
      oneWordHeadline: "hide-secondary-rail";
    };
    hierarchy: {
      headlinePowerMin: number;
      accentPowerMaxRatio: number;
      bodyPowerMaxRatio: number;
      metadataPowerMaxRatio: number;
    };
    rhythm: {
      headlineToAccent: number;
      accentToMeta: number;
      metaToDateTime: number;
      dateTimeToVenue: number;
      venueToFooter: number;
      baselineUnit: number;
      compression: number;
    };
    formats: Record<FashionClubVerticalFormat, FashionClubVerticalFormatRecipe>;
  };
};

/**
 * The single operational contract for Coco's Fashion Club Vertical campaign.
 * Runtime generation, composition scoring, editable atmosphere, export and
 * tests all consume this object; rendered PNGs are examples, never templates.
 */
export const FASHION_CLUB_VERTICAL_RECIPE: FashionClubVerticalVisualRecipe = deepFreeze({
  id: "fashion-club-vertical",
  name: "Fashion Club Vertical — Friday Fever",
  version: 3,
  reference: "friday-fever-coco-built-story.png",
  referenceMode: "measurement-only",
  summary:
    "A red velvet fashion portrait and mirrored disco ball, framed by oversized ivory and gold vertical FRIDAY FEVER titles, a narrow date and talent column, and restrained champagne details.",
  measurementReference: {
    mode: "measurement-only",
    sourceTemplateId: "friday-fever-coco-built-story",
    allowedUses: [
      "left-weighted portrait crop and protected face relationship",
      "twin vertical identity-rail geometry",
      "talent and date column hierarchy",
      "black-floor transition and footer geometry",
      "ruby, paper and acid color-role proportions",
    ],
    deniedUses: [
      "literal event copy",
      "literal uploaded portrait",
      "third-party logo or watermark",
      "flattened finished artwork",
    ],
    measurements: {
      squareSubjectRect: { x: 0, y: 0, width: 58, height: 100 },
      squarePresenterRect: { x: 73, y: 5.5, width: 20, height: 7 },
      squarePrimaryRailRect: { x: 55, y: 9, width: 17.5, height: 63.5 },
      squareSecondaryRailRect: { x: 75.5, y: 16, width: 16, height: 56.5 },
      squarePrimaryMetaRect: { x: 10, y: 49, width: 19, height: 6 },
      squareTalentPolicyRect: { x: 10, y: 59.5, width: 19, height: 13 },
      squareDateRect: { x: 36, y: 59.5, width: 13, height: 13.8 },
      squareDoorsRect: { x: 15, y: 75.5, width: 70, height: 3.5 },
      squareVenueRect: { x: 10, y: 80, width: 81, height: 6 },
      squareBadgeRect: { x: 72, y: 80, width: 19, height: 6 },
      squareReservationRect: { x: 9, y: 87.3, width: 82, height: 7.4 },
      squareComplianceRect: { x: 11, y: 95.5, width: 78, height: 2.2 },
      squareContrastFloorRect: { x: 0, y: 56, width: 100, height: 44 },
      squareFooterFrameRect: { x: 9, y: 87.3, width: 82, height: 7.4 },
      squareGlow: { x: 78, y: 34, scale: 1.52 },
      squarePaint: { x: 72, y: 43, scale: 0.88 },
      squareImageFocalTarget: { x: 35, y: 24, scale: 1.25 },
      storySubjectRect: { x: 0, y: 0, width: 58, height: 100 },
      storyPresenterRect: { x: 66.5, y: 6.2, width: 18, height: 4.6 },
      storyPrimaryRailRect: { x: 57.5, y: 13.5, width: 15, height: 61.5 },
      storySecondaryRailRect: { x: 75.5, y: 20.5, width: 17.5, height: 54.5 },
      storyPrimaryMetaRect: { x: 14.7, y: 54, width: 16.8, height: 6 },
      storyTalentPolicyRect: { x: 14.7, y: 64.8, width: 16.8, height: 9.4 },
      storyDateRect: { x: 36.6, y: 64.8, width: 12.9, height: 9.4 },
      storyDoorsRect: { x: 14.7, y: 79, width: 71.3, height: 3.5 },
      storyVenueRect: { x: 16, y: 83.1, width: 75, height: 4.1 },
      storyBadgeRect: { x: 72, y: 82.5, width: 18, height: 6 },
      storyReservationRect: { x: 13.5, y: 89.9, width: 73.2, height: 4.2 },
      storyComplianceRect: { x: 11, y: 95.8, width: 78, height: 2.2 },
      storyContrastFloorRect: { x: 0, y: 62, width: 100, height: 38 },
      storyFooterFrameRect: { x: 13.5, y: 89.9, width: 73.2, height: 4.2 },
      storyGlow: { x: 79, y: 34, scale: 2.38 },
      storyPaint: { x: 74, y: 43, scale: 1.34 },
      storyImageFocalTarget: { x: 31, y: 14, scale: 1.32 },
      paintRotation: -12,
      railRotation: -90,
      maximumStrongColors: 3,
      recipeVersion: 2,
    },
  },
  targetAssets: {
    backgroundUrl: "/create-with-coco/subjects/subject05.jpg",
    notes: [
      "The photograph is replaceable; user uploads inherit the crop and face-protection contract.",
      "The contrast floor, ruby glow, light paint and footer frame remain ordinary unlocked Coco objects.",
    ],
  },
  composition: {
    referenceMode: "measurement-only",
    referenceTemplateId: "friday-fever-coco-built-story",
    referenceUses: [
      "role geometry",
      "hierarchy ratios",
      "layer order",
      "contrast treatment",
    ],
    deniedReferenceUses: [
      "literal copy",
      "literal portrait",
      "flattened canvas",
      "third-party branding",
    ],
    canvas: {
      format: "story",
      safeArea: { x: 6, y: 4, width: 88, height: 94 },
    },
    roles: [
      { id: "heroPhoto", kind: "subject", purpose: "Full-bleed fashion hero weighted toward the left.", required: true, editable: true, bounds: { x: 0, y: 0, width: 58, height: 100 }, layer: "subject" },
      { id: "contrastFloor", kind: "background", purpose: "Fade the portrait into a clean near-black information floor.", required: true, editable: true, bounds: { x: 0, y: 62, width: 100, height: 38 }, layer: "behindSubject" },
      { id: "magentaGlow", kind: "texture", purpose: "Connect the portrait lighting to the ruby campaign palette.", editable: true, layer: "behindSubject" },
      { id: "lightPaint", kind: "texture", purpose: "Add one restrained editable light gesture behind the title.", editable: true, layer: "behindSubject" },
      { id: "headlinePrimary", kind: "headline", purpose: "First co-authoritative vertical half of the event identity.", required: true, editable: true, bounds: { x: 57.5, y: 13.5, width: 15, height: 61.5 }, layer: "foreground" },
      { id: "headlineSecondary", kind: "headline", purpose: "Second co-authoritative vertical half of a multiword event identity.", editable: true, bounds: { x: 75.5, y: 20.5, width: 17.5, height: 54.5 }, layer: "foreground" },
      { id: "presenter", kind: "utility", purpose: "Compact promoter or venue lockup above the rails.", editable: true, bounds: { x: 66.5, y: 6.2, width: 18, height: 4.6 }, layer: "foreground" },
      { id: "social", kind: "utility", purpose: "Social handle attached beneath the presenter.", editable: true, bounds: { x: 66.8, y: 9.8, width: 18, height: 2.2 }, layer: "foreground" },
      { id: "talentPolicy", kind: "copy", purpose: "Music label and a maximum of four talent lines.", editable: true, bounds: { x: 14.7, y: 64.8, width: 16.8, height: 9.4 }, layer: "foreground" },
      { id: "date", kind: "utility", purpose: "Three-line weekday, ordinal day and month lockup.", editable: true, bounds: { x: 36.6, y: 64.8, width: 12.9, height: 9.4 }, layer: "foreground" },
      { id: "doors", kind: "utility", purpose: "One-line door label and start time row.", editable: true, bounds: { x: 14.7, y: 79, width: 71.3, height: 3.5 }, layer: "utility" },
      { id: "venue", kind: "footer", purpose: "Venue and address communication row.", required: true, editable: true, bounds: { x: 16, y: 83.1, width: 75, height: 4.1 }, layer: "utility" },
      { id: "optionalBadge", kind: "badge", purpose: "Optional entry or VIP fact; hidden in the clean default.", editable: true, bounds: { x: 72, y: 82.5, width: 18, height: 6 }, layer: "utility" },
      { id: "footerFrame", kind: "footer", purpose: "Editable reservation frame aligned with the footer system.", editable: true, bounds: { x: 13.5, y: 89.9, width: 73.2, height: 4.2 }, layer: "utility" },
      { id: "reservation", kind: "footer", purpose: "Reservation contact inside the framed row.", editable: true, bounds: { x: 13.5, y: 89.9, width: 73.2, height: 4.2 }, layer: "utility" },
      { id: "compliance", kind: "footer", purpose: "Lowest-priority tracked assurance line.", editable: true, bounds: { x: 11, y: 95.8, width: 78, height: 2.2 }, layer: "utility" },
    ],
    layoutRules: [
      "Crop the uploaded portrait before placing typography; the hero owns the left visual mass and the face remains protected.",
      "Split a multiword event identity into two balanced measured-width rails; both rails own the headline and neither is a subtitle.",
      "Hide only the unused second rail for a one-word title.",
      "The vertical rails may cross hair, clothing or props, but never eyes, nose or mouth.",
      "Talent policy and date form two parallel compact columns above the footer floor.",
      "Map start time into the single doors row; venue, reservation and compliance form one bottom communication system.",
      "Use the description as creative direction rather than printing it as generic flyer copy.",
      "Square and Story preserve the same left-hero, right-rail, dark-footer campaign grammar.",
    ],
    overlapRules: [
      { objects: ["headlinePrimary", "face"], allowed: false, response: "Refit or move the rail without crossing protected facial features." },
      { objects: ["headlineSecondary", "face"], allowed: false, response: "Refit or move the rail without crossing protected facial features." },
      { objects: ["headlinePrimary", "headlineSecondary"], allowed: false, response: "Preserve the optical gutter between identity rails." },
      { objects: ["talentPolicy", "date"], allowed: false, response: "Keep talent and calendar information in separate columns." },
      { objects: ["footer", "heroPhoto"], allowed: true, maxCoveragePercent: 38, response: "Use the black floor to maintain contrast without erasing the portrait." },
    ],
    generationSteps: [
      "Analyze and crop the uploaded hero into the left-weighted visual-mass target.",
      "Add the editable black contrast floor, ruby glow, light paint and reservation frame.",
      "Split and fit the event identity into two vertical Aliens Among Us rails with protected-face avoidance.",
      "Format the date as weekday, ordinal day and month; pair it with the talent-policy column.",
      "Map start time, venue, address and reservation contact into the structured footer.",
      "Check mobile hierarchy and Square/Story campaign consistency before export.",
    ],
  },
  layerStack: [
    "Uploaded full-bleed fashion portrait.",
    "Editable ruby glow and restrained light paint.",
    "Editable black contrast floor.",
    "Twin vertical event-identity rails.",
    "Talent and calendar columns.",
    "Doors, venue, framed reservation and compliance footer.",
  ],
  textZones: [
    { id: "identity-rails", purpose: "Primary event identity.", placement: "Two optically separated vertical rails on the right." },
    { id: "presenter-social", purpose: "Promoter authority.", placement: "Compact upper-right lockup above the identity rails." },
    { id: "talent-date", purpose: "Talent policy and calendar facts.", placement: "Two parallel columns above the black footer floor." },
    { id: "footer-system", purpose: "Doors, venue, reservation and compliance.", placement: "Four ordered communication rows inside the near-black floor." },
  ],
  typography: [
    "Use Aliens Among Us in warm paper-white for both uppercase vertical identity rails.",
    "Rotate both identity rails -90 degrees with line-height 0.82 and tracking -0.035.",
    "Use Bebas Neue for presenter, talent, calendar and venue facts.",
    "Use LEMONMILK-Regular for doors, reservation and compliance copy.",
    "Use no gradient, stroke, bevel, chrome or glow; keep one restrained shadow between 0.10 and 0.14.",
  ],
  colorGrade: [
    "Near-black floor #050206 into deep ruby-black #120308.",
    "Ruby light #F20A58 connects the subject and title field.",
    "Warm paper #FFF8E8 owns both identity rails.",
    "Acid #EAF238 is restricted to micro-labels, handle, doors and reservation label.",
    "Preserve skin tone while reducing grain, haze and light leak.",
  ],
  avoid: [
    "Treating the second rail as a subtitle.",
    "Crossing eyes, nose or mouth with either identity rail.",
    "Allowing the brand block to collide with the first rail.",
    "Printing generic description prose as event facts.",
    "Adding QR, price badges or generic icons to the clean default.",
    "Heavy shadows, glows or paint that muddy the paper-white rails.",
    "Leaving an empty reservation frame when no contact was supplied.",
  ],
  appNotes: [
    "This object is the operational source of truth for direction selection, renderer geometry, editable assets and export.",
    "All atmosphere and footer objects remain unlocked in .nflyer projects.",
    "The rendered reference is measurement-only and is never loaded as a generation template.",
  ],
  runtime: {
    directionId: "fashion-club-vertical",
    compositionPattern: "fashion-club-vertical",
    railRotation: -90,
    palette: {
      bgFrom: "#050206",
      bgTo: "#120308",
      primary: "#F20A58",
      secondary: "#FFF8E8",
      accent: "#EAF238",
      neutral: "#FFF8E8",
    },
    fonts: {
      headline: "Aliens Among Us",
      support: "Bebas Neue",
      utility: "LEMONMILK-Regular",
    },
    assetPolicy: {
      autoAddComplianceRing: false,
      autoAddFooterFlare: false,
      autoAddGenericSocialIcons: false,
      autoAddPriceBadge: false,
      autoAddQr: false,
    },
    copyPolicy: {
      headlineSplit: "balanced-glyph-width",
      descriptionUsage: "creative-direction-only",
      oneWordHeadline: "hide-secondary-rail",
    },
    hierarchy: {
      headlinePowerMin: 100,
      accentPowerMaxRatio: 0.12,
      bodyPowerMaxRatio: 0.22,
      metadataPowerMaxRatio: 0.32,
    },
    rhythm: {
      headlineToAccent: 0.6,
      accentToMeta: 4.2,
      metaToDateTime: 4.8,
      dateTimeToVenue: 3.2,
      venueToFooter: 2.4,
      baselineUnit: 1.8,
      compression: 0.8,
    },
    formats: {
      square: {
        textColumn: { x: 53, y: 8, width: 40, height: 66 },
        subjectRect: { x: 0, y: 0, width: 58, height: 100 },
        imageFit: {
          focalTarget: { x: 35, y: 24 },
          scale: 1.25,
          preserveUserScale: true,
        },
        faceTarget: { centerX: 35, centerY: 27, heightMin: 33, heightMax: 38, protectionPadding: 3 },
        zones: {
          presenter: { x: 73, y: 5.5, width: 20, height: 7 },
          headlinePrimary: { x: 55, y: 9, width: 17.5, height: 63.5 },
          headlineSecondary: { x: 75.5, y: 16, width: 16, height: 56.5 },
          primaryMeta: { x: 10, y: 49, width: 19, height: 6 },
          talentPolicy: { x: 10, y: 59.5, width: 19, height: 13 },
          date: { x: 36, y: 59.5, width: 13, height: 13.8 },
          doors: { x: 15, y: 75.5, width: 70, height: 3.5 },
          venue: { x: 10, y: 80, width: 81, height: 6 },
          optionalBadge: { x: 72, y: 80, width: 19, height: 6 },
          reservation: { x: 9, y: 87.3, width: 82, height: 7.4 },
          compliance: { x: 11, y: 95.5, width: 78, height: 2.2 },
        },
        railFit: {
          primaryHeightRatio: 0.635,
          secondaryHeightRatio: 0.565,
          primaryMaximum: 116,
          secondaryMaximum: 107,
          primaryAxisScale: 1,
          secondaryAxisScale: 1,
          primaryCrossAxisScale: 1,
          secondaryCrossAxisScale: 1,
          minimum: 44,
        },
        variant: {
          headX: 63.447,
          headY: 32.343,
          headRotate: -90,
          textColWidth: 68,
          head2X: 83.337,
          head2Y: 35.438,
          head2Rotate: -90,
          head2ColWidth: 68,
          presenterX: 83,
          presenterY: 6,
          presenterWidth: 20,
          presenterSize: 20,
          detailsX: 10,
          detailsY: 49,
          rightRailX: 10,
          rightRailY: 56,
          rightRailSize: 9,
          details2X: 35.706,
          details2Y: 67.81,
          details2Size: 15,
          dateX: 14.579,
          dateY: 67.417,
          dateSize: 29,
          venueX: 13.465,
          venueY: 87.563,
          venueSize: 32,
          leftRailX: 10,
          leftRailY: 90.8,
          leftRailSize: 9,
          subtagX: 21.355,
          subtagY: 81.787,
          subtagSize: 12,
          cocoSocialHandleX: 76.62630208333333,
          cocoSocialHandleY: 10.30144675925926,
          socialHandleX: 76.62630208333333,
          socialHandleY: 10.30144675925926,
          complianceX: 50,
          complianceY: 96.6,
          complianceSize: 7,
          headlineSize: 108,
          headSize: 108,
          headMaxPx: 108,
          head2Size: 107,
          head2SizePx: 107,
          headShadowStrength: 0.12,
          head2ShadowStrength: 0.12,
          bgBlur: 0,
          clarity: 0.22,
          contrast: 1.18,
          exp: 0.94,
          filmGrade: 0.62,
          gamma: 0.98,
          grain: 0.08,
          grade: 0.36,
          haze: 0.04,
          leak: 0.26,
          saturation: 1.16,
          vibrance: 0.22,
          vignetteStrength: 0.72,
          vignette: true,
          align: "left",
          headAlign: "left",
          head2Align: "center",
          headSizeAuto: false,
          headlineLineHeight: 0.7,
          lineHeight: 0.7,
          headTracking: -0.035,
          presenterAlign: "center",
          detailsAlign: "left",
          detailsEnabled: false,
          rightRailAlign: "left",
          rightRailRotation: 0,
          details2Align: "left",
          details2Rotate: 0,
          details2LineHeight: 0.92,
          dateLineHeight: 0.88,
          dateAlign: "left",
          dateRotation: 0,
          venueAlign: "left",
          venueRotate: 0,
          venueLineHeight: 0.92,
          venueBold: true,
          cocoRushVenueStyles: { venueNameSize: 32, addressSize: 14, gap: 4.5, venueNameColor: "#FFF8E8", addressColor: "#EAF238" },
          leftRailAlign: "left",
          leftRailRotation: 0,
          subtagAlign: "center",
          subtagBgColor: "rgba(0,0,0,0)",
          cocoSocialHandleSize: 8,
          cocoSocialHandleAlign: "left",
          cocoSocialHandleRotation: 0,
          socialHandleSize: 8,
          socialHandleAlign: "left",
          socialHandleRotation: 0,
          complianceAlign: "center",
          complianceEnabled: true,
          qrEnabled: false,
          priceEnabled: false,
          bgPosX: 89.89221643518519,
          bgPosY: 17.16435185185185,
          bgScale: 1.4,
        },
        assets: {
          fieldHeightPct: 44,
          fieldY: 78,
          frameHeightPct: 7.4,
          frameWidthPct: 82,
          frameX: 50,
          frameY: 91,
          glowScale: 1.52,
          glowOpacity: 0.64,
          glowX: 78,
          glowY: 34,
          paintRotation: -12,
          paintScale: 0.88,
          paintOpacity: 0.17,
          paintX: 72,
          paintY: 43,
        },
      },
      story: {
        textColumn: { x: 53, y: 8, width: 42, height: 68 },
        subjectRect: { x: 0, y: 0, width: 58, height: 100 },
        imageFit: {
          focalTarget: { x: 31, y: 14 },
          scale: 1.32,
          preserveUserScale: true,
        },
        faceTarget: { centerX: 35, centerY: 24, heightMin: 29, heightMax: 33, protectionPadding: 3 },
        zones: {
          presenter: { x: 66.5, y: 6.2, width: 18, height: 4.6 },
          headlinePrimary: { x: 57.5, y: 13.5, width: 15, height: 61.5 },
          headlineSecondary: { x: 75.5, y: 20.5, width: 17.5, height: 54.5 },
          primaryMeta: { x: 14.7, y: 54, width: 16.8, height: 6 },
          talentPolicy: { x: 14.7, y: 64.8, width: 16.8, height: 9.4 },
          date: { x: 36.6, y: 64.8, width: 12.9, height: 9.4 },
          doors: { x: 14.7, y: 79, width: 71.3, height: 3.5 },
          venue: { x: 16, y: 83.1, width: 75, height: 4.1 },
          optionalBadge: { x: 72, y: 82.5, width: 18, height: 6 },
          reservation: { x: 13.5, y: 89.9, width: 73.2, height: 4.2 },
          compliance: { x: 11, y: 95.8, width: 78, height: 2.2 },
        },
        railFit: {
          primaryHeightRatio: 0.615,
          secondaryHeightRatio: 0.545,
          primaryMaximum: 156,
          secondaryMaximum: 156,
          primaryAxisScale: 1.24,
          secondaryAxisScale: 1.15,
          primaryCrossAxisScale: 0.63,
          secondaryCrossAxisScale: 0.76,
          minimum: 44,
        },
        variant: {
          headX: 62.252,
          headY: 45.371,
          headRotate: -90,
          textColWidth: 72,
          head2X: 91.522,
          head2Y: 47.786,
          head2Rotate: -90,
          head2ColWidth: 72,
          presenterX: 84.44748263888889,
          presenterY: 7.627115885416666,
          presenterWidth: 18,
          presenterSize: 23,
          detailsX: 10,
          detailsY: 54,
          rightRailX: 14.7,
          rightRailY: 68.2,
          rightRailSize: 10,
          details2X: 13.929,
          details2Y: 75.455,
          details2Size: 18,
          dateX: 38.399,
          dateY: 74.968,
          dateSize: 34,
          venueX: 12.687,
          venueY: 90.098,
          venueSize: 36,
          leftRailX: 16,
          leftRailY: 91.4,
          leftRailSize: 8,
          subtagX: 31.432,
          subtagY: 86.545,
          subtagSize: 11,
          cocoSocialHandleX: 70.02265625,
          cocoSocialHandleY: 11.403190104166667,
          socialHandleX: 70.02265625,
          socialHandleY: 11.403190104166667,
          complianceX: 50,
          complianceY: 95.72781575520833,
          complianceSize: 7,
          headlineSize: 156,
          headSize: 156,
          headMaxPx: 156,
          head2Size: 156,
          head2SizePx: 156,
          headShadowStrength: 0.12,
          head2ShadowStrength: 0.12,
          bgBlur: 0,
          clarity: 0.22,
          contrast: 1.18,
          exp: 0.94,
          filmGrade: 0.62,
          gamma: 0.98,
          grain: 0.08,
          grade: 0.36,
          haze: 0.04,
          leak: 0.26,
          saturation: 1.16,
          vibrance: 0.22,
          vignetteStrength: 0.72,
          vignette: true,
          align: "center",
          headAlign: "center",
          head2Align: "center",
          headSizeAuto: false,
          headlineLineHeight: 0.82,
          lineHeight: 0.82,
          headTracking: -0.035,
          presenterAlign: "right",
          detailsAlign: "left",
          detailsEnabled: false,
          rightRailAlign: "left",
          rightRailRotation: 0,
          details2Align: "left",
          details2Rotate: 0,
          details2LineHeight: 0.92,
          dateLineHeight: 0.88,
          dateAlign: "left",
          dateRotation: 0,
          venueAlign: "left",
          venueRotate: 0,
          venueLineHeight: 0.92,
          venueBold: true,
          cocoRushVenueStyles: { venueNameSize: 36, addressSize: 14, gap: 5.75, venueNameColor: "#FFF8E8", addressColor: "#EAF238" },
          leftRailAlign: "left",
          leftRailRotation: 0,
          subtagAlign: "center",
          subtagBgColor: "rgba(0,0,0,0)",
          cocoSocialHandleSize: 8,
          cocoSocialHandleAlign: "left",
          cocoSocialHandleRotation: 0,
          socialHandleSize: 8,
          socialHandleAlign: "left",
          socialHandleRotation: 0,
          complianceAlign: "center",
          complianceEnabled: true,
          qrEnabled: false,
          priceEnabled: false,
          bgPosX: 78.3285796957672,
          bgPosY: 49.192301432291664,
          bgScale: 1,
        },
        assets: {
          fieldHeightPct: 38,
          fieldY: 81,
          frameHeightPct: 4.2,
          frameWidthPct: 73.2,
          frameX: 50.1,
          frameY: 92,
          glowScale: 2.38,
          glowOpacity: 0.64,
          glowX: 79,
          glowY: 34,
          paintRotation: -12,
          paintScale: 1.34,
          paintOpacity: 0.17,
          paintX: 74,
          paintY: 43,
        },
      },
    },
  },
});

export function getFashionClubVerticalFormatRecipe(
  format: FashionClubVerticalFormat
): FashionClubVerticalFormatRecipe {
  return FASHION_CLUB_VERTICAL_RECIPE.runtime.formats[format];
}

export type FashionClubHeadlineSplit = {
  primary: string;
  secondary: string;
};

/**
 * Split one event identity into the recipe's two co-authoritative rails.
 * The optional measurer lets the live canvas use the loaded display font;
 * Quick Edit and server-side tests use the deterministic glyph estimate.
 */
export function splitFashionClubVerticalHeadline(
  value: unknown,
  measure?: (copy: string) => number
): FashionClubHeadlineSplit {
  const words = String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
  if (words.length <= 1) {
    return { primary: words[0] ?? "", secondary: "" };
  }

  const estimate = (copy: string) =>
    Array.from(copy.toUpperCase()).reduce((total, character) => {
      if (/[MW]/.test(character)) return total + 1.28;
      if (/[I1]/.test(character)) return total + 0.54;
      if (character === " ") return total + 0.46;
      return total + 1;
    }, 0);
  const width = measure ?? estimate;
  let splitAt = 1;
  let smallestDifference = Number.POSITIVE_INFINITY;
  for (let index = 1; index < words.length; index += 1) {
    const first = words.slice(0, index).join(" ");
    const second = words.slice(index).join(" ");
    const difference = Math.abs(width(first) - width(second));
    if (difference < smallestDifference) {
      smallestDifference = difference;
      splitAt = index;
    }
  }
  return {
    primary: words.slice(0, splitAt).join(" "),
    secondary: words.slice(splitAt).join(" "),
  };
}
