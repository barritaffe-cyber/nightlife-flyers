import type { VisualRecipe } from "./types.ts";

export const LADIES_NIGHT_ROSE_RECIPE = {
  id: "ladies-night-rose",
  name: "Ladies Night — Rose Gold",
  version: 3,
  reference: "ladies-night-rose.nflyer",
  referenceMode: "visual-inheritance",
  summary: "An upscale pink-and-rose-gold ladies night flyer with a supplied lounge scene, editable luxury headline lettering, and independent Square and Story compositions.",
  layerStack: ["Supplied full-bleed lounge background.", "Subtle contrast overlay.", "Individually editable event typography and offer badge."],
  textZones: [
    {id:"headline",purpose:"Primary Ladies title.",placement:"Large upper composition; use the supplied rose-gold bitmap family."},
    {id:"headline2",purpose:"Night subheadline.",placement:"Pink script crossing beneath the headline."},
    {id:"date",purpose:"Date and doors stack.",placement:"Upper-right information rail."},
    {id:"details",purpose:"Experience and music details.",placement:"Side lanes around the integrated subjects."},
    {id:"venue",purpose:"Venue and booking details.",placement:"Lower information lane."},
  ],
  typography: ["Ladies Rose Gold PNG is reserved for the primary headline in this template.", "Keep supporting copy narrow, spaced, and subordinate to the headline."],
  colorGrade: ["Preserve the supplied black, warm amber, champagne, and hot-pink lounge palette."],
  avoid: ["Exposing Ladies Rose Gold PNG in shared font menus.", "Replacing the independent Square or Story background.", "Flattening editable text into the background."],
  appNotes: ["Active portable master: ladies-night-rose.nflyer", "The supplied headline sheet is packaged as a template-scoped 62-glyph bitmap font."],
  runtime: {directionId:"ladies-night-rose",compositionPattern:"integrated-scene-poster",styleId:"black-electric",formats:{square:{canvas:{width:1080,height:1080}},story:{canvas:{width:1080,height:1920}}}},
} satisfies VisualRecipe & {runtime:Record<string,unknown>};
