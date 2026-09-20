import { readFile } from "node:fs/promises";
import { chromium } from "../node_modules/playwright/index.mjs";

const baseUrl = process.env.NF_BASE_URL || "http://127.0.0.1:3000";
const uploadPath =
  process.env.NF_UPLOAD_PATH ||
  "/Users/thepartyrocker/nightlife-flyers/public/create-with-coco/subjects/subject02.jpg";
const outputRoot =
  process.env.NF_OUTPUT_ROOT ||
  "/Users/thepartyrocker/nightlife-flyers/public/generated-flyers/ladies-css-coco";
const projectPath = `${outputRoot}.nflyer`;
const authEmail = String(process.env.NF_COCO_EMAIL || "").trim();
const authPassword = String(process.env.NF_COCO_PASSWORD || "");
const hasAuthEmail = authEmail.length > 0;
const hasAuthPassword = authPassword.length > 0;
if (hasAuthEmail !== hasAuthPassword) {
  throw new Error(
    "Authenticated smoke login requires both NF_COCO_EMAIL and NF_COCO_PASSWORD."
  );
}
const authenticatedSmoke = hasAuthEmail && hasAuthPassword;
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
  if (message.type() === "error") {
    consoleErrors.push(redactCredentials(message.text()));
  }
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
  const loginButton = page.getByRole("button", { name: "Login", exact: true });
  await emailInput.waitFor({ state: "visible", timeout: 60_000 });
  await passwordInput.waitFor({ state: "visible", timeout: 60_000 });
  // Next's server-rendered inputs can become visible just before their React
  // handlers attach in dev mode. Wait for hydration, then blur both controlled
  // fields so signInWithPassword receives the values the browser displays.
  await page.waitForTimeout(1_200);
  await emailInput.fill(authEmail);
  await emailInput.press("Tab");
  await passwordInput.fill(authPassword);
  await passwordInput.press("Tab");
  await page.waitForFunction(
    ({ email, password }) => {
      const emailInput = document.querySelector('input[placeholder="Email"]');
      const passwordInput = document.querySelector('input[placeholder="Password"]');
      return (
        emailInput instanceof HTMLInputElement &&
        passwordInput instanceof HTMLInputElement &&
        emailInput.value === email &&
        passwordInput.value === password
      );
    },
    { email: authEmail, password: authPassword },
    { timeout: 15_000 }
  );

  try {
    await loginButton.click();
    await Promise.race([
      page.waitForURL(
        (url) => url.origin === new URL(baseUrl).origin && url.pathname !== "/login",
        { timeout: 90_000 }
      ),
      page
        .locator(".mt-3.text-xs.text-neutral-300")
        .first()
        .waitFor({ state: "visible", timeout: 90_000 }),
    ]);
    if (new URL(page.url()).pathname === "/login") throw new Error("login rejected");
  } catch {
    const loginFeedback = redactCredentials(
      await page
        .locator(".mt-3.text-xs.text-neutral-300")
        .first()
        .textContent()
        .catch(() => "")
    ).trim();
    throw new Error(
      `Authenticated smoke login did not complete. Check the local auth configuration.${loginFeedback ? ` Login response: ${loginFeedback}` : ""}`
    );
  }
  console.log("COCO_AUTH", "authenticated session ready");
}

const studioUrl = authenticatedSmoke
  ? new URL("/", baseUrl).toString()
  : new URL("/?guest=1", baseUrl).toString();
await page.goto(studioUrl, {
  waitUntil: "domcontentloaded",
  timeout: 90_000,
});
await page.getByRole("button").filter({ hasText: "Create with Coco" }).click();
await page.getByTestId("coco-event-brief").waitFor({ state: "visible", timeout: 60_000 });
await page.getByTestId("coco-composer-image-upload").setInputFiles(uploadPath);
await page.getByPlaceholder("Sunday Takeover", { exact: true }).fill("Ladies");
await page.getByTestId("coco-composer-event-description").fill(
  "An elegant glamorous ladies Wednesday with a full-bleed fashion portrait, refined editorial typography, and a clean upscale nightclub mood."
);
await page.getByTestId("coco-composer-date").fill("Wednesday, August 28");
await page.getByTestId("coco-composer-start-time").fill("9PM");
await page.getByTestId("coco-composer-venue").fill("LA VIDA NIGHT CLUB");
await page.getByTestId("coco-composer-djs").fill("DJ NJ, DJ KILTON, DJ MATTHEW & KAY DRUM");
await page.getByText("Add exact flyer details", { exact: true }).click();
await page.getByTestId("coco-composer-presenter").fill("LA VIDA NIGHT CLUB");
await page.getByTestId("coco-composer-address").fill("JAMESLINE HOTEL, AVIELE.");
await page.getByTestId("coco-composer-music-policy").fill(
  "VOLTAGE PRINCE · CHIEF PRIEST OF HYPE · ECO BLACK · SHERICO"
);
await page.getByTestId("coco-composer-age").fill("18+");
await page.getByTestId("coco-composer-socials").fill("@LAVIDA");

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
if (!choiceIds.includes("sensual-night")) {
  throw new Error(`Sensual Night was not offered for the Ladies brief: ${choiceIds.join(", ")}`);
}
await chooser
  .locator('[data-coco-direction-id="sensual-night"]')
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
          portraitRoot.getAttribute("data-coco-session-recipe-id") === "ladies-css-editorial" &&
          portraitRoot.getAttribute("data-coco-session-recipe-materialized-version") === "2" &&
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
      const textCandidates = [node, ...node.querySelectorAll("div, span")]
        .filter((candidate) => visible(candidate) && !candidate.closest("[data-nonexport]"))
        .sort(
          (left, right) =>
            Number.parseFloat(getComputedStyle(right).fontSize) -
            Number.parseFloat(getComputedStyle(left).fontSize)
        );
      const textNode = textCandidates[0] || node;
      const style = getComputedStyle(textNode);
      const textClone = node.cloneNode(true);
      textClone.querySelectorAll?.("[data-nonexport]").forEach((candidate) => candidate.remove());
      return {
        text: textClone.textContent?.trim().replace(/\s+/g, " "),
        xPct: Number((((rect.x - (canvas?.x || 0)) / (canvas?.width || 1)) * 100).toFixed(1)),
        yPct: Number((((rect.y - (canvas?.y || 0)) / (canvas?.height || 1)) * 100).toFixed(1)),
        widthPct: Number(((rect.width / (canvas?.width || 1)) * 100).toFixed(1)),
        heightPct: Number(((rect.height / (canvas?.height || 1)) * 100).toFixed(1)),
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
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
      recipeId: portraitRoot?.getAttribute("data-coco-session-recipe-id"),
      materializedVersion: portraitRoot?.getAttribute("data-coco-session-recipe-materialized-version"),
      headline: readNode("headline"),
      headline2: readNode("headline2"),
      date: readNode("date"),
      details: readNode("details"),
      details2: readNode("details2"),
      venue: readNode("venue"),
      subtag: readNode("subtag"),
      presenter: readNode("presenter"),
      compliance: readNode("compliance"),
      signoff: readNode("socialHandle"),
      qr: readNode("qr"),
      price: readNode("price"),
      assets: [...(root?.querySelectorAll('[data-portrait-id^="coco_ladies_css_"]') ?? [])]
        .map((node) => node.getAttribute("data-portrait-id")),
      genericAssets: [...(root?.querySelectorAll("[data-portrait-id]") ?? [])]
        .map((node) => node.getAttribute("data-portrait-id"))
        .filter((id) => id && !id.startsWith("coco_ladies_css_")),
      brokenImages: [...(root?.querySelectorAll("img") ?? [])]
        .filter((image) => !image.complete || image.naturalWidth <= 0)
        .map((image) => image.getAttribute("src")),
    };
  }, { expectedHeight, format });

  const expected = format === "story"
    ? { headlineY: 6.15, scriptY: 79.75, venueY: 90.85 }
    : { headlineY: 7, scriptY: 59.5, venueY: 83.7 };
  if (
    result.recipeId !== "ladies-css-editorial" ||
    result.materializedVersion !== "2" ||
    result.subjectLayout !== "subject-right" ||
    result.width !== 540 ||
    result.height !== expectedHeight ||
    !result.headline?.text?.match(/^LADIES$/i) ||
    !result.headline.editable ||
    !String(result.headline.fontFamily).match(/Avigea/i) ||
    Math.abs(result.headline.yPct - expected.headlineY) > 0.8 ||
    !result.headline2?.text?.match(/^Wednesday$/i) ||
    !String(result.headline2.fontFamily).match(/OpenScript/i) ||
    Math.abs(result.headline2.yPct - expected.scriptY) > 0.8 ||
    !result.date?.text?.match(/28\s*AUG/i) ||
    !result.subtag?.text?.match(/9\s*PM/i) ||
    !result.venue?.text?.match(/LA VIDA NIGHT CLUB.*JAMESLINE HOTEL/i) ||
    Math.abs(result.venue.yPct - expected.venueY) > 0.9 ||
    ![result.date, result.details, result.details2, result.venue, result.subtag, result.presenter, result.compliance, result.signoff].every(
      (node) => node?.editable
    ) ||
    result.qr !== null ||
    result.price !== null ||
    result.assets.length !== 7 ||
    result.genericAssets.length !== 0 ||
    result.brokenImages.length
  ) {
    await artboard.screenshot({ path: `${outputRoot}-${format}-debug.png` });
    throw new Error(`${format} Ladies CSS canvas is incomplete: ${JSON.stringify(result)}`);
  }

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
for (const format of ["square", "story"]) {
  const variant = savedState.session?.[format] ?? {};
  const assets = savedState.portraits?.[format] ?? variant.portraits ?? variant.emojiList ?? [];
  if (
    variant.cocoVisualRecipeId !== "ladies-css-editorial" ||
    variant.cocoVisualRecipeVersion !== 4 ||
    variant.cocoVisualRecipeMaterializedVersion !== 2 ||
    variant.cocoCompositionSystem?.patternId !== "ladies-css-editorial" ||
    variant.headlineFamily !== "Avigea" ||
    variant.head2Family !== "OpenScript" ||
    variant.qrEnabled !== false ||
    variant.priceEnabled !== false ||
    assets.filter((asset) => String(asset.id || "").startsWith("coco_ladies_css_")).length !== 7 ||
    assets.some((asset) => !String(asset.id || "").startsWith("coco_ladies_css_"))
  ) {
    throw new Error(`${format} project snapshot lost the Ladies CSS recipe.`);
  }
}

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
