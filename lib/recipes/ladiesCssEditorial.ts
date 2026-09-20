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

export type LadiesCssEditorialFormat = "square" | "story";

export type LadiesCssEditorialZoneId =
  | "photo"
  | "photoControl"
  | "footerContrast"
  | "presenter"
  | "policies"
  | "headline"
  | "headlineSwash"
  | "date"
  | "script"
  | "footerRule"
  | "venue"
  | "legal"
  | "age"
  | "time"
  | "signoff";

export type LadiesCssMasterRegionId =
  | "photo"
  | "photo-contrast"
  | "footer-contrast"
  | "headline"
  | "headline-swash"
  | "presenter"
  | "policies"
  | "date"
  | "script"
  | "footer-rule"
  | "venue"
  | "legal"
  | "age"
  | "time"
  | "signoff";

export type LadiesCssEditorialSourceGeometry = {
  canvas: { width: 900; height: 1200; ratio: "3:4" };
  photo: VisualRecipeRect & {
    fit: "cover";
    positionX: 50;
    positionY: 0;
  };
  photoContrast: VisualRecipeRect & { kind: "two-axis-photo-control" };
  presenter: VisualRecipeRect;
  policies: VisualRecipeRect;
  headline: VisualRecipeRect & {
    font: "Avigea";
    fontSizePx: 210;
    trackingEm: -0.058;
  };
  headlineSwash: VisualRecipeRect & { rotationDeg: -1.8 };
  date: VisualRecipeRect & { accent: "#ff302a" };
  script: VisualRecipeRect & {
    font: "Open Script";
    fontSizePx: 142;
    rotationDeg: -2.1;
  };
  footerContrast: VisualRecipeRect & { kind: "transparent-to-solid-fade" };
  footerRule: Omit<VisualRecipeRect, "height"> & { heightPx: 1 };
  venue: VisualRecipeRect;
  legal: VisualRecipeRect;
  age: VisualRecipeRect;
  time: VisualRecipeRect;
  signoff: VisualRecipeRect & { bottom: 2.3 };
  zOrder: LadiesCssMasterRegionId[];
};

export type LadiesCssEditorialAssetGeometry = {
  photoControl: VisualRecipeRect;
  footerFade: VisualRecipeRect;
  swash: VisualRecipeRect & { rotation: number };
  dateRing: VisualRecipeRect;
  scriptUnderline: VisualRecipeRect & { rotation: number };
  footerRule: { x: number; y: number; width: number; heightPx: 1 };
  agePill: VisualRecipeRect;
};

export type LadiesCssEditorialFormatRecipe = {
  canvas: { width: 540; height: 540 | 960 };
  zones: Record<LadiesCssEditorialZoneId, VisualRecipeRect>;
  imageFit: {
    mode: "cover";
    positionX: 50;
    positionY: 0;
    focalTarget: { x: number; y: number };
    scale: number;
    preserveUserScale: true;
  };
  variant: Record<string, unknown>;
  assets: LadiesCssEditorialAssetGeometry;
};

export type LadiesCssEditorialVisualRecipe = VisualRecipe & {
  source: {
    kind: "standalone-css-master";
    publicPath: "/generated-flyers/ladies-reference-master.html";
    workspacePath: "public/generated-flyers/ladies-reference-master.html";
    geometryScriptId: "ladies-css-master-geometry";
    regionAttribute: "data-region";
    sha256: "01c77358fb32b7fa0089ea643010d1ce9d2a8af9ee24c7474596ba18ada4d2ef";
    geometry: LadiesCssEditorialSourceGeometry;
  };
  runtime: {
    directionId: "ladies-css-editorial";
    compositionPattern: "ladies-css-editorial";
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
        source: "buildCocoLadiesCssEditorialAssets";
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
      headline: "Avigea";
      script: "OpenScript";
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
      scriptSource: "weekday-or-accent";
      dateSource: "event-date";
      descriptionUsage: "creative-direction-only";
      maximumPolicyLines: 2;
    };
    formats: Record<LadiesCssEditorialFormat, LadiesCssEditorialFormatRecipe>;
  };
};

/**
 * Exact JSON contract embedded in ladies-reference-master.html. This object is
 * intentionally separate from the adapted runtime formats so the CSS master
 * remains auditable and can never be silently rewritten by Coco defaults.
 */
export const LADIES_CSS_MASTER_GEOMETRY: LadiesCssEditorialSourceGeometry = deepFreeze({
  canvas: { width: 900, height: 1200, ratio: "3:4" },
  photo: {
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    fit: "cover",
    positionX: 50,
    positionY: 0,
  },
  photoContrast: {
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    kind: "two-axis-photo-control",
  },
  presenter: { x: 5.7, y: 2.2, width: 24, height: 2.5 },
  policies: { x: 55.5, y: 2.1, width: 38.5, height: 3.3 },
  headline: {
    x: 8,
    y: 8.2,
    width: 84,
    height: 16.8,
    font: "Avigea",
    fontSizePx: 210,
    trackingEm: -0.058,
  },
  headlineSwash: {
    x: 22,
    y: 22.3,
    width: 53,
    height: 8.5,
    rotationDeg: -1.8,
  },
  date: {
    x: 5.6,
    y: 34.5,
    width: 20.5,
    height: 15.4,
    accent: "#ff302a",
  },
  script: {
    x: 15.5,
    y: 73,
    width: 72,
    height: 12.5,
    font: "Open Script",
    fontSizePx: 142,
    rotationDeg: -2.1,
  },
  footerContrast: {
    x: 0,
    y: 74,
    width: 100,
    height: 26,
    kind: "transparent-to-solid-fade",
  },
  footerRule: { x: 7.6, y: 85.8, width: 84.8, heightPx: 1 },
  venue: { x: 8, y: 87.8, width: 38, height: 8.6 },
  legal: { x: 52.8, y: 89.1, width: 27, height: 7.1 },
  age: { x: 81, y: 86.5, width: 5.8, height: 3.4 },
  time: { x: 83.1, y: 91.3, width: 10.5, height: 5.6 },
  signoff: { x: 8, y: 96.7, width: 84, height: 1, bottom: 2.3 },
  zOrder: [
    "photo",
    "photo-contrast",
    "footer-contrast",
    "headline",
    "headline-swash",
    "presenter",
    "policies",
    "date",
    "script",
    "footer-rule",
    "venue",
    "legal",
    "age",
    "time",
    "signoff",
  ],
});

const source = LADIES_CSS_MASTER_GEOMETRY;

const rectOf = (rect: VisualRecipeRect): VisualRecipeRect => ({
  x: rect.x,
  y: rect.y,
  width: rect.width,
  height: rect.height,
});

const adaptedZones = (format: LadiesCssEditorialFormat): Record<LadiesCssEditorialZoneId, VisualRecipeRect> => {
  if (format === "story") {
    return {
      photo: rectOf(source.photo),
      photoControl: rectOf(source.photoContrast),
      presenter: { x: 5.7, y: 1.65, width: 24, height: 1.875 },
      policies: { x: 55.5, y: 1.575, width: 38.5, height: 2.475 },
      headline: { x: 8, y: 6.15, width: 84, height: 12.6 },
      headlineSwash: { x: 22, y: 16.725, width: 53, height: 6.375 },
      date: { x: 5.6, y: 25.875, width: 20.5, height: 11.55 },
      script: { x: 15.5, y: 79.75, width: 72, height: 9.375 },
      footerContrast: { x: 0, y: 80.5, width: 100, height: 19.5 },
      footerRule: { x: 7.6, y: 89.35, width: 84.8, height: 100 / 960 },
      venue: { x: 8, y: 90.85, width: 38, height: 6.45 },
      legal: { x: 52.8, y: 91.825, width: 27, height: 5.325 },
      age: { x: 81, y: 89.875, width: 5.8, height: 2.55 },
      time: { x: 83.1, y: 93.475, width: 10.5, height: 4.2 },
      signoff: { x: 8, y: 97.525, width: 84, height: 0.75 },
    };
  }

  return {
    photo: rectOf(source.photo),
    photoControl: rectOf(source.photoContrast),
    presenter: { x: 5.7, y: 3, width: 24, height: 3.3 },
    policies: { x: 55.5, y: 2.8, width: 38.5, height: 4.4 },
    headline: { x: 8, y: 7, width: 84, height: 22.4 },
    headlineSwash: { x: 22, y: 25, width: 53, height: 11.3 },
    date: { x: 5.6, y: 37, width: 20.5, height: 20.5 },
    script: { x: 15.5, y: 59.5, width: 72, height: 16.7 },
    footerContrast: { x: 0, y: 65.3, width: 100, height: 34.7 },
    footerRule: { x: 7.6, y: 81.1, width: 84.8, height: 100 / 540 },
    venue: { x: 8, y: 83.7, width: 38, height: 11.5 },
    legal: { x: 52.8, y: 85.5, width: 27, height: 9.5 },
    age: { x: 81, y: 82, width: 5.8, height: 4.5 },
    time: { x: 83.1, y: 88.4, width: 10.5, height: 7.5 },
    signoff: { x: 8, y: 95.6, width: 84, height: 1.3333333333333333 },
  };
};

const buildFormat = (format: LadiesCssEditorialFormat): LadiesCssEditorialFormatRecipe => {
  const story = format === "story";
  const zones = adaptedZones(format);
  const canvas = { width: 540 as const, height: story ? 960 as const : 540 as const };
  return {
    canvas,
    zones,
    imageFit: {
      mode: "cover",
      positionX: 50,
      positionY: 0,
      focalTarget: { x: 50, y: story ? 27 : 23 },
      scale: story ? 1 : 1.08,
      preserveUserScale: true,
    },
    variant: {
      align: "center",
      bgBlur: 0,
      bgPosX: 50,
      bgPosY: 0,
      bgScale: story ? 1 : 1.08,
      clarity: 0,
      contrast: 1.045,
      exp: 0.91,
      filmGrade: 0,
      grade: 0,
      grain: 0,
      haze: 0,
      headAlign: "center",
      headAlpha: 1,
      headBold: false,
      headColor: "#FBF8EF",
      headGradient: false,
      headGlow: 0,
      headMaxPx: 126,
      headRotate: 0,
      headShadow: true,
      headShadowStrength: 0.16,
      headSize: 126,
      headSizeAuto: false,
      headTracking: -0.058,
      headUppercase: true,
      headX: zones.headline.x,
      headY: zones.headline.y,
      headlineFamily: "Avigea",
      headlineHeight: zones.headline.height,
      headlineLineHeight: 0.78,
      headlineSize: 126,
      leak: 0,
      saturation: 0.96,
      textColWidth: zones.headline.width,
      vibrance: 0,
      vignette: false,
      head2Align: "left",
      head2Alpha: 1,
      head2Color: "#FBF8EF",
      head2Enabled: true,
      head2Family: "OpenScript",
      head2LineHeight: 0.78,
      head2Rotate: -2.1,
      head2Shadow: true,
      head2ShadowStrength: 0.46,
      head2Size: 85.2,
      head2SizePx: 85.2,
      head2Tracking: -0.035,
      head2Uppercase: false,
      head2X: zones.script.x,
      head2Y: zones.script.y,
      head2ColWidth: zones.script.width,
      presenterAlign: "left",
      presenterBold: true,
      presenterColor: "#F8F6F0",
      presenterFamily: "LEMONMILK-Bold",
      presenterSize: 6,
      presenterWidth: zones.presenter.width,
      presenterX: zones.presenter.x,
      presenterY: zones.presenter.y,
      details2Align: "left",
      details2Color: "#F8F6F0",
      details2Enabled: true,
      details2Family: "LEMONMILK-Regular",
      details2LineHeight: 1.28,
      details2Size: 5.16,
      details2X: zones.policies.x,
      details2Y: zones.policies.y,
      dateAlign: "center",
      dateColor: "#FF302A",
      dateFamily: "LEMONMILK-Bold",
      dateLineHeight: 0.82,
      dateSize: 27,
      dateX: zones.date.x,
      dateY: zones.date.y,
      venueAlign: "left",
      venueBold: true,
      venueColor: "#F8F6F0",
      venueFamily: "LEMONMILK-Bold",
      venueLineHeight: 0.88,
      venueSize: 22.8,
      venueX: zones.venue.x,
      venueY: zones.venue.y,
	  cocoRushVenueStyles: {
	    venueNameSize: 22.8,
	    addressSize: 6,
	    gap: 4,
	    venueNameColor: "#F8F6F0",
	    addressColor: "#F8F6F0",
	  },
      rightRailAlign: "left",
      rightRailColor: "#F8F6F0",
      rightRailFamily: "LEMONMILK-Regular",
      rightRailLineHeight: 1.42,
      rightRailSize: story ? 6 : 5,
      rightRailX: zones.legal.x,
      rightRailY: zones.legal.y,
      subtagAlign: "right",
      subtagBgColor: "rgba(0,0,0,0)",
      subtagColor: "#F8F6F0",
      subtagFamily: "LEMONMILK-Bold",
      subtagSize: 18,
      subtagX: zones.time.x,
      subtagY: zones.time.y,
      complianceAlign: "center",
      complianceColor: "#FFFFFF",
      complianceEnabled: true,
      complianceFamily: "LEMONMILK-Bold",
      complianceSize: 5.4,
      complianceX: zones.age.x,
      complianceY: zones.age.y,
      priceEnabled: false,
      qrEnabled: false,
    },
    assets: {
      photoControl: { ...zones.photoControl },
      footerFade: { ...zones.footerContrast },
      swash: { ...zones.headlineSwash, rotation: source.headlineSwash.rotationDeg },
      dateRing: { ...zones.date },
      scriptUnderline: story
        ? { x: 50.78, y: 87.15625, width: 30.96, height: 0.1875, rotation: -5.1 }
        : { x: 50.78, y: 72.693, width: 30.96, height: 0.3333333333333333, rotation: -5.1 },
      footerRule: {
        x: zones.footerRule.x,
        y: zones.footerRule.y,
        width: zones.footerRule.width,
        heightPx: source.footerRule.heightPx,
      },
      agePill: { ...zones.age },
    },
  };
};

const squareFormat = buildFormat("square");
const storyFormat = buildFormat("story");

/**
 * Operational Coco recipe translated directly from the verified standalone
 * CSS flyer. The HTML is provenance, not a flattened generation template.
 */
export const LADIES_CSS_EDITORIAL_RECIPE: LadiesCssEditorialVisualRecipe = deepFreeze({
  id: "ladies-css-editorial",
  name: "Ladies CSS Editorial",
  version: 4,
  reference: "ladies-reference-master.html",
  referenceMode: "measurement-only",
  summary:
    "A full-bleed fashion portrait with a single oversized editorial serif title, one gestural script line, a circular date seal, restrained top utility copy, and an integrated dark communications floor.",
  source: {
    kind: "standalone-css-master",
    publicPath: "/generated-flyers/ladies-reference-master.html",
    workspacePath: "public/generated-flyers/ladies-reference-master.html",
    geometryScriptId: "ladies-css-master-geometry",
    regionAttribute: "data-region",
    sha256: "01c77358fb32b7fa0089ea643010d1ce9d2a8af9ee24c7474596ba18ada4d2ef",
    geometry: LADIES_CSS_MASTER_GEOMETRY,
  },
  measurementReference: {
    mode: "measurement-only",
    sourceTemplateId: "ladies-reference-master-css",
    allowedUses: [
      "percentage region geometry from the embedded CSS measurement contract",
      "photo cover crop and top-center object position",
      "type hierarchy, tracking, line-height and rotation",
      "contrast-control, swash, date-ring and footer-shape geometry",
      "layer order and reading order",
    ],
    deniedUses: [
      "flattened finished artwork",
      "generated replacement background",
      "generic template geometry",
      "generic decorative assets",
      "literal uploaded portrait when the user supplies another photo",
    ],
    measurements: {
      sourceCanvasWidth: 900,
      sourceCanvasHeight: 1200,
      sourceCanvasRatio: "3:4",
      sourcePhotoRect: source.photo,
      sourcePhotoContrastRect: source.photoContrast,
      sourcePresenterRect: source.presenter,
      sourcePoliciesRect: source.policies,
      sourceHeadlineRect: source.headline,
      sourceHeadlineSwashRect: source.headlineSwash,
      sourceDateRect: source.date,
      sourceScriptRect: source.script,
      sourceFooterContrastRect: source.footerContrast,
      sourceFooterRuleX: source.footerRule.x,
      sourceFooterRuleY: source.footerRule.y,
      sourceFooterRuleWidth: source.footerRule.width,
      sourceFooterRuleHeightPx: source.footerRule.heightPx,
      sourceVenueRect: source.venue,
      sourceLegalRect: source.legal,
      sourceAgeRect: source.age,
      sourceTimeRect: source.time,
      sourceSignoffRect: source.signoff,
      sourcePhotoPosition: { x: 50, y: 0, scale: 1 },
      squareCanvasWidth: squareFormat.canvas.width,
      squareCanvasHeight: squareFormat.canvas.height,
      storyCanvasWidth: storyFormat.canvas.width,
      storyCanvasHeight: storyFormat.canvas.height,
      recipeVersion: 4,
    },
  },
  targetAssets: {
    subjectUrl: "/create-with-coco/subjects/subject02.jpg",
    notes: [
      "The source portrait is a replaceable user-photo placeholder, not a generated background.",
      "Photo control, footer fade, swash, date ring, script underline, footer rule and age pill are ordinary unlocked Coco SVG objects.",
      "No generic decoration or flattened CSS render is loaded onto the Coco canvas.",
    ],
  },
  composition: {
    referenceMode: "measurement-only",
    referenceTemplateId: "ladies-reference-master-css",
    referenceUses: [
      "embedded percentage geometry",
      "explicit z order",
      "CSS type metrics",
      "photo and footer contrast treatment",
    ],
    deniedReferenceUses: [
      "flattened canvas",
      "generated background",
      "generic template composition",
      "generic decoration",
    ],
    canvas: {
      format: "story",
      safeArea: { x: 5.6, y: 2.1, width: 88.4, height: 95.7 },
    },
    roles: [
      { id: "photo", kind: "subject", purpose: "Replaceable full-bleed user fashion photo.", required: true, editable: true, bounds: storyFormat.zones.photo, layer: "subject" },
      { id: "photoControl", kind: "background", purpose: "Top and side contrast control over the user photo.", required: true, editable: true, bounds: storyFormat.zones.photoControl, layer: "foreground" },
      { id: "footerContrast", kind: "background", purpose: "Transparent-to-solid dark communications floor.", required: true, editable: true, bounds: storyFormat.zones.footerContrast, layer: "foreground" },
      { id: "headline", kind: "headline", purpose: "Single-line oversized event identity.", required: true, editable: true, bounds: storyFormat.zones.headline, layer: "foreground" },
      { id: "headlineSwash", kind: "texture", purpose: "White editorial gesture attached to the headline.", editable: true, bounds: storyFormat.zones.headlineSwash, layer: "foreground" },
      { id: "presenter", kind: "utility", purpose: "Compact upper-left venue or promoter authority.", editable: true, bounds: storyFormat.zones.presenter, layer: "utility" },
      { id: "policies", kind: "copy", purpose: "At most two compact music and hype policy lines.", editable: true, bounds: storyFormat.zones.policies, layer: "utility" },
      { id: "date", kind: "badge", purpose: "Circular event-date seal in the left narrative lane.", required: true, editable: true, bounds: storyFormat.zones.date, layer: "foreground" },
      { id: "script", kind: "headline", purpose: "Gestural weekday or event accent across the lower portrait.", required: true, editable: true, bounds: storyFormat.zones.script, layer: "foreground" },
      { id: "scriptUnderline", kind: "texture", purpose: "Authored hairline attached to the script accent.", editable: true, bounds: storyFormat.assets.scriptUnderline, layer: "foreground" },
      { id: "footerRule", kind: "footer", purpose: "Hairline separating image storytelling from footer facts.", editable: true, bounds: storyFormat.zones.footerRule, layer: "utility" },
      { id: "venue", kind: "footer", purpose: "Primary venue and address lockup.", required: true, editable: true, bounds: storyFormat.zones.venue, layer: "utility" },
      { id: "legal", kind: "footer", purpose: "Low-priority legal or reservation text.", editable: true, bounds: storyFormat.zones.legal, layer: "utility" },
      { id: "age", kind: "badge", purpose: "Small age restriction pill.", editable: true, bounds: storyFormat.zones.age, layer: "utility" },
      { id: "time", kind: "utility", purpose: "Stacked event start time.", required: true, editable: true, bounds: storyFormat.zones.time, layer: "utility" },
      { id: "signoff", kind: "footer", purpose: "Tracked lowest-priority signoff line.", editable: true, bounds: storyFormat.zones.signoff, layer: "utility" },
    ],
    layoutRules: [
      "Apply the user photo as a full-bleed cover crop positioned top-center before placing any type.",
      "Use the CSS percentage regions as layout authority; do not run the generic template placer afterward.",
      "Keep the headline on one line and let it own eighty-four percent of the canvas width.",
      "Attach the white swash to the headline rather than treating it as generic decoration.",
      "Keep the circular date seal in the left narrative lane and keep it off the protected face.",
      "Place the script across the lower portrait immediately before the footer transition.",
      "Allow only two compact utility lines at the top so the headline remains dominant.",
      "Venue, legal, age, time and signoff must remain inside the integrated dark footer system.",
      "Square and Story use explicit CSS-derived region adaptations with the same palette, asset set and reading order.",
    ],
    overlapRules: [
      { objects: ["headline", "face"], allowed: false, response: "Preserve the CSS top-title relationship by adjusting the photo crop, not the title region." },
      { objects: ["script", "face"], allowed: false, response: "Keep the script below protected eyes, nose and mouth." },
      { objects: ["date", "face"], allowed: false, response: "Keep the date seal in the left narrative lane." },
      { objects: ["headline", "headlineSwash"], allowed: true, maxCoveragePercent: 18, response: "The swash may touch the headline only as the authored identity gesture." },
      { objects: ["footer", "photo"], allowed: true, maxCoveragePercent: 26, response: "Use the editable fade to integrate facts with the user photo." },
    ],
    generationSteps: [
      "Load the user photo with the recipe-owned cover crop and top-center object position.",
      "Add only the seven unlocked recipe SVG assets in their measured regions.",
      "Place the Avigea headline, OpenScript accent and Lemon Milk utility copy in the CSS-owned zones.",
      "Map the supplied date, weekday, venue, policies, age and time into their semantic fields.",
      "Bypass generic template geometry, palette, decoration and crop authorities.",
      "Verify Square and Story against the same CSS-region contract before export.",
    ],
  },
  layerStack: [
    "Replaceable full-bleed user photo.",
    "Editable full-canvas photo contrast control.",
    "Editable footer fade.",
    "Oversized Avigea headline and attached white swash.",
    "Presenter, policies and circular date seal.",
    "OpenScript weekday accent and its editable underline.",
    "Footer rule, venue, legal, age, time and signoff.",
  ],
  textZones: [
    { id: "top-utility", purpose: "Presenter and policy authority.", placement: "Two restrained lanes at the top edge." },
    { id: "headline", purpose: "Primary event identity.", placement: "One oversized line spanning eighty-four percent of the upper canvas." },
    { id: "date", purpose: "Calendar fact.", placement: "Circular seal in the left narrative lane." },
    { id: "script", purpose: "Weekday or campaign accent.", placement: "Gestural line across the lower portrait." },
    { id: "footer", purpose: "Venue, legal, age, time and signoff.", placement: "One integrated dark communications floor." },
  ],
  typography: [
    "Use Avigea at the source's -0.058em tracking and 0.78 line-height for the one-line headline.",
    "Use OpenScript at -2.1 degrees for the single lower gestural accent.",
    "Use Lemon Milk for all utility and footer facts.",
    "Use no bevel, chrome, gradient headline, neon glow or generic text card.",
  ],
  colorGrade: [
    "Preserve the user photo and apply only the CSS source's mild brightness, contrast and saturation controls.",
    "Warm paper #FBF8EF owns headline, script and primary footer copy.",
    "Signal red #FF302A is restricted to the date seal and age pill.",
    "Near-black #05070B is restricted to contrast controls and the footer floor.",
  ],
  avoid: [
    "Running a generic layout after this recipe is materialized.",
    "Replacing the user photo with a generated or stock background.",
    "Adding palms, flowers, flares, social icons, QR codes, price badges or texture.",
    "Breaking the headline into multiple lines.",
    "Moving the script over protected facial features.",
    "Flattening the CSS master or SVG assets into one image.",
  ],
  appNotes: [
    "The CSS master is the measurement authority and remains independently renderable at its native 900 by 1200 canvas.",
    "Every non-photo visual treatment is either native text or one of seven ordinary unlocked Coco SVG assets.",
    "Fine Tune may edit individual objects after materialization; Coco defaults may not rematerialize over those edits.",
  ],
  runtime: {
    directionId: "ladies-css-editorial",
    compositionPattern: "ladies-css-editorial",
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
        source: "buildCocoLadiesCssEditorialAssets",
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
      bgFrom: "#05070B",
      bgTo: "#120C0A",
      primary: "#FF302A",
      secondary: "#FBF8EF",
      accent: "#FF473D",
      neutral: "#F8F6F0",
    },
    fonts: {
      headline: "Avigea",
      script: "OpenScript",
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
      scriptSource: "weekday-or-accent",
      dateSource: "event-date",
      descriptionUsage: "creative-direction-only",
      maximumPolicyLines: 2,
    },
    formats: {
      square: squareFormat,
      story: storyFormat,
    },
  },
});

export function getLadiesCssEditorialFormatRecipe(
  format: LadiesCssEditorialFormat
): LadiesCssEditorialFormatRecipe {
  return LADIES_CSS_EDITORIAL_RECIPE.runtime.formats[format];
}
