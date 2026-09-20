import type { VisualRecipe, VisualRecipeRect } from "./types.ts";

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

export type RushNightFormat = "square" | "story";

export type CocoRushDateStyles = {
  metaSize: number;
  daySize: number;
  openingSize: number;
  monthSize: number;
  timeLabelSize: number;
  timeSize: number;
  metaColor: string;
  dayColor: string;
  openingColor: string;
  monthColor: string;
  timeLabelColor: string;
  timeColor: string;
  ruleColor: string;
};

export const COCO_RUSH_DATE_STYLES: CocoRushDateStyles = {
  metaSize: 23,
  daySize: 48,
  openingSize: 11,
  monthSize: 23,
  timeLabelSize: 11,
  timeSize: 14,
  metaColor: "#F8F5EE",
  dayColor: "#FF5A0A",
  openingColor: "#FF5A0A",
  monthColor: "#F8F5EE",
  timeLabelColor: "#FF5A0A",
  timeColor: "#F8F5EE",
  ruleColor: "#FF5A0A",
};

export function resolveCocoRushDateStyles(value: unknown): CocoRushDateStyles {
  const source = value && typeof value === "object" ? value as Partial<CocoRushDateStyles> : {};
  return {
    metaSize: Number.isFinite(Number(source.metaSize)) ? Number(source.metaSize) : COCO_RUSH_DATE_STYLES.metaSize,
    daySize: Number.isFinite(Number(source.daySize)) ? Number(source.daySize) : COCO_RUSH_DATE_STYLES.daySize,
    openingSize: Number.isFinite(Number(source.openingSize)) ? Number(source.openingSize) : COCO_RUSH_DATE_STYLES.openingSize,
    monthSize: Number.isFinite(Number(source.monthSize)) ? Number(source.monthSize) : COCO_RUSH_DATE_STYLES.monthSize,
    timeLabelSize: Number.isFinite(Number(source.timeLabelSize)) ? Number(source.timeLabelSize) : COCO_RUSH_DATE_STYLES.timeLabelSize,
    timeSize: Number.isFinite(Number(source.timeSize)) ? Number(source.timeSize) : COCO_RUSH_DATE_STYLES.timeSize,
    metaColor: String(source.metaColor || COCO_RUSH_DATE_STYLES.metaColor),
    dayColor: String(source.dayColor || COCO_RUSH_DATE_STYLES.dayColor),
    openingColor: String(source.openingColor || COCO_RUSH_DATE_STYLES.openingColor),
    monthColor: String(source.monthColor || COCO_RUSH_DATE_STYLES.monthColor),
    timeLabelColor: String(source.timeLabelColor || COCO_RUSH_DATE_STYLES.timeLabelColor),
    timeColor: String(source.timeColor || COCO_RUSH_DATE_STYLES.timeColor),
    ruleColor: String(source.ruleColor || COCO_RUSH_DATE_STYLES.ruleColor),
  };
}

export type CocoRushVenueStyles = {
  venueNameSize: number;
  addressSize: number;
  gap: number;
  venueNameColor: string;
  addressColor: string;
};

export const COCO_RUSH_VENUE_STYLES: CocoRushVenueStyles = {
  venueNameSize: 8,
  addressSize: 8,
  gap: 5.5,
  venueNameColor: "#F8F5EE",
  addressColor: "#FF5A0A",
};

export function resolveCocoRushVenueStyles(value: unknown): CocoRushVenueStyles {
  const source = value && typeof value === "object" ? value as Partial<CocoRushVenueStyles> : {};
  return {
    venueNameSize: Number.isFinite(Number(source.venueNameSize)) ? Number(source.venueNameSize) : COCO_RUSH_VENUE_STYLES.venueNameSize,
    addressSize: Number.isFinite(Number(source.addressSize)) ? Number(source.addressSize) : COCO_RUSH_VENUE_STYLES.addressSize,
    gap: Number.isFinite(Number(source.gap)) ? Number(source.gap) : COCO_RUSH_VENUE_STYLES.gap,
    venueNameColor: String(source.venueNameColor || COCO_RUSH_VENUE_STYLES.venueNameColor),
    addressColor: String(source.addressColor || COCO_RUSH_VENUE_STYLES.addressColor),
  };
}

export type RushNightZoneId =
  | "photo"
  | "photoGrade"
  | "texture"
  | "edgeShadow"
  | "triangle"
  | "presenter"
  | "date"
  | "headline"
  | "script"
  | "genres"
  | "lineup"
  | "entry"
  | "venue";

export type RushNightMasterRegionId =
  | "photo"
  | "photo-grade"
  | "texture"
  | "edge-shadow"
  | "neon-triangle"
  | "headline"
  | "presenter"
  | "date"
  | "script"
  | "genres"
  | "lineup"
  | "entry"
  | "venue";

export type RushNightSourceGeometry = {
  canvas: { width: 900; height: 1600; ratio: "9:16" };
  photo: VisualRecipeRect & {
    fit: "cover";
    positionX: 50;
    positionY: 100;
    scale: 0.84;
  };
  photoGrade: VisualRecipeRect;
  texture: VisualRecipeRect;
  edgeShadow: VisualRecipeRect;
  presenter: VisualRecipeRect;
  date: VisualRecipeRect;
  triangle: VisualRecipeRect;
  headline: VisualRecipeRect & {
    font: "Bad Grunge";
    fontSizePx: 455;
    trackingEm: -0.055;
    verticalScale: 1.27;
  };
  script: VisualRecipeRect & {
    font: "Open Script";
    fontSizePx: 135;
    rotationDeg: -5;
  };
  genres: VisualRecipeRect;
  lineup: VisualRecipeRect;
  entry: VisualRecipeRect;
  venue: VisualRecipeRect;
  zOrder: RushNightMasterRegionId[];
};

export type RushNightAssetGeometry = {
  photoGrade: VisualRecipeRect & { kind: "authored-photo-grade" };
  texture: VisualRecipeRect & {
    opacity: number;
    sourceUrl: "/textures/paint02.png";
  };
  edgeShadow: VisualRecipeRect & { kind: "inset-edge-shadow" };
  triangle: VisualRecipeRect & {
    coreStrokePx: number;
    glowStrokePx: number;
    highlightStrokePx: number;
    occlusion: "behind-extracted-subject";
    path: "M610 62 L92 825 L866 825 Z";
    viewBox: "0 0 900 900";
  };
  scriptUnderline: VisualRecipeRect & { rotation: number };
  genreFrame: VisualRecipeRect;
  entryFrame: VisualRecipeRect;
  pricePill: VisualRecipeRect;
  venueRule: VisualRecipeRect;
};

export type RushNightFormatRecipe = {
  canvas: { width: 540; height: 540 | 960 };
  zones: Record<RushNightZoneId, VisualRecipeRect>;
  imageFit: {
    mode: "cover";
    positionX: number;
    positionY: number;
    focalTarget: { x: number; y: number };
    scale: number;
    preserveUserScale: true;
  };
  variant: Record<string, string | number | boolean>;
  assets: RushNightAssetGeometry;
};

export type RushNightVisualRecipe = VisualRecipe & {
  source: {
    kind: "standalone-css-master";
    publicPath: "/generated-flyers/rush-night-reference-master.html";
    workspacePath: "public/generated-flyers/rush-night-reference-master.html";
    geometryScriptId: "rush-night-css-master-geometry";
    regionAttribute: "data-region";
    sha256: "c0832413d8e13f599fc4a24394d6b8925e69e94c7dc508d4ae590223029b12f9";
    geometry: RushNightSourceGeometry;
  };
  runtime: {
    directionId: "rush-night-css";
    compositionPattern: "rush-night-css";
    authority: {
      layout: {
        owner: "recipe-format-zones";
        source: "runtime.formats[format].zones";
        genericTemplateMayOverride: false;
      };
      palette: {
        owner: "recipe-palette";
        source: "runtime.palette";
        generatedPaletteMayOverride: false;
      };
      assets: {
        owner: "recipe-assets";
        source: "runtime.formats[format].assets";
        genericDecorationAllowed: false;
        generatedBackgroundAllowed: false;
      };
      crop: {
        owner: "recipe-image-fit";
        source: "runtime.formats[format].imageFit";
        genericCropMayOverride: false;
      };
      downstreamMustObey: readonly [
        "recipe-format-zones",
        "recipe-palette",
        "recipe-assets",
        "recipe-image-fit"
      ];
    };
    palette: {
      bgFrom: string;
      bgTo: string;
      primary: string;
      secondary: string;
      accent: string;
      neutral: string;
    };
    fonts: {
      headline: "BAD GRUNGE";
      script: "OpenScript";
      date: "Anton";
      utility: "LEMONMILK-Regular";
      utilityBold: "LEMONMILK-Bold";
    };
    assetPolicy: {
      allowOnlyRecipeAssets: true;
      autoAddGenericSocialIcons: false;
      autoAddPriceBadge: false;
      autoAddQr: false;
      autoAddTexture: false;
      autoGenerateBackground: false;
    };
    copyPolicy: {
      headlineLines: 1;
      scriptSource: "event-accent-or-night";
      dateSource: "event-date";
      descriptionUsage: "creative-direction-only";
      maximumGenres: 3;
      maximumLineupNames: 3;
    };
    formats: Record<RushNightFormat, RushNightFormatRecipe>;
  };
};

/** Exact contract embedded in rush-night-reference-master.html. */
export const RUSH_NIGHT_MASTER_GEOMETRY: RushNightSourceGeometry = deepFreeze({
  canvas: { width: 900, height: 1600, ratio: "9:16" },
  photo: {
    x: 8,
    y: 16,
    width: 84,
    height: 84,
    fit: "cover",
    positionX: 50,
    positionY: 100,
    scale: 0.84,
  },
  photoGrade: { x: 0, y: 0, width: 100, height: 100 },
  texture: { x: 0, y: 0, width: 100, height: 100 },
  edgeShadow: { x: 0, y: 0, width: 100, height: 100 },
  presenter: { x: 31, y: 6.8, width: 42, height: 4.4 },
  date: { x: 13, y: 15.7, width: 13.5, height: 15.6 },
  triangle: { x: 11, y: 9, width: 85, height: 52 },
  headline: {
    x: 19.5,
    y: 46,
    width: 62,
    height: 19,
    font: "Bad Grunge",
    fontSizePx: 455,
    trackingEm: -0.055,
    verticalScale: 1.27,
  },
  script: {
    x: 28,
    y: 61.2,
    width: 52,
    height: 8.8,
    font: "Open Script",
    fontSizePx: 135,
    rotationDeg: -5,
  },
  genres: { x: 20.5, y: 72.8, width: 59, height: 3.2 },
  lineup: { x: 18.5, y: 77.1, width: 63, height: 6.7 },
  entry: { x: 32.5, y: 84.5, width: 35, height: 4.4 },
  venue: { x: 22, y: 89.5, width: 56, height: 5.2 },
  zOrder: [
    "photo",
    "photo-grade",
    "texture",
    "edge-shadow",
    "neon-triangle",
    "headline",
    "presenter",
    "date",
    "script",
    "genres",
    "lineup",
    "entry",
    "venue",
  ],
});

const source = RUSH_NIGHT_MASTER_GEOMETRY;

const rectOf = (rect: VisualRecipeRect): VisualRecipeRect => ({
  x: rect.x,
  y: rect.y,
  width: rect.width,
  height: rect.height,
});

const adaptedZones = (
  format: RushNightFormat
): Record<RushNightZoneId, VisualRecipeRect> => {
  if (format === "story") {
    return {
      photo: rectOf(source.photo),
      photoGrade: rectOf(source.photoGrade),
      texture: rectOf(source.texture),
      edgeShadow: rectOf(source.edgeShadow),
      triangle: rectOf(source.triangle),
      presenter: rectOf(source.presenter),
      date: rectOf(source.date),
      headline: rectOf(source.headline),
      script: rectOf(source.script),
      genres: rectOf(source.genres),
      lineup: rectOf(source.lineup),
      entry: rectOf(source.entry),
      venue: rectOf(source.venue),
    };
  }

  // Authored Square adaptation: preserve the same reading order and overlap
  // relationships without vertically squeezing the 9:16 master.
  return {
    photo: { x: 17.5, y: 0, width: 75, height: 133.2 },
    photoGrade: rectOf(source.photoGrade),
    texture: rectOf(source.texture),
    edgeShadow: rectOf(source.edgeShadow),
    triangle: { x: 8, y: 4, width: 90, height: 66 },
    presenter: { x: 34, y: 3.5, width: 32, height: 5 },
    date: { x: 6, y: 16, width: 14, height: 21 },
    headline: { x: 8, y: 48, width: 80, height: 20 },
    script: { x: 27, y: 59, width: 55, height: 12 },
    genres: { x: 17, y: 71.6, width: 66, height: 4.2 },
    lineup: { x: 14, y: 76.3, width: 72, height: 8.4 },
    entry: { x: 31, y: 85.3, width: 38, height: 5.2 },
    venue: { x: 20, y: 91.3, width: 60, height: 5 },
  };
};

const buildAssets = (
  format: RushNightFormat,
  zones: Record<RushNightZoneId, VisualRecipeRect>
): RushNightAssetGeometry => {
  const story = format === "story";
  const underlineHeight = story ? 0.4375 : 0.74;
  const underlineWidth = zones.script.width * 0.92;
  const underlineX = zones.script.x + zones.script.width * 0.07;
  const underlineY =
    zones.script.y + zones.script.height * 0.81 - underlineHeight;
  const priceWidth = zones.entry.width * 0.254;

  return {
    photoGrade: { ...zones.photoGrade, kind: "authored-photo-grade" },
    texture: {
      ...zones.texture,
      opacity: 0.14,
      sourceUrl: "/textures/paint02.png",
    },
    edgeShadow: { ...zones.edgeShadow, kind: "inset-edge-shadow" },
    triangle: {
      ...zones.triangle,
      coreStrokePx: story ? 7.2 : 7,
      glowStrokePx: story ? 22.8 : 20,
      highlightStrokePx: story ? 1.5 : 1.5,
      occlusion: "behind-extracted-subject",
      path: "M610 62 L92 825 L866 825 Z",
      viewBox: "0 0 900 900",
    },
    scriptUnderline: {
      x: underlineX,
      y: underlineY,
      width: underlineWidth,
      height: underlineHeight,
      rotation: -4.3,
    },
    genreFrame: { ...zones.genres },
    entryFrame: { ...zones.entry },
    pricePill: {
      x: zones.entry.x + zones.entry.width - priceWidth,
      y: zones.entry.y,
      width: priceWidth,
      height: zones.entry.height * 0.64,
    },
    venueRule: story
      ? { x: 46.4444444444, y: zones.venue.y, width: 7.1111111111, height: 0.125 }
      : { x: 45, y: zones.venue.y, width: 10, height: 100 / 540 },
  };
};

const buildFormat = (format: RushNightFormat): RushNightFormatRecipe => {
  const story = format === "story";
  const zones = adaptedZones(format);
  // Story preserves the CSS master's type metrics. Square keeps the same
  // optical headline height, then expands it horizontally to recover the
  // master's wide, low title silhouette without crushing the lower spine.
  const headlineSize = story ? 273 : 130;
  const headlineAxisScale = story ? 1 : 2.65;
  const headlineVerticalScale = story ? 1.27 : 1.6;
  const headlineOpticalTranslateYPx = story ? 0 : 13.5;
  const scriptSize = story ? 81 : 74;

  return {
    canvas: { width: 540, height: story ? 960 : 540 },
    zones,
    imageFit: {
      mode: "cover",
      positionX: story ? 50 : 70,
      positionY: story ? 100 : 0,
      focalTarget: { x: story ? 50 : 65, y: story ? 38 : 34 },
      scale: story ? 0.84 : 0.75,
      preserveUserScale: true,
    },
    variant: {
      align: "center",
      bgBlur: 0,
      // The cover remains full bleed as atmosphere. The independently
      // extracted subject follows imageFit below, which creates the smaller
      // hero crop without exposing a rectangular photo edge.
      bgPosX: 50,
      bgPosY: 50,
      bgScale: 1,
      clarity: 0,
      contrast: 1.18,
      exp: 0.78,
      filmGrade: 0,
      gamma: 1,
      grade: 0,
      grain: 0,
      haze: 0,
      hue: 0,
      leak: 0,
      saturation: 0.78,
      textureOpacity: 0,
      tint: 0,
      vibrance: 0,
      vignette: false,
      vignetteStrength: 0,
      warmth: 0,

      headAlign: "center",
      headBold: false,
      headColor: "#FF5A0A",
      headGradient: false,
      headGlow: 0,
      headMaxPx: headlineSize,
      headRotate: 0,
      headShadow: true,
      headShadowStrength: 0.88,
      headSize: headlineSize,
      headSizeAuto: false,
      headTracking: -0.055,
      headUppercase: true,
      headX: zones.headline.x,
      headY: zones.headline.y,
      headlineFamily: "BAD GRUNGE",
      headlineHeight: zones.headline.height,
      headlineLineHeight: 0.72,
      headlineAxisScale,
      headlineVerticalScale,
      headlineOpticalTranslateYPx,
      headlineSize,
      lineHeight: 0.72,
      textColWidth: zones.headline.width,

      head2Align: "left",
      head2Color: "#F8F5EE",
      head2Enabled: true,
      head2Family: "OpenScript",
      head2LineHeight: 0.78,
      head2Rotate: -5,
      head2Shadow: true,
      head2ShadowStrength: 0.95,
      head2Size: scriptSize,
      head2SizePx: scriptSize,
      head2Tracking: -0.05,
      head2Uppercase: false,
      head2X: zones.script.x,
      head2Y: zones.script.y,
      head2ColWidth: zones.script.width,

      presenterAlign: "center",
      presenterColor: "#F8F5EE",
      presenterFamily: "LEMONMILK-Bold",
      presenterSize: story ? 15 : 13,
      presenterWidth: zones.presenter.width,
      presenterX: zones.presenter.x,
      presenterY: zones.presenter.y,

      dateAlign: "left",
      dateColor: "#FF5A0A",
      dateFamily: "Anton",
      dateLineHeight: 0.86,
      dateSize: story ? 62.4 : 48,
      dateX: zones.date.x,
      dateY: zones.date.y,

      genresAlign: "center",
      genresColor: "#F8F5EE",
      genresFamily: "LEMONMILK-Bold",
      genresSize: story ? 10.2 : 10,
      genresX: zones.genres.x,
      genresY: story ? 73.87 : 72.77,
      genresWidth: zones.genres.width,

      lineupAlign: "center",
      lineupColor: "#F8F5EE",
      lineupFamily: "BAD GRUNGE",
      lineupLabelColor: "#FF5A0A",
      lineupSize: story ? 31.2 : 25.5,
      lineupX: zones.lineup.x,
      lineupY: story ? 77.1 : 76.3,
      lineupWidth: zones.lineup.width,

      entryAlign: "center",
      entryColor: "#F8F5EE",
      entryFamily: "LEMONMILK-Bold",
      entrySize: story ? 12.6 : 11.4,
      entryX: zones.entry.x,
      entryY: story ? 85.2 : 85.82,
      entryWidth: zones.entry.width,
      priceColor: "#F8F5EE",
      priceEnabled: true,
      priceFamily: "LEMONMILK-Bold",
      priceRingEnabled: false,
      priceRingAlpha: 0.72,
      priceScale: 0.75,

      venueAlign: "center",
      venueColor: "#F8F5EE",
      venueFamily: "LEMONMILK-Bold",
      venueLineHeight: 1.28,
      venueSize: story ? 8.4 : 8,
      venueX: zones.venue.x,
      venueY: story ? 90.55 : 92.3,
      qrEnabled: false,
    },
    assets: buildAssets(format, zones),
  };
};

const squareFormat = buildFormat("square");
const storyFormat = buildFormat("story");

export const RUSH_NIGHT_RECIPE: RushNightVisualRecipe = deepFreeze({
  id: "rush-night-css",
  name: "Rush Night CSS",
  version: 12,
  reference: "rush-night-reference-master.html",
  referenceMode: "measurement-only",
  summary:
    "A dark full-bleed nightlife portrait framed by one orange neon triangle, an oversized distressed title and crossing script, followed by disciplined genre, lineup, entry and venue bands.",
  source: {
    kind: "standalone-css-master",
    publicPath: "/generated-flyers/rush-night-reference-master.html",
    workspacePath: "public/generated-flyers/rush-night-reference-master.html",
    geometryScriptId: "rush-night-css-master-geometry",
    regionAttribute: "data-region",
    sha256: "c0832413d8e13f599fc4a24394d6b8925e69e94c7dc508d4ae590223029b12f9",
    geometry: RUSH_NIGHT_MASTER_GEOMETRY,
  },
  measurementReference: {
    mode: "measurement-only",
    sourceTemplateId: "rush-night-reference-master-css",
    allowedUses: [
      "embedded percentage region geometry",
      "full-bleed cover crop and focal position",
      "neon-triangle path, subject relationship and stroke hierarchy",
      "type size, tracking, line-height, rotation and reading order",
      "photo grade, distress, frame and rule geometry",
    ],
    deniedUses: [
      "flattened finished artwork",
      "generated replacement background",
      "generic template geometry",
      "generic palette or decorative effects",
      "literal reference portrait when the user supplies another photo",
    ],
    measurements: {
      sourceCanvasWidth: 900,
      sourceCanvasHeight: 1600,
      sourceCanvasRatio: "9:16",
      sourcePhotoRect: source.photo,
      sourcePhotoGradeRect: source.photoGrade,
      sourceTextureRect: source.texture,
      sourceEdgeShadowRect: source.edgeShadow,
      sourcePresenterRect: source.presenter,
      sourceDateRect: source.date,
      sourceTriangleRect: source.triangle,
      sourceHeadlineRect: source.headline,
      sourceScriptRect: source.script,
      sourceGenresRect: source.genres,
      sourceLineupRect: source.lineup,
      sourceEntryRect: source.entry,
      sourceVenueRect: source.venue,
      sourcePhotoPosition: { x: 50, y: 50, scale: 1 },
      squareCanvasWidth: squareFormat.canvas.width,
      squareCanvasHeight: squareFormat.canvas.height,
      storyCanvasWidth: storyFormat.canvas.width,
      storyCanvasHeight: storyFormat.canvas.height,
      recipeVersion: 9,
    },
  },
  targetAssets: {
    subjectUrl: "/create-with-coco/backgrounds/background05.jpg",
    notes: [
      "Background05 is Coco's replaceable 9:16 mid-shot demo photo; its extracted hero supplies real torso space while the backdrop stays code-native.",
      "The photo grade, texture, edge shadow, neon triangle, script underline, genre frame, entry frame, price block and venue rule remain nine ordinary editable recipe assets.",
      "BAD GRUNGE supplies the editable headline erosion natively; Coco does not add a flattened headline texture.",
      "No generic decoration, social icon, QR code, palette cast or flattened HTML render is added.",
    ],
  },
  composition: {
    referenceMode: "measurement-only",
    referenceTemplateId: "rush-night-reference-master-css",
    referenceUses: [
      "embedded percentage geometry",
      "explicit z order",
      "CSS type metrics and intentional title overlap",
      "photo treatment and code-native SVG geometry",
    ],
    deniedReferenceUses: [
      "flattened canvas",
      "generated or stock replacement background",
      "generic template composition",
      "generic decoration or headline preset",
    ],
    canvas: {
      format: "story",
      safeArea: { x: 5.5, y: 3, width: 89, height: 94 },
    },
    roles: [
      { id: "photo", kind: "subject", purpose: "Replaceable extracted user nightlife hero over the recipe-owned ambient field.", required: true, editable: true, bounds: storyFormat.zones.photo, layer: "subject" },
      { id: "photoGrade", kind: "background", purpose: "Authored orange bloom and directional contrast over the user photo.", required: true, editable: true, bounds: storyFormat.zones.photoGrade, layer: "foreground" },
      { id: "texture", kind: "texture", purpose: "Restrained monochrome paint texture from the verified CSS master.", editable: true, bounds: storyFormat.zones.texture, layer: "foreground" },
      { id: "edgeShadow", kind: "background", purpose: "Inset edge shadow controlling the full-bleed portrait.", editable: true, bounds: storyFormat.zones.edgeShadow, layer: "foreground" },
      { id: "triangle", kind: "texture", purpose: "Complete three-stroke orange neon triangle behind the extracted user subject.", required: true, editable: true, bounds: storyFormat.zones.triangle, layer: "behindSubject" },
      { id: "presenter", kind: "utility", purpose: "Centered promoter and presents authority.", editable: true, bounds: storyFormat.zones.presenter, layer: "utility" },
      { id: "date", kind: "badge", purpose: "Left date rail with weekday, dominant day, month, rule and opening time.", required: true, editable: true, bounds: storyFormat.zones.date, layer: "foreground" },
      { id: "headline", kind: "headline", purpose: "Single-line distressed orange event identity across the lower portrait.", required: true, editable: true, bounds: storyFormat.zones.headline, layer: "foreground" },
      { id: "script", kind: "headline", purpose: "White gestural accent crossing the orange headline.", required: true, editable: true, bounds: storyFormat.zones.script, layer: "foreground" },
      { id: "scriptUnderline", kind: "texture", purpose: "Authored white underline attached to the script accent.", editable: true, bounds: storyFormat.assets.scriptUnderline, layer: "foreground" },
      { id: "genres", kind: "copy", purpose: "One framed strip containing at most three music genres.", required: true, editable: true, bounds: storyFormat.zones.genres, layer: "utility" },
      { id: "lineup", kind: "copy", purpose: "Centered MUSIC BY label and three-name DJ lineup.", required: true, editable: true, bounds: storyFormat.zones.lineup, layer: "utility" },
	      { id: "entryPrimary", kind: "badge", purpose: "Primary admission timing inside the framed entry row.", required: true, editable: true, bounds: { x: storyFormat.zones.entry.x, y: storyFormat.zones.entry.y, width: storyFormat.assets.pricePill.x - storyFormat.zones.entry.x, height: storyFormat.zones.entry.height * 0.64 }, layer: "utility" },
	      { id: "entryPrice", kind: "badge", purpose: "Native editable price text over the independent orange price block.", required: true, editable: true, bounds: storyFormat.assets.pricePill, layer: "utility" },
	      { id: "entrySecondary", kind: "copy", purpose: "Independent after-deadline admission condition below the framed row.", required: true, editable: true, bounds: { x: storyFormat.zones.entry.x, y: storyFormat.zones.entry.y + storyFormat.zones.entry.height * 0.64, width: storyFormat.zones.entry.width, height: storyFormat.zones.entry.height * 0.36 }, layer: "utility" },
      { id: "venue", kind: "footer", purpose: "Centered address and city/room signoff below a short orange rule.", required: true, editable: true, bounds: storyFormat.zones.venue, layer: "utility" },
    ],
    layoutRules: [
    "Apply the replaceable user photo with the recipe-owned format crop before placing recipe assets.",
      "Use the embedded Story regions or the authored Square regions as final layout authority.",
      "Keep the complete orange triangle behind Coco's extracted subject layer so it cannot cross protected face features.",
      "Keep the distressed headline on one line and attach the white script across its lower-right field.",
      "Keep presenter and date restrained so neither competes with the title/portrait system.",
	      "Genres, lineup, primary entry, price, secondary entry and venue form one centered descending information spine.",
      "Square and Story share the same palette, type vocabulary, asset set and reading order.",
      "Do not run generic layout, palette, crop, background or effect passes after materialization.",
    ],
    overlapRules: [
      { objects: ["triangle", "subject"], allowed: true, maxCoveragePercent: 44, response: "Place the complete triangle behind the extracted subject so the subject naturally occludes the neon tube." },
      { objects: ["headline", "subject"], allowed: true, maxCoveragePercent: 30, response: "Allow the lower portrait/title integration while protecting eyes, nose and mouth." },
      { objects: ["script", "headline"], allowed: true, maxCoveragePercent: 36, response: "Keep the script attached as the single intentional title overlap." },
      { objects: ["date", "face"], allowed: false, response: "Hold the date inside its left rail; adjust the crop rather than moving the rail over the face." },
      { objects: ["genres", "lineup"], allowed: false, response: "Preserve the measured air gap between the framed genres and DJ billing." },
	      { objects: ["entrySecondary", "venue"], allowed: false, response: "Keep admission and venue as separate final reading steps." },
    ],
    generationSteps: [
      "Extract the user hero using the recipe-owned crop and focal target; keep the ambient background code-native.",
      "Add only the authored photo treatment, texture, edge shadow and neon triangle assets.",
	      "Place native presenter, date, headline, script, genres, lineup, primary entry, price, secondary entry and venue text in their format-owned zones.",
      "Use native BAD GRUNGE headline wear, then attach the script underline, genre frame, entry frame, price block and venue rule to their owning text regions.",
      "Bypass generic template, palette, crop, generated-background and headline-effect systems.",
      "Verify the independently authored Square and Story adaptations before export.",
    ],
  },
  layerStack: [
    "Replaceable extracted user hero over a code-native dark ambient field.",
    "Editable photo grade, paint texture and inset edge shadow.",
    "Complete three-stroke orange neon triangle behind the extracted subject.",
    "Native editable BAD GRUNGE orange headline.",
    "Presenter, date rail and crossing white script/underline.",
    "Framed genres, DJ lineup, entry block and venue signoff.",
  ],
  textZones: [
    { id: "presenter", purpose: "Promoter authority.", placement: "Compact centered stack above the portrait." },
    { id: "date", purpose: "Calendar and opening time.", placement: "Narrow left rail beside the upper portrait." },
    { id: "headline", purpose: "Primary event identity.", placement: "One oversized line spanning the lower portrait." },
    { id: "script", purpose: "Campaign accent.", placement: "White brush line crossing the headline's lower-right field." },
    { id: "genres", purpose: "Music policy.", placement: "Single framed strip immediately below the title lockup." },
    { id: "lineup", purpose: "DJ billing.", placement: "Centered label and three-name row below the genre strip." },
	    { id: "entryPrimary", purpose: "Primary admission condition.", placement: "Left side of the framed entry row." },
	    { id: "entryPrice", purpose: "Entry price.", placement: "Native price text centered over the independent orange price block." },
	    { id: "entrySecondary", purpose: "After-deadline admission condition.", placement: "Independent centered line below the framed row." },
    { id: "venue", purpose: "Location signoff.", placement: "Final centered address/city lockup at the bottom." },
  ],
  typography: [
    "Use BAD GRUNGE for the one-line RUSH identity at -0.055em tracking and 0.72 line-height.",
    "Use OpenScript at -5 degrees for the single crossing accent and keep its underline attached.",
    "Use Anton for the dominant date rail and BAD GRUNGE for the DJ names.",
    "Use Lemon Milk for presenter, genres, labels, prices and venue facts.",
    "The headline distress comes from the editable BAD GRUNGE face, not a generic glitch, bevel, neon, 3D preset or flattened texture.",
  ],
  colorGrade: [
    "Preserve the uploaded hero and apply the CSS master's .78 brightness, 1.18 contrast and .78 saturation.",
    "Near-black #030303 owns the background and lower fade.",
    "Signal orange #FF5A0A owns the triangle, headline, date emphasis and price cell.",
    "Paper #F8F5EE owns script and factual copy; warm core #FFF2B2 is restricted to the neon-tube highlight.",
  ],
  avoid: [
    "Running a generic template or automatic composition after this recipe is materialized.",
    "Generating or substituting a background raster behind the extracted user hero.",
    "Adding generic palette casts, sparkles, grain, flares, social icons, QR codes or unrelated badges.",
    "Breaking the headline into multiple lines or detaching the script from it.",
    "Replacing the framed information spine with cards scattered around the subject.",
    "Flattening the CSS master, text or editable SVG assets into one image.",
  ],
  appNotes: [
    "The standalone 900 by 1600 CSS master and its embedded JSON are the Story measurement authority.",
    "Square is an explicit authored adaptation, not a cropped Story render.",
    "Every field and non-photo treatment remains independently editable in Fine Tune.",
  ],
  runtime: {
    directionId: "rush-night-css",
    compositionPattern: "rush-night-css",
    authority: {
      layout: {
        owner: "recipe-format-zones",
        source: "runtime.formats[format].zones",
        genericTemplateMayOverride: false,
      },
      palette: {
        owner: "recipe-palette",
        source: "runtime.palette",
        generatedPaletteMayOverride: false,
      },
      assets: {
        owner: "recipe-assets",
        source: "runtime.formats[format].assets",
        genericDecorationAllowed: false,
        generatedBackgroundAllowed: false,
      },
      crop: {
        owner: "recipe-image-fit",
        source: "runtime.formats[format].imageFit",
        genericCropMayOverride: false,
      },
      downstreamMustObey: [
        "recipe-format-zones",
        "recipe-palette",
        "recipe-assets",
        "recipe-image-fit",
      ],
    },
    palette: {
      bgFrom: "#030303",
      bgTo: "#110D0A",
      primary: "#FF5A0A",
      secondary: "#F8F5EE",
      accent: "#FF8A10",
      neutral: "#FFF2B2",
    },
    fonts: {
      headline: "BAD GRUNGE",
      script: "OpenScript",
      date: "Anton",
      utility: "LEMONMILK-Regular",
      utilityBold: "LEMONMILK-Bold",
    },
    assetPolicy: {
      allowOnlyRecipeAssets: true,
      autoAddGenericSocialIcons: false,
      autoAddPriceBadge: false,
      autoAddQr: false,
      autoAddTexture: false,
      autoGenerateBackground: false,
    },
    copyPolicy: {
      headlineLines: 1,
      scriptSource: "event-accent-or-night",
      dateSource: "event-date",
      descriptionUsage: "creative-direction-only",
      maximumGenres: 3,
      maximumLineupNames: 3,
    },
    formats: {
      square: squareFormat,
      story: storyFormat,
    },
  },
});

export function getRushNightFormatRecipe(
  format: RushNightFormat
): RushNightFormatRecipe {
  return RUSH_NIGHT_RECIPE.runtime.formats[format];
}
