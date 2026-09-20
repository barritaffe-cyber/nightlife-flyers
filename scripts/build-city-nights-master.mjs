import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";
import { readFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright";
import { compileCssMaster } from "./lib/coco-css-master-compiler.mjs";
import { CITY_NIGHTS_RECIPE } from "../lib/recipes/cityNights.ts";

const masterPath = new URL("../public/generated-flyers/city-nights-reference-master.html", import.meta.url);
const outputPath = new URL("../public/generated-flyers/city-nights.nflyer", import.meta.url);
const publicRoot = new URL("../public/", import.meta.url);

export const cityNightsCssMasterAdapter = {
  id: "city-nights",
  masterPath,
  outputPath,
  publicRoot,
  recipe: CITY_NIGHTS_RECIPE,
  requiredFonts: ["CityDisplay", "CityCondensed", "CitySans", "CitySansBold", "CityBrush"],
  requiredRoles: [
    "presenter",
    "headline",
    "headline2",
    "date",
    "time",
    "details",
    "djLineupLabel",
    "djLineup",
    "footerDetails",
    "venue",
    "address",
    "rsvpLabel",
    "rsvp",
    "subtag",
  ],
  semanticRoles: {
    presenter: { semanticRole: "presenter", label: "Presenter" },
    headline: { semanticRole: "headline", label: "City / Headline" },
    headline2: { semanticRole: "headline2", label: "Nights / Script Headline" },
    date: { semanticRole: "date", label: "Date" },
    doors: { semanticRole: "time", label: "Doors Open" },
    callout: { semanticRole: "details", label: "Event Callout" },
    "dj-lineup": { semanticRole: "djLineup", label: "DJ Lineup" },
    "music-policy": { semanticRole: "footerDetails", label: "Music Policy" },
    slogan: { semanticRole: "price", label: "Event Slogan" },
    venue: { semanticRole: "venue", label: "Venue" },
    address: { semanticRole: "address", label: "Address" },
    "music-label": { semanticRole: "djLineupLabel", label: "DJ Lineup Label" },
    "ticket-label": { semanticRole: "rsvpLabel", label: "Ticket Label" },
    "ticket-value": { semanticRole: "rsvp", label: "Ticket Contact" },
    age: { semanticRole: "subtag", label: "Age Restriction" },
  },
  fontMap: {
    CityDisplay: "Anton",
    CityCondensed: "Bebas Neue",
    CitySans: "LEMONMILK-Regular",
    CitySansBold: "LEMONMILK-Bold",
    CityBrush: "Good Brush",
    presenter: "LEMONMILK-Regular",
    headline: "Anton",
    headline2: "Good Brush",
    date: "Bebas Neue",
    time: "LEMONMILK-Regular",
    details: "LEMONMILK-Bold",
    djLineup: "LEMONMILK-Bold",
    djLineupLabel: "LEMONMILK-Bold",
    footerDetails: "LEMONMILK-Bold",
    venue: "LEMONMILK-Bold",
    address: "LEMONMILK-Regular",
    rsvpLabel: "LEMONMILK-Bold",
    rsvp: "LEMONMILK-Bold",
    social: "LEMONMILK-Bold",
    subtag: "LEMONMILK-Bold",
    price: "LEMONMILK-Regular",
  },
  eventBrief: {
    eventName: "City Nights",
    date: "Saturday June 22",
    startTime: "10PM",
    venueName: "Elite Lounge",
    address: "1234 West Madison St. • Chicago, IL 60607",
    djs: "DJ Hype X\nDJ Kenzo",
    eventDetails: "The Hottest Night In The City",
    presenterName: "Elite Nights Presents",
    ageRequirement: "18+",
    musicPolicy: "Hip Hop • Afrobeats • R&B • Trap",
    ticketLabel: "Tickets & Tables:",
    rsvpContact: "312.555.0199",
  },
};

export const cocoCssMasterAdapter = cityNightsCssMasterAdapter;

async function renderCityNightsPreviews() {
  const browser = await chromium.launch({ headless: true });
  const root = fileURLToPath(publicRoot);
  const html = await readFile(fileURLToPath(masterPath));
  const exportRoot = resolve(root, "coco-references/recipe-exports");
  await mkdir(exportRoot, { recursive: true });
  try {
    for (const format of ["square", "story"]) {
      const height = format === "square" ? 1080 : 1920;
      const page = await browser.newPage({ viewport: { width: 1080, height }, deviceScaleFactor: 1 });
      await page.route("http://city-nights.local/**", async (route) => {
        const url = new URL(route.request().url());
        if (url.pathname === "/master.html") {
          await route.fulfill({ body: html, contentType: "text/html" });
          return;
        }
        const filePath = resolve(root, decodeURIComponent(url.pathname).replace(/^\/+/, ""));
        await route.fulfill({ body: await readFile(filePath) });
      });
      await page.goto(`http://city-nights.local/master.html?format=${format}`, { waitUntil: "networkidle" });
      await page.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all(Array.from(document.images).map((image) => image.decode().catch(() => undefined)));
        document.body.style.padding = "0";
        const canvas = document.querySelector("[data-coco-canvas]");
        if (canvas instanceof HTMLElement) canvas.style.width = "1080px";
      });
      const canvas = page.locator("[data-coco-canvas]");
      await canvas.screenshot({
        path: resolve(exportRoot, format === "square" ? "city-nights-square.png" : "city-nights-story.jpg"),
        ...(format === "story" ? { type: "jpeg", quality: 94 } : { type: "png" }),
      });
      await page.close();
    }
  } finally {
    await browser.close();
  }
}

export async function buildCityNightsMaster(overrides = {}) {
  const result = await compileCssMaster(cityNightsCssMasterAdapter, overrides);
  if (overrides.renderPreviews !== false) await renderCityNightsPreviews();
  const destination = overrides.outputPath || outputPath;
  console.log(
    `Compiled ${destination.pathname || destination} from rendered CSS (${result.square.cocoCssCompiler.ir.objects.length} Square objects, ${result.story.cocoCssCompiler.ir.objects.length} Story objects)`,
  );
  return result;
}

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";
if (import.meta.url === invokedPath) await buildCityNightsMaster();
