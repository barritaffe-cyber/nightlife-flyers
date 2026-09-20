import type { VisualRecipe, VisualRecipeElement, VisualRecipeRect } from "./types.ts";

function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const key of Reflect.ownKeys(value)) deepFreeze((value as Record<PropertyKey, unknown>)[key]);
  return Object.freeze(value);
}

export type PuntaCanaSundaysFormat = "square" | "story";
export type PuntaCanaSundaysFormatRecipe = Readonly<{
  canvas: Readonly<{ width: number; height: number }>;
  imageFit: Readonly<{ focalTarget: Readonly<{ x: number; y: number }>; scale: number; preserveUserScale: boolean }>;
  elements: Readonly<Record<string, VisualRecipeElement>>;
  zones: Readonly<Record<string, VisualRecipeRect>>;
}>;

const squareZones = {
  background: { x: 0, y: 0, width: 100, height: 100 },
  subjectGlow: { x: 14, y: 19, width: 72, height: 70 },
  foliageFrame: { x: -2, y: -2, width: 104, height: 104 },
  foliageForeground: { x: -2, y: -2, width: 104, height: 104 },
  headline: { x: 21.5, y: 2, width: 67.5, height: 11.5 },
  headline2: { x: 22.2, y: 9.3, width: 64, height: 11.9 },
  details: { x: 52.5, y: 16.9, width: 37.5, height: 8.5 },
  presenter: { x: 6.4, y: 18.5, width: 14, height: 3.1 },
  date: { x: 6.4, y: 22.9, width: 14, height: 7.2 },
  barcode: { x: 6.4, y: 31.7, width: 7.1, height: 12.5 },
  hostedBy: { x: 5.3, y: 62.6, width: 34.3, height: 1.2 },
  social: { x: 11.2, y: 62.2, width: 34.3, height: 1.2 },
  subject: { x: 8, y: 24, width: 84, height: 66 },
  djLineup: { x: 20, y: 76.3, width: 62, height: 4.9 },
  dotGridLeft: { x: 21, y: 82.5, width: 18, height: 5.7 },
  dotGridRight: { x: 61, y: 82.5, width: 18, height: 5.7 },
  venue: { x: 37, y: 82.8, width: 26, height: 4.9 },
  footerDetails: { x: 21, y: 89.8, width: 58, height: 3.6 },
  footerBand: { x: 0, y: 95.75, width: 100, height: 4.25 },
  footerAddress: { x: 0, y: 95.75, width: 100, height: 4.25 },
} as const;

const storyZones = {
  background: { x: 0, y: 0, width: 100, height: 100 },
  subjectGlow: { x: 12, y: 16, width: 76, height: 68 },
  foliageFrame: { x: -1, y: -1, width: 102, height: 102 },
  foliageForeground: { x: -1, y: -1, width: 102, height: 102 },
  headline: { x: 21.5, y: 1.8, width: 70, height: 6.9 },
  headline2: { x: 22.2, y: 7.7, width: 66, height: 7.1 },
  details: { x: 52.2, y: 12.5, width: 38, height: 5.2 },
  presenter: { x: 6, y: 18, width: 14, height: 1.8 },
  date: { x: 6, y: 22.1, width: 14, height: 4.1 },
  barcode: { x: 6, y: 30.4, width: 7.1, height: 11.7 },
  hostedBy: { x: 4.9, y: 59, width: 34.3, height: .7 },
  social: { x: 10.8, y: 58.6, width: 34.3, height: .7 },
  subject: { x: 6, y: 20, width: 88, height: 58 },
  djLineup: { x: 17, y: 76.7, width: 66, height: 2.7 },
  dotGridLeft: { x: 21, y: 82.5, width: 18, height: 4.3 },
  dotGridRight: { x: 61, y: 82.5, width: 18, height: 4.3 },
  venue: { x: 34, y: 83, width: 32, height: 2.7 },
  footerDetails: { x: 17, y: 90.2, width: 66, height: 2.1 },
  footerBand: { x: 0, y: 95.75, width: 100, height: 4.25 },
  footerAddress: { x: 0, y: 95.75, width: 100, height: 4.25 },
} as const;

const zById: Record<string, number> = {
  background: 0,
  subjectGlow: 12,
  foliageFrame: 14,
  foliageForeground: 36,
  headline: 18,
  headline2: 18,
  details: 24,
  presenter: 40,
  date: 40,
  barcode: 40,
  hostedBy: 40,
  social: 40,
  subject: 30,
  djLineup: 52,
  dotGridLeft: 45,
  dotGridRight: 45,
  venue: 55,
  footerDetails: 58,
  footerBand: 80,
  footerAddress: 81,
};

const textConfig: Record<string, {
  role: string;
  family: string;
  runtime: string;
  size: number;
  weight: number;
  lineHeight: number;
  tracking: number;
  align: "left" | "center" | "right";
  color: string;
  rotate?: number;
  scaleX?: number;
}> = {
  headline: { role: "headline", family: "Bodoni Moda", runtime: "Avigea", size: 172.8, weight: 800, lineHeight: .72, tracking: -.052, align: "left", color: "#FF4E17", scaleX: 1.3 },
  headline2: { role: "headline2", family: "Bodoni Moda", runtime: "Avigea", size: 178.2, weight: 800, lineHeight: .72, tracking: -.057, align: "left", color: "#EF1414", scaleX: 1.34 },
  details: { role: "details", family: "Yellowtail", runtime: "OpenScript", size: 110.16, weight: 400, lineHeight: .8, tracking: 0, align: "left", color: "#EAF418", rotate: -6, scaleX: 1.25 },
  presenter: { role: "presenter", family: "Montserrat", runtime: "LEMONMILK-Bold", size: 14.04, weight: 700, lineHeight: 1.25, tracking: .23, align: "left", color: "#F6F6F6" },
  date: { role: "date", family: "Montserrat", runtime: "LEMONMILK-Bold", size: 58.86, weight: 900, lineHeight: .72, tracking: -.037, align: "left", color: "#FFFFFF" },
  hostedBy: { role: "hostedBy", family: "Montserrat", runtime: "LEMONMILK-Bold", size: 11.664, weight: 700, lineHeight: 1, tracking: .64, align: "left", color: "#FFFFFF", rotate: -90 },
  social: { role: "social", family: "Montserrat", runtime: "LEMONMILK-Bold", size: 11.664, weight: 700, lineHeight: 1, tracking: .55, align: "left", color: "#EAF418", rotate: -90 },
  djLineup: { role: "djLineup", family: "Bodoni Moda", runtime: "Avigea", size: 52.38, weight: 700, lineHeight: 1, tracking: -.022, align: "center", color: "#FFFFFF" },
  venue: { role: "venue", family: "Montserrat", runtime: "LEMONMILK-Bold", size: 52.38, weight: 900, lineHeight: 1, tracking: -.055, align: "center", color: "#FFFFFF" },
  footerDetails: { role: "footerDetails", family: "Montserrat", runtime: "LEMONMILK-Bold", size: 15.336, weight: 800, lineHeight: 1.35, tracking: 0, align: "center", color: "#FFFFFF" },
  footerAddress: { role: "address", family: "Montserrat", runtime: "LEMONMILK-Bold", size: 11.016, weight: 700, lineHeight: 1, tracking: .64, align: "center", color: "#FFFFFF" },
};

function elementFor(id: string, rect: VisualRecipeRect): VisualRecipeElement {
  const text = textConfig[id];
  if (text) {
    return {
      id,
      type: "text",
      rect,
      semanticRole: text.role,
      editable: true,
      typography: {
        sourceFamily: text.family,
        runtimeFamily: text.runtime,
        fontSize: text.size,
        runtimeFontSize: text.size / 2,
        fontSizeUnit: "source-px",
        weight: text.weight,
        lineHeight: text.lineHeight,
        letterSpacing: text.tracking,
        letterSpacingUnit: "em",
        align: text.align,
        textTransform: id === "details" ? "none" : "uppercase",
        fit: { mode: "width", targetFill: 1 },
      },
      transform: { rotate: text.rotate || 0, scaleX: text.scaleX || 1, scaleY: 1, origin: "50% 50%" },
      paint: { fill: { type: "solid", color: text.color }, opacity: 1 },
      stacking: { zIndex: zById[id] },
    };
  }
  if (id.startsWith("foliage") || id === "subject") {
    return {
      id,
      type: "image",
      rect,
      semanticRole: id === "subject" ? "subject" : undefined,
      editable: true,
      paint: { fill: { type: "solid", color: "#FFFFFF" }, opacity: id === "foliageFrame" ? .94 : id === "foliageForeground" ? .92 : 1 },
      stacking: { zIndex: zById[id] },
      image: { fit: id === "subject" ? "cover" : "fill", position: id === "subject" ? "center top" : "center center" },
    };
  }
  const fill = id === "footerBand" ? "#FF1743" : id === "background" ? "#050402" : "#FFFFFF";
  return {
    id,
    type: "shape",
    rect,
    editable: true,
    paint: { fill: { type: "solid", color: fill }, opacity: id.startsWith("dotGrid") ? .9 : 1 },
    stacking: { zIndex: zById[id] },
  };
}

const makeElements = (zones: Readonly<Record<string, VisualRecipeRect>>) =>
  Object.fromEntries(Object.entries(zones).map(([id, rect]) => [id, elementFor(id, rect)])) as Record<string, VisualRecipeElement>;

const squareElements = makeElements(squareZones);
const storyElements = makeElements(storyZones);

export const PUNTA_CANA_SUNDAYS_RECIPE = deepFreeze({
  id: "punta-cana-sundays",
  name: "Punta Cana Sundays",
  version: 6,
  reference: "punta-cana-sundays-reference-master.html",
  referenceMode: "measurement-only",
  summary: "A tropical sunset portrait framed by ivory Punta, orange Cana, script Sundays, separate date and music notes, gold DJ names, and a restrained footer.",
  measurementReference: {
    mode: "measurement-only",
    sourceTemplateId: "punta-cana-sundays-reference-master",
    allowedUses: ["semantic element geometry", "computed typography", "transforms", "paint", "stacking", "image fit", "reading order"],
    deniedUses: ["flattened reference artwork", "CSS screenshot as final canvas", "generic layout", "generic palette", "generic crop", "generic decorations", "AI-generated background"],
    measurements: {
      sourcePath: "public/generated-flyers/punta-cana-sundays-reference-master.html",
      sourceSha256: "31b04bc5f2ea003d03668373a0765821f51ba4b3e98aae96ba5916cbb88c4680",
      suppliedSourceSha256: "33329d8c31feb372986b789205cda88696afc7ce5af789af039ab39d65112f54",
      suppliedCanvasWidth: 1080,
      suppliedCanvasHeight: 1350,
      suppliedAspectRatio: "4:5",
      squareCanvasWidth: 1080,
      squareCanvasHeight: 1080,
      storyCanvasWidth: 1080,
      storyCanvasHeight: 1920,
    },
  },
  targetAssets: {
    subjectUrl: "/generated-flyers/assets/punta-cana-subject-v2.png",
    notes: [
      "The central sunglasses portrait is a purpose-built transparent and replaceable subject.",
      "Square and Story use separate local tropical edge plates with a protected open center.",
      "The supplied source referenced seven unattached PNGs; every replacement is local and recorded by the compiler.",
    ],
  },
  composition: {
    referenceMode: "measurement-only",
    referenceTemplateId: "punta-cana-sundays-reference-master",
    referenceUses: ["elements", "geometry", "typography", "transforms", "paint", "stacking", "image fit"],
    deniedReferenceUses: ["flattened artwork", "literal starter portrait dependency"],
    canvas: { format: "story", safeArea: { x: 4, y: 2, width: 92, height: 96 } },
    roles: [
      { id: "headline", kind: "headline", purpose: "Punta title tier.", required: true, editable: true, bounds: storyZones.headline, layer: "behindSubject" },
      { id: "headline2", kind: "headline", purpose: "Cana title tier.", required: true, editable: true, bounds: storyZones.headline2, layer: "behindSubject" },
      { id: "details", kind: "headline", purpose: "Sundays script tier.", required: true, editable: true, bounds: storyZones.details, layer: "behindSubject" },
      { id: "subject", kind: "subject", purpose: "Replaceable central subject.", required: true, editable: true, bounds: storyZones.subject, layer: "subject" },
      { id: "presenter", kind: "utility", purpose: "Grodify Presents.", editable: true, bounds: storyZones.presenter, layer: "foreground" },
      { id: "date", kind: "utility", purpose: "Stacked event date.", editable: true, bounds: storyZones.date, layer: "foreground" },
      { id: "hostedBy", kind: "utility", purpose: "Independent vertical host detail.", editable: true, bounds: storyZones.hostedBy, layer: "foreground" },
      { id: "social", kind: "utility", purpose: "Independent vertical social handle.", editable: true, bounds: storyZones.social, layer: "foreground" },
      { id: "djLineup", kind: "copy", purpose: "DJ lineup.", editable: true, bounds: storyZones.djLineup, layer: "foreground" },
      { id: "venue", kind: "copy", purpose: "Venue brand.", editable: true, bounds: storyZones.venue, layer: "foreground" },
      { id: "footerDetails", kind: "footer", purpose: "Dress-code and package copy.", editable: true, bounds: storyZones.footerDetails, layer: "utility" },
      { id: "footerAddress", kind: "footer", purpose: "Bottom address bar copy.", editable: true, bounds: storyZones.footerAddress, layer: "utility" },
    ],
    layoutRules: ["Square and Story use separately authored geometry.", "Punta, Cana, and Sundays remain three independent editable objects.", "Every vertical rail item has an independent semantic binding.", "Footer copy is separate from its red background band."],
    overlapRules: [{ objects: ["headline", "headline2", "details", "subject"], allowed: true, maxCoveragePercent: 28, response: "Keep the face readable while preserving the layered tropical title lockup." }],
    generationSteps: ["Materialize local CSS assets.", "Fit the replaceable subject.", "Place the three independent title objects.", "Place independent rail and lower details.", "Validate Square and Story."],
  },
  layerStack: ["Tropical background, halo, and foliage.", "Three-part title.", "Replaceable central subject.", "Independent rail, lineup, venue, and dress code.", "Red footer band with editable address."],
  textZones: [
    { id: "headline", purpose: "Punta", placement: "Upper title tier" },
    { id: "headline2", purpose: "Cana", placement: "Second title tier" },
    { id: "details", purpose: "Sundays", placement: "Script across title" },
    { id: "presenter", purpose: "Presenter", placement: "Upper-left rail" },
    { id: "date", purpose: "Date", placement: "Left rail" },
    { id: "hostedBy", purpose: "Host", placement: "Vertical left rail" },
    { id: "social", purpose: "Social handle", placement: "Vertical left rail" },
    { id: "djLineup", purpose: "DJ lineup", placement: "Lower subject" },
    { id: "venue", purpose: "Venue", placement: "Lower center" },
    { id: "footerDetails", purpose: "Dress code", placement: "Above footer" },
    { id: "footerAddress", purpose: "Address", placement: "Bottom bar" },
  ],
  typography: ["Display serif for Punta and Cana.", "Independent handwritten script for Sundays.", "Geometric uppercase support copy.", "All differently styled title and rail objects remain independent."],
  colorGrade: ["Warm near-black tropical field.", "Orange-red display title.", "Acid-yellow script and rail accent.", "White support copy with a hot-red footer."],
  avoid: ["Combining Punta, Cana, and Sundays.", "Combining vertical rail items.", "Flattening the CSS master.", "Substituting generic layout, palette, crop, or decorations."],
  appNotes: ["The compiled document owns layout, palette, assets, crop, and background.", "The adapter maps hostedBy and social to separate existing Coco editor lanes."],
  runtime: {
    directionId: "punta-cana-sundays",
    compositionPattern: "tropical-center-subject-vertical-rail",
    styleId: "tropical-editorial",
    sourceCanvas: { width: 1080, height: 1350, aspectRatio: "4:5" },
    palette: { bgFrom: "#090704", bgTo: "#030201", primary: "#EF1414", secondary: "#FF4E17", accent: "#EAF418", neutral: "#FFFFFF" },
    fonts: { display: { source: "Bodoni Moda", runtime: "Avigea" }, script: { source: "Yellowtail", runtime: "OpenScript" }, support: { source: "Montserrat", runtime: "LEMONMILK-Bold" } },
    authority: {
      layout: { owner: "recipe-elements", source: "runtime.formats[format].elements", genericTemplateMayOverride: false },
      palette: { owner: "recipe-element-paint", source: "runtime.formats[format].elements[*].paint", generatedPaletteMayOverride: false },
      assets: { owner: "recipe-elements", source: "materialized Coco-native assets", genericDecorationAllowed: false, generatedBackgroundAllowed: false },
      crop: { owner: "recipe-element-image", source: "runtime.formats[format].elements.subject.image", genericCropMayOverride: false },
    },
    formats: {
      square: { canvas: { width: 1080, height: 1080 }, imageFit: { focalTarget: { x: 50, y: 58 }, scale: 1, preserveUserScale: true }, elements: squareElements, zones: Object.fromEntries(Object.entries(squareElements).map(([id, element]) => [id, element.rect])) },
      story: { canvas: { width: 1080, height: 1920 }, imageFit: { focalTarget: { x: 50, y: 55 }, scale: 1, preserveUserScale: true }, elements: storyElements, zones: Object.fromEntries(Object.entries(storyElements).map(([id, element]) => [id, element.rect])) },
    },
  },
} satisfies VisualRecipe & { runtime: Record<string, unknown> });

export function getPuntaCanaSundaysFormatRecipe(format: PuntaCanaSundaysFormat): PuntaCanaSundaysFormatRecipe {
  return PUNTA_CANA_SUNDAYS_RECIPE.runtime.formats[format] as PuntaCanaSundaysFormatRecipe;
}
