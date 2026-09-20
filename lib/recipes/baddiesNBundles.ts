import type { VisualRecipe, VisualRecipeElement, VisualRecipeRect } from "./types.ts";

function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const key of Reflect.ownKeys(value)) deepFreeze((value as Record<PropertyKey, unknown>)[key]);
  return Object.freeze(value);
}

export type BaddiesNBundlesFormat = "square" | "story";
export type BaddiesNBundlesFormatRecipe = Readonly<{
  canvas: Readonly<{ width: number; height: number }>;
  imageFit: Readonly<{ focalTarget: Readonly<{ x: number; y: number }>; scale: number; preserveUserScale: boolean }>;
  elements: Readonly<Record<string, VisualRecipeElement>>;
  zones: Readonly<Record<string, VisualRecipeRect>>;
}>;

const squareZones = {
  background: { x: 0, y: 0, width: 100, height: 100 },
  greenGlow: { x: 18, y: 24, width: 80, height: 72 },
  stripeLeft: { x: -8, y: -10, width: 20, height: 75 },
  stripeOrbTop: { x: 22, y: -8, width: 27, height: 27 },
  stripeOrbRight: { x: 74, y: 11, width: 46, height: 46 },
  stripeOrbBottom: { x: 72, y: 58, width: 40, height: 40 },
  dotTrail: { x: 70, y: 7.5, width: 20, height: 2.6 },
  accentPlus: { x: 1.5, y: 28, width: 4.5, height: 4.5 },
  accentWavesLeft: { x: 14, y: 20, width: 3.5, height: 12 },
  accentWavesRight: { x: 92.8, y: 66, width: 4.5, height: 12 },
  presenter: { x: 20, y: 6.1979, width: 30.9983, height: 1.4497 },
  headline: { x: 3.4983, y: 12.5, width: 92.9977, height: 42.338 },
  connectorDisc: { x: 47, y: 29.4, width: 9.8, height: 9.8 },
  connector: { x: 46.9994, y: 30.298, width: 9.7975, height: 6.7998 },
  dateFrame: { x: 6.2, y: 49, width: 20.5, height: 20.5 },
  date: { x: 6.9994, y: 48.6979, width: 18.8976, height: 20.3906 },
  doors: { x: 7.0978, y: 70, width: 20, height: 9.5313 },
  hype: { x: 6.1979, y: 80.6973, width: 22.9977, height: 4.8148 },
  subject: { x: 40.9983, y: 30, width: 55.9983, height: 61.9994 },
  djLineup: { x: 6.1979, y: 85.599, width: 22.9977, height: 4.8148 },
  venuePin: { x: 31.2, y: 88.1, width: 3.2, height: 3.2 },
  venue: { x: 35, y: 87.798, width: 57.9977, height: 5.2546 },
  logo: { x: 5, y: 3, width: 12.5, height: 10 },
  addressBand: { x: 8, y: 93.1, width: 84, height: 3.7 },
  address: { x: 10, y: 94.2477, width: 80, height: 1.4294 },
  reservationLabel: { x: 27.9977, y: 97.9977, width: 30, height: 1.3513 },
  reservationValue: { x: 58.9988, y: 97.9977, width: 30, height: 1.3513 },
  responsible: { x: 3.5995, y: 92.9977, width: 10, height: 1.0503 },
  age: { x: 2.5, y: 95.9983, width: 4.7975, height: 2.6997 },
} as const;

const storyZones = {
  background: { x: 0, y: 0, width: 100, height: 100 },
  greenGlow: { x: 11, y: 28, width: 83, height: 62 },
  stripeLeft: { x: -10, y: -2, width: 19, height: 54 },
  stripeOrbTop: { x: 18.5, y: .7, width: 26.5, height: 14.9063 },
  stripeOrbRight: { x: 70, y: 16.6, width: 55, height: 30.9375 },
  stripeOrbBottom: { x: 71, y: 54, width: 42, height: 23.625 },
  dotTrail: { x: 57, y: 9.6, width: 19, height: 2.2 },
  accentPlus: { x: .8, y: 20.7, width: 3.7, height: 3.7 },
  accentWavesLeft: { x: 13.8, y: 13.4, width: 3, height: 8.5 },
  accentWavesRight: { x: 93.3, y: 52.7, width: 4, height: 10.5 },
  presenter: { x: 30, y: 15.4997, width: 40, height: .8154 },
  headline: { x: 4.6991, y: 18.3984, width: 90.599, height: 25.8073 },
  connectorDisc: { x: 48.6, y: 30.35, width: 9.2, height: 5.175 },
  connector: { x: 48.5995, y: 31.1995, width: 9.1985, height: 3.6003 },
  dateFrame: { x: 8.9, y: 52.8, width: 18.4, height: 16.3 },
  date: { x: 9.6991, y: 52.3486, width: 16.7998, height: 14.0527 },
  doors: { x: 10.4977, y: 71.3997, width: 17.9977, height: 6.2077 },
  hype: { x: 8.9988, y: 78.5498, width: 21.9994, height: 2.5781 },
  subject: { x: 30.9983, y: 40.3499, width: 57.9977, height: 47.7995 },
  djLineup: { x: 8.9988, y: 82.1989, width: 21.9994, height: 2.5781 },
  venuePin: { x: 27.3, y: 86.6, width: 2.8, height: 2.8 },
  venue: { x: 30.7986, y: 86.4486, width: 52.5, height: 2.8158 },
  logo: { x: 42.2, y: 5.1, width: 15.6, height: 9.6 },
  addressBand: { x: 14.6, y: 91.35, width: 70.8, height: 3.4 },
  address: { x: 16.4988, y: 92.2184, width: 66.9994, height: .7764 },
  reservationLabel: { x: 23.6979, y: 95.5485, width: 30.9983, height: .804 },
  reservationValue: { x: 55.9983, y: 95.5485, width: 25, height: .804 },
  responsible: { x: 5.7986, y: 93.999, width: 12.5, height: .5908 },
  age: { x: 4.3981, y: 95.5485, width: 4.3981, height: 1.849 },
} as const;

type ElementStyle = Omit<VisualRecipeElement, "id" | "rect">;
type ElementFill = NonNullable<ElementStyle["paint"]>["fill"];
const solid = (color: string) => ({ type: "solid" as const, color });
const gradient = (angle: number, stops: Array<{ offset: number; color: string }>) => ({ type: "linear-gradient" as const, angle, stops });
const radial = (stops: Array<{ offset: number; color: string }>) => ({
  type: "radial-gradient" as const,
  center: { x: 50, y: 50 },
  shape: "ellipse",
  stops,
});
const transform = (rotate = 0, scaleX = 1, scaleY = 1) => ({ rotate, scaleX, scaleY, origin: "50% 50%" });
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
    textTransform: "uppercase",
    fit: { mode: "width", targetFill: 1 },
  },
  transform: transform(rotate),
  paint: { fill, opacity: 1 },
  stacking: { zIndex },
});

const lime = "#00FF3C";
const orange = "#F10D18";
const white = "#FFFFFF";
const black = "#050505";

const imageStyle = (semanticRole: string | undefined, zIndex: number, fit: "contain" | "cover" = "contain"): ElementStyle => ({
  type: "image",
  semanticRole,
  editable: true,
  transform: transform(),
  paint: { fill: solid(white), opacity: 1 },
  stacking: { zIndex },
  image: { fit, position: semanticRole === "subject" ? "center bottom" : "center center" },
});

export const BADDIES_N_BUNDLES_ELEMENT_STYLES: Readonly<Record<string, ElementStyle>> = deepFreeze({
  background: { type: "shape", editable: true, paint: { fill: radial([{ offset: 0, color: "#1D2608" }, { offset: 48, color: "#0B0D06" }, { offset: 100, color: black }]), opacity: 1 }, stacking: { zIndex: -20 } },
  greenGlow: { type: "shape", editable: false, paint: { fill: radial([{ offset: 0, color: "#A6FF0047" }, { offset: 55, color: "#75D9001C" }, { offset: 100, color: "#00000000" }]), opacity: 1, filter: "blur(30px)" }, stacking: { zIndex: -18 } },
  stripeLeft: { type: "shape", editable: true, paint: { fill: gradient(110, [{ offset: 0, color: "#D8FF0014" }, { offset: 50, color: "#D8FF0066" }, { offset: 100, color: "#00000000" }]), opacity: 1 }, stacking: { zIndex: -16 } },
  stripeOrbTop: { type: "shape", editable: true, paint: { fill: radial([{ offset: 0, color: "#D8FF0066" }, { offset: 100, color: "#00000000" }]), opacity: .9 }, stacking: { zIndex: -15 } },
  stripeOrbRight: { type: "shape", editable: true, paint: { fill: radial([{ offset: 0, color: "#FF5A1F52" }, { offset: 100, color: "#00000000" }]), opacity: .9 }, stacking: { zIndex: -15 } },
  stripeOrbBottom: { type: "shape", editable: true, paint: { fill: radial([{ offset: 0, color: "#D8FF004F" }, { offset: 100, color: "#00000000" }]), opacity: .9 }, stacking: { zIndex: -15 } },
  dotTrail: { type: "shape", editable: true, paint: { fill: solid(lime), opacity: .55 }, stacking: { zIndex: -10 } },
  accentPlus: { type: "shape", editable: true, transform: transform(12), paint: { fill: solid(orange), opacity: 1 }, stacking: { zIndex: 28 } },
  accentWavesLeft: { type: "shape", editable: true, paint: { fill: solid(lime), opacity: .75 }, stacking: { zIndex: -8 } },
  accentWavesRight: { type: "shape", editable: true, paint: { fill: solid(orange), opacity: .8 }, stacking: { zIndex: 16 } },
  presenter: text("presenter", "BaddiesRegular", "LEMONMILK-Regular", 24, 12, 400, 1, .78, "center", solid(white), 57),
  headline: { ...text("headline", "BaddiesDisplay", "Anton", 246, 123, 900, .78, -.035, "center", solid(white), 10), paint: { fill: gradient(92, [{ offset: 0, color: white }, { offset: 46, color: lime }, { offset: 100, color: white }]), opacity: 1, shadow: { x: 0, y: 8, blur: 18, color: "#000000B3" } }, stacking: { zIndex: 10, behind: ["subject"] } },
  connectorDisc: { type: "shape", editable: true, paint: { fill: solid(orange), opacity: 1, shadow: { x: 0, y: 0, blur: 18, color: "#FF5A1F80" } }, stacking: { zIndex: 48 } },
  connector: text("headline2", "BaddiesCondensed", "Antonio", 96, 48, 800, 1, -.06, "center", solid(white), 52, 7),
  dateFrame: { type: "shape", editable: true, transform: transform(-2), paint: { fill: solid("#111309E8"), opacity: 1, border: { width: 3, style: "solid", color: lime, radius: 12 } }, stacking: { zIndex: 43 } },
  date: text("date", "BaddiesCondensed", "Antonio", 92, 46, 800, .73, -.025, "center", solid(white), 46),
  doors: text("time", "BaddiesDisplay", "Anton", 36, 18, 900, .72, -.02, "center", solid(white), 58),
  hype: text("details", "BaddiesSans", "LEMONMILK-Bold", 29, 14.5, 700, .95, .03, "right", solid(white), 59),
  subject: { ...imageStyle("subject", 40), stacking: { zIndex: 40, above: ["headline"], behind: ["djLineup"] }, image: { fit: "contain", position: "center bottom", filters: { saturate: 1.08, contrast: 1.08, dropShadow: { x: 0, y: 18, blur: 30, color: "#000000B8" } } } },
  djLineup: { ...text("djLineup", "BaddiesSans", "LEMONMILK-Bold", 45, 22.5, 800, .9, .02, "center", solid(white), 59), paint: { fill: solid(white), opacity: 1, shadow: { x: 0, y: 3, blur: 8, color: "#000000E6" } } },
  venuePin: { type: "shape", editable: true, paint: { fill: solid(orange), opacity: 1 }, stacking: { zIndex: 61 } },
  venue: text("venue", "BaddiesNarrow", "Bebas Neue", 52, 26, 400, 1, -.025, "left", solid(white), 62),
  logo: { ...imageStyle(undefined, 56), paint: { fill: solid(white), opacity: .95 }, stacking: { zIndex: 56 } },
  addressBand: { type: "shape", editable: true, paint: { fill: gradient(100, [{ offset: 0, color: "#11120CFA" }, { offset: 65, color: "#0B0C08FA" }, { offset: 100, color: "#151905FA" }]), opacity: 1, border: { width: 1, style: "solid", color: "#D8FF0052", radius: 0 } }, stacking: { zIndex: 64 } },
  address: text("address", "BaddiesSans", "LEMONMILK-Bold", 19, 9.5, 900, 1, .015, "center", solid("#001306"), 65),
  reservationLabel: text("rsvpLabel", "BaddiesRegular", "LEMONMILK-Regular", 16, 8, 400, 1, .11, "right", solid(white), 66),
  reservationValue: text("rsvp", "BaddiesSans", "LEMONMILK-Bold", 18, 9, 900, 1, .025, "left", solid(white), 66),
  responsible: text("footerDetails", "BaddiesRegular", "LEMONMILK-Regular", 15, 7.5, 400, 1, .13, "left", solid(white), 67, -90),
  age: { ...text("subtag", "BaddiesSans", "LEMONMILK-Bold", 35, 17.5, 900, 1, 0, "center", solid(white), 68), paint: { fill: solid(white), opacity: 1, background: solid(orange), border: { width: 1, style: "solid", color: orange, radius: 0 } } },
});

function makeElements(zones: Readonly<Record<string, VisualRecipeRect>>) {
  return Object.fromEntries(
    Object.entries(zones).map(([id, rect]) => [id, { ...BADDIES_N_BUNDLES_ELEMENT_STYLES[id], id, rect }]),
  ) as Record<string, VisualRecipeElement>;
}

const squareElements = makeElements(squareZones);
const storyElements = makeElements(storyZones);

export const BADDIES_N_BUNDLES_RECIPE = deepFreeze({
  id: "baddies-n-bundles",
  name: "Baddies N Bundles",
  version: 3,
  reference: "baddies-n-bundles-reference-master.html",
  referenceMode: "measurement-only",
  summary: "A neon-lime fashion-night flyer with a split headline, replaceable seated subject, framed date and side details, and a structured venue/reservations footer.",
  measurementReference: {
    mode: "measurement-only",
    sourceTemplateId: "baddies-n-bundles-reference-master",
    allowedUses: ["semantic element geometry", "computed typography", "transforms", "paint", "stacking", "image fit", "reading order"],
    deniedUses: ["flattened reference artwork", "CSS screenshot as final canvas", "generic layout", "generic palette", "generic crop", "generic decorations", "AI-generated background"],
    measurements: {
      sourcePath: "public/generated-flyers/baddies-n-bundles-reference-master.html",
      sourceSha256: "e844a26b68859728a82672020bf958081d64781bcb60958b531610dd62ddf695",
      sourceCanvasWidth: 1080,
      sourceCanvasHeight: 1920,
      sourceAspectRatio: "9:16",
      squareCanvasWidth: 1080,
      squareCanvasHeight: 1080,
      storyCanvasWidth: 1080,
      storyCanvasHeight: 1920,
    },
  },
  targetAssets: {
    subjectUrl: "/generated-flyers/assets/baddies-n-bundles-subject-v1.png",
    logoUrl: "/generated-flyers/assets/baddies-n-bundles-logo-v1.png",
    notes: ["The central transparent subject remains independently replaceable.", "The transparent Classic Bar and Lounge mark remains an independent editable logo asset.", "Every decorative object is authored locally in CSS or a local transparent PNG."],
  },
  composition: {
    referenceMode: "measurement-only",
    referenceTemplateId: "baddies-n-bundles-reference-master",
    referenceUses: ["elements", "geometry", "typography", "transforms", "paint", "stacking", "image fit"],
    deniedReferenceUses: ["flattened artwork", "literal starter portrait dependency"],
    canvas: { format: "story", safeArea: { x: 4, y: 2, width: 92, height: 96 } },
    roles: [
      { id: "background", kind: "background", purpose: "Near-black lime-lit fashion field.", editable: true, layer: "background" },
      { id: "headline", kind: "headline", purpose: "Two-line BADDIES / BUNDLES title.", required: true, editable: true, bounds: storyZones.headline, layer: "behindSubject" },
      { id: "connector", kind: "headline", purpose: "Independent N connector disc.", required: true, editable: true, bounds: storyZones.connector, layer: "foreground" },
      { id: "subject", kind: "subject", purpose: "Replaceable seated fashion subject.", required: true, editable: true, bounds: storyZones.subject, layer: "subject" },
      { id: "date", kind: "badge", purpose: "Framed stacked event date.", editable: true, bounds: storyZones.date, layer: "foreground" },
      { id: "doors", kind: "utility", purpose: "Doors-open time.", editable: true, bounds: storyZones.doors, layer: "foreground" },
      { id: "hype", kind: "copy", purpose: "Hyped-by host credit.", editable: true, bounds: storyZones.hype, layer: "foreground" },
      { id: "djLineup", kind: "copy", purpose: "Music-by DJ credit.", editable: true, bounds: storyZones.djLineup, layer: "foreground" },
      { id: "venue", kind: "copy", purpose: "Venue name.", editable: true, bounds: storyZones.venue, layer: "utility" },
      { id: "logo", kind: "badge", purpose: "Independent venue logo.", editable: true, bounds: storyZones.logo, layer: "utility" },
      { id: "address", kind: "footer", purpose: "Venue address.", editable: true, bounds: storyZones.address, layer: "utility" },
      { id: "reservationLabel", kind: "footer", purpose: "Reservations label.", editable: true, bounds: storyZones.reservationLabel, layer: "utility" },
      { id: "reservationValue", kind: "footer", purpose: "Reservations contact.", editable: true, bounds: storyZones.reservationValue, layer: "utility" },
      { id: "responsible", kind: "footer", purpose: "Responsible-drinking notice.", editable: true, bounds: storyZones.responsible, layer: "utility" },
      { id: "age", kind: "badge", purpose: "18+ notice.", editable: true, bounds: storyZones.age, layer: "utility" },
    ],
    layoutRules: ["Square and Story use separately authored geometry.", "The BADDIES / BUNDLES title remains one editable multiline headline and N remains independent.", "The subject occludes only the intended center of the headline.", "Venue, address, reservations, responsibility notice, age notice, and venue logo stay independently editable."],
    overlapRules: [{ objects: ["headline", "subject"], allowed: true, maxCoveragePercent: 28, response: "Preserve the model's face, silhouette, and title legibility while retaining the deliberate center collision." }],
    generationSteps: ["Materialize CSS-authored decorations and local assets.", "Fit the replaceable subject above the title.", "Place the framed date and opposed support credits.", "Place lineup, venue, logo, and independent footer copy.", "Validate Square and Story."],
  },
  layerStack: ["Near-black background, lime glow, stripe, orbs, and marks.", "BADDIES / BUNDLES headline behind the subject.", "Replaceable subject and independent N connector.", "Date, doors, hype host, and DJ credit.", "Venue, address, reservation, responsibility, age, and logo footer system."],
  textZones: [
    { id: "presenter", purpose: "PRESENTS", placement: "Top eyebrow" },
    { id: "headline", purpose: "BADDIES / BUNDLES", placement: "Oversized upper title" },
    { id: "connector", purpose: "N", placement: "Center connector disc" },
    { id: "date", purpose: "SATURDAY / 18 / JUL", placement: "Left framed date" },
    { id: "doors", purpose: "DOORS OPEN / 5PM", placement: "Right metadata lane" },
    { id: "hype", purpose: "HYPED BY / HYPEMANFROSH", placement: "Right metadata lane" },
    { id: "djLineup", purpose: "MUSIC BY / DJ PEP", placement: "Lower subject" },
    { id: "venue", purpose: "CLASSIC LOUNGE", placement: "Lower venue row" },
    { id: "address", purpose: "Venue address", placement: "Footer" },
    { id: "reservationLabel", purpose: "FOR INFO & RESERVATIONS:", placement: "Footer contact row" },
    { id: "reservationValue", purpose: "+234 814 891 2126", placement: "Footer contact row" },
    { id: "responsible", purpose: "DRINK RESPONSIBLY", placement: "Footer utility lane" },
    { id: "age", purpose: "18+", placement: "Footer badge" },
  ],
  typography: ["Heavy condensed display type carries the title, connector, venue, and age notice.", "A narrower condensed face structures the date.", "LEMON MILK support faces keep all logistics compact and legible.", "All differently styled copy remains independently editable."],
  colorGrade: ["Near-black fashion field.", "Electric lime glow and type accents.", "Hot-orange connector and graphic accents.", "White support copy and venue mark."],
  avoid: ["Flattening the CSS master.", "Combining the N connector with the main headline.", "Combining distinct footer copy into one text object.", "Replacing the local subject or venue logo with remote resources.", "Allowing generic systems to overwrite layout, palette, crop, or decorations."],
  appNotes: ["The compiled document owns layout, palette, assets, crop, and background.", "runtime.formats[format].elements is authoritative; zones are derived compatibility data.", "The local subject and Classic venue mark are separate replaceable image objects."],
  runtime: {
    directionId: "baddies-n-bundles",
    compositionPattern: "center-subject-asymmetric-event-grid",
    styleId: "neon-lime-fashion-night",
    sourceCanvas: { width: 1080, height: 1920, aspectRatio: "9:16" },
    palette: { bgFrom: "#000501", bgTo: "#002B0D", primary: "#00FF3C", secondary: "#F10D18", accent: "#FFFFFF", neutral: "#F7FAF7" },
    fonts: { display: { source: "BaddiesDisplay", runtime: "Anton" }, condensed: { source: "BaddiesCondensed", runtime: "Antonio" }, narrow: { source: "BaddiesNarrow", runtime: "Bebas Neue" }, support: { source: "BaddiesSans", runtime: "LEMONMILK-Bold" }, regular: { source: "BaddiesRegular", runtime: "LEMONMILK-Regular" } },
    authority: {
      layout: { owner: "recipe-elements", source: "runtime.formats[format].elements", genericTemplateMayOverride: false },
      palette: { owner: "recipe-element-paint", source: "runtime.formats[format].elements[*].paint", generatedPaletteMayOverride: false },
      assets: { owner: "recipe-elements", source: "materialized Coco-native assets", genericDecorationAllowed: false, generatedBackgroundAllowed: false },
      crop: { owner: "recipe-element-image", source: "runtime.formats[format].elements.subject.image", genericCropMayOverride: false },
    },
    formats: {
      square: { canvas: { width: 1080, height: 1080 }, imageFit: { focalTarget: { x: 52, y: 58 }, scale: 1, preserveUserScale: true }, elements: squareElements, zones: Object.fromEntries(Object.entries(squareElements).map(([id, element]) => [id, element.rect])) },
      story: { canvas: { width: 1080, height: 1920 }, imageFit: { focalTarget: { x: 52, y: 55 }, scale: 1, preserveUserScale: true }, elements: storyElements, zones: Object.fromEntries(Object.entries(storyElements).map(([id, element]) => [id, element.rect])) },
    },
  },
} satisfies VisualRecipe & {
  targetAssets: NonNullable<VisualRecipe["targetAssets"]> & { logoUrl: string };
  runtime: Record<string, unknown>;
});

export function getBaddiesNBundlesFormatRecipe(format: BaddiesNBundlesFormat): BaddiesNBundlesFormatRecipe {
  return BADDIES_N_BUNDLES_RECIPE.runtime.formats[format] as BaddiesNBundlesFormatRecipe;
}
