import type { VisualRecipe, VisualRecipeRect } from "./types.ts";

function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const key of Reflect.ownKeys(value)) deepFreeze((value as Record<PropertyKey, unknown>)[key]);
  return Object.freeze(value);
}

export type NeonNightShiftFormat = "square" | "story";
export type NeonNightShiftFormatRecipe = Readonly<{
  canvas: Readonly<{ width: number; height: number }>;
  imageFit: Readonly<{ focalTarget: Readonly<{ x: number; y: number }>; scale: number; preserveUserScale: boolean }>;
  zones: Readonly<Record<string, VisualRecipeRect>>;
}>;

const storyZones = {
  background: { x: 0, y: 0, width: 100, height: 100 }, leftContrast: { x: 0, y: 0, width: 38.5, height: 78 }, footerContrast: { x: 0, y: 66, width: 100, height: 34 },
  paintLeft: { x: 0, y: 69, width: 25, height: 31 }, paintRight: { x: 76, y: 67, width: 24, height: 33 }, subjectGrade: { x: 8, y: 13, width: 84, height: 65 },
  subject: { x: 10, y: 13.5, width: 80, height: 64 }, subjectDisc: { x: 10.5, y: 27.2, width: 80, height: 45 },
  headline: { x: 5.4, y: 44.2, width: 61, height: 20 }, script: { x: 43, y: 55.2, width: 49, height: 10 },
  date: { x: 14.8, y: 11.5, width: 17, height: 15 }, doors: { x: 14.6, y: 24.7, width: 18, height: 5.2 },
  compliance: { x: 80, y: 4.8, width: 12, height: 4.8 }, manifesto: { x: 77.7, y: 25.1, width: 14, height: 9 },
  lineup: { x: 25.6, y: 77.4, width: 23.5, height: 8.8 }, offer: { x: 54.8, y: 77.4, width: 23.3, height: 8.8 },
  contact: { x: 33.5, y: 87.2, width: 33, height: 4.7 }, venue: { x: 22, y: 93.5, width: 56, height: 3 },
  dressCode: { x: 29, y: 97, width: 42, height: 2 },
  doorsRules: { x: 14.6, y: 24.7, width: 18, height: 5.2 }, manifestoRules: { x: 77.7, y: 25.1, width: 14, height: 9 },
  scriptUnderline: { x: 36, y: 65.5, width: 57, height: 2.5 }, accentTop: { x: 65, y: 9.4, width: 5, height: 3 }, accentBottom: { x: 84, y: 68, width: 5, height: 3 },
  lineupTag: { x: 25.6, y: 77.4, width: 11, height: 2.2 }, offerTag: { x: 54.8, y: 77.4, width: 10, height: 2.2 }, offerRule: { x: 54.8, y: 85.7, width: 12, height: 0.3 },
  supportRule: { x: 51.7, y: 77.4, width: 0.3, height: 8.8 }, contactFrame: { x: 33.5, y: 87.2, width: 33, height: 4.7 }, contactLabelPlate: { x: 39.5, y: 86.7, width: 21, height: 1.5 }, venuePin: { x: 48.9, y: 91.7, width: 2.2, height: 1.7 }, photoChip: { x: 76.4, y: 74.2, width: 19, height: 25.8 },
} as const;

const squareZones = {
  background: { x: 0, y: 0, width: 100, height: 100 }, leftContrast: { x: 0, y: 15, width: 37, height: 63 }, footerContrast: { x: 0, y: 70, width: 100, height: 30 },
  paintLeft: { x: 0, y: 72, width: 22, height: 28 }, paintRight: { x: 80, y: 70, width: 20, height: 30 }, subjectGrade: { x: 15, y: 5, width: 78, height: 84 },
  subject: { x: 18, y: 5, width: 72, height: 84 }, subjectDisc: { x: 13, y: 18, width: 75, height: 75 },
  headline: { x: 3.5, y: 42, width: 63, height: 25 }, script: { x: 43, y: 57, width: 50, height: 12 },
  date: { x: 6, y: 7, width: 16, height: 23 }, doors: { x: 6, y: 31, width: 19, height: 7 },
  compliance: { x: 82, y: 5, width: 13, height: 7 }, manifesto: { x: 84, y: 27, width: 12, height: 16 },
  lineup: { x: 8, y: 76, width: 24, height: 15 }, offer: { x: 38, y: 76, width: 24, height: 15 },
  contact: { x: 68, y: 78, width: 27, height: 10 }, venue: { x: 20, y: 93, width: 60, height: 3.5 },
  dressCode: { x: 29, y: 97, width: 42, height: 2 },
  doorsRules: { x: 6, y: 31, width: 19, height: 7 }, manifestoRules: { x: 84, y: 27, width: 12, height: 16 },
  scriptUnderline: { x: 49, y: 66, width: 43, height: 3 }, accentTop: { x: 31, y: 24, width: 7, height: 7 }, accentBottom: { x: 68, y: 62, width: 8, height: 8 },
  lineupTag: { x: 8, y: 76, width: 14, height: 3 }, offerTag: { x: 38, y: 76, width: 12, height: 3 }, offerRule: { x: 38, y: 89, width: 12, height: 0.4 },
  supportRule: { x: 34.8, y: 77, width: 0.35, height: 14 }, contactFrame: { x: 68, y: 78, width: 27, height: 10 }, contactLabelPlate: { x: 72, y: 77.4, width: 19, height: 2.5 }, venuePin: { x: 48.9, y: 90.5, width: 2.2, height: 2.2 }, photoChip: { x: 82, y: 73, width: 18, height: 27 },
} as const;

export const NEON_NIGHT_SHIFT_RECIPE = deepFreeze({
  id: "neon-night-shift", name: "Night Shift — Flyers HQ", version: 11,
  reference: "neon-night-shift-reference-master.html", referenceMode: "measurement-only",
  summary: "A neon palm portrait with oversized silver NIGHT and hot-pink brush Shift, a compact date column, separate DJs, and a restrained footer.",
  measurementReference: {
    mode: "measurement-only", sourceTemplateId: "neon-night-shift-reference-master",
    allowedUses: ["semantic data-region geometry", "subject crop and protected face", "headline overlap", "side-lane hierarchy", "footer rhythm", "palette roles"],
    deniedUses: ["flattened reference image", "CSS screenshot as final canvas", "generic layout", "generic palette", "generic crop", "generic decorations", "AI-generated background"],
    measurements: { sourcePath: "public/generated-flyers/neon-night-shift-reference-master.html", sourceSha256: "e2837e8455345939c589c163ed169213a09a46a3e3982136979fd1edb3c2c5a1", storyCanvasWidth: 1080, storyCanvasHeight: 1920, squareCanvasWidth: 1080, squareCanvasHeight: 1080 },
  },
  targetAssets: { subjectUrl: "/scene-assets/sugar-rush/subject-cutout.png", notes: ["The portrait is a replaceable starter subject.", "Every contrast field, disc, paint gesture, rule and accent is an unlocked Coco-native SVG asset."] },
  composition: {
    referenceMode: "measurement-only", referenceTemplateId: "neon-night-shift-reference-master",
    referenceUses: ["geometry", "hierarchy", "overlap", "layer order"], deniedReferenceUses: ["flattened artwork", "literal portrait dependency"],
    canvas: { format: "story", safeArea: { x: 4, y: 3, width: 92, height: 94 } },
    roles: [
      { id: "subject", kind: "subject", purpose: "Replaceable centered hero.", required: true, editable: true, bounds: storyZones.subject, layer: "subject" },
      { id: "subjectDisc", kind: "texture", purpose: "Editable cyan-magenta circular field.", required: true, editable: true, bounds: storyZones.subjectDisc, layer: "behindSubject" },
      { id: "headline", kind: "headline", purpose: "Oversized NIGHT identity.", required: true, editable: true, bounds: storyZones.headline, layer: "foreground" },
      { id: "script", kind: "headline", purpose: "Pink Shift title accent.", required: true, editable: true, bounds: storyZones.script, layer: "foreground" },
      { id: "dateDoors", kind: "utility", purpose: "Date and doors lockup.", editable: true, bounds: storyZones.date, layer: "foreground" },
      { id: "compliance", kind: "utility", purpose: "Age requirement.", editable: true, bounds: storyZones.compliance, layer: "foreground" },
      { id: "manifesto", kind: "copy", purpose: "Side message.", editable: true, bounds: storyZones.manifesto, layer: "foreground" },
      { id: "lineup", kind: "copy", purpose: "Music By lineup.", editable: true, bounds: storyZones.lineup, layer: "utility" },
      { id: "offer", kind: "copy", purpose: "Special offer.", editable: true, bounds: storyZones.offer, layer: "utility" },
      { id: "contact", kind: "footer", purpose: "VIP contact.", editable: true, bounds: storyZones.contact, layer: "utility" },
      { id: "venue", kind: "footer", purpose: "Street address.", editable: true, bounds: storyZones.venue, layer: "utility" },
      { id: "dressCode", kind: "footer", purpose: "Dress code.", editable: true, bounds: storyZones.dressCode, layer: "utility" },
    ],
    layoutRules: ["Story and Square use separately authored geometry.", "Alignment moves glyphs inside each editable object; it never moves a fixed recipe zone.", "Text selection bounds remain per-glyph after resizing.", "Replacing the subject preserves the circular field and protected headline relationship."],
    overlapRules: [{ objects: ["headline", "subject"], allowed: true, maxCoveragePercent: 32, response: "Keep eyes and glasses readable." }, { objects: ["script", "headline"], allowed: true, maxCoveragePercent: 28, response: "Preserve both title reads." }],
    generationSteps: ["Fit the replaceable subject.", "Build the editable disc and contrast fields.", "Place the two-object title lockup.", "Place semantic side facts and footer objects.", "Validate both formats and save one master."],
  },
  layerStack: ["Wet black wall and editable contrast fields.", "Cyan-magenta subject disc.", "Replaceable subject.", "NIGHT headline and Shift script.", "Side facts and structured footer."],
  textZones: [
    { id: "headline", purpose: "Event name", placement: "Oversized central lockup" }, { id: "script", purpose: "Title accent", placement: "Crosses lower headline" },
    { id: "date", purpose: "Date and doors", placement: "Upper-left lane" }, { id: "compliance", purpose: "Age requirement", placement: "Upper-right lane" },
    { id: "manifesto", purpose: "Side message", placement: "Right lane" }, { id: "lineup", purpose: "Music By", placement: "Lower-left footer" },
    { id: "offer", purpose: "Special offer", placement: "Lower-right footer" }, { id: "contact", purpose: "VIP contact", placement: "Framed footer row" },
    { id: "venue", purpose: "Venue", placement: "Bottom center" }, { id: "dressCode", purpose: "Dress code", placement: "Bottom utility line" },
  ],
  typography: ["Anton-style condensed uppercase for NIGHT.", "Open Script for Shift.", "Montserrat and Bebas Neue for support copy.", "Differently styled facts remain separate editable objects."],
  colorGrade: ["Near-black wet wall.", "Hot-pink primary light.", "Cyan secondary light.", "Paper-white headline."],
  avoid: ["Flattening the CSS master.", "Combining independently styled facts.", "Generic decoration or background replacement."],
  appNotes: ["Materialized recipe owns layout, palette, crop, assets and background.", "Generated Palette and generic construction paths must not overwrite this recipe."],
  runtime: {
    directionId: "neon-night-shift", compositionPattern: "neon-night-shift",
    palette: { bgFrom: "#020305", bgTo: "#09010A", primary: "#F50087", secondary: "#00D9E9", neutral: "#F2F0ED" },
    fonts: { headline: "Anton", script: "Open Script", support: "Montserrat", utility: "Bebas Neue" },
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
        source: "materialized Coco-native assets",
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
    formats: {
      story: { canvas: { width: 1080, height: 1920 }, imageFit: { focalTarget: { x: 50, y: 39 }, scale: 0.92, preserveUserScale: true }, zones: storyZones },
      square: { canvas: { width: 1080, height: 1080 }, imageFit: { focalTarget: { x: 54, y: 43 }, scale: 0.82, preserveUserScale: true }, zones: squareZones },
    },
  },
} satisfies VisualRecipe & { runtime: Record<string, unknown> });

export function getNeonNightShiftFormatRecipe(format: NeonNightShiftFormat): NeonNightShiftFormatRecipe {
  return NEON_NIGHT_SHIFT_RECIPE.runtime.formats[format];
}
