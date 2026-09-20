import { readFile } from "node:fs/promises";
import { chromium } from "../node_modules/playwright/index.mjs";

const baseUrl = process.env.NF_BASE_URL || "http://127.0.0.1:3003";
const uploadPath =
  process.env.NF_UPLOAD_PATH ||
  "/Users/thepartyrocker/nightlife-flyers/public/create-with-coco/backgrounds/background05.jpg";
const outputRoot =
  process.env.NF_OUTPUT_ROOT ||
  "/Users/thepartyrocker/nightlife-flyers/public/generated-flyers/rush-night-coco";
const projectPath = `${outputRoot}.nflyer`;
const authEmail = String(process.env.NF_COCO_EMAIL || "").trim();
const authPassword = String(process.env.NF_COCO_PASSWORD || "");
if (Boolean(authEmail) !== Boolean(authPassword)) {
  throw new Error("Authenticated smoke login requires both NF_COCO_EMAIL and NF_COCO_PASSWORD.");
}
const authenticatedSmoke = Boolean(authEmail && authPassword);
const redactCredentials = (value) => {
  let redacted = String(value ?? "");
  for (const secret of [authEmail, authPassword]) {
    if (secret) redacted = redacted.replaceAll(secret, "[REDACTED]");
  }
  return redacted;
};

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1500, height: 1300 },
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
page.on("pageerror", (error) => pageErrors.push(redactCredentials(error.message)));
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(redactCredentials(message.text()));
});
page.on("dialog", (dialog) => dialog.accept());
await page.route("**/api/auth/starter-render", async (route) => {
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ ok: true, limit: 2, used: 0, remaining: 2, blocked: false }),
  });
});

if (authenticatedSmoke) {
  const loginUrl = new URL("/login", baseUrl);
  loginUrl.searchParams.set("mode", "login");
  loginUrl.searchParams.set("next", "/");
  await page.goto(loginUrl.toString(), {
    waitUntil: "domcontentloaded",
    timeout: 90_000,
  });
  const emailInput = page.getByPlaceholder("Email", { exact: true });
  const passwordInput = page.getByPlaceholder("Password", { exact: true });
  await emailInput.waitFor({ state: "visible", timeout: 60_000 });
  await page.waitForTimeout(1_200);
  await emailInput.fill(authEmail);
  await emailInput.press("Tab");
  await passwordInput.fill(authPassword);
  await passwordInput.press("Tab");
  await page.getByRole("button", { name: "Login", exact: true }).click();
  await page.waitForURL(
    (url) => url.origin === new URL(baseUrl).origin && url.pathname !== "/login",
    { timeout: 90_000 }
  );
  console.log("COCO_AUTH", "authenticated session ready");
}

const studioUrl = authenticatedSmoke
  ? new URL("/", baseUrl).toString()
  : new URL("/?guest=1", baseUrl).toString();
await page.goto(studioUrl, {
  waitUntil: "domcontentloaded",
  timeout: 90_000,
});
const createWithCoco = page.getByRole("button").filter({ hasText: "Create with Coco" });
const startupErrorBoundary = page.getByText("Something went wrong", { exact: true });
try {
  const startupOutcome = await Promise.race([
    createWithCoco.waitFor({ state: "visible", timeout: 120_000 }).then(() => "ready"),
    startupErrorBoundary.waitFor({ state: "visible", timeout: 120_000 }).then(() => "error"),
  ]);
  if (startupOutcome === "error") throw new Error("Studio rendered its startup error boundary.");
} catch (error) {
  await page.screenshot({ path: `${outputRoot}-startup-debug.png`, fullPage: true });
  console.error("COCO_STARTUP_URL", page.url());
  console.error(
    "COCO_STARTUP_TEXT",
    String(await page.locator("body").innerText().catch(() => "")).replace(/\s+/g, " ").slice(0, 1200)
  );
  console.error("COCO_STARTUP_PAGE_ERRORS", pageErrors.slice(-8));
  console.error("COCO_STARTUP_CONSOLE_ERRORS", consoleErrors.slice(-8));
  throw error;
}
await createWithCoco.click();
await page.getByTestId("coco-event-brief").waitFor({ state: "visible", timeout: 60_000 });
await page.getByTestId("coco-composer-image-upload").setInputFiles(uploadPath);
await page.getByPlaceholder("Sunday Takeover", { exact: true }).fill("Rush Night");
await page.getByTestId("coco-composer-event-description").fill(
  "An intense orange neon triangle around a stylish nightlife portrait. Oversized distressed Rush title, handwritten Night accent, dark premium tech house club energy."
);
await page.getByTestId("coco-composer-date").fill("Saturday, May 24");
await page.getByTestId("coco-composer-start-time").fill("11PM");
await page.getByTestId("coco-composer-venue").fill("47 Grand Avenue · Downtown");
await page.getByTestId("coco-composer-djs").fill("DJ NOVA, DJ KAIRO, DJ VYBE");
await page.getByText("Add exact flyer details", { exact: true }).click();
await page.getByTestId("coco-composer-presenter").fill("NOVA GROUP");
await page.getByTestId("coco-composer-address").fill("NOVA ROOM · NEW YORK");
await page.getByTestId("coco-composer-music-policy").fill(
  "TECH HOUSE, HOUSE, AFRO HOUSE"
);
await page.getByTestId("coco-composer-entry").fill("20");
await page.getByTestId("coco-composer-age").fill("21");

const createButton = page.getByRole("button", { name: "Create 3 options", exact: true });
await createButton.scrollIntoViewIfNeeded();
await page.waitForTimeout(1_200);
console.log("COCO_CREATE_BUTTONS", await createButton.count(), await createButton.isEnabled());
await createButton.click({ force: true });
await page.waitForTimeout(1_500);
if ((await createButton.count()) && (await createButton.isVisible())) {
  await createButton.evaluate((button) => button.click());
}
const chooser = page.getByTestId("coco-direction-chooser");
for (let attempt = 0; attempt < 36 && !(await chooser.isVisible()); attempt += 1) {
  const status = await page.getByTestId("coco-event-brief").innerText().catch(() => "");
  const error = await page.locator(".text-rose-200").first().textContent().catch(() => "");
  const createState = await createButton.textContent().catch(() => "direction-ready");
  console.log(
    `COCO_WAIT_${attempt + 1}`,
    String(createState).trim(),
    String(error).trim(),
    status.replace(/\s+/g, " ").slice(-200)
  );
  if (error && attempt >= 1) break;
  await page.waitForTimeout(10_000);
}
if (!(await chooser.isVisible())) {
  await page.screenshot({ path: `${outputRoot}-chooser-debug.png`, fullPage: true });
  throw new Error(`Direction chooser did not appear: ${pageErrors.join(" | ") || "no page error"}`);
}

const choiceIds = await chooser.locator("[data-coco-direction-id]").evaluateAll((nodes) =>
  nodes.map((node) => node.getAttribute("data-coco-direction-id"))
);
if (!choiceIds.includes("high-energy-club")) {
  throw new Error(`High Energy Club was not offered: ${choiceIds.join(", ")}`);
}
await chooser
  .locator('[data-coco-direction-id="high-energy-club"]')
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
      const root = [...document.querySelectorAll("#artboard")].find(visible);
      const exportRoot = root?.closest("#export-root");
      const portraitRoot = root?.querySelector("#portrait-layer-root");
      const rect = exportRoot?.getBoundingClientRect();
      return Boolean(
        root &&
          portraitRoot &&
          root.getAttribute("data-coco-layout-transition") !== "true" &&
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
      const textNodes = [node, ...node.querySelectorAll("div, span")]
        .filter((candidate) => visible(candidate) && !candidate.closest("[data-nonexport]"))
        .sort((left, right) =>
          Number.parseFloat(getComputedStyle(right).fontSize) -
          Number.parseFloat(getComputedStyle(left).fontSize)
        );
      const style = getComputedStyle(textNodes[0] || node);
      const clone = node.cloneNode(true);
      clone.querySelectorAll?.("[data-nonexport]").forEach((candidate) => candidate.remove());
      return {
        text: clone.textContent?.trim().replace(/\s+/g, " "),
        xPct: Number((((rect.x - (canvas?.x || 0)) / (canvas?.width || 1)) * 100).toFixed(1)),
        yPct: Number((((rect.y - (canvas?.y || 0)) / (canvas?.height || 1)) * 100).toFixed(1)),
        widthPct: Number(((rect.width / (canvas?.width || 1)) * 100).toFixed(1)),
        heightPct: Number(((rect.height / (canvas?.height || 1)) * 100).toFixed(1)),
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
        color: style.color,
        backgroundColor: style.backgroundColor,
        ringEnabled: node.getAttribute("data-price-ring-enabled"),
        ringAlpha: node.getAttribute("data-price-ring-alpha"),
        editable: node.hasAttribute("data-anim-field") || node.hasAttribute("data-export-layer"),
      };
    };
    const allAssets = [...(root?.querySelectorAll("[data-portrait-id]") ?? [])]
      .map((node) => node.getAttribute("data-portrait-id"))
      .filter(Boolean);
    return {
      format,
      width: Math.round(canvas?.width || 0),
      height: Math.round(canvas?.height || 0),
      direction: portraitRoot?.getAttribute("data-coco-campaign-direction-id"),
      subjectLayout: portraitRoot?.getAttribute("data-coco-subject-layout-id"),
      recipeId: portraitRoot?.getAttribute("data-coco-session-recipe-id"),
      materializedVersion: portraitRoot?.getAttribute("data-coco-session-recipe-materialized-version"),
      headline: readNode("headline"),
      headline2: readNode("headline2"),
      date: readNode("date"),
      details: readNode("details"),
      details2: readNode("details2"),
      venue: readNode("venue"),
      subtag: readNode("subtag"),
      entryPrimary: readNode("entryPrimary"),
      entrySecondary: readNode("rightRail"),
      presenter: readNode("presenter"),
      compliance: readNode("compliance"),
      musicBy: readNode("djLineupLabel"),
      signoff: readNode("socialHandle"),
      qr: readNode("qr"),
      price: readNode("price"),
      recipeAssets: allAssets.filter((id) => id.startsWith("coco_rush_night_")),
      subjectAssets: allAssets.filter((id) => id.startsWith("coco_recipe_subject_")),
      genericAssets: allAssets.filter(
        (id) => !id.startsWith("coco_rush_night_") && !id.startsWith("coco_recipe_subject_")
      ),
      brokenImages: [...(root?.querySelectorAll("img") ?? [])]
        .filter((image) => !image.complete || image.naturalWidth <= 0)
        .map((image) => image.getAttribute("src")),
      expectedHeight,
    };
  }, { expectedHeight, format });

  const requiredEditable = [
    result.headline,
    result.headline2,
    result.date,
    result.details,
    result.details2,
    result.venue,
    result.subtag,
    result.entrySecondary,
    result.price,
    result.presenter,
    result.signoff,
  ];
  const expectedGeometry = format === "story"
    ? {
        headline: { y: 46, width: 62 },
        script: { y: 61.2 },
        details: { y: 73.87 },
        details2: { y: 77.1 },
        subtag: { y: 85.2 },
        entrySecondary: { y: 87.3 },
        price: { x: 58.6 },
        venue: { y: 90.55 },
      }
    : {
        headline: { y: 48, width: 80 },
        script: { y: 59 },
        details: { y: 72.77 },
        details2: { y: 76.3 },
        subtag: { y: 85.82 },
        entrySecondary: { y: 88.6 },
        price: { x: 59.7 },
        venue: { y: 92.3 },
      };
  const near = (actual, expected, tolerance = 2) =>
    Number.isFinite(actual) && Math.abs(actual - expected) <= tolerance;
  const scriptBottom = Number(result.headline2?.yPct) + Number(result.headline2?.heightPct);
  const entryPrimaryRight = Number(result.entryPrimary?.xPct) + Number(result.entryPrimary?.widthPct);
  const priceLeft = Number(result.price?.xPct);
  const geometryValid = Boolean(
    near(result.headline?.yPct, expectedGeometry.headline.y, 2.5) &&
    near(result.headline?.widthPct, expectedGeometry.headline.width, 2.5) &&
    near(result.headline2?.yPct, expectedGeometry.script.y, 3.5) &&
    near(result.details?.yPct, expectedGeometry.details.y, 2) &&
    near(result.details2?.yPct, expectedGeometry.details2.y, 2) &&
    near(result.subtag?.yPct, expectedGeometry.subtag.y, 2) &&
    near(result.entrySecondary?.yPct, expectedGeometry.entrySecondary.y, 2) &&
    near(result.price?.xPct, expectedGeometry.price.x, 2) &&
    near(result.venue?.yPct, expectedGeometry.venue.y, 2) &&
    scriptBottom <= Number(result.details?.yPct) + 1.5 &&
    Number(result.headline?.yPct) < Number(result.headline2?.yPct) &&
    Number(result.headline2?.yPct) < Number(result.details?.yPct) &&
    Number(result.details?.yPct) < Number(result.details2?.yPct) &&
    Number(result.details2?.yPct) < Number(result.subtag?.yPct) &&
    Number(result.subtag?.yPct) < Number(result.entrySecondary?.yPct) &&
    Number(result.entrySecondary?.yPct) < Number(result.venue?.yPct) &&
    entryPrimaryRight <= priceLeft - 0.2 &&
    Number.parseFloat(result.details?.fontSize || "0") >= 9 &&
    Number.parseFloat(result.details2?.fontSize || "0") >= (format === "story" ? 20 : 18)
  );
  if (
    result.recipeId !== "rush-night-css" ||
    result.materializedVersion !== "9" ||
    result.subjectLayout !== "subject-right" ||
    result.width !== 540 ||
    result.height !== expectedHeight ||
    !result.headline?.text?.match(/^RUSH$/i) ||
    !String(result.headline.fontFamily).match(/BAD GRUNGE/i) ||
    !result.headline2?.text?.match(/^Night$/i) ||
    !String(result.headline2.fontFamily).match(/OpenScript/i) ||
    !result.date?.text?.match(/SAT\s*24\s*MAY\s*OPEN 23H/i) ||
    !result.details?.text?.match(/TECH HOUSE.*HOUSE.*AFRO HOUSE/i) ||
    !result.details2?.text?.match(/MUSIC BY.*DJ NOVA.*DJ KAIRO.*DJ VYBE/i) ||
    !result.venue?.text?.match(/47 GRAND AVENUE.*NOVA ROOM/i) ||
    !result.subtag?.text?.match(/^ENTRY UNTIL 00H30$/i) ||
    /AFTER|\$30/i.test(result.subtag?.text || "") ||
    !result.entrySecondary?.text?.match(/^AFTER 00H30 \$30$/i) ||
    !result.price?.text?.match(/^\$20$/i) ||
    result.price?.ringEnabled !== "false" ||
    Math.abs(Number(result.price?.ringAlpha) - 0.72) > 0.001 ||
    result.compliance !== null ||
    !result.musicBy?.text?.match(/^MUSIC BY$/i) ||
    !String(result.musicBy?.color).match(/rgb\(255,\s*90,\s*10\)/i) ||
    !requiredEditable.every((node) => node?.editable) ||
    !geometryValid ||
    result.qr !== null ||
    result.recipeAssets.length !== 9 ||
    result.genericAssets.length !== 0 ||
    result.brokenImages.length
  ) {
    await artboard.screenshot({ path: `${outputRoot}-${format}-debug.png` });
    throw new Error(`${format} Rush Night canvas is incomplete: ${JSON.stringify(result)}`);
  }

  await artboard.screenshot({ path: `${outputRoot}-${format}.png` });
  return result;
}

const square = await inspect("square");
await page.getByTestId("coco-quick-format-story").click();
const story = await inspect("story");
await page.getByTestId("coco-quick-format-square").click();
const squareRoundTrip = await inspect("square");

const [download] = await Promise.all([
  page.waitForEvent("download", { timeout: 90_000 }),
  page.getByTestId("coco-quick-save").click(),
]);
await download.saveAs(projectPath);

const project = JSON.parse(await readFile(projectPath, "utf8"));
const savedState = project.state ?? project;
for (const format of ["square", "story"]) {
  const variant = savedState.session?.[format] ?? {};
  const assets = savedState.portraits?.[format] ?? variant.portraits ?? variant.emojiList ?? [];
  const recipeAssets = assets.filter((asset) => String(asset.id || "").startsWith("coco_rush_night_"));
  const genericAssets = assets.filter((asset) => {
    const id = String(asset.id || "");
    return !id.startsWith("coco_rush_night_") && !id.startsWith("coco_recipe_subject_");
  });
  const blockSources = (variant.cocoCompositionSystem?.blocks ?? []).map((block) => block.source);
  const allBlockSources = (variant.cocoCompositionSystem?.allBlocks ?? []).map((block) => block.source);
  const rendererZones = variant.cocoCompositionSystem?.rendererZones ?? {};
  const textZones = variant.textZones ?? {};
  if (
    variant.cocoVisualRecipeId !== "rush-night-css" ||
    variant.cocoVisualRecipeVersion !== 9 ||
    variant.cocoVisualRecipeMaterializedVersion !== 9 ||
    variant.cocoCompositionSystem?.patternId !== "rush-night-css" ||
    variant.headlineFamily !== "BAD GRUNGE" ||
    variant.head2Family !== "OpenScript" ||
    variant.qrEnabled !== false ||
    variant.subtag !== "ENTRY UNTIL 00H30" ||
    variant.rightRail !== "AFTER 00H30 $30" ||
    variant.rightRailEnabled !== true ||
    variant.price !== "$20" ||
    variant.priceEnabled !== true ||
    variant.priceRingEnabled !== false ||
    Math.abs(Number(variant.priceRingAlpha) - 0.72) > 0.001 ||
    variant.compliance !== "21+" ||
    variant.complianceEnabled !== false ||
    variant.djLineupLabel !== "MUSIC BY" ||
    variant.djLineupLabelColor !== "#FF5A0A" ||
    !["subtag", "rightRail", "price"].every((source) => blockSources.includes(source)) ||
    !["subtag", "rightRail", "price"].every((source) => allBlockSources.includes(source)) ||
    blockSources.includes("compliance") ||
    allBlockSources.includes("compliance") ||
    !["subtag", "rightRail", "price"].every((source) => rendererZones[source]) ||
    !["subtag", "rightRail", "price"].every((source) => textZones[source]) ||
    rendererZones.compliance ||
    textZones.compliance ||
    recipeAssets.length !== 9 ||
    genericAssets.length !== 0 ||
    !String(variant.bgUrl ?? "").startsWith("data:image/svg+xml") ||
    Boolean(variant.bgUploadUrl)
  ) {
    throw new Error(`${format} project snapshot lost the Rush Night recipe.`);
  }
}

if (
  !String(savedState.bgUrl ?? "").startsWith("data:image/svg+xml") ||
  Boolean(savedState.bgUploadUrl)
) {
  throw new Error("Portable Rush Night root state retained the uploaded JPEG background.");
}

if (pageErrors.length) throw new Error(`Page errors: ${pageErrors.join(" | ")}`);
console.log(JSON.stringify({
  pass: true,
  choiceIds,
  projectPath,
  square,
  squareRoundTrip,
  story,
  consoleErrors: consoleErrors.slice(0, 12),
}));

await browser.close();
