import { pathToFileURL, fileURLToPath } from "node:url";
import { readFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright";
import { compileCssMaster } from "./lib/coco-css-master-compiler.mjs";
import { BLACK_GOLD_PARTY_RECIPE } from "../lib/recipes/blackGoldParty.ts";

const masterPath = new URL("../public/generated-flyers/black-gold-party-reference-master.html", import.meta.url);
const outputPath = new URL("../public/generated-flyers/black-gold-party.nflyer", import.meta.url);
const refinementPath = new URL("../public/generated-flyers/black-gold-party-refinements.json", import.meta.url);
const publicRoot = new URL("../public/", import.meta.url);

export const BLACK_GOLD_PARTY_REFINEMENT_FIELDS = [
  "align",
  "presenter", "presenterFamily", "presenterColor", "presenterSize", "presenterAlign",
  "presenterLineHeight", "presenterTracking", "presenterRotation", "presenterX", "presenterY", "presenterWidth",
  "headline", "headlineFamily", "headlineSize", "headlineLineHeight", "headlineBold", "headlineItalic",
  "headManualPx", "headSize", "headMaxPx", "headAlign", "headTracking", "headRotate", "headX", "headY",
  "headShadow", "headShadowStrength", "textFx",
  "head2", "head2line", "head2Family", "head2Color", "head2Size", "head2SizePx", "head2Align",
  "head2LineHeight", "head2Rotate", "head2X", "head2Y", "head2Alpha", "head2Shadow", "head2ShadowStrength", "head2Fx",
  "date", "dateFamily", "dateColor", "dateSize", "dateAlign", "dateLineHeight", "dateRotation", "dateX", "dateY",
  "time", "timeFamily", "timeColor", "timeSize", "timeAlign", "timeLineHeight", "timeRotation", "timeX", "timeY",
  "subtag", "subtagFamily", "subtagTextColor", "subtagSize", "subtagAlign", "subtagLineHeight", "subtagRotate",
  "subtagX", "subtagY", "subtagAlpha", "subtagBgColor", "subtagBold", "subtagItalic", "subtagUnderline",
  "subtagShadow", "subtagShadowStrength",
  "details", "detailsFamily", "detailsColor", "detailsSize", "detailsAlign", "detailsLineHeight", "detailsRotate",
  "detailsX", "detailsY", "detailsUppercase", "detailsBold", "detailsItalic", "detailsUnderline", "detailsTracking",
  "detailsShadow", "detailsShadowStrength", "detailsLabel", "detailsLabelSize", "detailsLabelColor", "detailsLabelBgColor", "detailsFx",
  "details2", "details2Family", "details2Color", "details2Size", "details2Align", "details2LineHeight", "details2Rotate",
  "details2X", "details2Y", "details2LetterSpacing", "details2Uppercase", "details2Bold", "details2Italic",
  "details2Underline", "details2Shadow", "details2ShadowStrength",
  "djLineupLabel", "djLineupLabelSize", "djLineupLabelColor", "djLineupLabelBgColor",
  "venue", "venueFamily", "venueColor", "venueSize", "venueAlign", "venueLineHeight", "venueRotate", "venueX", "venueY",
  "venueUppercase", "venueBold", "venueItalic", "venueShadow", "venueShadowStrength",
  "price", "priceFamily", "priceColor", "priceSize", "priceAlign", "priceLineHeight", "priceX", "priceY", "priceScale",
  "priceLabel", "priceLabelSize", "priceLabelColor", "priceLabelBgColor",
  "qrEnabled", "qrImageUrl", "qrScale", "qrX", "qrY",
  "cocoManualTextColorRoles",
  "haze", "grade", "leak", "vignette", "vignetteStrength", "textureOpacity", "clarity", "exp",
  "contrast", "saturation", "warmth", "tint", "gamma", "grain", "vibrance", "filmGrade", "pillAlpha",
];

export const blackGoldPartyCssMasterAdapter = {
  id: "black-gold-party",
  masterPath,
  outputPath,
  refinementPath,
  publicRoot,
  recipe: BLACK_GOLD_PARTY_RECIPE,
  requiredFonts: ["GoldDisplay", "GoldCondensed", "GoldSans", "GoldSansBold", "GoldBrush"],
  requiredRoles: ["presenter", "headline", "headline2", "date", "subtag", "venue", "djLineup", "time", "details", "price"],
  semanticRoles: {
    presenter: { semanticRole: "presenter", label: "Presenter" },
    headline: { semanticRole: "headline", label: "Black / Headline" },
    headline2: { semanticRole: "headline2", label: "Gold / Secondary Headline" },
    date: { semanticRole: "date", label: "Date" },
    party: { semanticRole: "subtag", label: "Party Title" },
    venue: { semanticRole: "venue", label: "Venue" },
    "dj-lineup": { semanticRole: "djLineup", label: "DJ Lineup" },
    time: { semanticRole: "time", label: "Start Time" },
    details: { semanticRole: "details", label: "Event Details" },
    price: { semanticRole: "price", label: "Entry Fee" },
  },
  fontMap: {
    GoldDisplay: "Anton",
    GoldCondensed: "Bebas Neue",
    GoldSans: "LEMONMILK-Regular",
    GoldSansBold: "LEMONMILK-Bold",
    GoldBrush: "Good Brush",
    presenter: "Bebas Neue",
    headline: "LEMONMILK-Bold",
    headline2: "LEMONMILK-Bold",
    date: "Anton",
    subtag: "Good Brush",
    venue: "Bebas Neue",
    djLineup: "Bebas Neue",
    time: "Bebas Neue",
    details: "Bebas Neue",
    price: "Bebas Neue",
  },
  eventBrief: {
    eventName: "Black Gold Party",
    date: "June 18 2027",
    startTime: "7PM",
    venueName: "Blast Electro Bar | NY",
    djs: "DJ Jerian & DJ Darabella",
    eventDetails: "Free Parking | Free For Ladies",
    presenterName: "Redsanity Club Presents",
    entryFee: "$12",
  },
  refinementPolicy: {
    fields: BLACK_GOLD_PARTY_REFINEMENT_FIELDS,
    lockedCompiledObjectIds: ["background"],
    compiledObjectOverrideFields: ["x", "y", "removed"],
    compiledAssetPatchFields: [
      "x", "y", "scale", "opacity", "rotation", "locked", "blendMode", "tint", "tintMode", "layerOffset",
    ],
    additionFields: [
      "id", "url", "x", "y", "scale", "opacity", "rotation", "locked", "blendMode",
      "isFlare", "isSticker", "isTexture", "isExtracted", "isLogo", "isBrandFace",
      "isShapeGraphic", "isDesignElement", "isSeparator", "isNightlifeGraphic",
      "label", "labelBg", "layerOffset", "showLabel", "hitTestMode", "svgTemplate", "iconColor", "tint", "tintMode",
    ],
    additionIdPrefixes: ["flare_", "sticker_", "design_"],
  },
};

export const cocoCssMasterAdapter = blackGoldPartyCssMasterAdapter;

async function renderBlackGoldPartyPreviews() {
  const browser = await chromium.launch({ headless: true });
  const root = fileURLToPath(publicRoot);
  const html = await readFile(fileURLToPath(masterPath));
  const exportRoot = resolve(root, "coco-references/recipe-exports");
  await mkdir(exportRoot, { recursive: true });
  try {
    for (const format of ["square", "story"]) {
      const height = format === "square" ? 1080 : 1920;
      const page = await browser.newPage({ viewport: { width: 1080, height }, deviceScaleFactor: 1 });
      await page.route("http://black-gold-party.local/**", async (route) => {
        const url = new URL(route.request().url());
        if (url.pathname === "/master.html") {
          await route.fulfill({ body: html, contentType: "text/html" });
          return;
        }
        const filePath = resolve(root, decodeURIComponent(url.pathname).replace(/^\/+/, ""));
        await route.fulfill({ body: await readFile(filePath) });
      });
      await page.goto(`http://black-gold-party.local/master.html?format=${format}`, { waitUntil: "networkidle" });
      await page.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all(Array.from(document.images).map((image) => image.decode().catch(() => undefined)));
        document.body.style.padding = "0";
        const canvas = document.querySelector("[data-coco-canvas]");
        if (canvas instanceof HTMLElement) canvas.style.width = "1080px";
      });
      await page.locator("[data-coco-canvas]").screenshot({
        path: resolve(exportRoot, format === "square" ? "black-gold-party-square.png" : "black-gold-party-story.jpg"),
        ...(format === "story" ? { type: "jpeg", quality: 95 } : { type: "png" }),
      });
      await page.close();
    }
  } finally {
    await browser.close();
  }
}

export async function buildBlackGoldPartyMaster(overrides = {}) {
  const result = await compileCssMaster(blackGoldPartyCssMasterAdapter, overrides);
  if (overrides.renderPreviews !== false) await renderBlackGoldPartyPreviews();
  const destination = overrides.outputPath || outputPath;
  console.log(`Compiled ${destination.pathname || destination} from rendered CSS (${result.square.cocoCssCompiler.ir.objects.length} Square objects, ${result.story.cocoCssCompiler.ir.objects.length} Story objects)`);
  return result;
}

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";
if (import.meta.url === invokedPath) await buildBlackGoldPartyMaster();
