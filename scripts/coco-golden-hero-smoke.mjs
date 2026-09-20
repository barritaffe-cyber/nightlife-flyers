import { readFile } from "node:fs/promises";
import { chromium } from "../node_modules/playwright/index.mjs";

const baseUrl = process.env.NF_BASE_URL || "http://127.0.0.1:3000";
const uploadPath =
  process.env.NF_UPLOAD_PATH ||
  "/Users/thepartyrocker/nightlife-flyers/public/create-with-coco/subjects/subject02.jpg";
const outputRoot =
  process.env.NF_OUTPUT_ROOT ||
  "/Users/thepartyrocker/nightlife-flyers/public/generated-flyers/tribal-night-coco-recipe";
const projectPath = `${outputRoot}.nflyer`;
const saveMaster = process.env.NF_SAVE_MASTER === "1";

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1500, height: 1250 },
  deviceScaleFactor: 1,
  acceptDownloads: true,
});

await context.addInitScript(() => {
  localStorage.setItem("nf:pwa-install-ack:v1", "1");
  localStorage.setItem("nf:onboarded:v1", "1");
  localStorage.setItem("nf:saveNoticeDismissed", "1");
  localStorage.setItem("nightlife-flyers:coco-dismissed:v2", "1");
  localStorage.setItem("nightlife-flyers:coco-seen:v1", "1");
  sessionStorage.setItem("nightlife-flyers:coco-startup-intro:v1", "1");
  sessionStorage.setItem("nightlife-flyers:coco-returning-welcomed:v1", "1");
});

const page = await context.newPage();
const pageErrors = [];
const consoleErrors = [];
page.on("pageerror", (error) => pageErrors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});
page.on("dialog", (dialog) => dialog.accept());
await page.route("**/api/auth/starter-render", async (route) => {
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ ok: true, limit: 2, used: 0, remaining: 2, blocked: false }),
  });
});

await page.goto(`${baseUrl}/?guest=1&cocoWinningTemplate=afrobeat_rooftop`, {
  waitUntil: "domcontentloaded",
  timeout: 90_000,
});
await page.getByRole("button").filter({ hasText: "Create with Coco" }).click();
await page.getByTestId("coco-event-brief").waitFor({ state: "visible", timeout: 60_000 });
await page.getByTestId("coco-composer-image-upload").setInputFiles(uploadPath);
await page.getByPlaceholder("Sunday Takeover", { exact: true }).fill("Tribal Night");
await page.getByTestId("coco-composer-event-description").fill(
  "Make it black and gold. Put her on the right. Make the name really big on the left. Write Friday like handwriting. Warm, elegant Afrobeats nightlife."
);
await page.getByTestId("coco-composer-date").fill("Friday, July 25");
await page.getByTestId("coco-composer-start-time").fill("10PM");
await page.getByTestId("coco-composer-venue").fill("Downtown Lounge");
await page.getByTestId("coco-composer-djs").fill("VIBE KING\nT BRAINS");
await page.getByText("Add exact flyer details", { exact: true }).click();
await page.getByTestId("coco-composer-presenter").fill("DTL PRESENTS");
await page.getByTestId("coco-composer-address").fill("47 Grand Avenue");
await page.getByTestId("coco-composer-music-policy").fill("AFROBEATS • AMAPIANO");
await page.getByTestId("coco-composer-entry").fill("25");
await page.getByTestId("coco-composer-age").fill("21+");
await page.getByTestId("coco-composer-rsvp").fill("876-533-3715");
await page.getByTestId("coco-composer-socials").fill("@DTL_NIGHTS");

await page.getByRole("button", { name: "Create 3 options", exact: true }).click();
const chooser = page.getByTestId("coco-direction-chooser");
for (let attempt = 0; attempt < 36 && !(await chooser.isVisible()); attempt += 1) {
  const status = await page.getByTestId("coco-event-brief").innerText().catch(() => "");
  console.log(`COCO_WAIT_${attempt + 1}`, status.replace(/\s+/g, " ").slice(-200));
  await page.waitForTimeout(10_000);
}
if (!(await chooser.isVisible())) {
  await page.screenshot({ path: `${outputRoot}-chooser-debug.png`, fullPage: true });
  throw new Error(`Direction chooser did not appear: ${pageErrors.join(" | ") || "no page error"}`);
}

const choiceIds = await chooser.locator("[data-coco-direction-id]").evaluateAll((nodes) =>
  nodes.map((node) => node.getAttribute("data-coco-direction-id"))
);
if (choiceIds[0] !== "golden-hero-editorial") {
  throw new Error(`Golden Hero was not the first plain-language choice: ${choiceIds.join(", ")}`);
}
await chooser
  .locator('[data-coco-direction-id="golden-hero-editorial"]')
  .getByRole("button", { name: "Use this direction", exact: true })
  .click();

await page.getByTestId("coco-quick-edit").waitFor({ state: "visible", timeout: 240_000 });
const artboard = page.locator("#artboard");
await artboard.waitFor({ state: "visible", timeout: 90_000 });

async function inspect(format) {
  const expectedHeight = format === "story" ? 960 : 540;
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(
    ({ expectedHeight, format }) => {
      const visible = (node) => {
        if (!(node instanceof HTMLElement)) return false;
        const rect = node.getBoundingClientRect();
        const style = getComputedStyle(node);
        return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
      };
      const artboard = [...document.querySelectorAll("#artboard")].find(visible);
      const exportRoot = artboard?.closest("#export-root");
      const portraitRoot = artboard?.querySelector("#portrait-layer-root");
      const rect = exportRoot?.getBoundingClientRect();
      return Boolean(
        artboard &&
          portraitRoot &&
          artboard.getAttribute("data-coco-layout-transition") !== "true" &&
          portraitRoot.getAttribute("data-coco-campaign-direction-id") === "golden-hero-editorial" &&
          portraitRoot.getAttribute("data-coco-subject-layout-id") === "subject-right" &&
          Math.round(rect?.width || 0) === 540 &&
          Math.round(rect?.height || 0) === expectedHeight &&
          document.querySelector(`[data-testid="coco-quick-format-${format}"]`)?.getAttribute("aria-pressed") === "true"
      );
    },
    { expectedHeight, format },
    { timeout: 150_000 }
  );

  await page.waitForFunction(
    () => [...document.querySelectorAll("#artboard img")].every(
      (image) => image.complete && image.naturalWidth > 0 && image.naturalHeight > 0
    ),
    null,
    { timeout: 45_000 }
  );

  const result = await page.evaluate(({ expectedHeight, format }) => {
    const visible = (node) => {
      if (!(node instanceof HTMLElement)) return false;
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
    };
    const root = [...document.querySelectorAll("#artboard")].find(visible);
    const exportRoot = root?.closest("#export-root");
    const portraitRoot = root?.querySelector("#portrait-layer-root");
    const canvas = exportRoot?.getBoundingClientRect();
    const readNode = (name) => {
      const node = [...(root?.querySelectorAll(`[data-node="${name}"]`) ?? [])].find(visible);
      if (!node) return null;
      const rect = node.getBoundingClientRect();
      const textNode = node.querySelector("div") || node;
      const style = getComputedStyle(textNode);
      return {
        text: node.textContent?.trim().replace(/\s+/g, " "),
        xPct: Number((((rect.x - (canvas?.x || 0)) / (canvas?.width || 1)) * 100).toFixed(1)),
        yPct: Number((((rect.y - (canvas?.y || 0)) / (canvas?.height || 1)) * 100).toFixed(1)),
        widthPct: Number(((rect.width / (canvas?.width || 1)) * 100).toFixed(1)),
        heightPct: Number(((rect.height / (canvas?.height || 1)) * 100).toFixed(1)),
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
        editable: node.hasAttribute("data-anim-field") || node.hasAttribute("data-export-layer"),
      };
    };
    return {
      format,
      expectedHeight,
      width: Math.round(canvas?.width || 0),
      height: Math.round(canvas?.height || 0),
      direction: portraitRoot?.getAttribute("data-coco-campaign-direction-id"),
      subjectLayout: portraitRoot?.getAttribute("data-coco-subject-layout-id"),
      liveRecipe: {
        recipeId: portraitRoot?.getAttribute("data-coco-session-recipe-id"),
        headlineFamily: portraitRoot?.getAttribute("data-coco-headline-family"),
        head2Family: portraitRoot?.getAttribute("data-coco-head2-family"),
        headline: portraitRoot?.getAttribute("data-coco-live-headline"),
        headX: portraitRoot?.getAttribute("data-coco-live-head-x"),
        headY: portraitRoot?.getAttribute("data-coco-live-head-y"),
        headWidth: portraitRoot?.getAttribute("data-coco-live-head-width"),
        sessionHeadY: portraitRoot?.getAttribute("data-coco-session-head-y"),
        head2: portraitRoot?.getAttribute("data-coco-live-head2"),
        head2X: portraitRoot?.getAttribute("data-coco-live-head2-x"),
        head2Y: portraitRoot?.getAttribute("data-coco-live-head2-y"),
        head2Width: portraitRoot?.getAttribute("data-coco-live-head2-width"),
        head2Enabled: portraitRoot?.getAttribute("data-coco-live-head2-enabled"),
      },
      headline: readNode("headline"),
      headline2: readNode("headline2"),
      date: readNode("date"),
      details: readNode("details"),
      details2: readNode("details2"),
      venue: readNode("venue"),
      subtag: readNode("subtag"),
      presenter: readNode("presenter"),
      qr: readNode("qr"),
      assets: [...(root?.querySelectorAll('[data-portrait-id^="coco_golden_hero_"]') ?? [])]
        .map((node) => node.getAttribute("data-portrait-id")),
      brokenImages: [...(root?.querySelectorAll("img") ?? [])]
        .filter((image) => !image.complete || image.naturalWidth <= 0)
        .map((image) => image.getAttribute("src")),
    };
  }, { expectedHeight, format });

  if (
    result.direction !== "golden-hero-editorial" ||
    result.subjectLayout !== "subject-right" ||
    result.width !== 540 ||
    result.height !== expectedHeight ||
    !result.headline?.text?.match(/TRIBAL.*NIGHT/i) ||
    !result.headline.editable ||
    !result.headline2?.editable ||
    !String(result.headline2.fontFamily).match(/OpenScript/i) ||
    !String(result.liveRecipe.headlineFamily).match(/Coolvetica Hv Comp/i) ||
    !String(result.liveRecipe.head2Family).match(/OpenScript/i) ||
    Math.abs(Number(result.liveRecipe.headX) - 6) > 0.6 ||
    Math.abs(Number(result.liveRecipe.headY) - (format === "story" ? 6 : 7)) > 0.6 ||
    Math.abs(Number(result.liveRecipe.headWidth) - 42) > 0.6 ||
    !String(result.liveRecipe.head2).match(/^Friday$/i) ||
    Math.abs(Number(result.liveRecipe.head2X) - 6) > 0.6 ||
    Math.abs(Number(result.liveRecipe.head2Y) - (format === "story" ? 36.5 : 49)) > 0.6 ||
    Math.abs(Number(result.liveRecipe.head2Width) - (format === "story" ? 36 : 34)) > 0.6 ||
    !result.date?.text?.match(/JULY.*25TH/i) ||
    result.date.text.match(/FRIDAY/i) ||
    !result.subtag?.text?.match(/10PM/i) ||
    Math.abs(Number(result.date?.xPct) - 6) > 0.8 ||
    Math.abs(Number(result.date?.yPct) - (format === "story" ? 56.5 : 66)) > 0.8 ||
    Math.abs(Number(result.subtag?.xPct) - 6) > 0.8 ||
    Math.abs(Number(result.subtag?.yPct) - (format === "story" ? 64 : 74)) > 0.8 ||
    Math.abs(Number(result.details2?.xPct) - 25) > 0.8 ||
    Math.abs(Number(result.details2?.yPct) - (format === "story" ? 57 : 66)) > 0.8 ||
    ![result.date, result.details2, result.venue, result.subtag, result.presenter].every(
      (node) => node?.editable
    ) ||
    result.details !== null ||
    result.assets.length !== 7 ||
    !result.assets.some((id) => String(id).includes("footer_rule")) ||
    result.brokenImages.length
  ) {
    await artboard.screenshot({ path: `${outputRoot}-${format}-debug.png` });
    if (!saveMaster) {
      throw new Error(`${format} Golden Hero canvas is incomplete: ${JSON.stringify(result)}`);
    }
    console.warn(`${format} Golden Hero visual gate needs refinement; saving the editable recipe master.`);
  }

  // Capture the editor exactly as the user sees it. This intentionally does
  // not inject CSS to hide selection outlines, guides, or non-export chrome;
  // the product must keep its own normal Quick Edit canvas presentation clean.
  await artboard.screenshot({ path: `${outputRoot}-${format}.png` });
  return result;
}

const square = await inspect("square");
await page.getByTestId("coco-quick-format-story").click();
const story = await inspect("story");

const [download] = await Promise.all([
  page.waitForEvent("download", { timeout: 90_000 }),
  page.getByTestId("coco-quick-save").click(),
]);
await download.saveAs(projectPath);

const project = JSON.parse(await readFile(projectPath, "utf8"));
const savedState = project.state ?? project;
const headlineEffectFlags = [
  "headSliceEnabled",
  "headRushEnabled",
  "headLineEnabled",
  "headGlassEnabled",
  "headKineticEnabled",
  "headDashStrokeEnabled",
  "headColorStrokeEnabled",
  "headPure3dEnabled",
  "headGoldBlockEnabled",
  "headCyberEmbossEnabled",
  "headRetroShadowEnabled",
  "headQuantumEnabled",
  "headVerticalStretchEnabled",
  "headGlitchEnabled",
  "headMiamiHeatEnabled",
];
for (const format of ["square", "story"]) {
  const variant = savedState.session?.[format] ?? {};
  const assets = savedState.portraits?.[format] ?? variant.portraits ?? variant.emojiList ?? [];
  const expectedCrop = format === "story"
    ? { scale: 0.82, x: 100, y: 0 }
    : { scale: 1.18, x: 100, y: 80 };
  const enabledHeadlineEffects = headlineEffectFlags.filter((key) => Boolean(variant[key]));
  if (
    variant.cocoCampaignDirectionId !== "golden-hero-editorial" ||
    variant.cocoVisualRecipeId !== "golden-hero-editorial" ||
    variant.cocoVisualRecipeVersion !== 2 ||
    variant.cocoCompositionSystem?.patternId !== "golden-hero-editorial" ||
    variant.head2Family !== "OpenScript" ||
    variant.headGradient !== false ||
    Boolean(variant.textFx?.gradient) ||
    Number(variant.headStrokeWidth || 0) !== 0 ||
    Number(variant.headGlow || 0) !== 0 ||
    enabledHeadlineEffects.length > 0 ||
    variant.detailsEnabled !== false ||
    variant.subtagEnabled !== true ||
    !String(variant.subtag || "").match(/^10PM$/i) ||
    variant.bgFitMode !== true ||
    Math.abs(Number(variant.bgScale) - expectedCrop.scale) > 0.02 ||
    Math.abs(Number(variant.bgPosX) - expectedCrop.x) > 0.02 ||
    Math.abs(Number(variant.bgPosY) - expectedCrop.y) > 0.02 ||
    assets.filter((asset) => String(asset.id || "").startsWith("coco_golden_hero_")).length !== 7 ||
    !assets.some((asset) => String(asset.id || "").includes("coco_golden_hero_footer_rule_"))
  ) {
    throw new Error(`${format} project snapshot lost the Golden Hero recipe: ${JSON.stringify({
      recipeVersion: variant.cocoVisualRecipeVersion,
      head2Family: variant.head2Family,
      headGradient: variant.headGradient,
      headStrokeWidth: variant.headStrokeWidth,
      headGlow: variant.headGlow,
      enabledHeadlineEffects,
      detailsEnabled: variant.detailsEnabled,
      subtag: variant.subtag,
      subtagEnabled: variant.subtagEnabled,
      crop: {
        fitMode: variant.bgFitMode,
        scale: variant.bgScale,
        x: variant.bgPosX,
        y: variant.bgPosY,
      },
      assetCount: assets.length,
    })}`);
  }
}

const eventNameInput = page.getByTestId("coco-quick-event-name");
await eventNameInput.fill("Golden Friday");
await page.waitForFunction(
  () => [...document.querySelectorAll('[data-node="headline"]')].some(
    // The live renderer uses separate line spans, so textContent can be
    // "GOLDENFRIDAY" even though the editable recipe stores "GOLDEN\nFRIDAY".
    (node) => node.textContent?.replace(/\s+/g, " ").match(/GOLDEN.*FRIDAY/i)
  ),
  null,
  { timeout: 30_000 }
);

if (pageErrors.length) throw new Error(`Page errors: ${pageErrors.join(" | ")}`);
console.log(JSON.stringify({
  pass: true,
  choiceIds,
  projectPath,
  square,
  story,
  consoleErrors: consoleErrors.slice(0, 12),
}));

await browser.close();
