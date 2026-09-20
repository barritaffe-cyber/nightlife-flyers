import type { VisualRecipe } from "./types.ts";

export const BEAT_THERAPY_RECIPE = {
  id: "beat-therapy",
  name: "Beat Therapy",
  version: 1,
  reference: "beat-therapy.nflyer",
  referenceMode: "visual-inheritance",
  summary: "A neon DJ scene with oversized silver-to-pink italic BEAT lettering, a hot-pink brush THERAPY title, and clear event information in independent Square and Story compositions.",
  layerStack: [
    "Supplied full-bleed DJ background for each format; the person is baked into the scene.",
    "Controlled dark contrast beneath the lower headline and information lanes.",
    "Editable metallic headline, brush subtitle, date, lineup, and venue copy.",
    "Restrained pink dividers and headline highlights.",
  ],
  textZones: [
    { id: "headline", purpose: "First word of the event name.", placement: "Large heavy italic lettering across the lower torso, clear of the DJ's face." },
    { id: "subtitle", purpose: "Second word of the event name.", placement: "Hot-pink brush lettering crossing beneath the metallic headline." },
    { id: "presenter", purpose: "Event presenter.", placement: "Spaced uppercase line at the top." },
    { id: "date", purpose: "Event date and hours.", placement: "Upper-right information rail." },
    { id: "lineup", purpose: "Music lineup.", placement: "Bold lower-center names beneath the title and tagline." },
    { id: "venue", purpose: "Venue, admission, and reservations.", placement: "Lower information lanes with pink dividers." },
  ],
  typography: [
    "Preserve the two separate editable main title words and their authored proportions.",
    "Keep the metallic headline texture, soft directional shadows, and brush subtitle treatment.",
    "Support copy stays uppercase and spaced with clean sans-serif letterforms.",
  ],
  colorGrade: ["Preserve the supplied magenta, violet, warm amber, silver, and near-black nightclub palette."],
  avoid: [
    "Treating the baked DJ as a replaceable portrait layer.",
    "Replacing the supplied backgrounds with a generic image or cropping one format into the other.",
    "Flattening editable text or replacing the title materials with flat colors.",
    "Using a glow halo or a distant black duplicate as the text shadow.",
  ],
  appNotes: [
    "Portable master: beat-therapy.nflyer; Square and Story are independent authored sessions.",
    "Discoverable under Neon without an uploaded portrait; accepts exactly two headline words.",
    "Coco form fields derive from the saved editable objects, with saved wording plus ten characters and automatic template capitalization.",
  ],
  runtime: {
    directionId: "beat-therapy",
    compositionPattern: "center-poster-stack",
    styleId: "black-electric",
    formats: {
      square: { canvas: { width: 1080, height: 1080 } },
      story: { canvas: { width: 1080, height: 1920 } },
    },
  },
} satisfies VisualRecipe & { runtime: Record<string, unknown> };
