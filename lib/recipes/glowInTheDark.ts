import type { VisualRecipe, VisualRecipeElement, VisualRecipeRect } from "./types.ts";

function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const key of Reflect.ownKeys(value)) deepFreeze((value as Record<PropertyKey, unknown>)[key]);
  return Object.freeze(value);
}

export type GlowInTheDarkFormat = "square" | "story";
export type GlowInTheDarkFormatRecipe = Readonly<{
  canvas: Readonly<{ width: number; height: number }>;
  imageFit: Readonly<{ focalTarget: Readonly<{ x: number; y: number }>; scale: number; preserveUserScale: boolean }>;
  elements: Readonly<Record<string, VisualRecipeElement>>;
  zones: Readonly<Record<string, VisualRecipeRect>>;
}>;

const sharedAssets = {
  background: { x: 0, y: 0, width: 100, height: 100 },
  smokeFrame: { x: 0, y: 0, width: 100, height: 89 },
  subjectGlow: { x: 23.5, y: 31, width: 53, height: 50 },
  edgeLineLeft: { x: 3, y: 18, width: 0.2, height: 42 },
  edgeLineRight: { x: 96.8, y: 17, width: 0.2, height: 42 },
} as const;

const squareZones = {
  ...sharedAssets,
  presenter: { x: 9, y: 4, width: 82, height: 2.2 },
  headline: { x: 5, y: 8.5, width: 90, height: 11.5 },
  linkWord: { x: 67, y: 15.3, width: 22, height: 5 },
  darkTitle: { x: 5, y: 19.8, width: 90, height: 17.5 },
  subject: { x: 18, y: 29, width: 64, height: 60 },
  date: { x: 12, y: 49, width: 13, height: 10 },
  time: { x: 75, y: 49, width: 13, height: 10 },
  friday: { x: 25, y: 69.5, width: 50, height: 13 },
  lineup: { x: 10, y: 84, width: 80, height: 4.5 },
  footerBand: { x: 0, y: 89, width: 100, height: 11 },
  venue: { x: 5, y: 91, width: 39, height: 6 },
  footerDetails: { x: 49, y: 90.4, width: 43, height: 3 },
  footerAddress: { x: 49, y: 93.8, width: 43, height: 3 },
  footerContact: { x: 49, y: 96.3, width: 43, height: 3 },
  price: { x: 91, y: 91.2, width: 6, height: 3 },
} as const;

const storyZones = {
  ...sharedAssets,
  presenter: { x: 9, y: 3, width: 82, height: 1.5 },
  headline: { x: 5, y: 7, width: 90, height: 7 },
  linkWord: { x: 67, y: 12, width: 22, height: 3 },
  darkTitle: { x: 5, y: 15.5, width: 90, height: 10.5 },
  subject: { x: 14, y: 29.5, width: 72, height: 59.5 },
  date: { x: 10, y: 49, width: 13, height: 7 },
  time: { x: 77, y: 49, width: 13, height: 7 },
  friday: { x: 22, y: 73.5, width: 56, height: 7.5 },
  lineup: { x: 10, y: 83, width: 80, height: 2.5 },
  footerBand: { x: 0, y: 89, width: 100, height: 11 },
  venue: { x: 5, y: 91.4, width: 39, height: 4 },
  footerDetails: { x: 49, y: 90.5, width: 43, height: 1.7 },
  footerAddress: { x: 49, y: 93.8, width: 43, height: 1.7 },
  footerContact: { x: 49, y: 96.2, width: 43, height: 1.7 },
  price: { x: 91, y: 91.2, width: 6, height: 2 },
} as const;

type ElementStyle = Omit<VisualRecipeElement, "id" | "rect">;
type ElementFill = NonNullable<ElementStyle["paint"]>["fill"];
const solid = (color: string) => ({ type: "solid" as const, color });
const gradient = (angle: number, stops: Array<{ offset: number; color: string }>) => ({ type: "linear-gradient" as const, angle, stops });
const transform = (rotate = 0, scaleX = 1, scaleY = 1) => ({ rotate, scaleX, scaleY, origin: "50% 50%" });
const GLOW_WEEKDAY_GLYPH_COLORS = [
  "#00FF99",
  "#00D8C8",
  "#FF8C28",
  "#FF49A0",
  "#C630DA",
  "#B91CFF",
] as const;
const text = (
  semanticRole: string,
  sourceFamily: string,
  runtimeFamily: string,
  fontSize: number,
  runtimeFontSize: number,
  weight: number,
  lineHeight: number,
  letterSpacing: number,
  align: "left" | "center" | "right",
  fill: ElementFill,
  zIndex: number,
  rotate = 0,
  scaleX = 1,
): ElementStyle => ({
  type: "text",
  semanticRole,
  editable: true,
  typography: {
    sourceFamily,
    runtimeFamily,
    fontSize,
    runtimeFontSize,
    fontSizeUnit: "source-px",
    weight,
    lineHeight,
    letterSpacing,
    letterSpacingUnit: "em",
    align,
    textTransform: semanticRole === "connector" ? "none" : "uppercase",
    fit: { mode: "width", targetFill: 1 },
  },
  transform: transform(rotate, scaleX),
  paint: { fill, opacity: 1 },
  stacking: { zIndex },
});

export const GLOW_IN_THE_DARK_ELEMENT_STYLES: Readonly<Record<string, ElementStyle>> = deepFreeze({
  background: {
    type: "shape",
    editable: true,
    paint: { fill: { type: "radial-gradient", center: { x: 52, y: 44 }, shape: "ellipse", stops: [{ offset: 0, color: "#071B24" }, { offset: 45, color: "#020407" }, { offset: 100, color: "#010203" }] }, opacity: 1 },
    stacking: { zIndex: -12 },
  },
  smokeFrame: { type: "texture", editable: true, paint: { fill: solid("#FFFFFF"), opacity: 0.24, filter: "mix-blend-mode:screen" }, stacking: { zIndex: -9 }, image: { fit: "fill", position: "center center" } },
  subjectGlow: { type: "shape", editable: true, paint: { fill: { type: "radial-gradient", center: { x: 50, y: 50 }, shape: "ellipse", stops: [{ offset: 0, color: "#00FFAF2E" }, { offset: 40, color: "#00D2FF14" }, { offset: 72, color: "#00000000" }] }, opacity: 1, filter: "blur(40px)" }, stacking: { zIndex: 4, behind: ["subject"] } },
  edgeLineLeft: { type: "shape", editable: true, transform: transform(-5), paint: { fill: gradient(180, [{ offset: 0, color: "#00000000" }, { offset: 38, color: "#00FFC8" }, { offset: 68, color: "#00C8FF" }, { offset: 100, color: "#00000000" }]), opacity: 0.6, filter: "drop-shadow(0 0 6px #00EAFF)" }, stacking: { zIndex: 3 } },
  edgeLineRight: { type: "shape", editable: true, transform: transform(6), paint: { fill: gradient(180, [{ offset: 0, color: "#00000000" }, { offset: 38, color: "#00FFC8" }, { offset: 68, color: "#00C8FF" }, { offset: 100, color: "#00000000" }]), opacity: 0.6, filter: "drop-shadow(0 0 6px #00EAFF)" }, stacking: { zIndex: 3 } },
  presenter: { ...text("presenter", "Bebas Neue", "Bebas Neue", 23, 11.5, 500, 1, 0.78, "center", solid("#84CFE0"), 20), paint: { fill: solid("#84CFE0"), opacity: 1, shadow: { x: 0, y: 0, blur: 8, color: "#00D2FF73" } } },
  headline: { ...text("primary-headline", "Permanent Marker", "Good Brush", 205, 102.5, 900, 0.78, 0, "center", gradient(90, [{ offset: 0, color: "#2AB8A2" }, { offset: 38, color: "#00FF83" }, { offset: 67, color: "#56B4D9" }]), 5, -3, 1.25), paint: { fill: gradient(90, [{ offset: 0, color: "#2AB8A2" }, { offset: 38, color: "#00FF83" }, { offset: 67, color: "#56B4D9" }]), opacity: 1, shadow: { x: 0, y: 4, blur: 0, color: "#00000099" } }, stacking: { zIndex: 5, behind: ["subject"] } },
  linkWord: text("connector", "Paint the Town", "Paint the town", 78, 39, 400, 1, 0, "center", gradient(90, [{ offset: 0, color: "#F009FF" }, { offset: 50, color: "#FF4FA4" }, { offset: 100, color: "#B43BFF" }]), 5, -7),
  darkTitle: { ...text("primary-headline", "Permanent Marker", "Good Brush", 346, 173, 900, 0.78, -0.046, "center", gradient(95, [{ offset: 0, color: "#FF625C" }, { offset: 35, color: "#FF9A22" }, { offset: 58, color: "#FFBD20" }, { offset: 100, color: "#DC577D" }]), 5, -2, 1.45), paint: { fill: gradient(95, [{ offset: 0, color: "#FF625C" }, { offset: 35, color: "#FF9A22" }, { offset: 58, color: "#FFBD20" }, { offset: 100, color: "#DC577D" }]), opacity: 1, shadow: { x: 0, y: 8, blur: 0, color: "#00000033" } }, stacking: { zIndex: 5, behind: ["subject"] } },
  subject: { type: "image", semanticRole: "subject", editable: true, transform: transform(), paint: { fill: solid("#FFFFFF"), opacity: 1 }, stacking: { zIndex: 10, above: ["headline", "linkWord", "darkTitle"] }, image: { fit: "contain", position: "center bottom", filters: { saturate: 1.15, contrast: 1.05, dropShadow: { x: 0, y: 20, blur: 28, color: "#00000088" } } } },
  date: text("date", "Anton", "Anton", 97, 48.5, 800, 0.77, 0, "left", solid("#FF9D22"), 15),
  time: text("time", "Anton", "Anton", 97, 48.5, 800, 0.77, 0, "right", solid("#00FF9C"), 15),
  friday: { ...text("secondary-headline", "Permanent Marker", "Good Brush", 146, 73, 900, 0.9, 0, "center", solid("#00FF99"), 25, -4, 1.35), paint: { fill: solid("#00FF99"), glyphColors: [...GLOW_WEEKDAY_GLYPH_COLORS], opacity: 1, shadow: { x: 0, y: 4, blur: 2, color: "#00000099" } }, stacking: { zIndex: 25, above: ["subject"] } },
  lineup: { ...text("dj-lineup", "Bebas Neue", "Bebas Neue", 45, 22.5, 500, 1, 0.075, "center", solid("#FFFFFF"), 26), paint: { fill: solid("#FFFFFF"), opacity: 1, shadow: { x: 0, y: 2, blur: 5, color: "#000000CC" } } },
  footerBand: { type: "shape", semanticRole: "footer", editable: true, paint: { fill: gradient(105, [{ offset: 0, color: "#02D9D8" }, { offset: 43, color: "#00CBE7" }, { offset: 64, color: "#007EE9" }, { offset: 100, color: "#FF0099" }]), opacity: 1, shadow: { x: 0, y: -8, blur: 24, color: "#00000066" } }, stacking: { zIndex: 30 } },
  venue: { ...text("venue-name", "Anton", "Anton", 45, 22.5, 800, 1, -0.03, "center", solid("#FFFFFF"), 31), paint: { fill: solid("#FFFFFF"), opacity: 1, background: solid("#00506E1F"), border: { width: 3, style: "solid", color: "#FFFFFFBF", radius: 16 } } },
  footerDetails: text("footer-details", "Bebas Neue", "Bebas Neue", 23, 11.5, 600, 1.35, 0.075, "left", solid("#FFFFFFE6"), 31),
  footerAddress: text("venue-address", "Bebas Neue", "Bebas Neue", 23, 11.5, 600, 1.35, 0.075, "left", solid("#FFFFFFE6"), 31),
  footerContact: text("rsvp-contact", "Bebas Neue", "Bebas Neue", 23, 11.5, 600, 1.35, 0.075, "left", solid("#FFFFFFE6"), 31),
  price: text("price", "Anton", "Anton", 32, 16, 600, 1, 0, "right", solid("#FFFFFF"), 32),
});

function makeElements(zones: Readonly<Record<string, VisualRecipeRect>>) {
  return Object.fromEntries(Object.entries(zones).map(([id, rect]) => [id, { ...GLOW_IN_THE_DARK_ELEMENT_STYLES[id], id, rect }])) as Record<string, VisualRecipeElement>;
}

const squareElements = makeElements(squareZones);
const storyElements = makeElements(storyZones);

export const GLOW_IN_THE_DARK_RECIPE = deepFreeze({
  id: "glow-in-the-dark",
  name: "Glow in the Dark",
  version: 12,
  reference: "glow-in-the-dark-reference-master.html",
  referenceMode: "measurement-only",
  summary: "Club Woods Glow in the Dark: supplied nightlife backgrounds, editable chrome GLOW and neon-green brush DARK, with separate Square and Story layouts.",
  measurementReference: {
    mode: "measurement-only",
    sourceTemplateId: "glow-in-the-dark-reference-master",
    allowedUses: ["semantic element geometry", "computed typography", "transforms", "paint", "stacking", "image fit", "reading order"],
    deniedUses: ["flattened reference artwork", "CSS screenshot as final canvas", "generic layout", "generic palette", "generic crop", "generic decorations", "AI-generated background"],
    measurements: {
      sourcePath: "public/generated-flyers/glow-in-the-dark-reference-master.html",
      sourceSha256: "762588dc2998d526ddc436be53614f59739139df0797a77822a0275493ef89af",
      sourceCanvasWidth: 1080,
      sourceCanvasHeight: 1350,
      sourceAspectRatio: "4:5",
      squareCanvasWidth: 1080,
      squareCanvasHeight: 1080,
      storyCanvasWidth: 1080,
      storyCanvasHeight: 1920,
    },
  },
  targetAssets: {
    subjectUrl: "/scene-assets/sugar-rush/subject-cutout.png",
    notes: ["The starter portrait is replaceable.", "Smoke is a transparent editable texture.", "The footer is the CSS-authored solid neon gradient; no texture mask is permitted."],
  },
  composition: {
    referenceMode: "measurement-only",
    referenceTemplateId: "glow-in-the-dark-reference-master",
    referenceUses: ["elements", "geometry", "typography", "transforms", "paint", "stacking", "image fit"],
    deniedReferenceUses: ["flattened artwork", "literal portrait dependency"],
    canvas: { format: "story", safeArea: { x: 4, y: 2, width: 92, height: 96 } },
    roles: [
      { id: "background", kind: "background", purpose: "Blacklight field.", editable: true, layer: "background" },
      { id: "smokeFrame", kind: "texture", purpose: "Editable edge smoke.", editable: true, layer: "background" },
      { id: "presenter", kind: "utility", purpose: "Presenter eyebrow.", editable: true, layer: "foreground" },
      { id: "headline", kind: "headline", purpose: "GLOW title tier.", required: true, editable: true, layer: "behindSubject" },
      { id: "linkWord", kind: "copy", purpose: "in the connector.", editable: true, layer: "behindSubject" },
      { id: "darkTitle", kind: "headline", purpose: "DARK title tier.", required: true, editable: true, layer: "behindSubject" },
      { id: "subject", kind: "subject", purpose: "Replaceable centered hero.", required: true, editable: true, layer: "subject" },
      { id: "date", kind: "utility", purpose: "Left date anchor.", editable: true, layer: "foreground" },
      { id: "time", kind: "utility", purpose: "Right time anchor.", editable: true, layer: "foreground" },
      { id: "friday", kind: "headline", purpose: "Secondary weekday bridge.", editable: true, layer: "foreground" },
      { id: "lineup", kind: "copy", purpose: "DJ support line.", editable: true, layer: "foreground" },
      { id: "footerBand", kind: "footer", purpose: "Solid CSS gradient footer anchor.", required: true, editable: true, layer: "utility" },
      { id: "venue", kind: "badge", purpose: "Venue name.", editable: true, layer: "utility" },
      { id: "footerDetails", kind: "copy", purpose: "Footer logistics.", editable: true, layer: "utility" },
      { id: "footerAddress", kind: "copy", purpose: "Venue address.", editable: true, layer: "utility" },
      { id: "footerContact", kind: "copy", purpose: "RSVP contact.", editable: true, layer: "utility" },
      { id: "price", kind: "badge", purpose: "Ticket price.", editable: true, layer: "utility" },
    ],
    layoutRules: ["Square and Story use separately authored element rectangles.", "The complete title is below the subject in the stack.", "Date and time balance the subject.", "The footer occupies the bottom eleven percent."],
    overlapRules: [{ objects: ["headline", "darkTitle", "subject"], allowed: true, maxCoveragePercent: 22, response: "Keep the face and title readable while preserving the controlled collision." }],
    generationSteps: ["Materialize CSS elements.", "Fit the replaceable subject above the primary title.", "Place opposed metadata and lower title.", "Place support line and footer logistics.", "Validate both formats."],
  },
  layerStack: ["Background, glow, smoke, and edge lines.", "Complete primary title behind the subject.", "Replaceable subject.", "Date/time, Friday, and lineup.", "Solid neon footer and independent footer text."],
  textZones: [
    { id: "presenter", purpose: "Presenter", placement: "Top spaced rail" },
    { id: "headline", purpose: "GLOW", placement: "Upper title tier" },
    { id: "linkWord", purpose: "in the", placement: "Connector" },
    { id: "darkTitle", purpose: "DARK", placement: "Oversized warm tier" },
    { id: "date", purpose: "Date", placement: "Left of subject" },
    { id: "time", purpose: "Time", placement: "Right of subject" },
    { id: "friday", purpose: "Weekday", placement: "Across lower subject" },
    { id: "lineup", purpose: "DJ lineup", placement: "Above footer" },
    { id: "venue", purpose: "Venue", placement: "Footer badge" },
    { id: "footerAddress", purpose: "Address", placement: "Footer" },
    { id: "footerContact", purpose: "RSVP", placement: "Footer" },
    { id: "price", purpose: "Price", placement: "Footer" },
  ],
  typography: ["Source families and runtime mappings are explicit per element.", "Font size, weight, line height, tracking, alignment, transform, and fit are authoritative element properties."],
  colorGrade: ["Near-black base.", "Emerald/cyan glow.", "Warm orange-pink DARK tier.", "Solid cyan-to-magenta footer."],
  avoid: ["Flattening the reference.", "Treating zones as the complete recipe.", "Inventing paint masks or decorations absent from CSS.", "Letting generic systems overwrite element contracts."],
  appNotes: ["Composition pattern and Glow Party style are separate identifiers.", "runtime.formats[format].elements is authoritative; zones are derived compatibility data."],
  runtime: {
    directionId: "glow-in-the-dark",
    compositionPattern: "center-subject-headline-behind",
    styleId: "glow-party",
    sourceCanvas: { width: 1080, height: 1350, aspectRatio: "4:5" },
    palette: { bgFrom: "#010203", bgTo: "#071B24", primary: "#FF1B92", secondary: "#00DFF4", accent: "#00EF80", neutral: "#F8F5F0" },
    textEffects: { weekdayGlyphColors: [...GLOW_WEEKDAY_GLYPH_COLORS] },
    fonts: { headline: { source: "Permanent Marker", runtime: "Good Brush" }, script: { source: "Paint the Town", runtime: "Paint the town" }, support: { source: "Bebas Neue", runtime: "Bebas Neue" }, utility: { source: "Anton", runtime: "Anton" } },
    authority: {
      layout: { owner: "recipe-elements", source: "runtime.formats[format].elements", genericTemplateMayOverride: false },
      palette: { owner: "recipe-element-paint", source: "runtime.formats[format].elements[*].paint", generatedPaletteMayOverride: false },
      assets: { owner: "recipe-elements", source: "materialized Coco-native assets", genericDecorationAllowed: false, generatedBackgroundAllowed: false },
      crop: { owner: "recipe-element-image", source: "runtime.formats[format].elements.subject.image", genericCropMayOverride: false },
    },
    formats: {
      square: { canvas: { width: 1080, height: 1080 }, imageFit: { focalTarget: { x: 50, y: 59 }, scale: 1, preserveUserScale: true }, elements: squareElements, zones: Object.fromEntries(Object.entries(squareElements).map(([key, element]) => [key, element.rect])) },
      story: { canvas: { width: 1080, height: 1920 }, imageFit: { focalTarget: { x: 50, y: 59.25 }, scale: 1, preserveUserScale: true }, elements: storyElements, zones: Object.fromEntries(Object.entries(storyElements).map(([key, element]) => [key, element.rect])) },
    },
  },
} satisfies VisualRecipe & { runtime: Record<string, unknown> });

export function getGlowInTheDarkFormatRecipe(format: GlowInTheDarkFormat): GlowInTheDarkFormatRecipe {
  return GLOW_IN_THE_DARK_RECIPE.runtime.formats[format] as GlowInTheDarkFormatRecipe;
}
