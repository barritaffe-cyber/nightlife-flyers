import type { VisualRecipe, VisualRecipeElement, VisualRecipeRect } from "./types.ts";

function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const key of Reflect.ownKeys(value)) deepFreeze((value as Record<PropertyKey, unknown>)[key]);
  return Object.freeze(value);
}

export type GreyRaveFestivalFormat = "square" | "story";

const storyZones = {
  background: { x: 0, y: 0, width: 100, height: 100 },
  date: { x: 19, y: 10.2, width: 62, height: 6 },
  "hero-marks": { x: 17, y: 27.1, width: 66, height: 22 },
  headline: { x: 14, y: 31, width: 72, height: 11 },
  headline2: { x: 20, y: 42.15, width: 60, height: 2.8 },
  "dj-lineup-label": { x: 31, y: 47, width: 38, height: 5 },
  "dj-lineup": { x: 11, y: 52.7, width: 78, height: 11 },
  address: { x: 30, y: 64.45, width: 40, height: 2.2 },
  venue: { x: 30, y: 66.55, width: 40, height: 4.8 },
  details: { x: 40, y: 73.2, width: 20, height: 2.5 },
  price: { x: 76, y: 70.5, width: 14, height: 7.875 },
  subtag: { x: 22.5, y: 77, width: 55, height: 3.8 },
  footer: { x: 17, y: 93.6, width: 66, height: 2.2 },
} as const satisfies Record<string, VisualRecipeRect>;

const squareZones = {
  background: storyZones.background,
  date: { x: 19, y: 5.5, width: 62, height: 8 },
  "hero-marks": { x: 17, y: 20, width: 66, height: 22 },
  headline: { x: 14, y: 24, width: 72, height: 14 },
  headline2: { x: 20, y: 39, width: 60, height: 4 },
  "dj-lineup-label": { x: 31, y: 46, width: 38, height: 6 },
  "dj-lineup": { x: 11, y: 54, width: 78, height: 14 },
  address: { x: 30, y: 73.25, width: 40, height: 3 },
  venue: { x: 30, y: 76.4, width: 40, height: 5.4 },
  details: { x: 40, y: 84, width: 20, height: 3 },
  price: { x: 76, y: 64, width: 12, height: 12 },
  subtag: { x: 22.5, y: 89, width: 55, height: 5 },
  footer: { x: 17, y: 96, width: 66, height: 2.2 },
} as const satisfies Record<string, VisualRecipeRect>;

const text: Record<string, { role: string; family: string; source: string; size: number; lineHeight: number; tracking: number; color: string; rotate?: number }> = {
  date: { role: "date", family: "LEMONMILK-Bold", source: "RaveWide", size: 43, lineHeight: 1, tracking: .38, color: "#F5F3F4" },
  headline: { role: "headline", family: "Road Rage", source: "RaveBrush", size: 189, lineHeight: .74, tracking: -.065, color: "#FFFFFF", rotate: -3 },
  headline2: { role: "headline2", family: "LEMONMILK-Bold", source: "RaveWide", size: 25.4, lineHeight: 1, tracking: .62, color: "#F5F3F4" },
  "dj-lineup-label": { role: "djLineupLabel", family: "Road Rage", source: "RaveBrush", size: 60.5, lineHeight: .9, tracking: 0, color: "#FFFFFF", rotate: -6 },
  "dj-lineup": { role: "djLineup", family: "LEMONMILK-Regular", source: "RaveRegular", size: 56.7, lineHeight: .92, tracking: -.055, color: "#F72A91" },
  address: { role: "address", family: "Road Rage", source: "RaveBrush", size: 34.6, lineHeight: .8, tracking: 0, color: "#FFFFFF", rotate: -4 },
  venue: { role: "venue", family: "LEMONMILK-Regular", source: "RaveRegular", size: 50.2, lineHeight: .86, tracking: -.035, color: "#F72A91" },
  details: { role: "compliance", family: "LEMONMILK-Bold", source: "RaveWide", size: 21.6, lineHeight: 1, tracking: .55, color: "#F5F3F4" },
  price: { role: "price", family: "LEMONMILK-Regular", source: "RaveRegular", size: 23.2, lineHeight: 1, tracking: 0, color: "#FFFFFF" },
  subtag: { role: "social", family: "LEMONMILK-Bold", source: "RaveWide", size: 30.2, lineHeight: 1, tracking: -.025, color: "#FFFFFF" },
  footer: { role: "footerDetails", family: "LEMONMILK-Bold", source: "RaveWide", size: 12.4, lineHeight: 1, tracking: .82, color: "#F5F3F4" },
};

function makeElements(zones: Readonly<Record<string, VisualRecipeRect>>) {
  return Object.fromEntries(Object.entries(zones).map(([id, rect]) => {
    if (id === "background") return [id, { id, type: "image", rect, editable: false, paint: { fill: { type: "solid", color: "#090909" }, opacity: 1 }, stacking: { zIndex: 0 }, image: { fit: "cover", position: "50% 50%" } }];
    if (id === "hero-marks") return [id, { id, type: "shape", rect, editable: true, paint: { fill: { type: "solid", color: "#F72A91" }, opacity: 1 }, stacking: { zIndex: 11 } }];
    const config = text[id];
    return [id, { id, type: "text", rect, semanticRole: config.role, editable: true, typography: { sourceFamily: config.source, runtimeFamily: config.family, fontSize: config.size, runtimeFontSize: config.size, fontSizeUnit: "source-px", weight: 900, lineHeight: config.lineHeight, letterSpacing: config.tracking, letterSpacingUnit: "em", align: "center", textTransform: "uppercase", fit: { mode: "width", targetFill: 1 } }, transform: { rotate: config.rotate ?? 0, scaleX: 1, scaleY: 1, origin: "50% 50%" }, paint: { fill: { type: "solid", color: config.color }, opacity: 1, shadow: { x: 3, y: 4, blur: 2, color: "#090909" } }, stacking: { zIndex: 12 } }];
  })) as Record<string, VisualRecipeElement>;
}

const squareElements = makeElements(squareZones);
const storyElements = makeElements(storyZones);

export const GREY_RAVE_FESTIVAL_RECIPE = deepFreeze({
  id: "grey-rave-festival",
  name: "Grey Rave Festival",
  version: 1,
  reference: "grey-rave-reference-master.html",
  referenceMode: "visual-inheritance",
  summary: "A monochrome classical-statue rave flyer with electric-pink geometry, brush lettering, compact festival metadata, and a sponsor-free footer.",
  targetAssets: { backgroundUrl: "/generated-flyers/assets/grey%20assets-bg.png", notes: ["The supplied 9:16 statue collage is the single locked background.", "No sponsor or third-party brand marks are included."] },
  composition: {
    referenceMode: "visual-inheritance", referenceTemplateId: "grey-rave-reference-master",
    referenceUses: ["complete CSS composition", "background crop", "typography hierarchy", "pink graphic marks", "format-specific geometry"],
    deniedReferenceUses: ["sponsor logos", "brand marks", "generic background replacement"],
    canvas: { format: "story", safeArea: { x: 4, y: 3, width: 92, height: 94 } },
    roles: [
      { id: "background", kind: "background", purpose: "Full-bleed statue collage.", required: true, editable: false, bounds: storyZones.background, layer: "background" },
      { id: "headline", kind: "headline", purpose: "Brush RAVE title.", required: true, editable: true, bounds: storyZones.headline, layer: "foreground" },
      { id: "headline2", kind: "headline", purpose: "Festival descriptor.", editable: true, bounds: storyZones.headline2, layer: "foreground" },
      { id: "dj-lineup", kind: "copy", purpose: "Artist lineup.", editable: true, bounds: storyZones["dj-lineup"], layer: "foreground" },
      { id: "address", kind: "utility", purpose: "Small venue kicker.", editable: true, bounds: storyZones.address, layer: "utility" },
      { id: "venue", kind: "footer", purpose: "Venue lockup.", editable: true, bounds: storyZones.venue, layer: "utility" },
      { id: "price", kind: "badge", purpose: "Editable entry price.", editable: true, bounds: storyZones.price, layer: "utility" },
    ],
    layoutRules: ["Keep the supplied background full bleed.", "Keep all event facts independently editable.", "Do not add sponsor logos or third-party brand marks.", "Square and Story use authored geometry."],
    overlapRules: [{ objects: ["headline", "hero-marks"], allowed: true, maxCoveragePercent: 80, response: "Keep the pink marks behind the brush headline." }],
    generationSteps: ["Load the authored background.", "Materialize the CSS text and pink marks.", "Apply format-specific geometry.", "Verify the sponsor-free footer."],
  },
  layerStack: ["Statue collage background.", "Pink hero marks.", "RAVE and Festival title.", "Lineup and venue information.", "Sponsor-free handle and footer."],
  textZones: [
    { id: "date", purpose: "Event date", placement: "Top center" }, { id: "headline", purpose: "Event title", placement: "Across statue face" },
    { id: "headline2", purpose: "Festival label", placement: "Below title" }, { id: "djLineup", purpose: "Artists", placement: "Center lower" },
    { id: "address", purpose: "Venue kicker", placement: "Above venue" }, { id: "venue", purpose: "Venue", placement: "Below lineup" }, { id: "price", purpose: "Entry price", placement: "Lower right badge" }, { id: "subtag", purpose: "Social handle", placement: "Lower center" },
  ],
  typography: ["White outlined brush headline.", "Electric-pink heavy geometric lineup.", "Widely tracked uppercase metadata."],
  colorGrade: ["Near-black distressed base.", "Electric pink accents.", "Cold white support type."],
  avoid: ["Sponsor logos or brand marks.", "Flattening editable copy into the background.", "Replacing the supplied artwork.", "Combining the lineup label and artist names."],
  appNotes: ["Background-only recipe; do not request a portrait.", "Recipe owns its layout, palette, crop, and decorations."],
  runtime: {
    directionId: "grey-rave-festival", compositionPattern: "center-poster-stack", styleId: "black-electric", sourceCanvas: { width: 1080, height: 1920, aspectRatio: "9:16" },
    palette: { bgFrom: "#090909", bgTo: "#151515", primary: "#F72A91", secondary: "#F5F3F4", accent: "#F72A91", neutral: "#F5F3F4" },
    fonts: { display: { source: "RaveBrush", runtime: "Road Rage" }, support: { source: "RaveWide", runtime: "LEMONMILK-Bold" } },
    authority: { layout: { owner: "recipe-elements", source: "runtime.formats[format].elements", genericTemplateMayOverride: false }, palette: { owner: "recipe-element-paint", source: "runtime.formats[format].elements[*].paint", generatedPaletteMayOverride: false }, assets: { owner: "recipe-elements", source: "materialized Coco-native assets", genericDecorationAllowed: false, generatedBackgroundAllowed: false }, crop: { owner: "recipe-background-image", source: "runtime.formats[format].elements.background.image", genericCropMayOverride: false } },
    formats: {
      square: { canvas: { width: 1080, height: 1080 }, imageFit: { focalTarget: { x: 50, y: 38 }, scale: 1, preserveUserScale: true }, elements: squareElements, zones: Object.fromEntries(Object.entries(squareElements).map(([id, element]) => [id, element.rect])) },
      story: { canvas: { width: 1080, height: 1920 }, imageFit: { focalTarget: { x: 50, y: 50 }, scale: 1, preserveUserScale: true }, elements: storyElements, zones: Object.fromEntries(Object.entries(storyElements).map(([id, element]) => [id, element.rect])) },
    },
  },
} satisfies VisualRecipe & { runtime: Record<string, unknown> });

export function getGreyRaveFestivalFormatRecipe(format: GreyRaveFestivalFormat) {
  return GREY_RAVE_FESTIVAL_RECIPE.runtime.formats[format];
}
