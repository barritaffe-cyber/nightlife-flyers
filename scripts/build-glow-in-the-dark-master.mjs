import { pathToFileURL } from "node:url";
import { compileCssMaster } from "./lib/coco-css-master-compiler.mjs";
import { GLOW_IN_THE_DARK_RECIPE } from "../lib/recipes/glowInTheDark.ts";

const masterPath = new URL("../public/generated-flyers/glow-in-the-dark-reference-master.html", import.meta.url);
const outputPath = new URL("../public/generated-flyers/glow-in-the-dark.nflyer", import.meta.url);
const refinementPath = new URL("../public/generated-flyers/glow-in-the-dark-refinements.json", import.meta.url);
const publicRoot = new URL("../public/", import.meta.url);

export const cocoCssMasterAdapter = {
  id: "glow-in-the-dark",
  masterPath,
  outputPath,
  refinementPath,
  publicRoot,
  recipe: GLOW_IN_THE_DARK_RECIPE,
  requiredRoles: [
    "presenter", "headline", "headline2", "subject", "date", "time", "subtag",
    "djLineup", "venue", "address", "footerDetails", "rsvpLabel", "rsvp", "price",
  ],
  semanticRoles: {
    presenter: { semanticRole: "presenter", label: "Presenter" },
    headline: { semanticRole: "headline", label: "Headline" },
    "link-word": { semanticRole: "details", label: "Connector" },
    "dark-title": { semanticRole: "headline2", label: "Secondary Headline" },
    subject: { semanticRole: "subject", label: "Subject" },
    date: { semanticRole: "date", label: "Date" },
    time: { semanticRole: "time", label: "Time" },
    friday: { semanticRole: "subtag", label: "Weekday" },
    lineup: { semanticRole: "djLineup", label: "DJ Lineup" },
    venue: { semanticRole: "venue", label: "Venue" },
    "footer-address": { semanticRole: "address", label: "Address" },
    "footer-details": { semanticRole: "footerDetails", label: "Footer Details" },
    "footer-contact-label": { semanticRole: "rsvpLabel", label: "RSVP Label" },
    "footer-contact-value": { semanticRole: "rsvp", label: "RSVP Contact" },
    price: { semanticRole: "price", label: "Price" },
  },
  fontMap: {
    presenter: "Bebas Neue",
    headline: "Good Brush",
    details: "Paint the town",
    headline2: "Good Brush",
    date: "Anton",
    time: "Anton",
    subtag: "Good Brush",
    djLineup: "Bebas Neue",
    venue: "Anton",
    address: "Bebas Neue",
    footerDetails: "Bebas Neue",
    rsvpLabel: "Bebas Neue",
    rsvp: "Bebas Neue",
    price: "Anton",
  },
  eventBrief: {
    eventName: "Glow in the Dark",
    date: "April 25",
    startTime: "9 PM",
    venueName: "CLUBWOODS",
    address: "234 WEST AVENUE STREET CITY",
    djs: "DJ SPICE | DJ ELEVATE",
    eventDetails: "DRINKS | PARKING AREA | TICKETS",
    presenterName: "CLUB WOODS PRESENTS",
    entryFee: "$25",
    rsvpContact: "0088 235 0089",
  },
  refinementPolicy: {
    fields: [
      "detailsUppercase", "detailsFamily", "bodyFamily", "head2SizePx", "head2Size", "dateFamily",
      "subtagFamily", "subtagRotate", "venueFamily", "venueSize", "rightRail", "rightRailColor",
      "rightRailAlign", "leftRailLabelColor", "leftRailLabelBgColor", "leftRailSize", "priceFamily",
      "priceX", "priceY", "priceAlign", "priceLineHeight", "priceLabel", "priceLabelSize",
      "priceLabelColor", "priceLabelBgColor", "cocoRushVenueStyles", "cocoManualTextColorRoles",
      "head2Shadow", "detailsShadow", "details2Shadow", "venueShadow", "subtagShadow",
      "head2ShadowStrength", "detailsShadowStrength", "details2ShadowStrength", "venueShadowStrength",
      "subtagShadowStrength", "textFx", "head2Fx", "vignette", "vignetteStrength",
    ],
    compiledObjectOverrideFields: ["x", "y", "layerZ", "removed"],
    compiledAssetPatchFields: [
      "x", "y", "scale", "opacity", "rotation", "locked", "blendMode", "tint", "tintMode", "layerOffset",
    ],
    additionFields: [
      "id", "url", "x", "y", "scale", "opacity", "rotation", "locked", "blendMode", "isFlare",
      "isSticker", "isDesignElement", "label", "layerOffset", "showLabel", "hitTestMode", "svgTemplate", "iconColor",
    ],
    additionIdPrefixes: ["flare_", "design_"],
  },
};

export async function buildGlowInTheDarkMaster(overrides = {}) {
  const result = await compileCssMaster(cocoCssMasterAdapter, overrides);
  const destination = overrides.outputPath || outputPath;
  console.log(
    `Compiled ${destination.pathname || destination} from rendered CSS (${result.square.cocoCssCompiler.ir.objects.length} Square objects, ${result.story.cocoCssCompiler.ir.objects.length} Story objects)`,
  );
  return result;
}

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";
if (import.meta.url === invokedPath) await buildGlowInTheDarkMaster();
