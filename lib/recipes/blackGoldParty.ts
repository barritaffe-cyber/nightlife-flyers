import type { VisualRecipe, VisualRecipeElement, VisualRecipeRect } from "./types.ts";

function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const key of Reflect.ownKeys(value)) deepFreeze((value as Record<PropertyKey, unknown>)[key]);
  return Object.freeze(value);
}

export type BlackGoldPartyFormat = "square" | "story";

const storyZones = {
  background: { x: 0, y: 0, width: 100, height: 100 },
  ambience: { x: 0, y: 0, width: 100, height: 100 },
  constellations: { x: -3, y: -3, width: 106, height: 106 },
  edgeBarLeft: { x: -1.3, y: 40.8, width: 4.8, height: 18.5 },
  edgeBarRight: { x: 96.5, y: 31.5, width: 4.8, height: 18.5 },
  portraitFrame: { x: 30.65, y: 9.1, width: 38.7, height: 58.7 },
  smoke: { x: 22, y: 48, width: 57, height: 28 },
  subject: { x: 22.8, y: 16.4, width: 54.4, height: 49.8 },
  shards: { x: 40, y: 3.8, width: 47, height: 31 },
  presenter: { x: 22, y: 4.65, width: 56, height: 1.5 },
  headline: { x: 2.2, y: 37.2, width: 43, height: 8.1 },
  headline2: { x: 58.6, y: 38.2, width: 43, height: 8.1 },
  dateMedallion: { x: 73, y: 16.25, width: 18.2, height: 10.24 },
  date: { x: 72.7, y: 18.15, width: 18.8, height: 7.2 },
  subtag: { x: 30, y: 67.1, width: 40, height: 6.3 },
  venue: { x: 20, y: 82.2, width: 60, height: 2.2 },
  djLineup: { x: 20, y: 85.7, width: 60, height: 2.1 },
  time: { x: 25, y: 89, width: 16, height: 1.5 },
  details: { x: 42, y: 89, width: 36, height: 1.5 },
  price: { x: 79, y: 89, width: 10, height: 1.5 },
  brandRow: { x: 20, y: 93.15, width: 60, height: 4.3 },
  grain: { x: 0, y: 0, width: 100, height: 100 },
} as const satisfies Record<string, VisualRecipeRect>;

const squareZones = {
  ...storyZones,
  portraitFrame: { x: 31, y: 9, width: 38, height: 61 },
  subject: { x: 23, y: 15, width: 54, height: 54 },
  shards: { x: 42, y: 1, width: 44, height: 34 },
  presenter: { x: 22, y: 3.1, width: 56, height: 1.6 },
  headline: { x: .5, y: 37, width: 43, height: 8.1 },
  headline2: { x: 58, y: 38, width: 43, height: 8.1 },
  dateMedallion: { x: 76, y: 14, width: 18, height: 18 },
  date: { x: 75.7, y: 16.4, width: 18.6, height: 12.6 },
  subtag: { x: 30, y: 68.5, width: 40, height: 7.5 },
  venue: { x: 20, y: 80, width: 60, height: 2.6 },
  djLineup: { x: 20, y: 84, width: 60, height: 2.5 },
  time: { x: 23, y: 88.1, width: 17, height: 1.7 },
  details: { x: 41, y: 88.1, width: 38, height: 1.7 },
  price: { x: 80, y: 88.1, width: 11, height: 1.7 },
  brandRow: { x: 20, y: 92.2, width: 60, height: 5 },
} as const satisfies Record<string, VisualRecipeRect>;

const textStyles: Record<string, Omit<VisualRecipeElement, "id" | "rect">> = {
  presenter: textStyle("presenter", "GoldCondensed", "Bebas Neue", 15.34, 400, 1, .47, "center", "#F4DCA6", 40),
  headline: textStyle("headline", "GoldSansBold", "LEMONMILK-Bold", 103.68, 900, .82, -.055, "center", "#F7BB28", 33, -90),
  headline2: textStyle("headline2", "GoldSansBold", "LEMONMILK-Bold", 103.68, 900, .82, -.055, "center", "#F7BB28", 33, 90),
  date: textStyle("date", "GoldDisplay", "Anton", 47.52, 900, .78, -.02, "center", "#080808", 42, -5),
  subtag: textStyle("subtag", "GoldBrush", "Good Brush", 94.5, 900, .72, -.08, "center", "#F7BB28", 46, -6),
  venue: textStyle("venue", "GoldCondensed", "Bebas Neue", 23.76, 400, 1, 0, "center", "#E7B956", 43),
  djLineup: textStyle("djLineup", "GoldCondensed", "Bebas Neue", 22.14, 400, 1, 0, "center", "#E7B956", 43),
  time: textStyle("time", "GoldCondensed", "Bebas Neue", 15.44, 400, 1, 0, "right", "#E7B956", 43),
  details: textStyle("details", "GoldCondensed", "Bebas Neue", 15.44, 400, 1, 0, "center", "#E7B956", 43),
  price: textStyle("price", "GoldCondensed", "Bebas Neue", 15.44, 400, 1, 0, "left", "#E7B956", 43),
};

function textStyle(
  semanticRole: string,
  sourceFamily: string,
  runtimeFamily: string,
  fontSize: number,
  weight: number,
  lineHeight: number,
  letterSpacing: number,
  align: "left" | "center" | "right",
  color: string,
  zIndex: number,
  rotate = 0,
): Omit<VisualRecipeElement, "id" | "rect"> {
  return {
    type: "text",
    semanticRole,
    editable: true,
    typography: {
      sourceFamily,
      runtimeFamily,
      fontSize,
      runtimeFontSize: fontSize,
      fontSizeUnit: "source-px",
      weight,
      lineHeight,
      letterSpacing,
      letterSpacingUnit: "em",
      align,
      textTransform: "uppercase",
      fit: { mode: "width", targetFill: 1 },
    },
    transform: { rotate, scaleX: 1, scaleY: 1, origin: "50% 50%" },
    paint: {
      fill: { type: "solid", color },
      opacity: 1,
      shadow: { x: 1.4, y: 3.6, blur: 1.4, color: "rgba(24,10,0,.9)" },
    },
    stacking: { zIndex },
  };
}

function elementFor(id: string, rect: VisualRecipeRect): VisualRecipeElement {
  const text = textStyles[id];
  if (text) return { id, rect, ...text };
  if (id === "subject") {
    return {
      id, rect, type: "image", semanticRole: "subject", editable: true,
      transform: { rotate: 0, scaleX: 1, scaleY: 1, origin: "50% 50%" },
      paint: { fill: { type: "solid", color: "#FFFFFF" }, opacity: 1, filter: "contrast(1.08) saturate(1.08) drop-shadow(0 14px 18px rgba(0,0,0,.85))" },
      stacking: { zIndex: 18 }, image: { fit: "contain", position: "50% 100%" },
    };
  }
  if (id === "shards") {
    return {
      id, rect, type: "texture", editable: true,
      transform: { rotate: 0, scaleX: 1, scaleY: 1, origin: "50% 50%" },
      paint: { fill: { type: "solid", color: "#FFFFFF" }, opacity: .92, filter: "contrast(1.25) brightness(1.12)" },
      stacking: { zIndex: 25 }, image: { fit: "contain", position: "50% 50%" },
    };
  }
  const zIndex = id === "grain" ? 90 : id === "portraitFrame" ? 12 : id === "smoke" ? 9 : id === "background" ? -30 : -16;
  return {
    id, rect, type: "shape",
    editable: !["background", "ambience", "grain"].includes(id),
    paint: { fill: { type: "solid", color: id === "portraitFrame" ? "#D89300" : "#02080A" }, opacity: id === "grain" ? .1 : 1 },
    stacking: { zIndex },
  };
}

function elementsFor(zones: Readonly<Record<string, VisualRecipeRect>>) {
  return Object.fromEntries(Object.entries(zones).map(([id, rect]) => [id, elementFor(id, rect)])) as Record<string, VisualRecipeElement>;
}

const squareElements = elementsFor(squareZones);
const storyElements = elementsFor(storyZones);

export const BLACK_GOLD_PARTY_RECIPE = deepFreeze({
  id: "black-gold-party",
  name: "Black Gold Party",
  version: 1,
  reference: "black-gold-party-reference-master.html",
  referenceMode: "visual-inheritance",
  summary: "A premium black-and-metallic-gold portrait flyer with a framed central hero, vertical BLACK/GOLD title rails, shattered-glass motion, a splattered date medallion, gold brush lettering, and a disciplined event footer.",
  targetAssets: {
    subjectUrl: "/generated-flyers/assets/black-gold-party-subject-v1.png",
    notes: [
      "The black-painted gold-highlight portrait is an isolated transparent subject and may be replaced by the user.",
      "The transparent shattered-glass cluster is a separate editable texture asset.",
      "The gold frame, medallion, atmosphere, flares, line work, metallic type, and footer are authored CSS objects.",
    ],
  },
  composition: {
    referenceMode: "visual-inheritance",
    referenceTemplateId: "black-gold-party-reference-master",
    referenceUses: ["complete CSS composition", "subject placement", "metallic paint", "text hierarchy", "stacking", "format-specific geometry"],
    deniedReferenceUses: ["generic template substitution", "flattened text", "generated background replacement"],
    canvas: { format: "story", safeArea: { x: 3, y: 2, width: 94, height: 96 } },
    roles: [
      { id: "background", kind: "background", purpose: "Locked black-and-amber atmospheric base.", required: true, editable: false, bounds: storyZones.background, layer: "background" },
      { id: "subject", kind: "subject", purpose: "Black-and-gold central portrait.", required: true, editable: true, bounds: storyZones.subject, layer: "subject" },
      { id: "portraitFrame", kind: "utility", purpose: "Metallic portrait frame.", required: true, editable: true, bounds: storyZones.portraitFrame, layer: "behindSubject" },
      { id: "headline", kind: "headline", purpose: "Vertical BLACK title rail.", required: true, editable: true, bounds: storyZones.headline, layer: "foreground" },
      { id: "headline2", kind: "headline", purpose: "Vertical GOLD title rail.", required: true, editable: true, bounds: storyZones.headline2, layer: "foreground" },
      { id: "date", kind: "badge", purpose: "Gold medallion date.", editable: true, bounds: storyZones.date, layer: "foreground" },
      { id: "subtag", kind: "headline", purpose: "Gold brush PARTY gesture.", editable: true, bounds: storyZones.subtag, layer: "foreground" },
      { id: "venue", kind: "footer", purpose: "Venue name.", editable: true, bounds: storyZones.venue, layer: "utility" },
      { id: "djLineup", kind: "copy", purpose: "DJ lineup.", editable: true, bounds: storyZones.djLineup, layer: "utility" },
      { id: "details", kind: "copy", purpose: "Event perks.", editable: true, bounds: storyZones.details, layer: "utility" },
    ],
    layoutRules: [
      "Keep the portrait centered within the metallic frame.",
      "BLACK and GOLD remain independent vertical editable title objects flanking the subject.",
      "The date remains inside its upper-right gold medallion.",
      "PARTY crosses the frame base and leads into the centered footer hierarchy.",
      "Square and Story use independently authored CSS geometry.",
    ],
    overlapRules: [
      { objects: ["subject", "portraitFrame"], allowed: true, response: "The subject is intentionally nested within the frame." },
      { objects: ["shards", "subject"], allowed: true, maxCoveragePercent: 18, response: "Glass may cross the upper portrait but must not obscure the face." },
      { objects: ["subtag", "portraitFrame"], allowed: true, maxCoveragePercent: 25, response: "PARTY intentionally crosses the frame base." },
    ],
    generationSteps: ["Load the isolated subject and shard assets.", "Materialize CSS atmosphere and gold geometry.", "Apply format-specific vertical-title composition.", "Preserve independent footer fields."],
  },
  layerStack: ["Black atmospheric CSS background.", "Constellation lines and warm flares.", "Metallic frame and smoky portrait base.", "Isolated subject and glass shards.", "Vertical gold title rails, date badge, and brush PARTY.", "Event footer and brand row.", "Fine grain finish."],
  textZones: [
    { id: "presenter", purpose: "Presenter", placement: "Top center" },
    { id: "headline", purpose: "BLACK", placement: "Vertical left rail" },
    { id: "headline2", purpose: "GOLD", placement: "Vertical right rail" },
    { id: "date", purpose: "Date", placement: "Upper-right medallion" },
    { id: "subtag", purpose: "PARTY", placement: "Across the base of the portrait" },
    { id: "venue", purpose: "Venue", placement: "Lower center" },
    { id: "djLineup", purpose: "DJ lineup", placement: "Below venue" },
    { id: "details", purpose: "Event perks", placement: "Fine-print footer" },
  ],
  typography: ["Metallic gold vertical display title.", "Expressive gold brush PARTY word.", "Narrow, letter-spaced presenter and footer metadata.", "Extreme hierarchy with compact lower information."],
  colorGrade: ["Near-black blue-green shadows.", "Warm foil gold highlights.", "Controlled amber flares.", "Neutral silver shards."],
  avoid: ["Flattening the portrait and text together.", "Replacing the black-and-gold palette with unrelated colors.", "Moving BLACK or GOLD into ordinary horizontal headline positions.", "Covering the subject face with shards or copy."],
  appNotes: ["User subject replacement keeps the authored frame and surrounding design.", "All event copy is mapped to Coco-native editor fields.", "Compiled document owns layout, palette, crop, and decorative assets."],
  runtime: {
    directionId: "black-gold-party",
    compositionPattern: "framed-center-portrait-vertical-title",
    styleId: "black-gold-luxury",
    sourceCanvas: { width: 1080, height: 1920, aspectRatio: "9:16" },
    palette: { bgFrom: "#02080A", bgTo: "#120909", primary: "#F7BB28", secondary: "#FFF0A3", accent: "#D89300", neutral: "#F4DCA6" },
    fonts: {
      display: { source: "GoldSansBold", runtime: "LEMONMILK-Bold" },
      script: { source: "GoldBrush", runtime: "Good Brush" },
      support: { source: "GoldCondensed", runtime: "Bebas Neue" },
    },
    authority: {
      layout: { owner: "recipe-elements", source: "runtime.formats[format].elements", genericTemplateMayOverride: false },
      palette: { owner: "recipe-element-paint", source: "runtime.formats[format].elements[*].paint", generatedPaletteMayOverride: false },
      assets: { owner: "recipe-elements", source: "materialized Coco-native assets", genericDecorationAllowed: false, generatedBackgroundAllowed: false },
      crop: { owner: "recipe-subject-image", source: "runtime.formats[format].elements.subject.image", genericCropMayOverride: false },
    },
    formats: {
      square: { canvas: { width: 1080, height: 1080 }, imageFit: { focalTarget: { x: 50, y: 45 }, scale: 1, preserveUserScale: true }, elements: squareElements, zones: Object.fromEntries(Object.entries(squareElements).map(([id, element]) => [id, element.rect])) },
      story: { canvas: { width: 1080, height: 1920 }, imageFit: { focalTarget: { x: 50, y: 46 }, scale: 1, preserveUserScale: true }, elements: storyElements, zones: Object.fromEntries(Object.entries(storyElements).map(([id, element]) => [id, element.rect])) },
    },
  },
} satisfies VisualRecipe & { runtime: Record<string, unknown> });

export function getBlackGoldPartyFormatRecipe(format: BlackGoldPartyFormat) {
  return BLACK_GOLD_PARTY_RECIPE.runtime.formats[format];
}
