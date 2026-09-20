import { chromium } from "../node_modules/playwright/index.mjs";
import { readFile } from "node:fs/promises";
import {
  FASHION_CLUB_VERTICAL_RECIPE,
  getFashionClubVerticalFormatRecipe,
} from "../lib/recipes/fashionClubVertical.ts";

const expectedRecipeId = FASHION_CLUB_VERTICAL_RECIPE.id;
const expectedRecipeVersion = String(FASHION_CLUB_VERTICAL_RECIPE.version ?? 1);

const baseUrl = process.env.NF_BASE_URL || "http://127.0.0.1:3000";
const uploadPath =
  process.env.NF_UPLOAD_PATH ||
  "/Users/thepartyrocker/nightlife-flyers/public/create-with-coco/subjects/subject05.jpg";
const outputRoot =
  process.env.NF_OUTPUT_ROOT ||
  "/Users/thepartyrocker/nightlife-flyers/public/generated-flyers/coco-fashion-club";
const projectPath = `${outputRoot}.nflyer`;
const saveMaster = process.env.NF_SAVE_MASTER === "1";

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1500, height: 1250 },
  deviceScaleFactor: 1,
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

await page.goto(`${baseUrl}/?guest=1&cocoWinningTemplate=red_velvet_editorial`, {
  waitUntil: "domcontentloaded",
  timeout: 90_000,
});

const cocoEntry = page.getByRole("button").filter({ hasText: "Create with Coco" });
await cocoEntry.waitFor({ state: "visible", timeout: 90_000 });
await cocoEntry.click();
await page.getByTestId("coco-event-brief").waitFor({ state: "visible", timeout: 60_000 });
await page.getByTestId("coco-composer-image-upload").setInputFiles(uploadPath);
await page.getByPlaceholder("Sunday Takeover", { exact: true }).fill("Friday Fever");
await page.getByTestId("coco-composer-event-description").fill(
  "A glamorous high-fashion Friday club night with a close portrait, dramatic ruby and magenta lighting, two huge vertical serif title words, a black information footer, white type, and small acid-yellow accents. Premium, bold, sexy, and editorial."
);
await page.getByTestId("coco-composer-date").fill("Friday, July 3");
await page.getByTestId("coco-composer-start-time").fill("10PM");
await page.getByTestId("coco-composer-venue").fill("CLUB 007");
await page.getByTestId("coco-composer-djs").fill("DJ YINGKID\nEAZI\nV.O.G\nSINGAPORE");
await page.getByText("Add exact flyer details", { exact: true }).click();
await page.getByTestId("coco-composer-presenter").fill("CLUB 007 • IKEJA");
await page
  .getByTestId("coco-composer-address")
  .fill("NO. 8, ALHAJA KOFOWOROLA CRESCENT\nOFF AWOLOWO WAY, IKEJA, LAGOS");
await page.getByTestId("coco-composer-music-policy").fill("MUSIC POLICY\nHYPE POLICY");
await page.getByTestId("coco-composer-rsvp").fill("07032213939 • 07039243915");
await page.getByTestId("coco-composer-socials").fill("@CLUB007_IKEJA");

await page.getByRole("button", { name: "Create 3 options", exact: true }).click();
const chooser = page.getByTestId("coco-direction-chooser");
for (let attempt = 0; attempt < 36; attempt += 1) {
  if (await chooser.isVisible()) break;
  const status = await page.getByTestId("coco-event-brief").innerText().catch(() => "");
  console.log(`COCO_WAIT_${attempt + 1}`, status.replace(/\s+/g, " ").slice(-220));
  await page.waitForTimeout(10_000);
}
if (!(await chooser.isVisible())) {
  await page.screenshot({ path: `${outputRoot}-chooser-debug.png`, fullPage: true });
  throw new Error(
    `Coco direction chooser did not appear. Page errors: ${pageErrors.join(" | ") || "none"}. Console errors: ${consoleErrors.slice(0, 8).join(" | ") || "none"}.`
  );
}
const choiceIds = await chooser.locator("[data-coco-direction-id]").evaluateAll((nodes) =>
  nodes.map((node) => node.getAttribute("data-coco-direction-id"))
);
if (!choiceIds.includes("fashion-club-vertical")) {
  throw new Error(`Fashion Club Vertical was not offered: ${choiceIds.join(", ")}`);
}
await chooser
  .locator('[data-coco-direction-id="fashion-club-vertical"]')
  .getByRole("button", { name: "Use this direction", exact: true })
  .click();

await page.getByTestId("coco-quick-edit").waitFor({ state: "visible", timeout: 240_000 });
const artboard = page.locator("#artboard");
await artboard.waitFor({ state: "visible", timeout: 90_000 });

async function inspect(format) {
  const expectedHeight = format === "story" ? 960 : 540;
  const formatRecipe = getFashionClubVerticalFormatRecipe(format);
  await page.evaluate(() => document.fonts.ready);
  // A format switch keeps #artboard mounted while its preload shell replaces
  // the native canvas. An empty image list therefore used to pass the old
  // readiness check, and the inspector ran one frame before Story's editable
  // objects mounted. Wait for the authored rail contract itself instead.
  await page.waitForFunction(
    ({ expectedHeight, expectedRecipeId, expectedRecipeVersion, format }) => {
      const isVisible = (node) => {
        if (!(node instanceof HTMLElement)) return false;
        const rect = node.getBoundingClientRect();
        const style = getComputedStyle(node);
        return (
          rect.width > 0 &&
          rect.height > 0 &&
          style.display !== "none" &&
          style.visibility !== "hidden"
        );
      };
      const artboard = [...document.querySelectorAll("#artboard")].find(isVisible);
      const exportRoot = artboard?.closest("#export-root");
      const portraitRoot = artboard?.querySelector("#portrait-layer-root");
      if (!artboard || !exportRoot || !portraitRoot || !isVisible(portraitRoot)) return false;
      const exportRect = exportRoot.getBoundingClientRect();
      const editableNode = (name) =>
        [...artboard.querySelectorAll(`[data-node="${name}"]`)].find(
          (node) =>
            isVisible(node) &&
            (node.hasAttribute("data-anim-field") || node.hasAttribute("data-export-layer"))
        );
      return (
        artboard.getAttribute("data-coco-layout-transition") !== "true" &&
        portraitRoot.getAttribute("data-coco-campaign-direction-id") ===
          expectedRecipeId &&
        portraitRoot.getAttribute("data-coco-session-recipe-id") === expectedRecipeId &&
        portraitRoot.getAttribute("data-coco-session-recipe-version") ===
          expectedRecipeVersion &&
        portraitRoot.getAttribute("data-coco-session-recipe-materialized-version") ===
          expectedRecipeVersion &&
        (portraitRoot.getAttribute("data-coco-live-background-transform") ?? "")
          .split(":").length === 4 &&
        (portraitRoot.getAttribute("data-coco-live-background-transform") ?? "")
          .split(":")
          .map(Number)
          .every(Number.isFinite) &&
        portraitRoot.getAttribute("data-coco-subject-layout-id") === "subject-center" &&
        portraitRoot.getAttribute("data-coco-center-layout-option-id") ===
          "subject-center-rail" &&
        Number(portraitRoot.getAttribute("data-coco-center-layout-version")) >= 55 &&
        Math.round(exportRect.width) === 540 &&
        Math.round(exportRect.height) === expectedHeight &&
        document
          .querySelector(`[data-testid="coco-quick-format-${format}"]`)
          ?.getAttribute("aria-pressed") === "true" &&
        ["headline", "headline2", "date", "venue"].every(editableNode)
      );
    },
    { expectedHeight, expectedRecipeId, expectedRecipeVersion, format },
    { timeout: 120_000 }
  );
  await page.waitForFunction(
    () => {
      const artboard = [...document.querySelectorAll("#artboard")].find((node) => {
        const rect = node.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });
      if (!artboard) return false;
      const images = [...artboard.querySelectorAll("img")].filter(
        (image) => !image.closest('[data-nonexport="true"]')
      );
      return images.every(
        (image) => image.complete && image.naturalWidth > 0 && image.naturalHeight > 0
      );
    },
    null,
    { timeout: 30_000 }
  );
  const result = await page.evaluate(({ expectedHeight, format }) => {
    const isVisible = (node) => {
      if (!(node instanceof HTMLElement)) return false;
      const nodeRect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return (
        nodeRect.width > 0 &&
        nodeRect.height > 0 &&
        style.display !== "none" &&
        style.visibility !== "hidden"
      );
    };
    const artboardRoot = [...document.querySelectorAll("#artboard")].find(isVisible);
    const exportRoot = artboardRoot?.closest("#export-root");
    const portraitRoot = [
      ...(artboardRoot?.querySelectorAll("#portrait-layer-root") ?? []),
    ].find((node) => {
      const rect = node.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
    const telemetryRoot = portraitRoot || exportRoot;
    const rect = exportRoot?.getBoundingClientRect();
    const readNode = (nodeName) => {
      const node = [...(artboardRoot?.querySelectorAll(`[data-node="${nodeName}"]`) ?? [])]
        .filter(
          (candidate) =>
            isVisible(candidate) &&
            (candidate.hasAttribute("data-anim-field") ||
              candidate.hasAttribute("data-export-layer"))
        )
        .sort((a, b) => {
          const aRect = a.getBoundingClientRect();
          const bRect = b.getBoundingClientRect();
          return bRect.width * bRect.height - aRect.width * aRect.height;
        })[0];
      if (!node) return null;
      const nodeRect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return {
        text: node.textContent?.trim().replace(/\s+/g, " "),
        x: Number((nodeRect.x - (rect?.x || 0)).toFixed(1)),
        y: Number((nodeRect.y - (rect?.y || 0)).toFixed(1)),
        width: Number(nodeRect.width.toFixed(1)),
        height: Number(nodeRect.height.toFixed(1)),
        transform: style.transform,
        inlineTransform: node.style.transform,
        renderRotate:
          node.getAttribute("data-coco-render-head-rotate") ??
          node.getAttribute("data-coco-render-head2-rotate"),
        renderSize:
          node.getAttribute("data-coco-render-head-size") ??
          node.getAttribute("data-coco-render-head2-size"),
        editable:
          node.hasAttribute("data-anim-field") || node.hasAttribute("data-export-layer"),
        exportLayer: node.getAttribute("data-export-layer"),
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
      };
    };
    return {
      direction: telemetryRoot?.getAttribute("data-coco-campaign-direction-id"),
      recipeId: portraitRoot?.getAttribute("data-coco-session-recipe-id"),
      recipeVersion: portraitRoot?.getAttribute("data-coco-session-recipe-version"),
      recipeMaterializedVersion: portraitRoot?.getAttribute(
        "data-coco-session-recipe-materialized-version"
      ),
      liveBackgroundTransform: portraitRoot?.getAttribute(
        "data-coco-live-background-transform"
      ),
      subjectLayout: telemetryRoot?.getAttribute("data-coco-subject-layout-id"),
      centerLayout: portraitRoot?.getAttribute("data-coco-center-layout-option-id"),
      centerVersion: portraitRoot?.getAttribute("data-coco-center-layout-version"),
      liveHeadRotate: portraitRoot?.getAttribute("data-coco-live-head-rotate"),
      liveHead2Rotate: portraitRoot?.getAttribute("data-coco-live-head2-rotate"),
      liveHeadSize: portraitRoot?.getAttribute("data-coco-live-head-size"),
      liveHead2Size: portraitRoot?.getAttribute("data-coco-live-head2-size"),
      liveDateEnabled: portraitRoot?.getAttribute("data-coco-live-date-enabled"),
      liveDate: portraitRoot?.getAttribute("data-coco-live-date"),
      liveTime: portraitRoot?.getAttribute("data-coco-live-time"),
      liveVenue: portraitRoot?.getAttribute("data-coco-live-venue"),
      liveVenueAddress: portraitRoot?.getAttribute("data-coco-live-venue-address"),
      snapshotHeadRotate: portraitRoot?.getAttribute("data-coco-snapshot-head-rotate"),
      snapshotHead2Rotate: portraitRoot?.getAttribute("data-coco-snapshot-head2-rotate"),
      snapshotHeadSize: portraitRoot?.getAttribute("data-coco-snapshot-head-size"),
      snapshotHead2Size: portraitRoot?.getAttribute("data-coco-snapshot-head2-size"),
      width: rect ? Math.round(rect.width) : null,
      height: rect ? Math.round(rect.height) : null,
      expectedHeight,
      formatPressed: document
        .querySelector(`[data-testid="coco-quick-format-${format}"]`)
        ?.getAttribute("aria-pressed"),
      transition: artboardRoot?.getAttribute("data-coco-layout-transition"),
      preloadShell: Boolean(artboardRoot?.querySelector(".nf-coco-boot")),
      headline: readNode("headline"),
      headline2: readNode("headline2"),
      date: readNode("date"),
      presenter: readNode("presenter"),
      details2: readNode("details2"),
      rightRail: readNode("rightRail"),
      subtag: readNode("subtag"),
      venue: readNode("venue"),
      leftRail: readNode("leftRail"),
      compliance: readNode("compliance"),
      socialHandle: readNode("socialHandle"),
      qr: readNode("qr"),
      price: readNode("price"),
      autoAssets: [
        ...(artboardRoot?.querySelectorAll(
          '[data-portrait-id="coco_compliance_circular_text"], [data-portrait-id="coco_center_footer_black_flare"], [data-portrait-id^="coco_required_"]'
        ) ?? []),
      ].map((node) => node.getAttribute("data-portrait-id")),
      assets: [...(artboardRoot?.querySelectorAll('[data-portrait-id^="coco_fashion_club_"]') ?? [])]
        .map((node) => {
          const bounds = node.querySelector('[data-hit-bounds="true"]');
          const source =
            node.querySelector('[data-hit-source="true"]') ??
            node.querySelector("img, canvas, svg");
          const boundsStyle = bounds ? getComputedStyle(bounds) : null;
          const sourceStyle = source ? getComputedStyle(source) : null;
          const nodeRect = node.getBoundingClientRect();
          return {
            id: node.getAttribute("data-portrait-id"),
            anchorX: Number.parseFloat(node.style.left),
            anchorY: Number.parseFloat(node.style.top),
            x: Number((nodeRect.x - (rect?.x || 0)).toFixed(1)),
            y: Number((nodeRect.y - (rect?.y || 0)).toFixed(1)),
            width: Number(nodeRect.width.toFixed(1)),
            height: Number(nodeRect.height.toFixed(1)),
            opacity: boundsStyle ? Number.parseFloat(boundsStyle.opacity) : null,
            blendMode: sourceStyle?.mixBlendMode ?? null,
            transform: boundsStyle?.transform ?? null,
          };
        }),
      brokenImages: [...(artboardRoot?.querySelectorAll("img") ?? [])]
        .filter((image) => !image.complete || image.naturalWidth <= 0)
        .map((image) => image.getAttribute("src")),
    };
  }, { expectedHeight, format });

  const approximately = (value, expected, tolerance = 0.05) =>
    Number.isFinite(Number(value)) && Math.abs(Number(value) - expected) <= tolerance;
  const pct = (value, total) => Number(value) / total * 100;
  const zones = formatRecipe.zones;
  const variant = formatRecipe.variant;
  const backgroundParts = String(result.liveBackgroundTransform ?? "")
    .split(":")
    .map(Number);
  const [backgroundPositionX, backgroundPositionY, backgroundScale, backgroundRotation] =
    backgroundParts;
  const imageFitProvenanceComplete =
    backgroundParts.length === 4 &&
    backgroundParts.every(Number.isFinite) &&
    backgroundPositionX >= 0 &&
    backgroundPositionX <= 100 &&
    backgroundPositionY >= 0 &&
    backgroundPositionY <= 100 &&
    approximately(backgroundScale, formatRecipe.imageFit.scale, 0.01) &&
    approximately(backgroundRotation, 0, 0.01);
  result.backgroundProvenance = {
    positionX: backgroundPositionX,
    positionY: backgroundPositionY,
    scale: backgroundScale,
    rotation: backgroundRotation,
    recipeFocalTarget: formatRecipe.imageFit.focalTarget,
    recipeScale: formatRecipe.imageFit.scale,
    preserveUserScale: formatRecipe.imageFit.preserveUserScale,
  };
  const rectMatchesZone = (node, zone, tolerance = {}) =>
    !!node &&
    approximately(
      pct(node.x, result.width),
      zone.x,
      tolerance.x ?? 2.2
    ) &&
    approximately(
      pct(node.y, result.height),
      zone.y,
      tolerance.y ?? 2.2
    ) &&
    approximately(
      pct(node.width, result.width),
      zone.width,
      tolerance.width ?? 3.5
    ) &&
    approximately(
      pct(node.height, result.height),
      zone.height,
      tolerance.height ?? 3.5
    );
  const rectContainedByZone = (node, zone, tolerance = 1.5) => {
    if (!node) return false;
    const left = pct(node.x, result.width);
    const top = pct(node.y, result.height);
    const right = left + pct(node.width, result.width);
    const bottom = top + pct(node.height, result.height);
    return (
      left >= zone.x - tolerance &&
      top >= zone.y - tolerance &&
      right <= zone.x + zone.width + tolerance &&
      bottom <= zone.y + zone.height + tolerance
    );
  };
  const layoutGeometryComplete =
    rectMatchesZone(result.headline, zones.headlinePrimary, {
      x: 2.5,
      y: 2.2,
      width: 4,
      height: 3,
    }) &&
    rectMatchesZone(result.headline2, zones.headlineSecondary, {
      x: 2.5,
      y: 2.2,
      width: 4,
      height: 3,
    }) &&
    rectContainedByZone(result.presenter, zones.presenter) &&
    approximately(pct(result.details2?.x, result.width), Number(variant.details2X), 0.7) &&
    approximately(pct(result.details2?.y, result.height), Number(variant.details2Y), 0.7) &&
    approximately(pct(result.date?.x, result.width), Number(variant.dateX), 0.7) &&
    approximately(pct(result.date?.y, result.height), Number(variant.dateY), 0.7) &&
    approximately(pct(result.subtag?.x, result.width), Number(variant.subtagX), 0.7) &&
    approximately(pct(result.subtag?.y, result.height), Number(variant.subtagY), 0.7) &&
    approximately(pct(result.venue?.x, result.width), Number(variant.venueX), 0.7) &&
    approximately(pct(result.venue?.y, result.height), Number(variant.venueY), 0.7) &&
    approximately(pct(result.leftRail?.x, result.width), Number(variant.leftRailX), 0.7) &&
    approximately(pct(result.leftRail?.y, result.height), Number(variant.leftRailY), 0.7) &&
    approximately(
      pct(result.socialHandle?.x, result.width),
      Number(variant.socialHandleX),
      0.7
    ) &&
    approximately(
      pct(result.socialHandle?.y, result.height),
      Number(variant.socialHandleY),
      0.7
    ) &&
    approximately(pct(result.compliance?.y, result.height), zones.compliance.y, 1.2) &&
    result.compliance.width / result.width <= 0.82;

  const assetsById = Object.fromEntries(result.assets.map((asset) => [asset.id, asset]));
  const expectedAssets = [
    {
      id: `coco_fashion_club_floor_${format}`,
      x: 50,
      y: formatRecipe.assets.fieldY,
      opacity: 1,
      blendMode: "normal",
    },
    {
      id: `coco_fashion_club_glow_${format}`,
      x: formatRecipe.assets.glowX,
      y: formatRecipe.assets.glowY,
      opacity: formatRecipe.assets.glowOpacity,
      blendMode: "screen",
    },
    {
      id: `coco_fashion_club_paint_${format}`,
      x: formatRecipe.assets.paintX,
      y: formatRecipe.assets.paintY,
      opacity: formatRecipe.assets.paintOpacity,
      blendMode: "screen",
    },
    {
      id: `coco_fashion_club_footer_frame_${format}`,
      x: formatRecipe.assets.frameX,
      y: formatRecipe.assets.frameY,
      opacity: 0.72,
      blendMode: "normal",
    },
  ];
  if (format === "square") {
    expectedAssets.push({
      id: "coco_fashion_club_red_sun_square",
      x: 76.41420717592592,
      y: 67.69820601851853,
      opacity: 0.5,
      blendMode: "screen",
    });
  }
  expectedAssets.push(
    {
      id: `coco_fashion_club_arrow_${format}`,
      x: format === "story" ? 80.59317129629629 : 82.61863425925927,
      y: format === "story" ? 83.32234700520833 : 75.92592592592594,
      opacity: 0.9,
      blendMode: "normal",
    },
    {
      id: `coco_fashion_club_circles_${format}`,
      x: format === "story" ? 46.83159722222222 : 47.74956597222223,
      y: format === "story" ? 27.547607421875004 : 15.105613425925926,
      opacity: 0.9,
      blendMode: "normal",
    }
  );
  const refinedAssetsComplete = expectedAssets.every((expected) => {
    const actual = assetsById[expected.id];
    return (
      actual &&
      approximately(actual.anchorX, expected.x, 0.15) &&
      approximately(actual.anchorY, expected.y, 0.15) &&
      approximately(actual.opacity, expected.opacity, 0.02) &&
      actual.blendMode === expected.blendMode &&
      actual.transform &&
      actual.transform !== "none"
    );
  });
  const cleanAssetPolicyComplete =
    Object.values(FASHION_CLUB_VERTICAL_RECIPE.runtime.assetPolicy).every(
      (enabled) => enabled === false
    ) &&
    result.autoAssets.length === 0 &&
    !result.qr &&
    !result.price;

  if (
    result.direction !== expectedRecipeId ||
    result.recipeId !== expectedRecipeId ||
    result.recipeVersion !== expectedRecipeVersion ||
    result.recipeMaterializedVersion !== expectedRecipeVersion ||
    !imageFitProvenanceComplete ||
    // Fashion Club uses the native Center renderer; Vertical Rail is the
    // format-specific option identity, not a fourth subject-layout family.
    result.subjectLayout !== "subject-center" ||
    result.centerLayout !== "subject-center-rail" ||
    Number(result.centerVersion) < 55 ||
    result.width !== 540 ||
    result.height !== expectedHeight ||
    result.formatPressed !== "true" ||
    !result.headline?.text?.match(/FRIDAY/i) ||
    !result.headline2?.text?.match(/FEVER/i) ||
    !result.headline.editable ||
    !result.headline2.editable ||
    result.headline.height <= result.headline.width * 1.5 ||
    result.headline2.height <= result.headline2.width * 1.5 ||
    result.headline.transform === "none" ||
    result.headline2.transform === "none" ||
    !approximately(result.headline.renderRotate, -90) ||
    !approximately(result.headline2.renderRotate, -90) ||
    !approximately(result.liveHeadRotate, -90) ||
    !approximately(result.liveHead2Rotate, -90) ||
    !approximately(result.snapshotHeadRotate, -90) ||
    !approximately(result.snapshotHead2Rotate, -90) ||
    !approximately(result.liveHeadSize, Number(variant.headlineSize), 0.1) ||
    !approximately(result.liveHead2Size, Number(variant.head2Size), 0.1) ||
    !approximately(result.snapshotHeadSize, Number(variant.headlineSize), 0.1) ||
    !approximately(result.snapshotHead2Size, Number(variant.head2Size), 0.1) ||
    !result.headline.inlineTransform?.includes(
      `scale(${formatRecipe.railFit.primaryAxisScale}, ${formatRecipe.railFit.primaryCrossAxisScale})`
    ) ||
    !result.headline2.inlineTransform?.includes(
      `scale(${formatRecipe.railFit.secondaryAxisScale}, ${formatRecipe.railFit.secondaryCrossAxisScale})`
    ) ||
    !result.date?.editable ||
    !approximately(Number.parseFloat(result.date.fontSize), Number(variant.dateSize), 0.1) ||
    !approximately(
      Number.parseFloat(result.presenter?.fontSize),
      Number(variant.presenterSize),
      0.1
    ) ||
    !result.date.text?.match(/JULY/i) ||
    !result.date.text?.match(/3RD/i) ||
    !result.venue?.editable ||
    !result.venue.text?.match(/CLUB\s*007/i) ||
    !result.presenter?.text?.match(/CLUB\s*007/i) ||
    !result.details2?.text?.match(/MUSIC\s*POLICY/i) ||
    !result.details2?.text?.match(/HYPE\s*POLICY/i) ||
    !result.subtag?.text?.match(/DOOR\s*OPENS.*10PM/i) ||
    !result.leftRail?.text?.match(/FOR\s*RESERVATION\s*CALL/i) ||
    !result.compliance?.text?.match(/MAXIMUM\s*SECURITY\s*GUARANTEED/i) ||
    !layoutGeometryComplete ||
    result.transition === "true" ||
    result.preloadShell ||
    result.assets.length !== expectedAssets.length ||
    result.assets.map((asset) => asset.id).join("|") !==
      expectedAssets.map((asset) => asset.id).join("|") ||
    !result.assets.every((asset) => !asset.id.includes("_rule_")) ||
    !refinedAssetsComplete ||
    !cleanAssetPolicyComplete ||
    result.brokenImages.length
  ) {
    await artboard.screenshot({ path: `${outputRoot}-${format}-debug.png` });
    if (!saveMaster) {
      throw new Error(`${format} fashion-club canvas is incomplete: ${JSON.stringify(result)}`);
    }
    console.warn(`${format} Fashion Club visual gate needs refinement; saving the editable recipe master.`);
  }

  const cleanPreviewStyle = await page.addStyleTag({
    content: '#artboard [data-node] { outline: none !important; } [data-nonexport="true"] { display: none !important; }',
  });
  await artboard.screenshot({ path: `${outputRoot}-${format}.png` });
  await cleanPreviewStyle.evaluate((node) => node.remove());
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
  const assets =
    savedState.portraits?.[format] ?? variant.portraits ?? variant.emojiList ?? [];
  if (
    variant.cocoVisualRecipeId !== expectedRecipeId ||
    String(variant.cocoVisualRecipeVersion) !== expectedRecipeVersion ||
    String(variant.cocoVisualRecipeMaterializedVersion) !== expectedRecipeVersion ||
    variant.cocoCompositionSystem?.patternId !== expectedRecipeId ||
    assets.filter((asset) =>
      String(asset.id || "").startsWith("coco_fashion_club_")
    ).length !== (format === "square" ? 7 : 6)
  ) {
    throw new Error(`${format} project snapshot lost the Fashion Club recipe.`);
  }
}

await page.getByTestId("coco-quick-fine-tune").click();
const venuePanel = page.locator("#venue-panel");
await venuePanel.getByRole("button", { name: "▸ Venue", exact: true }).click();
await venuePanel.getByText("Venue Name Size", { exact: true }).waitFor({
  state: "visible",
  timeout: 10_000,
});
const venuePanelText = await venuePanel.innerText();
const normalizedVenuePanelText = venuePanelText.toUpperCase().replace(/\s+/g, " ");
for (const label of [
  "VENUE NAME SIZE",
  "VENUE NAME COLOR",
  "ADDRESS SIZE",
  "ADDRESS COLOR",
]) {
  if (!normalizedVenuePanelText.includes(label)) {
    throw new Error(`Fashion Club Venue panel is missing ${label}.`);
  }
}

if (pageErrors.length) throw new Error(`Page errors: ${pageErrors.join(" | ")}`);
console.log(
  JSON.stringify({
    pass: true,
    choiceIds,
    projectPath,
    square,
    story,
    consoleErrors: consoleErrors.slice(0, 12),
  })
);
await browser.close();
