import type { VisualRecipe, VisualRecipeElement, VisualRecipeRect } from "./types.ts";

function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const key of Reflect.ownKeys(value)) deepFreeze((value as Record<PropertyKey, unknown>)[key]);
  return Object.freeze(value);
}

export type CityNightsFormat = "square" | "story";

const storyZones = {
  background: { x: 0, y: 0, width: 100, height: 100 },
  blackWash: { x: 0, y: 0, width: 100, height: 100 },
  presenter: { x: 23, y: 2.35, width: 54, height: 1.6 },
  dateFrame: { x: 4.05, y: 6.65, width: 13.25, height: 16.2 },
  date: { x: 4.05, y: 7.85, width: 13.25, height: 13.8 },
  calloutRule: { x: 96, y: 7.4, width: 0.46, height: 11.9 },
  details: { x: 76, y: 9.25, width: 18.8, height: 11.6 },
  headline: { x: 13.7, y: 23.7, width: 72.8, height: 18.5 },
  headline2: { x: 18, y: 34.3, width: 64, height: 11.6 },
  dotRail: { x: 4.25, y: 25.7, width: 2.1, height: 10.6 },
  doorsFrame: { x: 3.85, y: 61.4, width: 12.25, height: 10.2 },
  time: { x: 4.5, y: 62.55, width: 10.95, height: 8.4 },
  subtag: { x: 4.35, y: 74.25, width: 11.5, height: 4.4 },
  musicLabelFrame: { x: 67.8, y: 66.3, width: 16.6, height: 2.45 },
  rsvpLabel: { x: 67.8, y: 66.9, width: 16.6, height: 1.4 },
  djLineup: { x: 59.3, y: 69.2, width: 33.5, height: 5.7 },
  footerDetails: { x: 58.3, y: 75.25, width: 35.5, height: 1.5 },
  price: { x: 12, y: 82.55, width: 76, height: 1.8 },
  venue: { x: 19.5, y: 85.7, width: 61, height: 5.2 },
  address: { x: 14, y: 91.2, width: 72, height: 1.8 },
  ticketBand: { x: 17, y: 94.1, width: 66, height: 3.3 },
  social: { x: 25.2, y: 95.02, width: 24, height: 1.7 },
  rsvp: { x: 50, y: 95.02, width: 28, height: 1.7 },
  grain: { x: 0, y: 0, width: 100, height: 100 },
} as const satisfies Record<string, VisualRecipeRect>;

const squareZones = {
  ...storyZones,
  presenter: { x: 23, y: 3.1, width: 54, height: 2 },
  dateFrame: { x: 4.05, y: 8, width: 15, height: 27 },
  date: { x: 4.05, y: 10, width: 15, height: 22.5 },
  calloutRule: { x: 96, y: 9, width: 0.46, height: 20 },
  details: { x: 71.75, y: 12, width: 23, height: 18 },
  headline: { x: 14, y: 30, width: 72, height: 22 },
  headline2: { x: 18, y: 47, width: 64, height: 13 },
  dotRail: { x: 4.25, y: 38, width: 2.1, height: 16 },
  doorsFrame: { x: 3.85, y: 65, width: 14, height: 17 },
  time: { x: 4.5, y: 67, width: 12.7, height: 13 },
  subtag: { x: 4.35, y: 85, width: 11.5, height: 5 },
  musicLabelFrame: { x: 67, y: 66, width: 20, height: 4 },
  rsvpLabel: { x: 67, y: 67.2, width: 20, height: 1.8 },
  djLineup: { x: 57, y: 71, width: 39, height: 7 },
  footerDetails: { x: 56, y: 79, width: 41, height: 1.6 },
  price: { x: 12, y: 82.55, width: 0, height: 0 },
  venue: { x: 22, y: 84.2, width: 56, height: 5.2 },
  address: { x: 18, y: 90.1, width: 64, height: 1.7 },
  ticketBand: { x: 17, y: 94, width: 66, height: 3.3 },
  social: { x: 25.2, y: 95, width: 24, height: 1.6 },
  rsvp: { x: 50, y: 95, width: 28, height: 1.6 },
} as const satisfies Record<string, VisualRecipeRect>;

const zIndex: Record<string, number> = {
  background: -30,
  blackWash: -24,
  headline: 18,
  dateFrame: 30,
  calloutRule: 31,
  dotRail: 33,
  doorsFrame: 30,
  musicLabelFrame: 34,
  ticketBand: 41,
  presenter: 42,
  date: 34,
  details: 34,
  headline2: 38,
  time: 34,
  subtag: 35,
  rsvpLabel: 36,
  djLineup: 37,
  footerDetails: 37,
  price: 42,
  venue: 43,
  address: 44,
  social: 45,
  rsvp: 45,
  grain: 80,
};

const textConfig: Record<string, {
  role: string;
  family: string;
  sourceFamily: string;
  size: number;
  weight: number;
  lineHeight: number;
  tracking: number;
  align: "left" | "center" | "right";
  color: string;
  rotate?: number;
  scaleX?: number;
}> = {
  presenter: { role: "presenter", family: "LEMONMILK-Regular", sourceFamily: "CitySans", size: 12.74, weight: 700, lineHeight: 1, tracking: .78, align: "center", color: "#F6F2EF" },
  date: { role: "date", family: "Bebas Neue", sourceFamily: "CityCondensed", size: 32.94, weight: 400, lineHeight: .78, tracking: 0, align: "center", color: "#F6F2EF" },
  details: { role: "details", family: "LEMONMILK-Bold", sourceFamily: "CitySans", size: 22.14, weight: 700, lineHeight: 1.18, tracking: 0, align: "right", color: "#F6F2EF" },
  headline: { role: "headline", family: "Anton", sourceFamily: "CityDisplay", size: 297, weight: 900, lineHeight: .8, tracking: -.055, align: "center", color: "#F6F2EF", scaleX: 1.04 },
  headline2: { role: "headline2", family: "Good Brush", sourceFamily: "CityBrush", size: 170.64, weight: 900, lineHeight: .72, tracking: -.045, align: "center", color: "#ED0909", rotate: -7, scaleX: 1.16 },
  time: { role: "time", family: "LEMONMILK-Regular", sourceFamily: "CitySans", size: 27.54, weight: 400, lineHeight: 1.03, tracking: 0, align: "center", color: "#F6F2EF" },
  subtag: { role: "subtag", family: "LEMONMILK-Bold", sourceFamily: "CitySansBold", size: 48.06, weight: 900, lineHeight: .9, tracking: 0, align: "left", color: "#ED0909" },
  rsvpLabel: { role: "rsvpLabel", family: "LEMONMILK-Bold", sourceFamily: "CitySansBold", size: 13.5, weight: 700, lineHeight: 1, tracking: .38, align: "center", color: "#ED0909" },
  djLineup: { role: "djLineup", family: "LEMONMILK-Bold", sourceFamily: "CitySansBold", size: 32.94, weight: 700, lineHeight: .93, tracking: -.03, align: "center", color: "#F6F2EF" },
  footerDetails: { role: "footerDetails", family: "LEMONMILK-Bold", sourceFamily: "CitySansBold", size: 14.04, weight: 700, lineHeight: 1, tracking: 0, align: "center", color: "#ED0909" },
  price: { role: "price", family: "LEMONMILK-Regular", sourceFamily: "CitySans", size: 15.66, weight: 400, lineHeight: 1, tracking: .44, align: "center", color: "#F6F2EF" },
  venue: { role: "venue", family: "LEMONMILK-Bold", sourceFamily: "CitySansBold", size: 59.94, weight: 900, lineHeight: .92, tracking: -.055, align: "center", color: "#F6F2EF" },
  address: { role: "address", family: "LEMONMILK-Regular", sourceFamily: "CitySans", size: 16.2, weight: 400, lineHeight: 1, tracking: .24, align: "center", color: "#F6F2EF" },
  social: { role: "social", family: "LEMONMILK-Bold", sourceFamily: "CitySansBold", size: 16.74, weight: 700, lineHeight: 1, tracking: .12, align: "right", color: "#090000" },
  rsvp: { role: "rsvp", family: "LEMONMILK-Bold", sourceFamily: "CitySansBold", size: 16.74, weight: 700, lineHeight: 1, tracking: .08, align: "left", color: "#090000" },
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
        sourceFamily: text.sourceFamily,
        runtimeFamily: text.family,
        fontSize: text.size,
        runtimeFontSize: text.size,
        fontSizeUnit: "source-px",
        weight: text.weight,
        lineHeight: text.lineHeight,
        letterSpacing: text.tracking,
        letterSpacingUnit: "em",
        align: text.align,
        textTransform: "uppercase",
        fit: { mode: "width", targetFill: 1 },
      },
      transform: {
        rotate: text.rotate ?? 0,
        scaleX: text.scaleX ?? 1,
        scaleY: 1,
        origin: "50% 50%",
      },
      paint: {
        fill: { type: "solid", color: text.color },
        opacity: 1,
      },
      stacking: { zIndex: zIndex[id] ?? 40 },
    };
  }
  if (id === "background") {
    return {
      id,
      type: "image",
      rect,
      editable: true,
      paint: { fill: { type: "solid", color: "#FFFFFF" }, opacity: 1, filter: "contrast(1.13) saturate(1.08) brightness(.77)" },
      stacking: { zIndex: zIndex[id] },
      image: { fit: "cover", position: "50% 50%" },
    };
  }
  return {
    id,
    type: "shape",
    rect,
    editable: !["blackWash", "grain"].includes(id),
    paint: {
      fill: { type: "solid", color: id.includes("Frame") ? "#00000070" : id === "blackWash" ? "#00000033" : id === "grain" ? "#FFFFFF" : "#ED0909" },
      opacity: id === "grain" ? .13 : 1,
    },
    stacking: { zIndex: zIndex[id] ?? 30 },
  };
}

function makeElements(zones: Readonly<Record<string, VisualRecipeRect>>) {
  return Object.fromEntries(
    Object.entries(zones)
      .filter(([, rect]) => rect.width > 0 && rect.height > 0)
      .map(([id, rect]) => [id, elementFor(id, rect)]),
  ) as Record<string, VisualRecipeElement>;
}

const squareElements = makeElements(squareZones);
const storyElements = makeElements(storyZones);

export const CITY_NIGHTS_RECIPE = deepFreeze({
  id: "city-nights",
  name: "City Nights",
  version: 3,
  reference: "city-nights-reference-master.html",
  referenceMode: "visual-inheritance",
  summary: "A no-subject red-and-black city flyer built around one full-bleed background image, monumental textured type, a red brush-script overlay, framed date and door blocks, a DJ lockup, and a structured venue/footer system.",
  targetAssets: {
    backgroundUrl: "/generated-flyers/assets/city-nights-background.jpg",
    notes: [
      "The supplied city-and-car image is the only photographic asset.",
      "This recipe intentionally has no subject object and must not request a portrait.",
    ],
  },
  composition: {
    referenceMode: "visual-inheritance",
    referenceTemplateId: "city-nights-reference-master",
    referenceUses: ["complete CSS composition", "background crop", "text hierarchy", "paint", "stacking", "format-specific geometry"],
    deniedReferenceUses: ["subject extraction", "portrait fallback", "generic template substitution"],
    canvas: { format: "story", safeArea: { x: 3, y: 2, width: 94, height: 96 } },
    roles: [
      { id: "background", kind: "background", purpose: "Full-bleed city and car background.", required: true, editable: true, bounds: storyZones.background, layer: "background" },
      { id: "headline", kind: "headline", purpose: "Monumental textured CITY title.", required: true, editable: true, bounds: storyZones.headline, layer: "foreground" },
      { id: "headline2", kind: "headline", purpose: "Red brush Nights overlay.", required: true, editable: true, bounds: storyZones.headline2, layer: "foreground" },
      { id: "date", kind: "utility", purpose: "Framed three-line event date.", editable: true, bounds: storyZones.date, layer: "foreground" },
      { id: "time", kind: "utility", purpose: "Framed doors-open time.", editable: true, bounds: storyZones.time, layer: "foreground" },
      { id: "details", kind: "copy", purpose: "Upper-right event callout.", editable: true, bounds: storyZones.details, layer: "foreground" },
      { id: "djLineup", kind: "copy", purpose: "Two-line DJ lineup.", editable: true, bounds: storyZones.djLineup, layer: "foreground" },
      { id: "footerDetails", kind: "copy", purpose: "Music policy line.", editable: true, bounds: storyZones.footerDetails, layer: "foreground" },
      { id: "venue", kind: "footer", purpose: "Venue name lockup.", editable: true, bounds: storyZones.venue, layer: "utility" },
      { id: "address", kind: "footer", purpose: "Venue address.", editable: true, bounds: storyZones.address, layer: "utility" },
      { id: "rsvp", kind: "footer", purpose: "Ticket and table contact.", editable: true, bounds: storyZones.rsvp, layer: "utility" },
    ],
    layoutRules: [
      "No subject layer may be inserted into this recipe.",
      "The city/car artwork remains a single full-bleed cover-fit background.",
      "Square and Story use separately authored CSS geometry.",
      "CITY and Nights remain independent editable objects.",
      "Date, door time, callout, lineup, music policy, venue, address, and ticket contact remain independently editable.",
    ],
    overlapRules: [
      { objects: ["headline", "headline2"], allowed: true, maxCoveragePercent: 42, response: "Keep the red script crossing the lower half of CITY." },
      { objects: ["headline", "background"], allowed: true, response: "The title is intentionally integrated over the skyline." },
    ],
    generationSteps: ["Load the authored background.", "Materialize the CSS text and shape objects.", "Apply Story or Square geometry.", "Verify that no subject asset exists."],
  },
  layerStack: ["Full-bleed city/car background.", "Black contrast wash.", "Monumental CITY and red Nights title.", "Framed event metadata and DJ lockup.", "Venue, address, and ticket footer.", "Fine grain finish."],
  textZones: [
    { id: "presenter", purpose: "Presenter", placement: "Top center" },
    { id: "date", purpose: "Date", placement: "Upper-left framed rail" },
    { id: "details", purpose: "Event callout", placement: "Upper-right" },
    { id: "headline", purpose: "CITY", placement: "Upper-middle hero title" },
    { id: "headline2", purpose: "Nights", placement: "Across CITY" },
    { id: "time", purpose: "Doors time", placement: "Lower-left frame" },
    { id: "djLineup", purpose: "DJ lineup", placement: "Lower-right" },
    { id: "footerDetails", purpose: "Music policy", placement: "Below DJ lineup" },
    { id: "venue", purpose: "Venue", placement: "Bottom center" },
    { id: "address", purpose: "Address", placement: "Below venue" },
    { id: "rsvp", purpose: "Ticket contact", placement: "Red bottom band" },
  ],
  typography: ["Massive distressed condensed CITY headline.", "Independent red brush-script Nights overlay.", "Narrow uppercase metadata with aggressive size contrast.", "Letter-spaced presenter, slogan, address, and ticket lines."],
  colorGrade: ["Near-black shadows.", "Saturated signal red.", "Warm white headline texture.", "High-contrast chrome and wet-street detail retained in the background."],
  avoid: ["Adding a subject or portrait.", "Flattening the text into the background.", "Replacing the city/car asset with a generic generated background.", "Collapsing distinct metadata objects into one text field."],
  appNotes: ["This is a background-only recipe.", "The compiled document owns layout, palette, background crop, and assets.", "User background replacement may replace the one background object without introducing a subject."],
  runtime: {
    directionId: "city-nights",
    compositionPattern: "city-background-monumental-type",
    styleId: "red-urban-night",
    sourceCanvas: { width: 1080, height: 1920, aspectRatio: "9:16" },
    palette: { bgFrom: "#050000", bgTo: "#130000", primary: "#ED0909", secondary: "#F6F2EF", accent: "#ED0909", neutral: "#F6F2EF" },
    fonts: {
      display: { source: "CityDisplay", runtime: "Anton" },
      script: { source: "CityBrush", runtime: "Good Brush" },
      support: { source: "CitySans", runtime: "LEMONMILK-Regular" },
    },
    authority: {
      layout: { owner: "recipe-elements", source: "runtime.formats[format].elements", genericTemplateMayOverride: false },
      palette: { owner: "recipe-element-paint", source: "runtime.formats[format].elements[*].paint", generatedPaletteMayOverride: false },
      assets: { owner: "recipe-elements", source: "materialized Coco-native assets", genericDecorationAllowed: false, generatedBackgroundAllowed: false },
      crop: { owner: "recipe-background-image", source: "runtime.formats[format].elements.background.image", genericCropMayOverride: false },
    },
    formats: {
      square: { canvas: { width: 1080, height: 1080 }, imageFit: { focalTarget: { x: 50, y: 48 }, scale: 1, preserveUserScale: true }, elements: squareElements, zones: Object.fromEntries(Object.entries(squareElements).map(([id, element]) => [id, element.rect])) },
      story: { canvas: { width: 1080, height: 1920 }, imageFit: { focalTarget: { x: 50, y: 50 }, scale: 1, preserveUserScale: true }, elements: storyElements, zones: Object.fromEntries(Object.entries(storyElements).map(([id, element]) => [id, element.rect])) },
    },
  },
} satisfies VisualRecipe & { runtime: Record<string, unknown> });

export function getCityNightsFormatRecipe(format: CityNightsFormat) {
  return CITY_NIGHTS_RECIPE.runtime.formats[format];
}
