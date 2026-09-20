import { pathToFileURL, fileURLToPath } from "node:url";
import { readFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright";
import { compileCssMaster } from "./lib/coco-css-master-compiler.mjs";
import { GREY_RAVE_FESTIVAL_RECIPE } from "../lib/recipes/greyRaveFestival.ts";

const masterPath = new URL("../public/generated-flyers/grey-rave-reference-master.html", import.meta.url);
const outputPath = new URL("../public/generated-flyers/grey-rave-festival.nflyer", import.meta.url);
const publicRoot = new URL("../public/", import.meta.url);

export const greyRaveFestivalCssMasterAdapter = {
  id: "grey-rave-festival", masterPath, outputPath, publicRoot, recipe: GREY_RAVE_FESTIVAL_RECIPE,
  requiredFonts: ["RaveWide", "RaveRegular", "RaveBrush"],
  requiredRoles: ["date", "headline", "headline2", "djLineupLabel", "djLineup", "address", "venue", "compliance", "price", "social", "footerDetails"],
  semanticRoles: {
    background: { editable: false, label: "Locked Background" },
    date: { semanticRole: "date", label: "Date" }, headline: { semanticRole: "headline", label: "Rave / Headline" },
    headline2: { semanticRole: "headline2", label: "Festival / Secondary Headline" }, "dj-lineup-label": { semanticRole: "djLineupLabel", label: "Lineup Label" },
    "dj-lineup": { semanticRole: "djLineup", label: "Artist Lineup" }, "venue-kicker": { semanticRole: "address", label: "Venue Kicker" }, venue: { semanticRole: "venue", label: "Venue Name" },
    "age-restriction": { semanticRole: "compliance", label: "Age Requirement" }, entry: { semanticRole: "price", label: "Entry Price" }, "social-handle": { semanticRole: "social", label: "Social Handle" }, "footer-message": { semanticRole: "footerDetails", label: "Footer Message" },
  },
  fontMap: { RaveWide: "LEMONMILK-Bold", RaveRegular: "LEMONMILK-Regular", RaveBrush: "Road Rage", date: "LEMONMILK-Bold", headline: "Road Rage", headline2: "LEMONMILK-Bold", djLineupLabel: "Road Rage", djLineup: "LEMONMILK-Regular", address: "Road Rage", venue: "LEMONMILK-Regular", compliance: "LEMONMILK-Bold", price: "LEMONMILK-Regular", social: "LEMONMILK-Bold", footerDetails: "LEMONMILK-Bold" },
  eventBrief: { eventName: "Rave Festival", date: "Sat 28 May", venueName: "Zona Noble", address: "Pilare", djs: "Dormun\nFran Di Rocco\nTato Lerner\nThomy Dome", ageRequirement: "18+", entryFee: "$20", entryLabel: "ENTRY", entryLabelSize: 8, socials: "@rave.festivall", eventDetails: "Keep The Date" },
};

export const cocoCssMasterAdapter = greyRaveFestivalCssMasterAdapter;

async function renderPreviews() {
  const browser = await chromium.launch({ headless: true });
  const root = fileURLToPath(publicRoot); const html = await readFile(fileURLToPath(masterPath));
  const exportRoot = resolve(root, "coco-references/recipe-exports"); await mkdir(exportRoot, { recursive: true });
  try {
    for (const format of ["square", "story"]) {
      const height = format === "square" ? 1080 : 1920;
      const page = await browser.newPage({ viewport: { width: 1080, height }, deviceScaleFactor: 1 });
      await page.route("http://grey-rave.local/**", async (route) => { const url = new URL(route.request().url()); if (url.pathname === "/master.html") return route.fulfill({ body: html, contentType: "text/html" }); const filePath = resolve(root, decodeURIComponent(url.pathname).replace(/^\/+/, "")); await route.fulfill({ body: await readFile(filePath) }); });
      await page.goto(`http://grey-rave.local/master.html?format=${format}`, { waitUntil: "networkidle" });
      await page.evaluate(async () => { await document.fonts.ready; await Promise.all(Array.from(document.images).map((image) => image.decode().catch(() => undefined))); document.body.style.padding = "0"; const canvas = document.querySelector("[data-coco-canvas]"); if (canvas instanceof HTMLElement) canvas.style.width = "1080px"; });
      await page.locator("[data-coco-canvas]").screenshot({ path: resolve(exportRoot, format === "square" ? "grey-rave-festival-square.png" : "grey-rave-festival-story.jpg"), ...(format === "story" ? { type: "jpeg", quality: 95 } : { type: "png" }) });
      await page.close();
    }
  } finally { await browser.close(); }
}

export async function buildGreyRaveFestivalMaster(overrides = {}) {
  const result = await compileCssMaster(greyRaveFestivalCssMasterAdapter, overrides);
  if (overrides.renderPreviews !== false) await renderPreviews();
  console.log(`Compiled Grey Rave Festival (${result.square.cocoCssCompiler.ir.objects.length} Square objects, ${result.story.cocoCssCompiler.ir.objects.length} Story objects)`);
  return result;
}

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";
if (import.meta.url === invokedPath) await buildGreyRaveFestivalMaster();
