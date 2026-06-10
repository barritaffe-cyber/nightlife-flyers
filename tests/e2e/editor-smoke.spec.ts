import { expect, type Locator, type Page, test } from "@playwright/test";

const NEW_YORK_SQUARE_URL = "/?studio=1&template=new-york&format=square";

function exactText(text: string) {
  return new RegExp(`^${text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`);
}

async function openNewYorkSquare(page: Page) {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto(NEW_YORK_SQUARE_URL, { waitUntil: "domcontentloaded" });
  await expect(page.locator('[data-tour="artboard"]')).toBeVisible();
  await expect(page.locator('[data-node="headline"]')).toBeAttached();
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
  await dismissOptional(page.getByRole("button", { name: /dismiss save notice/i }));
  await dismissOptional(page.getByRole("button", { name: /dismiss start prompt/i }));

  return pageErrors;
}

async function dismissOptional(locator: Locator) {
  if (await locator.isVisible().catch(() => false)) {
    await locator.click();
  }
}

async function ensureExpanded(toggle: Locator) {
  if ((await toggle.getAttribute("aria-expanded")) !== "true") {
    await toggle.click();
  }
}

function sliderNumberInput(scope: Locator, page: Page, label: string) {
  const control = scope
    .locator("div.min-w-0.w-full")
    .filter({
      has: page.locator("span").filter({ hasText: exactText(label) }),
    })
    .first();

  return control.locator('input[type="text"]').first();
}

test("new york square editor loads core canvas layers", async ({ page }) => {
  const pageErrors = await openNewYorkSquare(page);

  await expect(page.locator('[data-node="headline"]')).toHaveCount(1);
  await expect(page.locator('[data-node="headline2"]')).toHaveCount(1);
  await expect(page.locator('[data-export-layer="flare-overlays"]')).toHaveCount(1);
  await expect(page.locator('[data-export-layer="portrait-assets"]')).toHaveCount(1);
  await expect
    .poll(() => page.locator('[data-tour="artboard"] [data-portrait-area="true"]').count())
    .toBeGreaterThanOrEqual(3);

  expect(pageErrors).toEqual([]);
});

test("graphics fx typed scale value stays exact", async ({ page }) => {
  const pageErrors = await openNewYorkSquare(page);
  const artboardGraphic = page
    .locator('[data-tour="artboard"] [data-portrait-area="true"][data-portrait-id="graphic_venue_sq"]')
    .first();

  await expect(artboardGraphic).toBeVisible();
  await artboardGraphic.click({ force: true });

  const graphicsToggle = page.getByRole("button", { name: /graphics\s*&\s*fx/i });
  await ensureExpanded(graphicsToggle);

  const library = page.locator('[data-tour="library"]');
  const selectedGraphic = library
    .locator('[data-portrait-area="true"]')
    .filter({ hasText: /selected graphic/i })
    .first();

  await expect(selectedGraphic).toBeVisible();

  const scaleInput = sliderNumberInput(selectedGraphic, page, "Scale");
  await expect(scaleInput).toBeVisible();
  await scaleInput.fill("150");
  await scaleInput.blur();

  await expect(scaleInput).toHaveValue("150");
  await page.waitForTimeout(500);
  await expect(scaleInput).toHaveValue("150");

  expect(pageErrors).toEqual([]);
});
