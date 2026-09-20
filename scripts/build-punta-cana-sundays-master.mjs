import { pathToFileURL } from "node:url";
import { compileCssMaster } from "./lib/coco-css-master-compiler.mjs";
import { PUNTA_CANA_SUNDAYS_RECIPE } from "../lib/recipes/puntaCanaSundays.ts";

const masterPath = new URL("../public/generated-flyers/punta-cana-sundays-reference-master.html", import.meta.url);
const outputPath = new URL("../public/generated-flyers/punta-cana-sundays.nflyer", import.meta.url);
const refinementPath = new URL("../public/generated-flyers/punta-cana-sundays-refinements.json", import.meta.url);
const publicRoot = new URL("../public/", import.meta.url);

export const puntaCanaSundaysCssMasterAdapter = {
  id: "punta-cana-sundays",
  masterPath,
  outputPath,
  refinementPath,
  publicRoot,
  // Preserve the legacy master/refinement version; the replacement has its own builder.
  recipe: { ...PUNTA_CANA_SUNDAYS_RECIPE, version: 2, summary: "A tropical editorial flyer with a three-object Punta / Cana / Sundays title, a replaceable central subject, a separately editable vertical information rail, and a compact red footer." },
  requiredFonts: ["PuntaDisplay", "PuntaScript", "PuntaSans"],
  requiredRoles: [
    "headline",
    "headline2",
    "details",
    "subject",
    "presenter",
    "date",
    "hostedBy",
    "social",
    "djLineup",
    "venue",
    "footerDetails",
    "address",
  ],
  semanticRoles: {
    headline: { semanticRole: "headline", label: "Punta / Headline" },
    headline2: { semanticRole: "headline2", label: "Cana / Secondary Headline" },
    details: { semanticRole: "details", label: "Sundays" },
    subject: { semanticRole: "subject", label: "Subject" },
    presenter: { semanticRole: "presenter", label: "Presenter" },
    date: { semanticRole: "date", label: "Date" },
    hostedBy: { semanticRole: "hostedBy", label: "Hosted By" },
    social: { semanticRole: "social", label: "Social Handle" },
    djLineup: { semanticRole: "djLineup", label: "DJ Lineup" },
    venue: { semanticRole: "venue", label: "Venue" },
    footerDetails: { semanticRole: "footerDetails", label: "Dress Code" },
    footerAddress: { semanticRole: "address", label: "Footer Address" },
  },
  fontMap: {
    headline: "Avigea",
    headline2: "Avigea",
    details: "OpenScript",
    presenter: "LEMONMILK-Bold",
    date: "LEMONMILK-Bold",
    hostedBy: "LEMONMILK-Bold",
    social: "LEMONMILK-Bold",
    djLineup: "Avigea",
    venue: "LEMONMILK-Bold",
    footerDetails: "LEMONMILK-Bold",
    address: "LEMONMILK-Bold",
  },
  eventBrief: {
    eventName: "Punta Cana Sundays",
    date: "03/06",
    startTime: "",
    venueName: "FLYERS HQ",
    address: "297 GRODIFY ST • NEW YORK • NY • 07345",
    djs: "DJNAME × DJNAME",
    eventDetails: "DRESS CODE STRICTLY ENFORCED • BOTTLE SPECIALS & BIRTHDAY PACKAGES AVAILABLE",
    presenterName: "GRODIFY PRESENTS",
    rsvpContact: "978.000.0000",
    socialHandle: "@GRODIFY",
  },
  refinementPolicy: {
    fields: [
      "headlineSize", "headSize", "headManualPx", "headMaxPx", "headAlign", "align", "head2Size", "head2SizePx", "bodyFamily",
      "detailsFamily", "bodySize", "detailsSize", "detailsLineHeight", "detailsRotate",
      "detailsTracking", "bodyTracking", "detailsUppercase", "details2Family", "details2Color", "venueAddress",
      "venueSize", "rightRailSize", "leftRailX", "leftRailY", "cocoSocialHandleSize",
      "cocoSocialHandleAlign", "cocoSocialHandleRotation", "compliance", "complianceEnabled",
      "qrEnabled", "qrX", "qrY", "qrScale", "cocoRushVenueStyles",
      "cocoManualTextColorRoles", "headShadow", "headShadowStrength", "head2Shadow",
      "head2ShadowStrength", "detailsShadow", "detailsShadowStrength", "details2Shadow",
      "details2ShadowStrength", "venueShadow", "venueShadowStrength",
      "vignette", "vignetteStrength", "haze", "grade",
    ],
    compiledObjectOverrideFields: ["x", "y"],
    compiledAssetPatchFields: ["x", "y", "scale"],
    additionFields: [
      "id", "url", "x", "y", "scale", "opacity", "rotation", "locked", "blendMode",
      "isFlare", "isSticker", "isNightlifeGraphic", "isSocialIcon", "socialPlatform", "label",
      "layerOffset", "showLabel", "hitTestMode", "svgTemplate", "iconColor",
    ],
    additionIdPrefixes: ["flare_", "sticker_"],
  },
};

export const cocoCssMasterAdapter = puntaCanaSundaysCssMasterAdapter;

export async function buildPuntaCanaSundaysMaster(overrides = {}) {
  const result = await compileCssMaster(puntaCanaSundaysCssMasterAdapter, overrides);
  const destination = overrides.outputPath || outputPath;
  console.log(
    `Compiled ${destination.pathname || destination} from rendered CSS (${result.square.cocoCssCompiler.ir.objects.length} Square objects, ${result.story.cocoCssCompiler.ir.objects.length} Story objects)`,
  );
  return result;
}

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";
if (import.meta.url === invokedPath) await buildPuntaCanaSundaysMaster();
